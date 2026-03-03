import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // MP sends different notification types
    if (body.type !== "payment" && body.action !== "payment.created" && body.action !== "payment.updated") {
      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
        mp_payment_id: String(paymentId),
        installments: mpPayment.installments || 1,
      })
      .eq("id", internalPaymentId)
      .select("*, plans(*)")
      .single();

    if (updateError) {
      console.error("Error updating payment:", updateError);
      throw updateError;
    }

    // If approved, activate subscription
    if (newStatus === "approved" && payment) {
      const startDate = new Date();
      const endDate = new Date();
      const durationDays = (payment as any).plans?.duration_days || 30;
      endDate.setDate(endDate.getDate() + durationDays);

      // Check existing subscription
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", payment.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSub) {
        // Update existing
        await supabase.from("subscriptions").update({
          plan_id: payment.plan_id,
          status: "active",
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        }).eq("id", existingSub.id);
      } else {
        // Create new
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

    return new Response(JSON.stringify({ received: true, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
