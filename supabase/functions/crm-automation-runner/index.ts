import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

type Automation = {
  id: string;
  trigger_type: string;
  trigger_config: any;
  template_id: string | null;
  segment_id: string | null;
  media_ids: string[];
  last_run_at: string | null;
};

function classifyStatus(profile: any, sub: any) {
  if (sub) {
    const days = Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000);
    if (days < 0) return 'expired';
    if (days <= 7) return 'expiring';
    return 'active';
  }
  return profile?.onboarding_complete ? 'lead' : 'tool_user';
}

function renderVars(content: string, ctx: Record<string, string>) {
  return content.replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? `{${k}}`);
}

function shouldRunRecurring(auto: Automation, now: Date): boolean {
  const cfg = auto.trigger_config || {};
  const weekdays: number[] = Array.isArray(cfg.weekdays) ? cfg.weekdays : [];
  const hour = typeof cfg.hour === 'number' ? cfg.hour : 10;
  const minute = typeof cfg.minute === 'number' ? cfg.minute : 0;
  if (weekdays.length === 0) return false;
  if (!weekdays.includes(now.getUTCDay())) return false;
  // Match the hour:minute window (within 5 min tolerance)
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const target = hour * 60 + minute;
  if (Math.abs(minutes - target) > 5) return false;
  // Don't repeat same day
  if (auto.last_run_at) {
    const last = new Date(auto.last_run_at);
    if (last.toISOString().slice(0, 10) === now.toISOString().slice(0, 10)) return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const url = new URL(req.url);
    const forceId = url.searchParams.get('automation_id');

    let body: any = {};
    try { body = await req.json(); } catch (_) {}
    const onlyId = body?.automation_id || forceId;

    // Respeita o toggle global do CRM Automático (compartilhado com cobranças).
    // Disparos manuais (com automation_id) continuam funcionando.
    if (!onlyId) {
      const { data: automation } = await supabase
        .from('billing_automation')
        .select('enabled')
        .eq('id', 1)
        .maybeSingle();
      if (!automation?.enabled) {
        return new Response(
          JSON.stringify({ ok: true, paused: true, processed: 0, results: [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    let q = supabase.from('crm_automations').select('*').eq('active', true);
    if (onlyId) q = supabase.from('crm_automations').select('*').eq('id', onlyId);
    const { data: automations, error } = await q;
    if (error) throw error;

    const now = new Date();
    const results: any[] = [];

    for (const auto of (automations || []) as Automation[]) {
      try {
        // Decide if this automation should run now
        if (!onlyId) {
          if (auto.trigger_type === 'recurring' && !shouldRunRecurring(auto, now)) continue;
        }

        if (!auto.template_id) {
          results.push({ id: auto.id, skipped: 'no template' });
          continue;
        }

        const { data: tpl } = await supabase
          .from('crm_templates').select('content,title').eq('id', auto.template_id).single();
        if (!tpl) { results.push({ id: auto.id, skipped: 'template missing' }); continue; }

        // Build recipient pool: profiles + latest subscription
        const { data: profiles } = await supabase
          .from('profiles').select('user_id, full_name, phone, gender, objective, onboarding_complete').limit(5000);
        const userIds = (profiles || []).map((p: any) => p.user_id);
        const { data: subs } = await supabase
          .from('subscriptions').select('user_id, end_date, status, plan_id').in('user_id', userIds);
        const latest = new Map<string, any>();
        (subs || []).forEach((s: any) => {
          const ex = latest.get(s.user_id);
          if (!ex || new Date(s.end_date) > new Date(ex.end_date)) latest.set(s.user_id, s);
        });

        // Optional segment filter
        let segFilters: any = {};
        if (auto.segment_id) {
          const { data: seg } = await supabase
            .from('crm_segments').select('filters').eq('id', auto.segment_id).single();
          segFilters = (seg?.filters as any) || {};
        }

        const cfg = auto.trigger_config || {};
        const matches = (profiles || []).filter((p: any) => {
          const phone = (p.phone || '').replace(/\D/g, '');
          if (!phone) return false;
          const sub = latest.get(p.user_id);
          const status = classifyStatus(p, sub);

          // Segment filters
          if (segFilters.gender && segFilters.gender !== 'all' && (p.gender || '').toLowerCase() !== segFilters.gender) return false;
          if (segFilters.objective && !(p.objective || '').toLowerCase().includes(String(segFilters.objective).toLowerCase())) return false;
          if (segFilters.status && segFilters.status !== 'all') {
            if (segFilters.status === 'inactive') {
              if (status !== 'expired') return false;
              const d = sub ? Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000) : 0;
              if (d > -30) return false;
            } else if (status !== segFilters.status) return false;
          }

          // Trigger logic
          if (auto.trigger_type === 'subscription_expiring') {
            if (!sub) return false;
            const days = Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / 86400000);
            const targetDays = Number(cfg.days_before ?? 3);
            return days === targetDays;
          }
          if (auto.trigger_type === 'subscription_expired') {
            if (!sub) return false;
            const days = Math.floor((Date.now() - new Date(sub.end_date).getTime()) / 86400000);
            const targetDays = Number(cfg.days_after ?? 1);
            return days === targetDays;
          }
          if (auto.trigger_type === 'new_lead') {
            // Apenas leads qualificados (onboarding completo), sem assinatura.
            // Visitantes de ferramentas são ignorados por padrão.
            if (cfg.include_tool_users) return !sub;
            return !sub && status === 'lead';
          }
          if (auto.trigger_type === 'recurring') {
            // Apply optional status filter from config
            if (cfg.audience_status && cfg.audience_status !== 'all') {
              if (cfg.audience_status === 'inactive') {
                if (status !== 'expired') return false;
                const d = sub ? Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000) : 0;
                return d <= -30;
              }
              return status === cfg.audience_status;
            }
            // Por padrão, recurring NÃO atinge visitantes de ferramentas
            return status !== 'tool_user';
          }
          return false;
        });

        // Dispatch via send-whatsapp per recipient
        let sent = 0;
        let failed = 0;
        const mediaUrl = await (async () => {
          if (!auto.media_ids?.[0]) return null;
          const { data: m } = await supabase.from('crm_media').select('url').eq('id', auto.media_ids[0]).single();
          return m?.url || null;
        })();

        for (const p of matches) {
          const sub = latest.get(p.user_id);
          const ctx: Record<string, string> = {
            nome: (p.full_name || '').split(' ')[0] || 'aluno',
            plano: sub?.plan_id || '',
            link: 'https://sthmethod.com.br',
            objetivo: p.objective || '',
          };
          const content = renderVars(tpl.content || '', ctx);
          try {
            const r = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
              body: JSON.stringify({
                phone: (p.phone || '').replace(/\D/g, ''),
                message: content,
                mediaUrl: mediaUrl || undefined,
              }),
            });
            if (r.ok) sent++; else failed++;
          } catch (_) { failed++; }
        }

        await supabase.from('crm_automation_runs').insert({
          automation_id: auto.id,
          matched_count: matches.length,
          sent_count: sent,
          failed_count: failed,
          status: failed > 0 && sent === 0 ? 'failed' : 'success',
          context: { trigger_type: auto.trigger_type, config: cfg },
        });

        await supabase.from('crm_automations').update({
          last_run_at: new Date().toISOString(),
          run_count: (await supabase.from('crm_automations').select('run_count').eq('id', auto.id).single()).data?.run_count + 1 || 1,
          sent_count: (await supabase.from('crm_automations').select('sent_count').eq('id', auto.id).single()).data?.sent_count + sent || sent,
        }).eq('id', auto.id);

        results.push({ id: auto.id, matched: matches.length, sent, failed });
      } catch (e) {
        results.push({ id: auto.id, error: String(e) });
        await supabase.from('crm_automation_runs').insert({
          automation_id: auto.id, status: 'failed', error: String(e),
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});