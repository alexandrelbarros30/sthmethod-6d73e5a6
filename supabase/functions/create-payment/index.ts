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

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    // Service role client for coupon operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { plan_id, method, action_type, coupon_id } = await req.json();
    if (!plan_id || !method) throw new Error("Missing plan_id or method");

    // Fetch plan
    const { data: plan, error: planError } = await supabaseAuth.from("plans").select("*").eq("id", plan_id).single();
    if (planError || !plan) throw new Error("Plan not found");

    // Fetch user profile
    const { data: profile } = await supabaseAuth.from("profiles").select("full_name, email, phone").eq("user_id", userId).single();

    // Calculate base price (with plan discount)
    const priceStr = plan.price.replace(/[^\d,\.]/g, "").replace(",", ".");
    let originalAmount = parseFloat(priceStr) || 0;
    let finalAmount = originalAmount;

    if ((plan as any).discount_type === "percentage" && (plan as any).discount_value > 0) {
      finalAmount = originalAmount * (1 - (plan as any).discount_value / 100);
    } else if ((plan as any).discount_type === "fixed" && (plan as any).discount_value > 0) {
      finalAmount = Math.max(0, originalAmount - (plan as any).discount_value);
    }

    // Apply coupon discount
    let couponDiscount = 0;
    let validCouponId: string | null = null;

    if (coupon_id) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("id", coupon_id)
        .eq("active", true)
        .single();

      if (coupon) {
        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
        const isMaxed = coupon.current_uses >= coupon.max_uses;
        const wrongPlan = coupon.plan_id && coupon.plan_id !== plan_id;

        if (!isExpired && !isMaxed && !wrongPlan) {
          if (coupon.discount_type === "percentage") {
            couponDiscount = finalAmount * (Number(coupon.discount_value) / 100);
          } else {
            couponDiscount = Math.min(Number(coupon.discount_value), finalAmount);
          }
          couponDiscount = Math.round(couponDiscount * 100) / 100;
          finalAmount = Math.max(0, finalAmount - couponDiscount);
          validCouponId = coupon.id;

          // Increment coupon usage
          await supabaseAdmin
            .from("coupons")
            .update({ current_uses: coupon.current_uses + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    finalAmount = Math.round(finalAmount * 100) / 100;

    // Create payment record
    const paymentInsert: any = {
      user_id: userId,
      plan_id,
      amount: finalAmount,
      original_amount: originalAmount,
      method,
      action_type: action_type || "new",
      status: "pending",
    };
    if (validCouponId) {
      paymentInsert.coupon_id = validCouponId;
      paymentInsert.coupon_discount = couponDiscount;
    }

    const { data: payment, error: paymentError } = await supabaseAdmin.from("payments").insert(paymentInsert).select().single();
    if (paymentError) throw paymentError;

    // Map payment method to excluded types
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

    // Store MP preference ID in gateway details table
    await supabaseAdmin.from("payment_gateway_details").upsert({
      payment_id: payment.id,
      mp_preference_id: mpData.id,
    }, { onConflict: "payment_id" });

    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      payment_id: payment.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    console.error("Error creating payment:", error);
    return new Response(JSON.stringify({ error: "Falha ao criar pagamento. Tente novamente." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
