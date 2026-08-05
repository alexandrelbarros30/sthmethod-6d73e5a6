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

    const { code, plan_id, payment_method } = await req.json();
    if (!code) throw new Error("Missing code");

    // Fetch coupon by code (string) instead of ID for easier user input
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
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

    // Rule: Pix à vista check (if specified in request)
    if (payment_method && payment_method !== "pix") {
      return new Response(JSON.stringify({ valid: false, reason: "Cupom válido apenas para pagamentos via Pix à vista" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rule: Eligibility check (No duplication with already discounted plans)
    const allowedIds: string[] = Array.isArray(coupon.plan_ids) && coupon.plan_ids.length > 0
      ? coupon.plan_ids
      : (coupon.plan_id ? [coupon.plan_id] : []);
    
    if (plan_id) {
      // Regra de ouro: Se o plano já contém 'oferta' ou 'fundador', não permite cupom
      if (plan_id.includes('oferta') || plan_id.includes('fundador')) {
        return new Response(JSON.stringify({ valid: false, reason: "Este plano já possui desconto promocional ativo e não aceita cupons adicionais" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (allowedIds.length > 0 && !allowedIds.includes(plan_id)) {
        return new Response(JSON.stringify({ valid: false, reason: "Cupom não válido para este plano" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({
      valid: true,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      code: coupon.code,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    console.error("Error validating coupon:", error);
    return new Response(JSON.stringify({ error: "Erro ao validar cupom" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});