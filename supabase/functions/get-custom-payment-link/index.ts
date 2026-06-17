import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { code } = await req.json().catch(() => ({ code: "" }));
    if (!code) {
      return new Response(JSON.stringify({ error: "code required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: link } = await admin
      .from("custom_payment_links")
      .select("id, code, label, amount, description, expires_at, active, max_uses, current_uses, student_user_id")
      .eq("code", String(code).toLowerCase().trim())
      .maybeSingle();

    if (!link) {
      return new Response(JSON.stringify({ error: "Link não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let student: { full_name: string | null; email: string | null; phone: string | null } | null = null;
    if (link.student_user_id) {
      const { data: prof } = await admin
        .from("profiles")
        .select("full_name, email, phone")
        .eq("user_id", link.student_user_id)
        .maybeSingle();
      if (prof) student = prof as any;
    }

    return new Response(
      JSON.stringify({
        link: {
          id: link.id,
          code: link.code,
          label: link.label,
          amount: Number(link.amount),
          description: link.description,
          expires_at: link.expires_at,
          active: link.active,
          max_uses: link.max_uses,
          current_uses: link.current_uses,
          has_student: !!link.student_user_id,
        },
        student,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});