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

// Enfileira um e-mail transacional via fila unificada (email_scheduled_sends).
// Dedup por `source` para evitar duplicatas em retries do webhook MP.
async function enqueueEmail(
  supabase: any,
  templateKey: string,
  userId: string,
  source: string,
  data: Record<string, unknown>,
) {
  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prof?.email) return;

    const { data: existing } = await supabase
      .from("email_scheduled_sends")
      .select("id")
      .eq("source", source)
      .eq("template_key", templateKey)
      .limit(1);
    if (existing && existing.length > 0) return;

    await supabase.from("email_scheduled_sends").insert({
      template_key: templateKey,
      recipient_user_id: userId,
      recipient_email: prof.email,
      recipient_name: prof.full_name,
      template_data: { name: prof.full_name || "", siteUrl: "https://sthmethod.com", ...data },
      source,
    });
  } catch (e) {
    console.error("[enqueueEmail] failed", templateKey, e);
  }
}

function fmtBRL(value: number | null | undefined): string {
  if (value == null) return "";
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
  } catch {
    return `R$ ${Number(value).toFixed(2)}`;
  }
}

function isPaymentNotification(body: any): boolean {
  return body?.type === "payment"
    || body?.action === "payment.created"
    || body?.action === "payment.updated"
    || body?.topic === "payment";
}

function isPreapprovalNotification(body: any): boolean {
  const t = body?.type || body?.topic || "";
  const a = body?.action || "";
  return t === "subscription_preapproval"
    || t === "preapproval"
    || t === "subscription_authorized_payment"
    || t === "authorized_payment"
    || a.startsWith("subscription_preapproval")
    || a.startsWith("subscription_authorized_payment");
}

function extractResourceId(body: any): string | null {
  if (body?.data?.id) return String(body.data.id);
  if (body?.resource) {
    const m = String(body.resource).match(/(\w+)(?:\/?$)/);
    return m?.[1] ?? String(body.resource);
  }
  return null;
}

