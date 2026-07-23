import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { plan_id, method, action_type, coupon_id } = await req.json();
    if (!plan_id || !method) throw new Error("Missing plan_id or method");

    // Validate method
    const validMethods = ["pix", "credit", "debit"];
    if (!validMethods.includes(method)) throw new Error("Invalid payment method");

    // Fetch plan from DB (server-side source of truth)
    const { data: plan, error: planError } = await supabaseAuth.from("plans").select("*").eq("id", plan_id).single();
    if (planError || !plan) throw new Error("Plan not found");

    // Fetch user profile
    const { data: profile } = await supabaseAuth.from("profiles").select("full_name, email, phone").eq("user_id", userId).single();

    // SERVER-SIDE price calculation — client cannot influence this
    const isCard = method === "credit" || method === "debit";
    const rawPriceStr = isCard && plan.card_price ? plan.card_price : plan.price;
    const priceStr = rawPriceStr.replace(/[^\d,\.]/g, "").replace(",", ".");
    let originalAmount = parseFloat(priceStr) || 0;
    let finalAmount = originalAmount;

    // Apply plan-level discount
    if ((plan as any).discount_type === "percentage" && (plan as any).discount_value > 0) {
      finalAmount = originalAmount * (1 - (plan as any).discount_value / 100);
    } else if ((plan as any).discount_type === "fixed" && (plan as any).discount_value > 0) {
      finalAmount = Math.max(0, originalAmount - (plan as any).discount_value);
    }

    // Apply coupon discount
    let couponDiscount = 0;
    let validCouponId: string | null = null;

    // IMPORTANT: Coupons are PIX-ONLY. Other methods always pay full price.
    if (coupon_id && method === "pix") {
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
            // Cupom calculado sobre o valor cheio (originalAmount), não sobre o valor já descontado
            couponDiscount = originalAmount * (Number(coupon.discount_value) / 100);
          } else {
            couponDiscount = Math.min(Number(coupon.discount_value), originalAmount);
          }
          couponDiscount = Math.round(couponDiscount * 100) / 100;
          finalAmount = Math.max(0, originalAmount - couponDiscount);
          validCouponId = coupon.id;

          await supabaseAdmin
            .from("coupons")
            .update({ current_uses: coupon.current_uses + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    finalAmount = Math.round(finalAmount * 100) / 100;

    // ==========================================================
    // 100% de desconto (cupom gratuidade — ex.: PRIMEIRO testers APK)
    // Bypass total do Mercado Pago: ativa a assinatura direto.
    // Mercado Pago rejeita unit_price=0 e travava o checkout em tela branca.
    // ==========================================================
    if (finalAmount <= 0 && validCouponId) {
      const freePayload: any = {
        user_id: userId,
        plan_id,
        amount: 0,
        original_amount: originalAmount,
        method: "free",
        action_type: action_type || "new",
        status: "approved",
        installments: 1,
        coupon_id: validCouponId,
        coupon_discount: couponDiscount,
      };

      // Reaproveita registro pendente se existir; senão insere novo
      const { data: prevPending } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("user_id", userId)
        .eq("plan_id", plan_id)
        .eq("status", "pending")
        .gt("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let freePayment: any;
      if (prevPending?.id) {
        const { data: upd, error: uErr } = await supabaseAdmin
          .from("payments").update(freePayload).eq("id", prevPending.id).select().single();
        if (uErr) throw new Error(`Free activation update error: ${uErr.message}`);
        freePayment = upd;
      } else {
        const { data: ins, error: iErr } = await supabaseAdmin
          .from("payments").insert(freePayload).select().single();
        if (iErr) throw new Error(`Free activation insert error: ${iErr.message}`);
        freePayment = ins;
      }

      // Ativa/estende assinatura
      // Idempotência: se este pagamento já ativou a assinatura antes, sai sem repetir.
      if (freePayment?.subscription_applied_at) {
        const origin = req.headers.get("origin") || "https://sthmethod.com.br";
        return new Response(JSON.stringify({
          free_activation: true,
          payment_id: freePayment.id,
          redirect_url: `${origin}/dashboard/subscription?status=approved&free=1`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const durationDays = plan.duration_days || 30;
      const startDate = new Date();
      const { data: existingSub } = await supabaseAdmin
        .from("subscriptions")
        .select("id, start_date, end_date, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let baseDate = new Date(startDate);
      if (existingSub?.end_date) {
        const currentEnd = new Date(existingSub.end_date + "T23:59:59");
        const today = startDate.toISOString().split("T")[0];
        const startedToday = existingSub.start_date === today;
        // Só empilha em cima da assinatura vigente se ela NÃO foi criada hoje pelo
        // próprio fluxo — evita somar dias em reexecuções do mesmo checkout.
        if (currentEnd > startDate && existingSub.status === "active" && !startedToday) {
          baseDate = currentEnd;
        }
      }
      const endDate = new Date(baseDate);
      endDate.setDate(endDate.getDate() + durationDays);

      const subPayload = {
        user_id: userId,
        plan_id,
        status: "active",
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      };
      if (existingSub) {
        await supabaseAdmin.from("subscriptions").update(subPayload).eq("id", existingSub.id);
      } else {
        await supabaseAdmin.from("subscriptions").insert(subPayload);
      }

      // Marca o pagamento como aplicado para bloquear reprocessamento futuro.
      await supabaseAdmin
        .from("payments")
        .update({ subscription_applied_at: new Date().toISOString() })
        .eq("id", freePayment.id)
        .is("subscription_applied_at", null);

      console.log(`Free activation via coupon: user=${userId}, plan=${plan.name}, days=${durationDays}`);

      const origin = req.headers.get("origin") || "https://sthmethod.com.br";
      return new Response(JSON.stringify({
        free_activation: true,
        payment_id: freePayment.id,
        redirect_url: `${origin}/dashboard/subscription?status=approved&free=1`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // SERVER-SIDE installment calculation based on plan duration and method
    let maxInstallments = 1;
    if (method === "credit") {
      if (plan.duration_days >= 180) {
        maxInstallments = 6;
      } else if (plan.duration_days >= 90) {
        maxInstallments = 3;
      } else {
        maxInstallments = 1;
      }
    }
    // PIX and debit: ALWAYS 1 installment, no exceptions

    // Create payment record (reuse a recent pending one for the same plan to avoid trigger conflict)
    const paymentPayload: any = {
      user_id: userId,
      plan_id,
      amount: finalAmount,
      original_amount: originalAmount,
      method,
      action_type: action_type || "new",
      status: "pending",
      installments: maxInstallments,
      coupon_id: validCouponId,
      coupon_discount: validCouponId ? couponDiscount : 0,
    };

    const { data: existingPending } = await supabaseAdmin
      .from("payments")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("plan_id", plan_id)
      .eq("status", "pending")
      .gt("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let payment: any;
    if (existingPending?.id) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("payments")
        .update(paymentPayload)
        .eq("id", existingPending.id)
        .select()
        .single();
      if (updateError) {
        console.error("Failed to update existing pending payment:", updateError);
        throw new Error(`DB update error: ${updateError.message}`);
      }
      payment = updated;
    } else {
      const { data: inserted, error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert(paymentPayload)
        .select()
        .single();
      if (paymentError) {
        console.error("Failed to insert payment:", paymentError);
        throw new Error(`DB insert error: ${paymentError.message}`);
      }
      payment = inserted;
    }

    // Mercado Pago payment type exclusions (correct type IDs)
    // These are PAYMENT TYPES, not payment method IDs
    const excludedPaymentTypes: Record<string, string[]> = {
      pix: ["credit_card", "debit_card", "ticket", "prepaid_card"],
      credit: ["bank_transfer", "debit_card", "ticket", "prepaid_card"],
      debit: ["bank_transfer", "credit_card", "ticket", "prepaid_card"],
    };

    // Build MP preference
    const preference: any = {
      items: [{
        title: `${plan.name} - ST&H Consultoria`,
        description: plan.subtitle || plan.duration,
        quantity: 1,
        unit_price: finalAmount,
        currency_id: "BRL",
      }],
      payer: {
        name: profile?.full_name || "Aluno",
        email: profile?.email || user.email || "aluno@sthmethod.com.br",
      },
      external_reference: payment.id,
      back_urls: {
        success: `${req.headers.get("origin") || "https://sthmethod.com.br"}/dashboard/subscription?status=approved`,
        failure: `${req.headers.get("origin") || "https://sthmethod.com.br"}/dashboard/subscription?status=failed`,
        pending: `${req.headers.get("origin") || "https://sthmethod.com.br"}/dashboard/subscription?status=pending`,
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercado-pago-webhook`,
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: (excludedPaymentTypes[method] || []).map((id: string) => ({ id })),
        installments: maxInstallments,
        default_installments: 1,
      },
    };

    console.log(`Creating payment: method=${method}, plan=${plan.name}, amount=${finalAmount}, maxInstallments=${maxInstallments}`);

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      console.error(`MP error [${mpRes.status}]:`, JSON.stringify(mpData));
      console.error("Preference sent:", JSON.stringify(preference));
      throw new Error(`MP error [${mpRes.status}]: ${mpData.message || JSON.stringify(mpData)}`);
    }

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
    const message = error instanceof Error ? error.message : "Falha ao criar pagamento. Tente novamente.";
    console.error("Error creating payment:", message, error);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
