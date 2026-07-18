import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userRes } = await authed.auth.getUser();
    const caller = userRes?.user;
    if (!caller) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetId = caller.id;
    try {
      const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
      const url = new URL(req.url);
      const requested = body?.user_id ?? url.searchParams.get("user_id");
      if (requested && requested !== caller.id) {
        // Só admin ou consultor vinculado pode consultar outro aluno
        const [{ data: isAdmin }, { data: link }] = await Promise.all([
          admin.rpc("has_admin_view", { _user_id: caller.id }),
          admin
            .from("consultant_students")
            .select("id")
            .eq("consultant_id", caller.id)
            .eq("student_id", requested)
            .maybeSingle(),
        ]);
        if (isAdmin || link) targetId = requested;
      }
    } catch (_) { /* ignore */ }

    const [
      manualRes,
      bodyImgs,
      weightLogs,
      subs,
      diets,
      protocols,
      trainings,
    ] = await Promise.all([
      admin.from("student_flow_status").select("*").eq("user_id", targetId).maybeSingle(),
      admin.from("body_images").select("id", { count: "exact", head: true }).eq("user_id", targetId),
      admin.from("weight_logs").select("id", { count: "exact", head: true }).eq("user_id", targetId),
      admin.from("subscriptions").select("status,end_date").eq("user_id", targetId),
      admin.from("student_diets").select("id", { count: "exact", head: true }).eq("user_id", targetId),
      admin.from("student_protocols").select("id", { count: "exact", head: true }).eq("user_id", targetId),
      admin.from("student_workout_assignments").select("id", { count: "exact", head: true }).eq("user_id", targetId),
    ]);

    const manual = manualRes.data ?? {};
    const nowIso = new Date().toISOString();
    const has = (r: any) => (r?.count ?? 0) > 0;
    const hasSub = Array.isArray(subs.data) && subs.data.some((s: any) =>
      ["active", "approved", "trialing"].includes(String(s.status || "").toLowerCase()) ||
      (s.end_date && new Date(s.end_date) > new Date())
    );
    const hasDiet = has(diets);
    const hasProt = has(protocols);
    const hasTrain = has(trainings);
    const hasAnalysis = has(bodyImgs) || has(weightLogs);
    const platformReleased = hasDiet || hasProt || hasTrain;
    const advancedReady = hasDiet && hasProt && hasTrain;

    const steps = {
      cadastro_recebido_at: manual.cadastro_recebido_at || nowIso,
      dados_em_analise_at: manual.dados_em_analise_at || (hasAnalysis || hasSub ? nowIso : null),
      estrategia_estruturando_at: manual.estrategia_estruturando_at || (hasSub || platformReleased ? nowIso : null),
      plataforma_liberada_at: manual.plataforma_liberada_at || (platformReleased ? nowIso : null),
      plano_avancado_pronto_at: manual.plano_avancado_pronto_at || (advancedReady ? nowIso : null),
    };

    const completed = Object.values(steps).filter(Boolean).length;
    const total = 5;
    const progress = Math.round((completed / total) * 100);
    const allDone = completed === total;

    return new Response(
      JSON.stringify({
        user_id: targetId,
        steps,
        completed,
        total,
        progress,
        all_done: allDone,
        completed_dismissed_at: manual.completed_dismissed_at ?? null,
        signals: { hasSub, hasDiet, hasProt, hasTrain, hasAnalysis },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
