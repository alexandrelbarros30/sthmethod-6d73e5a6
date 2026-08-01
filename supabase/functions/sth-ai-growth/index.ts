// STH METHOD AI — Fases 7 e 8.
// action=offers   -> monetização inteligente (upgrade / retorno / renovação) baseada em uso real
// action=insights -> IA preditiva (platô, tendência, ajustes de dieta/treino)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'openai/gpt-5.6-sol';

const PLAN_ORDER = ['mensal', 'trimestral', 'semestral', 'anual'] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(`${iso}T00:00:00`).getTime()) / 86_400_000);
}

/** Regressão linear simples: retorna variação por semana. */
function weeklySlope(points: { x: number; y: number }[]) {
  if (points.length < 3) return null;
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  const num = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = points.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (den === 0) return null;
  return (num / den) * 7; // por semana
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: auth } = await anon.auth.getClaims(authHeader.replace('Bearer ', ''));
    const userId = auth?.claims?.sub as string | undefined;
    if (!userId) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? 'insights');

    const [{ data: profile }, { data: subs }, { data: checkins }, { data: measurements }, { data: gens }] =
      await Promise.all([
        admin.from('ai_app_profiles').select('*').eq('user_id', userId).maybeSingle(),
        admin.from('ai_app_subscriptions').select('id, plan, status, expires_at, created_at')
          .eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
        admin.from('ai_app_checkins').select('checkin_date, diet_done, workout_done, water_done, mood, energy')
          .eq('user_id', userId).order('checkin_date', { ascending: false }).limit(60),
        admin.from('ai_app_measurements').select('measured_on, weight_kg, waist_cm')
          .eq('user_id', userId).order('measured_on', { ascending: false }).limit(30),
        admin.from('ai_app_generations').select('kind, created_at, revisions')
          .eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      ]);

    const active = (subs ?? []).find(
      (s: any) => s.status === 'active' && s.expires_at && new Date(s.expires_at) > new Date(),
    );

    const days = (checkins ?? []).map((c: any) => c.checkin_date as string);
    const daySet = new Set(days);
    let streak = 0;
    const cursor = new Date(`${todayISO()}T00:00:00`);
    if (!daySet.has(todayISO())) cursor.setDate(cursor.getDate() - 1);
    for (;;) {
      const iso = cursor.toISOString().slice(0, 10);
      if (!daySet.has(iso)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    const adherence14 = days.filter((d) => daysSince(d) < 14).length;
    const adherence7 = days.filter((d) => daysSince(d) < 7).length;

    // ---------------- Fase 7 — ofertas inteligentes ----------------
    if (action === 'offers') {
      const { data: existing } = await admin
        .from('ai_app_offers')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) return json({ offer: existing });

      let offer: { kind: string; plan: string; discount_pct: number; reason: string } | null = null;
      const expiringIn = active?.expires_at
        ? Math.ceil((new Date(active.expires_at).getTime() - Date.now()) / 86_400_000)
        : null;

      if (!active) {
        const everPaid = (subs ?? []).some((s: any) => s.status === 'active' || s.status === 'expired');
        offer = everPaid
          ? {
              kind: 'winback',
              plan: 'trimestral',
              discount_pct: 20,
              reason: 'Sentimos sua falta. Retome de onde parou com condição especial no ciclo trimestral.',
            }
          : {
              kind: 'trial',
              plan: 'mensal',
              discount_pct: 15,
              reason: 'Condição de primeira ativação para você começar hoje o seu primeiro ciclo.',
            };
      } else if (expiringIn !== null && expiringIn <= 7) {
        offer = {
          kind: 'renewal',
          plan: active.plan,
          discount_pct: 10,
          reason: `Seu plano vence em ${expiringIn} ${expiringIn === 1 ? 'dia' : 'dias'}. Renove agora e não perca a continuidade do ciclo.`,
        };
      } else if (streak >= 7 || adherence14 >= 9) {
        const idx = PLAN_ORDER.indexOf(active.plan as any);
        const next = PLAN_ORDER[Math.min(idx + 1, PLAN_ORDER.length - 1)];
        if (next !== active.plan) {
          offer = {
            kind: 'upgrade',
            plan: next,
            discount_pct: 12,
            reason: `Sua constância está alta (${streak} dias seguidos). Planos mais longos sustentam a adaptação fisiológica com custo/mês menor.`,
          };
        }
      }

      if (!offer) return json({ offer: null });

      const { data: created, error } = await admin
        .from('ai_app_offers')
        .insert({ user_id: userId, ...offer })
        .select()
        .single();
      if (error) throw error;
      return json({ offer: created });
    }

    // ---------------- Fase 8 — IA preditiva ----------------
    const { data: cached } = await admin
      .from('ai_app_insights')
      .select('*')
      .eq('user_id', userId)
      .gt('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached && !body?.force) return json({ insight: cached, cached: true });

    const ms = (measurements ?? []).filter((m: any) => m.weight_kg != null);
    const weightPoints = ms.map((m: any) => ({ x: -daysSince(m.measured_on), y: Number(m.weight_kg) }));
    const waistPoints = (measurements ?? [])
      .filter((m: any) => m.waist_cm != null)
      .map((m: any) => ({ x: -daysSince(m.measured_on), y: Number(m.waist_cm) }));

    const weightPerWeek = weeklySlope(weightPoints);
    const waistPerWeek = weeklySlope(waistPoints);
    const plateau =
      weightPerWeek !== null && Math.abs(weightPerWeek) < 0.15 && weightPoints.length >= 3;
    const dietRate = (checkins ?? []).slice(0, 14).filter((c: any) => c.diet_done).length;
    const workoutRate = (checkins ?? []).slice(0, 14).filter((c: any) => c.workout_done).length;
    const moodAvg = (() => {
      const v = (checkins ?? []).slice(0, 14).map((c: any) => c.mood).filter((x: any) => x != null);
      return v.length ? Number((v.reduce((s: number, x: number) => s + x, 0) / v.length).toFixed(1)) : null;
    })();

    const signals = {
      streak,
      adherence7,
      adherence14,
      diet_days_14: dietRate,
      workout_days_14: workoutRate,
      mood_avg_14: moodAvg,
      weight_kg_per_week: weightPerWeek !== null ? Number(weightPerWeek.toFixed(2)) : null,
      waist_cm_per_week: waistPerWeek !== null ? Number(waistPerWeek.toFixed(2)) : null,
      plateau,
      measurements_count: (measurements ?? []).length,
      current_weight: ms[0]?.weight_kg ?? profile?.weight_kg ?? null,
      projection_30d:
        weightPerWeek !== null && ms[0]?.weight_kg != null
          ? Number((Number(ms[0].weight_kg) + weightPerWeek * 4.3).toFixed(1))
          : null,
      goal: profile?.goal ?? null,
      last_generations: (gens ?? []).map((g: any) => ({ kind: g.kind, created_at: g.created_at })),
    };

    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return json({ error: 'IA indisponível no momento.' }, 500);

    const prompt = `Você é a inteligência preditiva do STH METHOD AI.
Regras invioláveis:
- Português do Brasil, tom técnico, elegante e direto. Markdown escaneável e curto.
- NUNCA cite medicamentos, hormônios, peptídeos, doses ou qualquer substância terapêutica. Esse tema pertence exclusivamente ao acompanhamento profissional da STH METHOD.
- Nunca use as palavras "médico", "medicina" ou "medical". Nunca prometa resultados milagrosos.
- Baseie TODA afirmação nos sinais numéricos fornecidos. Se faltar dado, diga o que o usuário precisa registrar.

Objetivo declarado: ${profile?.goal ?? 'não informado'}.
Sinais calculados: ${JSON.stringify(signals)}

Gere exatamente esta estrutura (máx. 450 palavras):
## Leitura preditiva
## Alertas
(inclua alerta de platô quando plateau=true, e alerta de adesão quando adherence14 < 8)
## Ajustes sugeridos
(2 a 4 ações objetivas, separando dieta e treino)
## Projeção de 30 dias
(cenário realista mantendo o comportamento atual, e cenário com os ajustes aplicados)`;

    const res = await fetch(GATEWAY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key },
      body: JSON.stringify({
        model: MODEL,
        reasoning_effort: 'none',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const details = await res.text();
      console.error('AI gateway error', res.status, details);
      return json({ error: 'Falha ao gerar leitura preditiva', status: res.status, details }, res.status);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? '';

    const { data: insight, error: insErr } = await admin
      .from('ai_app_insights')
      .insert({
        user_id: userId,
        kind: 'prediction',
        content,
        signals,
        valid_until: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      })
      .select()
      .single();
    if (insErr) throw insErr;

    return json({ insight, cached: false });
  } catch (err) {
    console.error('sth-ai-growth', err);
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});
