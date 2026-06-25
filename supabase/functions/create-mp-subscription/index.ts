import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Cria uma assinatura escalonada no Mercado Pago (preapproval) para o plano
 * "Projeto Verão 180":
 *   Fase 1 → 2× R$ 49,50/mês
 *   Fase 2 → 4× R$ 94,50/mês (transição feita pelo webhook após a 2ª cobrança)
 * Total: R$ 477,00 em 6 cobranças mensais.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { plan_id } = await req.json();
    if (!plan_id) throw new Error("plan_id required");

    const { data: plan, error: planErr } = await admin
      .from("plans").select("*").eq("id", plan_id).single();
    if (planErr || !plan) throw new Error("Plan not found");

    const { data: profile } = await admin
      .from("profiles").select("email, full_name").eq("user_id", user.id).maybeSingle();
    const payerEmail = profile?.email || user.email;
    if (!payerEmail) throw new Error("Payer e-mail not found");

    // Cria registro local primeiro para usar id como external_reference.
    const { data: subRow, error: subErr } = await admin
      .from("mp_subscriptions")
      .insert({
        user_id: user.id,
        plan_id,
        status: "pending",
        phase: 1,
        charges_done: 0,
      })
      .select()
      .single();
    if (subErr) throw subErr;

    // Fase 1: 2 cobranças mensais de R$ 49,50.
    // end_date cobre janela de 2 meses + 5 dias (segurança caso o MP atrase 1 ciclo).
    const phase1End = new Date();
    phase1End.setDate(phase1End.getDate() + 65);

    const origin = req.headers.get("origin") || "https://sthmethod.com.br";
    const preapprovalBody = {
      reason: `${plan.name} — Fase 1 (2× R$ ${Number(subRow.phase1_amount).toFixed(2)})`,
      external_reference: `mpsub:${subRow.id}`,
      payer_email: payerEmail,
      back_url: `${origin}/dashboard/subscription?status=approved`,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: Number(subRow.phase1_amount),
        currency_id: "BRL",
        end_date: phase1End.toISOString(),
      },
    };

    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preapprovalBody),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP preapproval error", mpRes.status, mpData);
      await admin.from("mp_subscriptions")
        .update({ status: "failed" })
        .eq("id", subRow.id);
      throw new Error(`MP error [${mpRes.status}]: ${mpData?.message || JSON.stringify(mpData)}`);
    }

    await admin.from("mp_subscriptions").update({
      mp_preapproval_id: mpData.id,
      status: mpData.status || "pending",
      init_point: mpData.init_point,
      next_payment_date: mpData.next_payment_date || null,
      end_date: phase1End.toISOString(),
    }).eq("id", subRow.id);

    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      subscription_id: subRow.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao criar assinatura";
    console.error("create-mp-subscription", msg, err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});