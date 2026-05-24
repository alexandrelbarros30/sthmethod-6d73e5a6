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

function renderTemplate(content: string, ctx: Record<string, any>): string {
  const firstName = (ctx.full_name as string | undefined)?.split(" ")[0] || "Aluno";
  let msg = content;
  msg = msg.replace(/\{nome\}/g, firstName);
  msg = msg.replace(/\{nome_completo\}/g, ctx.full_name || "Aluno");
  msg = msg.replace(/\{email\}/g, ctx.email || "");
  msg = msg.replace(/\{telefone\}/g, ctx.phone || "");
  return msg;
}

async function sendWelcomeWhatsapp(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles").select("full_name, phone, email").eq("user_id", userId).maybeSingle();
  if (!profile?.phone) {
    console.log("[welcome-whatsapp] no phone for", userId);
    return;
  }
  const { data: tpl } = await supabase
    .from("message_templates").select("id, content, image_url").eq("system_key", "payment_welcome").maybeSingle();
  if (!tpl?.content) {
    console.warn("[welcome-whatsapp] payment_welcome template missing");
    return;
  }
  // Dedup: if welcome was already sent in last 24h, skip
  const { data: recent } = await supabase
    .from("message_history")
    .select("id")
    .eq("user_id", userId)
    .eq("template_id", tpl.id)
    .gte("created_at", new Date(Date.now() - 86400000).toISOString())
    .limit(1);
  if (recent && recent.length > 0) {
    console.log("[welcome-whatsapp] already sent recently for", userId);
    return;
  }
  const message = renderTemplate(tpl.content, {
    full_name: profile.full_name, email: profile.email, phone: profile.phone,
  });
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE}`,
      "apikey": SERVICE_ROLE,
    },
    body: JSON.stringify({ phone: profile.phone, message, image_url: tpl.image_url || null }),
  });
  const j = await res.json().catch(() => ({}));
  const ok = !!j?.ok;
  try {
    await supabase.from("message_history").insert({
      user_id: userId,
      template_id: tpl.id,
      content: message,
      recipient_phone: profile.phone,
      recipient_name: profile.full_name,
      image_url: tpl.image_url || null,
      status: ok ? "sent" : "failed",
      sent_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[welcome-whatsapp] history insert failed", e);
  }
  console.log("[welcome-whatsapp] result", { userId, ok });
}

async function activateSubscriptionForPayment(supabase: any, payment: any) {
  // Self-heal: ensure profile + student role exist before activating.
  // Some auth users were created without the handle_new_user trigger firing,
  // which leaves them orphaned and breaks every downstream feature (admin
  // panel, onboarding save, etc.). Repair on the fly here so a paying
  // customer is never stuck.
  try {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", payment.user_id)
      .maybeSingle();
    if (!existingProfile) {
      const { data: authUser } = await supabase.auth.admin.getUserById(payment.user_id);
      const fullName = authUser?.user?.user_metadata?.full_name
        || authUser?.user?.raw_user_meta_data?.full_name
        || "";
      const email = authUser?.user?.email || "";
      await supabase.from("profiles").insert({
        user_id: payment.user_id,
        full_name: fullName,
        email,
      });
      console.log(`[orphan-repair] created profile for ${payment.user_id}`);
    }
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", payment.user_id)
      .maybeSingle();
    if (!existingRole) {
      await supabase.from("user_roles").insert({ user_id: payment.user_id, role: "student" });
      console.log(`[orphan-repair] created student role for ${payment.user_id}`);
    }
  } catch (repairErr) {
    console.error("[orphan-repair] failed:", repairErr);
    // Do not block subscription activation
  }

  const startDate = new Date();
  const durationDays = payment?.plans?.duration_days || 30;

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id, start_date, end_date, status")
    .eq("user_id", payment.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If renewing before expiry, carry over remaining days.
  // Skip when the existing sub was created today (same activation flow) to
  // avoid double-stacking when webhook + reconcile both run.
  let baseDate = new Date(startDate);
  if (existingSub?.end_date) {
    const currentEnd = new Date(existingSub.end_date + "T23:59:59");
    const today = startDate.toISOString().split("T")[0];
    const startedToday = existingSub.start_date === today;
    if (currentEnd > startDate && existingSub.status === "active" && !startedToday) {
      baseDate = currentEnd;
    }
  }
  const endDate = new Date(baseDate);
  endDate.setDate(endDate.getDate() + durationDays);

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
      // Auto-send welcome WhatsApp (does not depend on admin being online)
      try {
        await sendWelcomeWhatsapp(supabase, payment.user_id);
      } catch (e) {
        console.error("[welcome-whatsapp] failed", e);
      }
    }

    return new Response(JSON.stringify({ received: true, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
