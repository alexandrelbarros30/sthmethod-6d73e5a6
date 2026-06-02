import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Régua de disparo automático de renovação (canal Comercial Z-API):
// D-3 (3 dias antes do vencimento), D+1, D+7, D+15 (cupom RETOMA20), D+30.
// Roda 1x/dia via pg_cron. Dedup por (user_id, end_date, trigger).

const RULES: Array<{ trigger: string; offset: number; coupon?: string }> = [
  { trigger: 'renewal_pre_3d', offset: -3 },
  { trigger: 'renewal_d1', offset: 1 },
  { trigger: 'renewal_d7', offset: 7 },
  { trigger: 'renewal_d15', offset: 15, coupon: 'RETOMA20' },
  { trigger: 'renewal_d30', offset: 30 },
];

function render(body: string, ctx: Record<string, string>): string {
  return body.replace(/\{([a-z0-9_]+)\}/gi, (_m, k) =>
    ctx[String(k).toLowerCase()] ?? '');
}

function fmtDateBR(d: Date): string {
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function todaySaoPaulo(): Date {
  const now = new Date();
  const sp = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  sp.setHours(0, 0, 0, 0);
  return sp;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry_run') === '1';
  const forceUser = url.searchParams.get('user_id') || undefined;

  try {
    // Carrega os templates
    const { data: tplRows, error: tplErr } = await admin
      .from('crm_message_templates')
      .select('key, body, active, channel')
      .in('key', RULES.map(r => r.trigger));
    if (tplErr) throw tplErr;
    const tplMap = new Map((tplRows || []).map(r => [r.key as string, r]));

    const today = todaySaoPaulo();

    const summary: Record<string, { eligible: number; sent: number; skipped: number; errors: number }> = {};
    for (const r of RULES) summary[r.trigger] = { eligible: 0, sent: 0, skipped: 0, errors: 0 };
    const details: any[] = [];

    // Trava global do dia: usuários que já receberam QUALQUER cobrança hoje
    // (mesmo de outra régua/assinatura) não recebem de novo. Evita duplicidade
    // quando há subscriptions sobrepostas ou regras coincidentes no mesmo dia.
    const startOfDayIso = today.toISOString();
    const { data: sentToday } = await admin
      .from('subscription_reminder_log')
      .select('user_id')
      .gte('sent_at', startOfDayIso)
      .eq('status', 'sent');
    const alreadySentToday = new Set((sentToday || []).map((r: any) => r.user_id));

    for (const rule of RULES) {
      const tpl = tplMap.get(rule.trigger);
      if (!tpl || !tpl.active) continue;

      // end_date alvo = hoje - offset (D-3 => end_date = hoje+3; D+7 => end_date = hoje-7)
      const target = new Date(today);
      target.setDate(target.getDate() - rule.offset);
      const targetIso = target.toISOString().slice(0, 10);

      let q = admin
        .from('subscriptions')
        .select('id, user_id, end_date, plan_id')
        .eq('end_date', targetIso);
      if (forceUser) q = q.eq('user_id', forceUser);

      const { data: subs, error: subErr } = await q;
      if (subErr) { console.error('subs query error', subErr); continue; }

      // Para cada user, manter apenas a assinatura mais recente (caso haja duplicadas)
      const seen = new Set<string>();
      const list = (subs || []).filter(s => {
        if (seen.has(s.user_id)) return false;
        seen.add(s.user_id); return true;
      });

      summary[rule.trigger].eligible = list.length;

      for (const sub of list) {
        // Trava: um aluno só recebe 1 cobrança automática por dia
        if (alreadySentToday.has(sub.user_id)) {
          summary[rule.trigger].skipped++;
          continue;
        }

        // Dedup
        const { data: logRow } = await admin
          .from('subscription_reminder_log')
          .select('id')
          .eq('user_id', sub.user_id)
          .eq('end_date', sub.end_date)
          .eq('trigger', rule.trigger)
          .maybeSingle();
        if (logRow) { summary[rule.trigger].skipped++; continue; }

        // Perfil + telefone
        const { data: profile } = await admin
          .from('profiles')
          .select('full_name, phone, email, whatsapp_opt_out')
          .eq('user_id', sub.user_id)
          .maybeSingle();
        if (profile?.whatsapp_opt_out === true) {
          await admin.from('subscription_reminder_log').insert({
            user_id: sub.user_id, subscription_id: sub.id, end_date: sub.end_date,
            trigger: rule.trigger, status: 'skipped_opt_out',
            error_message: 'Aluno optou por não receber mensagens',
          });
          summary[rule.trigger].skipped++;
          continue;
        }
        const phone = (profile?.phone || '').replace(/\D/g, '');
        if (!phone) {
          await admin.from('subscription_reminder_log').insert({
            user_id: sub.user_id, subscription_id: sub.id, end_date: sub.end_date,
            trigger: rule.trigger, status: 'failed', error_message: 'sem telefone',
          });
          summary[rule.trigger].errors++;
          continue;
        }

        const firstName = (profile?.full_name || '').split(' ')[0] || 'Aluno';
        const endDate = new Date(sub.end_date + 'T00:00:00');
        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86400000));
        const daysOver = Math.max(0, Math.floor((today.getTime() - endDate.getTime()) / 86400000));
        const link = `https://sthmethod.com.br/dashboard/renew?uid=${sub.user_id}`;

        const ctx: Record<string, string> = {
          nome: firstName,
          nome_completo: profile?.full_name || 'Aluno',
          email: profile?.email || '',
          telefone: phone,
          vencimento: fmtDateBR(endDate),
          data_vencimento: fmtDateBR(endDate),
          dias_restantes: String(daysLeft),
          dias_vencido: String(daysOver),
          link,
          link_renovacao: link,
          cupom: rule.coupon || '',
        };

        const finalMessage = render(tpl.body as string, ctx);
        details.push({ trigger: rule.trigger, user_id: sub.user_id, phone, preview: finalMessage.slice(0, 80) });

        if (dryRun) { summary[rule.trigger].sent++; continue; }

        // Dispara via canal comercial Z-API (silencioso)
        let ok = false; let err: string | null = null;
        try {
          const { data, error } = await admin.functions.invoke('send-whatsapp', {
            body: { phone, message: finalMessage },
          });
          if (error) throw error;
          if (data?.ok) ok = true;
          else err = data?.error || 'falha no envio';
        } catch (e: any) {
          err = e?.message || String(e);
        }

        await admin.from('subscription_reminder_log').insert({
          user_id: sub.user_id, subscription_id: sub.id, end_date: sub.end_date,
          trigger: rule.trigger, status: ok ? 'sent' : 'failed', error_message: err,
        });

        // Espelha no message_history para visibilidade no histórico geral
        try {
          await admin.from('message_history').insert({
            user_id: sub.user_id,
            content: finalMessage,
            recipient_phone: phone,
            recipient_name: profile?.full_name || null,
            status: ok ? 'sent' : 'failed',
            sent_at: new Date().toISOString(),
            error_message: err,
          });
        } catch (_) { /* opcional */ }

        if (ok) summary[rule.trigger].sent++;
        else summary[rule.trigger].errors++;
        if (ok) alreadySentToday.add(sub.user_id);
      }
    }

    return new Response(JSON.stringify({ ok: true, dryRun, summary, details }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('subscription-reminder-dispatch error', e);
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});