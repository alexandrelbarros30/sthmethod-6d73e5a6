// Libera/revoga acesso ao STH METHOD AI a partir do painel admin/consultor da STH METHOD.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const PLANS = ["free", "mensal", "trimestral", "semestral", "anual"] as const;
const PLAN_DAYS: Record<string, number | null> = { free: null, mensal: 30, trimestral: 90, semestral: 180, anual: 365 };
const FOREVER = "2099-12-31T23:59:59.000Z";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Não autorizado" }, 401);

    const admin = createClient(url, service);
    const [{ data: isAdmin }, { data: isConsultor }] = await Promise.all([
      admin.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      admin.rpc("has_role", { _user_id: user.id, _role: "consultor" }),
    ]);
    if (!isAdmin && !isConsultor) return json({ error: "Acesso negado" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "list");

    if (action === "list") {
      const { data: subs } = await admin
        .from("ai_app_subscriptions")
        .select("id, user_id, plan, status, amount, started_at, expires_at, created_at, provider")
        .order("created_at", { ascending: false })
        .limit(500);
      const ids = [...new Set((subs ?? []).map((s) => s.user_id))];
      const [{ data: profs }, { data: aiProfs }] = await Promise.all([
        ids.length ? admin.from("profiles").select("user_id, full_name, email").in("user_id", ids) : { data: [] as any[] },
        ids.length ? admin.from("ai_app_profiles").select("user_id, full_name").in("user_id", ids) : { data: [] as any[] },
      ]);
      const rows = (subs ?? []).map((s) => {
        const p = (profs ?? []).find((x: any) => x.user_id === s.user_id);
        const ap = (aiProfs ?? []).find((x: any) => x.user_id === s.user_id);
        return { ...s, full_name: p?.full_name ?? ap?.full_name ?? null, email: p?.email ?? null };
      });
      return json({ subscriptions: rows });
    }

    if (action === "grant") {
      const email = String(body?.email || "").trim().toLowerCase();
      const plan = String(body?.plan || "free");
      const days = body?.days === null || body?.days === undefined ? null : Number(body.days);
      if (!email.includes("@")) return json({ error: "E-mail inválido" }, 400);
      if (!PLANS.includes(plan as any)) return json({ error: "Plano inválido" }, 400);

      // Localiza a conta na base integrada STH METHOD
      let userId: string | null = null;
      const { data: prof } = await admin.from("profiles").select("user_id").ilike("email", email).maybeSingle();
      userId = prof?.user_id ?? null;
      if (!userId) {
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        userId = list?.users?.find((u) => (u.email || "").toLowerCase() === email)?.id ?? null;
      }
      if (!userId) return json({ error: "Nenhuma conta encontrada com este e-mail" }, 200);

      const effectiveDays = days ?? PLAN_DAYS[plan];
      const expires = effectiveDays
        ? new Date(Date.now() + effectiveDays * 86_400_000).toISOString()
        : FOREVER;

      // Encerra assinaturas ativas anteriores e cria a nova liberação
      await admin
        .from("ai_app_subscriptions")
        .update({ status: "replaced" })
        .eq("user_id", userId)
        .eq("status", "active");

      const { data: created, error } = await admin
        .from("ai_app_subscriptions")
        .insert({
          user_id: userId,
          plan,
          amount: 0,
          status: "active",
          provider: "cortesia",
          external_reference: `grant:${user.id}`,
          started_at: new Date().toISOString(),
          expires_at: expires,
        })
        .select()
        .single();
      if (error) {
        console.error("grant error:", error.message);
        return json({ error: "Não foi possível liberar o acesso" }, 200);
      }
      return json({ success: true, subscription: created });
    }

    if (action === "revoke") {
      const id = String(body?.id || "");
      if (!id) return json({ error: "Registro inválido" }, 400);
      const { error } = await admin.from("ai_app_subscriptions").update({ status: "canceled" }).eq("id", id);
      if (error) return json({ error: "Não foi possível revogar" }, 200);
      return json({ success: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (err) {
    console.error("ai-app-access fatal:", err);
    return json({ error: "Erro inesperado" }, 500);
  }
});
