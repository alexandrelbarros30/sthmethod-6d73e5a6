import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type AlertInput = {
  memory_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  data?: Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const now = new Date();
    const generated: AlertInput[] = [];

    // Load all memories (cap 2000 — plenty for current scale)
    const { data: memories, error } = await sb
      .from('sth_memory')
      .select('id, full_name, phone, user_id, plan_name, plan_status, last_interaction_at, last_physical_update, temperature, score')
      .limit(2000);
    if (error) throw error;

    // Pull active subscriptions per user for "plano vencendo" / "aluno ausente"
    const userIds = (memories || []).map((m) => m.user_id).filter(Boolean) as string[];
    const subsByUser = new Map<string, { end_date: string; status: string }>();
    if (userIds.length) {
      const { data: subs } = await sb
        .from('subscriptions')
        .select('user_id, end_date, status')
        .in('user_id', userIds)
        .eq('status', 'active');
      for (const s of subs || []) {
        const prev = subsByUser.get(s.user_id);
        if (!prev || new Date(s.end_date) > new Date(prev.end_date)) {
          subsByUser.set(s.user_id, { end_date: s.end_date, status: s.status });
        }
      }
    }

    for (const m of memories || []) {
      const lastInter = m.last_interaction_at ? new Date(m.last_interaction_at) : null;
      const lastPhys = m.last_physical_update ? new Date(m.last_physical_update) : null;
      const daysSinceInter = lastInter ? (now.getTime() - lastInter.getTime()) / 86_400_000 : null;
      const daysSincePhys = lastPhys ? (now.getTime() - lastPhys.getTime()) / 86_400_000 : null;
      const sub = m.user_id ? subsByUser.get(m.user_id) : undefined;

      // 🔥 sem atualização (aluno ativo, sem update físico há 35+ dias)
      if (sub && (daysSincePhys === null || daysSincePhys >= 35)) {
        generated.push({
          memory_id: m.id,
          alert_type: 'sem_atualizacao',
          severity: 'high',
          message: `${m.full_name || m.phone} está sem atualização de peso/medidas há ${Math.floor(daysSincePhys || 999)}d`,
          data: { days: daysSincePhys },
        });
      }

      // 🔥 sem resposta (interação > 7d e ainda quente/pronto)
      if (daysSinceInter !== null && daysSinceInter >= 7 && (m.temperature === 'quente' || m.temperature === 'pronto')) {
        generated.push({
          memory_id: m.id,
          alert_type: 'sem_resposta',
          severity: 'high',
          message: `${m.full_name || m.phone} (lead ${m.temperature}) sem resposta há ${Math.floor(daysSinceInter)}d`,
          data: { days: daysSinceInter, temperature: m.temperature },
        });
      }

      // 🔥 plano vencendo (≤10 dias)
      if (sub?.end_date) {
        const endTs = new Date(sub.end_date).getTime();
        const daysLeft = (endTs - now.getTime()) / 86_400_000;
        if (daysLeft >= 0 && daysLeft <= 10) {
          generated.push({
            memory_id: m.id,
            alert_type: 'plano_vencendo',
            severity: daysLeft <= 3 ? 'high' : 'medium',
            message: `${m.full_name || m.phone} — plano vence em ${Math.ceil(daysLeft)}d`,
            data: { days_left: daysLeft, end_date: sub.end_date },
          });
        }
      }

      // 🔥 aluno ausente (sub ativa + sem interação 14+d)
      if (sub && daysSinceInter !== null && daysSinceInter >= 14) {
        generated.push({
          memory_id: m.id,
          alert_type: 'aluno_ausente',
          severity: 'medium',
          message: `${m.full_name || m.phone} ausente há ${Math.floor(daysSinceInter)}d`,
          data: { days: daysSinceInter },
        });
      }

      // 🔥 risco de desistência (ausente 21+ d + score baixo)
      if (sub && daysSinceInter !== null && daysSinceInter >= 21 && (m.score ?? 0) < 40) {
        generated.push({
          memory_id: m.id,
          alert_type: 'risco_desistencia',
          severity: 'high',
          message: `⚠️ Risco de desistência: ${m.full_name || m.phone} (score ${m.score})`,
          data: { days: daysSinceInter, score: m.score },
        });
      }
    }

    // Deduplicate: avoid creating same alert_type for memory if already open
    let inserted = 0;
    for (const a of generated) {
      const { data: existing } = await sb
        .from('sth_memory_alerts')
        .select('id')
        .eq('memory_id', a.memory_id)
        .eq('alert_type', a.alert_type)
        .eq('acknowledged', false)
        .limit(1)
        .maybeSingle();
      if (existing?.id) continue;
      const { error: insErr } = await sb.from('sth_memory_alerts').insert(a);
      if (!insErr) inserted++;
    }

    // Recalc scores in parallel batches (top 200 to keep work bounded)
    const toRecalc = (memories || []).slice(0, 200);
    await Promise.all(
      toRecalc.map((m) => sb.rpc('sth_memory_recalc_score', { _memory_id: m.id }).then(() => null).catch(() => null)),
    );

    return new Response(
      JSON.stringify({ ok: true, scanned: memories?.length || 0, generated: generated.length, inserted }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});