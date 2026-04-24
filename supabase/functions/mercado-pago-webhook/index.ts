import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function validateMpSignature(req: Request, rawBody: string, dataId: string): Promise<boolean> {
  const secret = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!secret) {
    console.warn("MP_WEBHOOK_SECRET not configured — skipping signature validation");
    return true; // fail-open until secret configured
  }
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature || !xRequestId) {
    console.warn("Missing x-signature or x-request-id headers", { xSignature, xRequestId });
    return false;
  }

  const parts = Object.fromEntries(xSignature.split(",").map((p) => p.trim().split("=")));
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) {
    console.warn("Malformed x-signature header", { xSignature });
    return false;
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const ok = hex === v1;
  if (!ok) {
    console.warn("Signature mismatch", {
      manifest,
      expected_v1: v1,
      computed: hex,
      secret_length: secret.length,
    });
  }
  return ok;
}

function extractPaymentId(body: any): string | null {
  if (body?.data?.id) return String(body.data.id);

  if (body?.topic === "payment" && body?.resource) {
    const resource = String(body.resource);
    const match = resource.match(/(\d+)(?:\/?$)/);
    return match?.[1] ?? resource;
  }

  return null;
}

function isPaymentNotification(body: any): boolean {
  return body?.type === "payment"
    || body?.action === "payment.created"
    || body?.action === "payment.updated"
    || body?.topic === "payment";
}

async function activateSubscriptionForPayment(supabase: any, payment: any) {
  const startDate = new Date();
  const endDate = new Date();
  const durationDays = payment?.plans?.duration_days || 30;
  endDate.setDate(endDate.getDate() + durationDays);

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", payment.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSub) {
    await supabase.from("subscriptions").update({
      plan_id: payment.plan_id,
      status: "active",
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    }).eq("id", existingSub.id);
  } else {
    await supabase.from("subscriptions").insert({
      user_id: payment.user_id,
      plan_id: payment.plan_id,
      status: "active",
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    });
  }

  console.log(`Subscription activated for user ${payment.user_id}, plan ${payment.plan_id}, ${durationDays} days`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    console.log("Webhook received:", rawBody);

    // MP sends different notification types
    if (!isPaymentNotification(body)) {
      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const paymentId = extractPaymentId(body);
    if (!paymentId) {
      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate signature when present. If it fails, fall back to provider-side verification.
    const valid = await validateMpSignature(req, rawBody, String(paymentId));
    if (!valid) {
      console.warn("Invalid MP webhook signature — continuing with provider verification fallback");
    }

    // Fetch payment details from MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const mpPayment = await mpRes.json();
    if (!mpRes.ok) {
      console.error(`MP fetch error [${mpRes.status}]:`, JSON.stringify(mpPayment));
      throw new Error("Failed to fetch payment from provider");
    }

    console.log("MP Payment status:", mpPayment.status, "external_reference:", mpPayment.external_reference);

    const internalPaymentId = mpPayment.external_reference;
    if (!internalPaymentId) {
      return new Response(JSON.stringify({ received: true, note: "no external_reference" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from("payments")
      .select("status")
      .eq("id", internalPaymentId)
      .single();

    if (existingPaymentError || !existingPayment) {
      console.error("Payment referenced by provider was not found:", internalPaymentId, existingPaymentError);
      return new Response(JSON.stringify({ error: "payment not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const previousStatus = existingPayment.status;

    // Map MP status
    const statusMap: Record<string, string> = {
      approved: "approved",
      pending: "pending",
      in_process: "pending",
      rejected: "rejected",
      cancelled: "cancelled",
      refunded: "refunded",
    };
    const newStatus = statusMap[mpPayment.status] || mpPayment.status;

    // Update payment record
    const { data: payment, error: updateError } = await supabase
      .from("payments")
      .update({
        status: newStatus,
        installments: mpPayment.installments || 1,
      })
      .eq("id", internalPaymentId)
      .select("*, plans(*)")
      .single();

    if (updateError) {
      console.error("Error updating payment:", updateError);
      throw updateError;
    }

    // Store gateway details in separate restricted table
    await supabase.from("payment_gateway_details").upsert({
      payment_id: internalPaymentId,
      mp_payment_id: String(paymentId),
    }, { onConflict: "payment_id" });

    if (updateError) {
      console.error("Error updating payment:", updateError);
      throw updateError;
    }

    // If approved for the first time, activate subscription once.
    if (newStatus === "approved" && payment && previousStatus !== "approved") {
      await activateSubscriptionForPayment(supabase, payment);
    }

    return new Response(JSON.stringify({ received: true, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
