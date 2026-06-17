import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json().catch(() => ({}));
    const { code, payer_name, payer_email, payer_phone } = body || {};
    // Sempre PIX: pagamento avulso entra como saldo no aluno e é reconciliado pelo admin.
    const method = "pix";

    if (!code) return new Response(JSON.stringify({ error: "code required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!payer_name || String(payer_name).trim().length < 2) return new Response(JSON.stringify({ error: "payer_name required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Carrega o link
    const { data: link } = await admin
      .from("custom_payment_links")
      .select("*")
      .eq("code", String(code).toLowerCase().trim())
      .maybeSingle();

    if (!link) return new Response(JSON.stringify({ error: "Link não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!link.active) return new Response(JSON.stringify({ error: "Link inativo" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (link.expires_at && new Date(link.expires_at) < new Date()) return new Response(JSON.stringify({ error: "Link expirado" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (link.max_uses > 0 && link.current_uses >= link.max_uses) return new Response(JSON.stringify({ error: "Limite de usos atingido" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const amount = Number(link.amount);
    if (!(amount > 0)) throw new Error("invalid amount");

    // Tenta identificar o usuário logado (opcional). Se o link já tem aluno vinculado, ele tem prioridade.
    let payerUserId: string | null = (link as any).student_user_id || null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user && !payerUserId) payerUserId = user.id;
      } catch { /* anonymous ok */ }
    }

    // Cria registro de pagamento
    const { data: cp, error: cpErr } = await admin
      .from("custom_payments")
      .insert({
        link_id: link.id,
        payer_user_id: payerUserId,
        payer_name: String(payer_name).trim(),
        payer_email: payer_email ? String(payer_email).trim() : null,
        payer_phone: payer_phone ? String(payer_phone).replace(/\D/g, "") : null,
        amount,
        method,
        status: "pending",
      })
      .select()
      .single();
    if (cpErr) throw cpErr;

    const origin = req.headers.get("origin") || "https://sthmethod.com.br";
    const preference: any = {
      items: [{
        title: link.label,
        description: link.description || "Pagamento STH METHOD",
        quantity: 1,
        unit_price: amount,
        currency_id: "BRL",
      }],
      payer: {
        name: String(payer_name).trim(),
        email: payer_email || "aluno@sthmethod.com.br",
      },
      external_reference: `cpay:${cp.id}`,
      back_urls: {
        success: `${origin}/pagar/${link.code}?status=approved`,
        failure: `${origin}/pagar/${link.code}?status=failed`,
        pending: `${origin}/pagar/${link.code}?status=pending`,
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercado-pago-webhook`,
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [
          { id: "credit_card" },
          { id: "debit_card" },
          { id: "ticket" },
          { id: "prepaid_card" },
          { id: "atm" },
        ],
        installments: 1,
        default_installments: 1,
      },
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      body: JSON.stringify(preference),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP error", mpRes.status, mpData);
      throw new Error(`MP error [${mpRes.status}]: ${mpData.message || JSON.stringify(mpData)}`);
    }

    await admin.from("custom_payments").update({ mp_preference_id: mpData.id }).eq("id", cp.id);

    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      custom_payment_id: cp.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao criar pagamento";
    console.error("create-custom-payment", msg, err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