async function handleMpSubscriptionEvent(
  supabase: any,
  MP_ACCESS_TOKEN: string,
  body: any,
): Promise<Response | null> {
  const t = body?.type || body?.topic || "";
  const a = body?.action || "";
  const isAuthorizedPayment = t.includes("authorized_payment") || a.includes("authorized_payment");
  const isPreapprovalUpdate = !isAuthorizedPayment && (t.includes("preapproval") || a.includes("preapproval"));

  const resourceId = extractResourceId(body);
  if (!resourceId) return null;

  let preapprovalId: string | null = null;
  let chargeAmount = 0;
  let chargeStatus = "";

  if (isAuthorizedPayment) {
    const r = await fetch(`https://api.mercadopago.com/authorized_payments/${resourceId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const ap = await r.json();
    if (!r.ok) {
      console.error("MP authorized_payment fetch failed", r.status, ap);
      return new Response(JSON.stringify({ received: true, note: "authorized_payment fetch failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    preapprovalId = ap?.preapproval_id ? String(ap.preapproval_id) : null;
    chargeAmount = Number(ap?.transaction_amount || 0);
    chargeStatus = String(ap?.status || "");
  } else if (isPreapprovalUpdate) {
    preapprovalId = resourceId;
  }

  if (!preapprovalId) return null;

  const { data: sub } = await supabase
    .from("mp_subscriptions")
    .select("*, plans(*)")
    .eq("mp_preapproval_id", preapprovalId)
    .maybeSingle();

  if (!sub) {
    console.warn("mp_subscriptions not found for preapproval", preapprovalId);
    return new Response(JSON.stringify({ received: true, note: "mp_subscription not found" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Preapproval status update (authorized / cancelled / paused).
  if (isPreapprovalUpdate) {
    const r = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const pa = await r.json();
    if (r.ok && pa?.status) {
      await supabase.from("mp_subscriptions").update({
        status: pa.status,
        next_payment_date: pa.next_payment_date || sub.next_payment_date,
      }).eq("id", sub.id);
    }
    return new Response(JSON.stringify({ received: true, preapproval_status: pa?.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // authorized_payment: só processa quando aprovado.
  if (chargeStatus !== "approved" && chargeStatus !== "accredited") {
    return new Response(JSON.stringify({ received: true, charge_status: chargeStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const newChargesDone = sub.charges_done + 1;
  const newTotal = Number(sub.total_amount_paid) + chargeAmount;

  await supabase.from("mp_subscriptions").update({
    charges_done: newChargesDone,
    total_amount_paid: newTotal,
  }).eq("id", sub.id);

  // Insere histórico em payments para recibo/painel admin.
  try {
    await supabase.from("payments").insert({
      user_id: sub.user_id,
      plan_id: sub.plan_id,
      amount: chargeAmount,
      original_amount: chargeAmount,
      method: "credit",
      action_type: newChargesDone === 1 ? "new" : "subscription",
      status: "approved",
      installments: 1,
    });
  } catch (e) {
    console.error("[mp-sub] payments insert failed", e);
  }

  // Na 1ª cobrança aprovada → ativa a assinatura de 180 dias.
  if (newChargesDone === 1) {
    await activateSubscriptionForPayment(supabase, {
      user_id: sub.user_id,
      plan_id: sub.plan_id,
      plans: sub.plans,
    });
    try {
      await supabase.from("profiles")
        .update({ onboarding_complete: true })
        .eq("user_id", sub.user_id)
        .eq("onboarding_complete", false);
    } catch {}
  }

  // Transição Fase 1 → Fase 2 após 2 cobranças.
  if (sub.phase === 1 && newChargesDone >= sub.phase1_charges) {
    const phase2End = new Date();
    phase2End.setDate(phase2End.getDate() + (30 * sub.phase2_charges + 5));
    const upd = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        reason: `${sub.plans?.name || "Plano"} — Fase 2 (4× R$ ${Number(sub.phase2_amount).toFixed(2)})`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: Number(sub.phase2_amount),
          currency_id: "BRL",
          end_date: phase2End.toISOString(),
        },
      }),
    });
    const updJson = await upd.json().catch(() => ({}));
    if (!upd.ok) {
      console.error("[mp-sub] phase2 PUT failed", upd.status, updJson);
    } else {
      await supabase.from("mp_subscriptions").update({
        phase: 2,
        end_date: phase2End.toISOString(),
      }).eq("id", sub.id);
      console.log("[mp-sub] advanced to phase 2", sub.id);
    }
  }

  // Encerramento ao concluir Fase 2.
  if (sub.phase === 2 && newChargesDone >= (sub.phase1_charges + sub.phase2_charges)) {
    await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ status: "cancelled" }),
    }).catch((e) => console.error("[mp-sub] cancel failed", e));
    await supabase.from("mp_subscriptions").update({
      status: "finished",
    }).eq("id", sub.id);
  }

  return new Response(JSON.stringify({
    received: true,
    mp_subscription_id: sub.id,
    charges_done: newChargesDone,
    phase: sub.phase,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function renderTemplate(content: string, ctx: Record<string, any>): string {
  const firstName = (ctx.full_name as string | undefined)?.split(" ")[0] || "Aluno";
  let msg = content;
  msg = msg.replace(/\{nome\}/g, firstName);
  msg = msg.replace(/\{nome_completo\}/g, ctx.full_name || "Aluno");
  msg = msg.replace(/\{email\}/g, ctx.email || "");
  msg = msg.replace(/\{telefone\}/g, ctx.phone || "");
  msg = msg.replace(/\{plano\}/g, ctx.plan_name || "—");
  msg = msg.replace(/\{valor\}/g, ctx.amount || ctx.plan_price || "—");
  if (ctx.end_date) {
    const d = new Date(String(ctx.end_date) + "T00:00:00");
    const venc = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    msg = msg.replace(/\{vencimento\}/g, venc);
    msg = msg.replace(/\{data_vencimento\}/g, venc);
    const diff = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
    msg = msg.replace(/\{dias_restantes\}/g, String(diff));
    const over = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
    msg = msg.replace(/\{dias_vencido\}/g, String(over));
  } else {
    msg = msg.replace(/\{vencimento\}/g, "—");
    msg = msg.replace(/\{data_vencimento\}/g, "—");
    msg = msg.replace(/\{dias_restantes\}/g, "—");
    msg = msg.replace(/\{dias_vencido\}/g, "—");
  }
  const link = ctx.user_id
    ? `https://sthmethod.com.br/dashboard/renew?uid=${ctx.user_id}${ctx.plan_id ? `&pid=${ctx.plan_id}` : ''}`
    : "";
  msg = msg.replace(/\{link\}/g, link);
  msg = msg.replace(/\{link_renovacao\}/g, link);
  msg = msg.replace(/\{cupom\}/g, ctx.cupom || "");
  return msg;
}

async function sendAutomationWhatsapp(
  supabase: any,
  userId: string,
  trigger: string,
  channel: "nutri" | "comercial" = "nutri",
) {
  const { data: profile } = await supabase
    .from("profiles").select("full_name, phone, email").eq("user_id", userId).maybeSingle();
  if (!profile?.phone) {
    console.log(`[${trigger}] no phone for`, userId);
    return;
  }
  // Carrega assinatura ativa mais recente + plano para popular {plano}, {vencimento}, {valor}.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("end_date, plan_id")
    .eq("user_id", userId)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  let planName: string | null = null;
  let planPrice: string | null = null;
  if (sub?.plan_id) {
    const { data: plan } = await supabase
      .from("plans").select("name, price").eq("id", sub.plan_id).maybeSingle();
    if (plan) {
      planName = plan.name || null;
      if (plan.price != null) {
        planPrice = Number(plan.price).toLocaleString("pt-BR", {
          style: "currency", currency: "BRL",
        });
      }
    }
  }
  // Templates de automação são gerenciados na CRM (crm_message_templates).
  // Resolução por prioridade: automation_trigger=<trigger> → key=<trigger>
  // → fallback por key legada conhecida.
  const legacyKeyMap: Record<string, string> = {
    payment_welcome: "automacao_pagamento_aprovado",
    payment_welcome_new: "automacao_pagamento_aprovado",
    payment_renewal: "automacao_pagamento_renovacao",
    payment_welcome_renewal: "automacao_pagamento_renovacao",
    payment_welcome_reactivation: "automacao_pagamento_reativacao",
    payment_thanks_comercial: "automacao_pagamento_comercial",
  };
  const legacyKey = legacyKeyMap[trigger] || trigger;
  let tpl: { id: string; body: string; media_url: string | null } | null = null;
  {
    const { data } = await supabase
      .from("crm_message_templates")
      .select("id, body, media_url, active")
      .or(`automation_trigger.eq.${trigger},key.eq.${trigger},key.eq.${legacyKey}`)
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (data?.body) tpl = { id: data.id, body: data.body, media_url: data.media_url };
  }
  if (!tpl?.body) {
    console.warn(`[${trigger}] template missing in crm_message_templates`);
    return;
  }
  // Dedup: se já enviamos este mesmo template em 24h, não repetir.
  const { data: recent } = await supabase
    .from("message_history")
    .select("id")
    .eq("user_id", userId)
    .eq("template_id", tpl.id)
    .gte("created_at", new Date(Date.now() - 86400000).toISOString())
    .limit(1);
  if (recent && recent.length > 0) {
    console.log(`[${trigger}] already sent recently for`, userId);
    return;
  }
  const message = renderTemplate(tpl.body, {
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    user_id: userId,
    plan_id: sub?.plan_id || null,
    plan_name: planName,
    plan_price: planPrice,
    amount: planPrice,
    end_date: sub?.end_date || null,
  });
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // Canal:
  //  - nutri    → send-wapi   (Fale com o Nutri, 5521998984153)
  //  - comercial→ send-whatsapp (Z-API canal comercial)
  const fnName = channel === "comercial" ? "send-whatsapp" : "send-wapi";
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE}`,
      "apikey": SERVICE_ROLE,
    },
    body: JSON.stringify({ phone: profile.phone, message, image_url: tpl.media_url || null }),
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
      image_url: tpl.media_url || null,
      status: ok ? "sent" : "failed",
      sent_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error(`[${trigger}] history insert failed`, e);
  }
  console.log(`[${trigger}][${channel}] result`, { userId, ok });
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
    }).eq("user_id", payment.user_id);
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

  // Self-heal: mark onboarding_complete=true once the student has a paid
  // subscription. Without this, the client gate in StudentSubscription keeps
  // showing the onboarding wizard even after the payment was approved
  // (happened with Cristiano Jorge — paid PIX, sub active, mas onboarding
  // continuava false porque o callback onPaymentSuccess depende do diálogo
  // ficar aberto).
  try {
    await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("user_id", payment.user_id)
      .eq("onboarding_complete", false);
  } catch (e) {
    console.error("[onboarding-flag] failed to set onboarding_complete", e);
  }
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

    // Eventos de assinatura escalonada (Projeto Verão 180 etc.)
    if (isPreapprovalNotification(body)) {
      const handled = await handleMpSubscriptionEvent(supabase, MP_ACCESS_TOKEN, body);
      if (handled) return handled;
    }

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

    // ===== Pagamento avulso (link com valor livre) =====
    if (typeof internalPaymentId === "string" && internalPaymentId.startsWith("cpay:")) {
      const cpId = internalPaymentId.slice(5);
      const statusMap: Record<string, string> = {
        approved: "approved", pending: "pending", in_process: "pending",
        rejected: "rejected", cancelled: "cancelled", refunded: "refunded",
      };
      const newStatus = statusMap[mpPayment.status] || mpPayment.status;

      const { data: prev } = await supabase
        .from("custom_payments")
        .select("status, link_id")
        .eq("id", cpId)
        .maybeSingle();
      if (!prev) {
        return new Response(JSON.stringify({ received: true, note: "custom payment not found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await supabase.from("custom_payments")
        .update({ status: newStatus, mp_payment_id: String(paymentId) })
        .eq("id", cpId);

      // Incrementa current_uses do link na primeira aprovação
      if (newStatus === "approved" && prev.status !== "approved" && prev.link_id) {
        const { data: link } = await supabase
          .from("custom_payment_links")
          .select("current_uses")
          .eq("id", prev.link_id)
          .maybeSingle();
        if (link) {
          await supabase.from("custom_payment_links")
            .update({ current_uses: (link.current_uses || 0) + 1 })
            .eq("id", prev.link_id);
        }
      }

      return new Response(JSON.stringify({ received: true, custom_payment_id: cpId, status: newStatus }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    // ===== E-mails de status de pagamento (pending / failed) =====
    const planName = payment?.plans?.name || "";
    const amountStr = fmtBRL(payment?.amount);
    const methodStr = payment?.method || "";
    const paymentDateStr = new Date().toLocaleDateString("pt-BR");

    if (newStatus === "pending" && previousStatus !== "pending" && payment) {
      await enqueueEmail(
        supabase,
        "payment-pending",
        payment.user_id,
        `mp:${payment.id}:pending`,
        { planName, amount: amountStr, method: methodStr },
      );
    }

    if (newStatus === "rejected" && previousStatus !== "rejected" && payment) {
      await enqueueEmail(
        supabase,
        "payment-failed",
        payment.user_id,
        `mp:${payment.id}:rejected`,
        { planName, amount: amountStr, method: methodStr, reason: "Pagamento recusado pelo emissor" },
      );
    }

    // If approved for the first time, activate subscription once.
    if (newStatus === "approved" && payment && previousStatus !== "approved") {
      // Classifica o tipo de adesão ANTES de ativar (depois disso a sub já
      // está ativa com end_date futuro e não dá pra distinguir reativação).
      let kind: "novo" | "reativacao" | "renovacao" = "novo";
      try {
        const { data: prevSub } = await supabase
          .from("subscriptions")
          .select("end_date, status")
          .eq("user_id", payment.user_id)
          .order("end_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (prevSub) {
          const prevEnd = new Date(String(prevSub.end_date) + "T23:59:59");
          kind = prevEnd < new Date() ? "reativacao" : "renovacao";
        }
      } catch (e) {
        console.error("[kind] failed to classify", e);
      }
      await activateSubscriptionForPayment(supabase, payment);
      // Boas-vindas: NOVO aluno (primeira compra) → template payment_welcome.
      // Reativação (assinatura vencida) e Renovação (ainda ativa) recebem
      // mensagens diferenciadas pela linha "Fale com o Nutri".
      // Em PARALELO, o canal Comercial (Z-API) envia agradecimento pela
      // escolha do plano com nome + vencimento.
      try {
        // Lock atômico: o MP frequentemente envia o mesmo evento em paralelo
        // (múltiplos topics) e duas execuções simultâneas conseguiam passar pelo
        // dedup por message_history. Aqui só a primeira chamada que conseguir
        // marcar automation_sent_at prossegue com o disparo.
        const { data: claim } = await supabase
          .from("payments")
          .update({ automation_sent_at: new Date().toISOString() })
          .eq("id", payment.id)
          .is("automation_sent_at", null)
          .select("id")
          .maybeSingle();
        if (!claim) {
          console.log("[automation-whatsapp] skipped (already claimed) for", payment.id);
        } else {
          // Trigger do canal Nutri por tipo de adesão.
          const nutriTrigger =
            kind === "novo" ? "payment_welcome_new"
            : kind === "reativacao" ? "payment_welcome_reactivation"
            : "payment_welcome_renewal";
          // Dispara os 2 canais em paralelo: Comercial (agradecimento) +
          // Nutri (saudação personalizada por tipo de adesão).
          await Promise.allSettled([
            sendAutomationWhatsapp(supabase, payment.user_id, "payment_thanks_comercial", "comercial"),
            sendAutomationWhatsapp(supabase, payment.user_id, nutriTrigger, "nutri"),
          ]);

          // ===== E-mails de pagamento aprovado =====
          if (kind === "novo") {
            await Promise.allSettled([
              enqueueEmail(
                supabase,
                "welcome-post-payment",
                payment.user_id,
                `mp:${payment.id}:welcome-post-payment`,
                { planName },
              ),
              enqueueEmail(
                supabase,
                "payment-receipt-first",
                payment.user_id,
                `mp:${payment.id}:receipt-first`,
                { planName, amount: amountStr, method: methodStr, paymentDate: paymentDateStr },
              ),
            ]);
          } else {
            await enqueueEmail(
              supabase,
              "payment-receipt-renewal",
              payment.user_id,
              `mp:${payment.id}:receipt-renewal`,
              { planName, amount: amountStr, method: methodStr, paymentDate: paymentDateStr },
            );
          }
        }
      } catch (e) {
        console.error("[automation-whatsapp] failed", e);
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
