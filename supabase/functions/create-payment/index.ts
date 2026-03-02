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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { plan_id, method, action_type } = await req.json();
    if (!plan_id || !method) throw new Error("Missing plan_id or method");

    // Fetch plan
    const { data: plan, error: planError } = await supabase.from("plans").select("*").eq("id", plan_id).single();
    if (planError || !plan) throw new Error("Plan not found");

    // Fetch user profile
    const { data: profile } = await supabase.from("profiles").select("full_name, email, phone").eq("user_id", userId).single();

    // Calculate price
    const priceStr = plan.price.replace(/[^\d,\.]/g, "").replace(",", ".");
    let originalAmount = parseFloat(priceStr) || 0;
    let finalAmount = originalAmount;

    if ((plan as any).discount_type === "percentage" && (plan as any).discount_value > 0) {
      finalAmount = originalAmount * (1 - (plan as any).discount_value / 100);
    } else if ((plan as any).discount_type === "fixed" && (plan as any).discount_value > 0) {
      finalAmount = Math.max(0, originalAmount - (plan as any).discount_value);
    }
    finalAmount = Math.round(finalAmount * 100) / 100;

    // Create payment record
    const { data: payment, error: paymentError } = await supabase.from("payments").insert({
      user_id: userId,
      plan_id,
      amount: finalAmount,
      original_amount: originalAmount,
      method,
      action_type: action_type || "new",
      status: "pending",
    }).select().single();
    if (paymentError) throw paymentError;

    // Map payment method
    const excludedMethods: Record<string, string[]> = {
      pix: ["credit_card", "debit_card", "ticket", "bolbradesco"],
      credit: ["pix", "debit_card", "ticket", "bolbradesco"],
      debit: ["pix", "credit_card", "ticket", "bolbradesco"],
    };

    // Create MP preference
    const preference = {
      items: [{
        title: `${plan.name} - ST&H Consultoria`,
        description: plan.subtitle || plan.duration,
        quantity: 1,
        unit_price: finalAmount,
        currency_id: "BRL",
      }],
      payer: {
        name: profile?.full_name || "",
        email: profile?.email || "",
      },
      external_reference: payment.id,
      back_urls: {
        success: `${req.headers.get("origin") || "https://sthconsultoria.lovable.app"}/dashboard/subscription?status=approved`,
        failure: `${req.headers.get("origin") || "https://sthconsultoria.lovable.app"}/dashboard/subscription?status=failed`,
        pending: `${req.headers.get("origin") || "https://sthconsultoria.lovable.app"}/dashboard/subscription?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercado-pago-webhook`,
      excluded_payment_methods: [],
      excluded_payment_types: (excludedMethods[method] || []).map((id: string) => ({ id })),
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const mpData = await mpRes.json();
    if (!mpRes.ok) throw new Error(`MP error [${mpRes.status}]: ${JSON.stringify(mpData)}`);

    // Update payment with MP preference ID
    await supabase.from("payments").update({ mp_preference_id: mpData.id }).eq("id", payment.id);

    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      payment_id: payment.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    console.error("Error creating payment:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
