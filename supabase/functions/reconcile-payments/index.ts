import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { triggerSupercoachSync } from "../_shared/supercoach-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RECONCILE_WINDOW_MS = 48 * 60 * 60 * 1000;

function mapPaymentStatus(status: string | null | undefined) {
  const statusMap: Record<string, string> = {
    approved: "approved",
    pending: "pending",
    in_process: "pending",
    authorized: "approved",
    rejected: "rejected",
    cancelled: "cancelled",
    refunded: "refunded",
    charged_back: "refunded",
  };

  return statusMap[status || ""] || (status || "pending");
}

async function activateSubscriptionForPayment(supabase: any, payment: any) {
  const startDate = new Date();
  const durationDays = payment?.plans?.duration_days || 30;

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id, start_date, end_date, status")
    .eq("user_id", payment.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If renewing before expiry, carry over remaining days from active plan.
  // Skip when the existing sub started today (same activation flow) to avoid
  // double-stacking when webhook + reconcile both run for the same payment.
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

  // Espelha vencimento no SuperCoach (fire-and-forget).
  triggerSupercoachSync({
    userId: payment.user_id,
    expiresDate: endDate.toISOString().split("T")[0],
  }).catch(() => {});
}

async function fetchGatewayPayment(accessToken: string, mpPaymentId: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch payment by MP id", { mpPaymentId, status: response.status, errorText });
    return null;
  }

  return await response.json();
}

async function searchGatewayPayment(accessToken: string, externalReference: string) {
  const url = new URL("https://api.mercadopago.com/v1/payments/search");
  url.searchParams.set("external_reference", externalReference);
  url.searchParams.set("sort", "date_created");
  url.searchParams.set("criteria", "desc");
  url.searchParams.set("limit", "10");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to search payment by external_reference", { externalReference, status: response.status, errorText });
    return null;
  }

  const data = await response.json();
  const results = data?.results || [];
  if (!results.length) return null;

  const preferred = results.find((item: any) => item.status === "approved") || results[0];
  if (!preferred?.id) return null;

  return await fetchGatewayPayment(accessToken, String(preferred.id));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const requestedPaymentIds = Array.isArray(body?.payment_ids)
      ? body.payment_ids.filter((value: unknown) => typeof value === "string")
      : [];

    let paymentsQuery = supabaseAdmin
      .from("payments")
      .select("id, user_id, plan_id, status, method, installments, created_at, plans(duration_days)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .gte("created_at", new Date(Date.now() - RECONCILE_WINDOW_MS).toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    if (requestedPaymentIds.length > 0) {
      paymentsQuery = paymentsQuery.in("id", requestedPaymentIds);
    }

    const { data: pendingPayments, error: paymentsError } = await paymentsQuery;
    if (paymentsError) throw paymentsError;

    if (!pendingPayments?.length) {
      return new Response(JSON.stringify({
        checked_count: 0,
        changed_count: 0,
        approved_count: 0,
        pending_count: 0,
        payments: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pendingPaymentIds = pendingPayments.map((payment: any) => payment.id);
    const { data: gatewayDetails } = await supabaseAdmin
      .from("payment_gateway_details")
      .select("payment_id, mp_payment_id, mp_preference_id")
      .in("payment_id", pendingPaymentIds);

    const gatewayDetailsByPaymentId = new Map(
      (gatewayDetails || []).map((detail: any) => [detail.payment_id, detail])
    );

    const results: Array<{ id: string; previous_status: string; status: string; mp_payment_id: string | null }> = [];
    let changedCount = 0;
    let approvedCount = 0;

    for (const payment of pendingPayments) {
      const gatewayDetail = gatewayDetailsByPaymentId.get(payment.id);
      const gatewayPayment = gatewayDetail?.mp_payment_id
        ? await fetchGatewayPayment(MP_ACCESS_TOKEN, gatewayDetail.mp_payment_id)
        : await searchGatewayPayment(MP_ACCESS_TOKEN, payment.id);

      if (!gatewayPayment) {
        results.push({
          id: payment.id,
          previous_status: payment.status,
          status: payment.status,
          mp_payment_id: gatewayDetail?.mp_payment_id || null,
        });
        continue;
      }

      const nextStatus = mapPaymentStatus(gatewayPayment.status);
      const nextInstallments = gatewayPayment.installments || payment.installments || 1;
      const mpPaymentId = gatewayPayment.id ? String(gatewayPayment.id) : gatewayDetail?.mp_payment_id || null;

      await supabaseAdmin.from("payment_gateway_details").upsert({
        payment_id: payment.id,
        mp_payment_id: mpPaymentId,
        mp_preference_id: gatewayDetail?.mp_preference_id || null,
      }, { onConflict: "payment_id" });

      if (nextStatus === "pending" && nextInstallments === payment.installments) {
        results.push({
          id: payment.id,
          previous_status: payment.status,
          status: payment.status,
          mp_payment_id: mpPaymentId,
        });
        continue;
      }

      const { data: updatedPayment, error: updateError } = await supabaseAdmin
        .from("payments")
        .update({
          status: nextStatus,
          installments: nextInstallments,
        })
        .eq("id", payment.id)
        .eq("status", "pending")
        .select("id, user_id, plan_id, status, plans(duration_days)")
        .maybeSingle();

      if (updateError) throw updateError;

      if (updatedPayment) {
        changedCount += 1;

        if (nextStatus === "approved") {
          approvedCount += 1;
          await activateSubscriptionForPayment(supabaseAdmin, updatedPayment);
        }
      }

      results.push({
        id: payment.id,
        previous_status: payment.status,
        status: updatedPayment?.status || nextStatus,
        mp_payment_id: mpPaymentId,
      });
    }

    return new Response(JSON.stringify({
      checked_count: pendingPayments.length,
      changed_count: changedCount,
      approved_count: approvedCount,
      pending_count: results.filter((payment) => payment.status === "pending").length,
      payments: results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("reconcile-payments error:", error);
    return new Response(JSON.stringify({ error: "Falha ao reconciliar pagamentos." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});