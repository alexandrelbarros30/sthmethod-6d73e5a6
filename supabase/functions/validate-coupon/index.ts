import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { coupon_id, plan_id } = await req.json();
    if (!coupon_id) throw new Error("Missing coupon_id");

    // Fetch coupon
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", coupon_id)
      .eq("active", true)
      .single();

    if (error || !coupon) {
      return new Response(JSON.stringify({ valid: false, reason: "Cupom inválido" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, reason: "Cupom expirado" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check uses
    if (coupon.current_uses >= coupon.max_uses) {
      return new Response(JSON.stringify({ valid: false, reason: "Cupom esgotado" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check plan
    if (coupon.plan_id && plan_id && coupon.plan_id !== plan_id) {
      return new Response(JSON.stringify({ valid: false, reason: "Cupom não válido para este plano" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Increment usage
    await supabase
      .from("coupons")
      .update({ current_uses: coupon.current_uses + 1 })
      .eq("id", coupon_id);

    return new Response(JSON.stringify({
      valid: true,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    console.error("Error validating coupon:", error);
    return new Response(JSON.stringify({ error: "Erro ao validar cupom" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
