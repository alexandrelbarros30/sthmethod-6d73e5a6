import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Gera uma cobrança Pix DIRETA via /v1/payments do Mercado Pago,
// retornando QR Code (base64), copia-e-cola e ticket_url para enviar
// pronto ao aluno via WhatsApp. Pix MP expira tipicamente em ~30 min,
// então sempre gere "na hora" de mandar.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    const code = String(body?.code || "").toLowerCase().trim();
    if (!code) return new Response(JSON.stringify({ error: "code required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: link } = await admin
      .from("custom_payment_links")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (!link) return new Response(JSON.stringify({ error: "Link não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!link.active) return new Response(JSON.stringify({ error: "Link inativo" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (link.expires_at && new Date(link.expires_at) < new Date()) return new Response(JSON.stringify({ error: "Link expirado" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (link.max_uses > 0 && link.current_uses >= link.max_uses) return new Response(JSON.stringify({ error: "Limite de usos atingido" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const amount = Number(link.amount);
    if (!(amount > 0)) throw new Error("invalid amount");

    // Resolve dados do pagador a partir do aluno vinculado (fonte da verdade)
    let payerName = "Aluno STH";
    let payerEmail: string | null = null;
    let payerPhone: string | null = null;
    const payerUserId: string | null = (link as any).student_user_id || null;
    if (payerUserId) {
      const { data: prof } = await admin
        .from("profiles")
        .select("full_name, email, phone")
        .eq("user_id", payerUserId)
        .maybeSingle();
      if (prof) {
        if (prof.full_name && prof.full_name.trim().length >= 2) payerName = prof.full_name.trim();
        if (prof.email) payerEmail = String(prof.email).trim();
        if (prof.phone) payerPhone = String(prof.phone).replace(/\D/g, "");
      }
    }
    // Fallback opcional do body
    if (!payerEmail && body?.payer_email) payerEmail = String(body.payer_email).trim();
    if (!payerPhone && body?.payer_phone) payerPhone = String(body.payer_phone).replace(/\D/g, "");
    if (body?.payer_name && payerName === "Aluno STH") payerName = String(body.payer_name).trim();

    // Cria custom_payment como pending
    const { data: cp, error: cpErr } = await admin
      .from("custom_payments")
      .insert({
        link_id: link.id,
        payer_user_id: payerUserId,
        payer_name: payerName,
        payer_email: payerEmail,
        payer_phone: payerPhone,
        amount,
        method: "pix",
        status: "pending",
      })
      .select()
      .single();
    if (cpErr) throw cpErr;

    const [firstName, ...rest] = payerName.split(" ");
    const lastName = rest.join(" ") || firstName;

    const pixPayload: any = {
      transaction_amount: Number(amount.toFixed(2)),
      description: link.label || "Pagamento STH METHOD",
      payment_method_id: "pix",
      external_reference: `cpay:${cp.id}`,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercado-pago-webhook`,
      payer: {
        email: payerEmail || "aluno@sthmethod.com.br",
        first_name: firstName,
        last_name: lastName,
      },
    };

    const idemKey = `cpay-${cp.id}`;
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "X-Idempotency-Key": idemKey,
      },
      body: JSON.stringify(pixPayload),
    });
    const mp = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP pix error", mpRes.status, mp);
      throw new Error(`MP error [${mpRes.status}]: ${mp.message || JSON.stringify(mp)}`);
    }

    const poi = mp?.point_of_interaction?.transaction_data || {};
    const qrCode: string | null = poi.qr_code || null;
    const qrBase64: string | null = poi.qr_code_base64 || null;
    const ticketUrl: string | null = poi.ticket_url || null;
    const expires: string | null = mp?.date_of_expiration || null;

    await admin.from("custom_payments").update({
      mp_payment_id: String(mp.id),
    }).eq("id", cp.id);

    return new Response(JSON.stringify({
      custom_payment_id: cp.id,
      mp_payment_id: String(mp.id),
      qr_code: qrCode,
      qr_code_base64: qrBase64,
      ticket_url: ticketUrl,
      expires_at: expires,
      amount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao gerar Pix";
    console.error("create-custom-pix", msg, err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});