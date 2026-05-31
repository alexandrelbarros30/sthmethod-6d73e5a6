import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

type AnyRec = Record<string, any>;

function classifyIntent(text: string): string {
  const t = (text || '').toLowerCase();
  if (/(dieta|refeic|cardap|alimenta|carbo|protein)/.test(t)) return 'dieta';
  if (/(treino|exerc|musculac|academia|serie|repeti)/.test(t)) return 'treino';
  if (/(protocolo|suplement|ciclo|dose|hormon)/.test(t)) return 'protocolo';
  if (/(exame|laborator|sangue|hemograma)/.test(t)) return 'exames';
  if (/(atualizac|peso|foto|medida|progresso)/.test(t)) return 'atualizacao';
  if (/(renovar|renova|vence|expira)/.test(t)) return 'renovacao';
  if (/(pix|pagamento|boleto|cartao|cartão|cobranc|fatura|valor|preço|preco|quanto custa)/.test(t)) return 'financeiro';
  if (/(plano|consultoria|começar|comecar|contratar|inscrev)/.test(t)) return 'comercial';
  return 'duvida';
}

function scoreFromText(text: string): { delta: number; reasons: string[] } {
  const t = (text || '').toLowerCase();
  let delta = 0;
  const reasons: string[] = [];
  if (/(valor|preço|preco|quanto custa)/.test(t)) { delta += 20; reasons.push('Perguntou valor (+20)'); }
  if (/(plano|consultoria)/.test(t)) { delta += 15; reasons.push('Perguntou plano (+15)'); }
  if (/(pix|pagamento|boleto|cartao|cartão)/.test(t)) { delta += 20; reasons.push('Perguntou pagamento (+20)'); }
  if (/(cadastro|inscrev|começar|comecar)/.test(t)) { delta += 30; reasons.push('Demonstrou intenção de cadastro (+30)'); }
  return { delta, reasons };
}

async function handleInbound(supabase: any, body: AnyRec) {
  const phone = String(body.phone || '').replace(/\D/g, '');
  const text = String(body.text || body.message || '');
  if (phone.length < 8) return { ok: false, error: 'invalid phone' };

  // 1. Identify user via profile
  const { data: profile } = await supabase.rpc('find_profile_by_phone', { _phone: phone });
  const user = Array.isArray(profile) && profile[0] ? profile[0] : null;

  // 2. Classify
  let classification = 'lead';
  let sub: any = null;
  if (user?.user_id) {
    const { data: s } = await supabase
      .from('subscriptions')
      .select('id,status,end_date,plan_id')
      .eq('user_id', user.user_id)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    sub = s;
    if (s) {
      const days = Math.floor((new Date(s.end_date).getTime() - Date.now()) / 86400000);
      if (s.status === 'active' && days >= 0) {
        classification = days <= 10 ? 'renovacao' : 'aluno_ativo';
      } else {
        classification = 'aluno_inativo';
      }
    }
  }

  // 3. Upsert memory
  const { data: memId } = await supabase.rpc('sth_memory_upsert', {
    _phone: phone,
    _patch: {
      full_name: user?.full_name || null,
      user_id: user?.user_id || null,
      plan_name: sub?.plan_id || null,
      plan_status: classification,
      objective: user?.objective || null,
    },
  });

  // 4. Intent + score
  const intent = classifyIntent(text);
  const { delta, reasons } = scoreFromText(text);

  if (memId && delta > 0) {
    for (const r of reasons) {
      await supabase.from('sth_auto_score_log').insert({ memory_id: memId, phone, reason: r, delta });
    }
    await supabase.rpc('sth_memory_recalc_score', { _memory_id: memId });
  }

  // 5. Session tracking
  const { data: existingSession } = await supabase
    .from('sth_auto_sessions')
    .select('id, greeting_sent_at, status')
    .eq('phone', phone)
    .maybeSingle();

  await supabase.from('sth_auto_sessions').upsert(
    {
      phone,
      user_id: user?.user_id || null,
      last_inbound_at: new Date().toISOString(),
      status: 'open',
      idle_warned: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'phone' },
  );

  // 5b. Saudação automática (primeira mensagem da sessão)
  const isNewSession = !existingSession || existingSession.status !== 'open' || !existingSession.greeting_sent_at;
  let greetingSent = false;
  if (isNewSession) {
    const { data: cfg } = await supabase.from('sth_engine_config').select('auto_greeting_enabled').eq('id', 1).maybeSingle();
    if (cfg?.auto_greeting_enabled !== false) {
      const { data: tpl } = await supabase
        .from('sth_greeting_templates')
        .select('message, enabled')
        .eq('classification', classification)
        .maybeSingle();
      if (tpl?.enabled && tpl?.message) {
        const firstName = (user?.full_name || '').split(' ')[0] || 'Aluno';
        const daysLeft = sub?.end_date
          ? Math.max(0, Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000))
          : 0;
        const rendered = tpl.message
          .replace(/\{nome\}/g, firstName)
          .replace(/\{plano\}/g, sub?.plan_id || 'STH METHOD')
          .replace(/\{dias_restantes\}/g, String(daysLeft));
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/send-wapi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
            body: JSON.stringify({ phone, message: rendered }),
          });
          greetingSent = true;
          await supabase
            .from('sth_auto_sessions')
            .update({ greeting_sent_at: new Date().toISOString() })
            .eq('phone', phone);
          await supabase.from('sth_auto_events').insert({
            phone, user_id: user?.user_id || null, memory_id: memId,
            classification, intent: 'saudacao', source: 'inbound',
            decision: 'greeting', action_taken: 'greeting_sent',
          });
        } catch (e) {
          console.error('greeting send failed', e);
        }
      }
    }
  }

  // 6. Generate AI draft (never auto-send — human approval queue)
  let decision = 'human';

  // 6a. Aluno ativo no canal comercial → redireciona automaticamente para Fale com o Nutri
  let nutriRedirectSent = false;
  const isCommercialIntent = intent === 'comercial' || intent === 'financeiro';
  if (classification === 'aluno_ativo' && isCommercialIntent) {
    const firstName = (user?.full_name || '').split(' ')[0] || 'Aluno';
    const nutriPhone = '5521998984153';
    const nutriLink = `https://wa.me/${nutriPhone}?text=${encodeURIComponent(
      `Oi Nutri! Sou ${firstName} e gostaria de falar com o Nutri para acompanhamento da consultoria.`,
    )}`;
    const redirectMsg =
      `Olá, ${firstName}! 👋\n\n` +
      `Identificamos que você já é aluno ativo do STH METHOD.\n\n` +
      `Este canal é exclusivo para o time *Comercial* (novos alunos, planos e renovações).\n\n` +
      `Para dúvidas de acompanhamento, dieta, treino, protocolo ou suporte da consultoria, ` +
      `por favor utilize o canal *Fale com o Nutri*:\n\n` +
      `👉 ${nutriLink}\n\n` +
      `Assim sua solicitação chega direto na equipe responsável e o atendimento é mais rápido. 🙏`;
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/send-wapi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
        body: JSON.stringify({ phone, message: redirectMsg }),
      });
      if (r.ok) nutriRedirectSent = true;
    } catch (e) {
      console.error('nutri redirect send failed', e);
    }
    await supabase.from('sth_auto_events').insert({
      phone,
      user_id: user?.user_id || null,
      memory_id: memId,
      classification,
      intent,
      source: 'inbound',
      decision: 'redirect_nutri',
      action_taken: nutriRedirectSent ? 'redirect_sent' : 'redirect_failed',
    });
    decision = 'redirect_nutri';
  }

  try {
    if (nutriRedirectSent) throw new Error('skip draft after redirect');
    const r = await fetch(`${SUPABASE_URL}/functions/v1/sth-ai-engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
      body: JSON.stringify({ action: 'draft', phone, inbound_text: text, intent, classification }),
    });
    if (r.ok) decision = 'gemini';
  } catch (_) {}

  // 7. Log orchestration event
  await supabase.from('sth_auto_events').insert({
    phone,
    user_id: user?.user_id || null,
    memory_id: memId,
    classification,
    intent,
    source: 'inbound',
    payload: { text: text.slice(0, 500) },
    decision,
    action_taken: 'draft_queued',
  });

  return {
    ok: true,
    classification,
    intent,
    memory_id: memId,
    score_delta: delta,
    greeting_sent: greetingSent,
    nutri_redirect_sent: nutriRedirectSent,
  };
}

async function handleScheduler(supabase: any) {
  const now = Date.now();
  const idleCutoff = new Date(now - 15 * 60 * 1000).toISOString();

  // Close idle sessions with farewell message
  const { data: idle } = await supabase
    .from('sth_auto_sessions')
    .select('id, phone, idle_warned')
    .eq('status', 'open')
    .lt('last_inbound_at', idleCutoff)
    .limit(200);

  let closed = 0;
  for (const s of idle || []) {
    if (!s.idle_warned) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-wapi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
          body: JSON.stringify({
            phone: s.phone,
            message:
              '👋 Encerrando este atendimento por inatividade.\n\nQuando desejar continuar, basta enviar uma nova mensagem.\n\nSeguimos à disposição.',
          }),
        });
      } catch (_) {}
    }
    await supabase
      .from('sth_auto_sessions')
      .update({ status: 'closed_idle', idle_warned: true, closed_at: new Date().toISOString() })
      .eq('id', s.id);
    await supabase.from('sth_auto_events').insert({
      phone: s.phone,
      source: 'scheduler',
      decision: 'idle_close',
      action_taken: 'session_closed',
    });
    closed++;
  }

  return { ok: true, idle_closed: closed };
}

// ============================================================
// BILLING TICK — régua de cobrança/renovação (5 stages)
// Substitui o antigo billing-auto-dispatch, agora unificado aqui.
// ============================================================
const STAGE_TEMPLATE_KEYS: Record<number, string> = {
  1: 'renewal_soft',
  2: 'renewal_objective',
  3: 'renewal_recovery',
  4: 'renewal_last_contact',
  5: 'renewal_reactivation',
};
const AUTO_FOOTER =
  '\n\n———\n🔔 Comunicação automática STH METHOD\nMensagem enviada automaticamente pelo sistema.\nNão é necessário responder.';

function renderBillingTemplate(content: string, ctx: Record<string, any>): string {
  const firstName = (ctx.full_name as string | undefined)?.split(' ')[0] || 'Aluno';
  const fullName = (ctx.full_name as string | undefined) || 'Aluno';
  let msg = content;
  msg = msg.replace(/\{nome\}/g, firstName);
  msg = msg.replace(/\{nome_completo\}/g, fullName);
  msg = msg.replace(/\{email\}/g, ctx.email || '');
  msg = msg.replace(/\{telefone\}/g, ctx.phone || '');
  msg = msg.replace(/\{plano\}/g, ctx.plan_name || '—');
  msg = msg.replace(/\{valor\}/g, ctx.amount || '—');
  const link = ctx.user_id ? `${ctx.origin}/dashboard/renew?uid=${ctx.user_id}` : '';
  msg = msg.replace(/\{link\}/g, link);
  msg = msg.replace(/\{link_renovacao\}/g, link);
  msg = msg.replace(/\{cupom\}/g, ctx.cupom || 'VOLTASTH');
  if (ctx.end_date) {
    const d = new Date(ctx.end_date);
    msg = msg.replace(/\{vencimento\}/g, d.toLocaleDateString('pt-BR'));
    msg = msg.replace(/\{data_vencimento\}/g, d.toLocaleDateString('pt-BR'));
    const overdue = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
    msg = msg.replace(/\{dias_vencido\}/g, String(overdue));
    msg = msg.replace(/\{dias_restantes\}/g, '0');
  } else {
    msg = msg.replace(/\{vencimento\}/g, '—');
    msg = msg.replace(/\{data_vencimento\}/g, '—');
    msg = msg.replace(/\{dias_vencido\}/g, '—');
    msg = msg.replace(/\{dias_restantes\}/g, '—');
  }
  return msg;
}

async function handleBillingTick(supabase: any) {
  // Switch global compartilhado
  const { data: autoRow } = await supabase
    .from('billing_automation').select('enabled').eq('id', 1).maybeSingle();
  if (!autoRow?.enabled) return { ok: true, skipped: true, reason: 'automation disabled' };

  const nowIso = new Date().toISOString();
  const { data: campaigns } = await supabase
    .from('billing_campaigns')
    .select('id, user_id, stage, next_due_at, status, auto_send')
    .eq('status', 'active').eq('auto_send', true)
    .lte('next_due_at', nowIso).limit(100);
  if (!campaigns?.length) return { ok: true, processed: 0 };

  const userIds = campaigns.map((c: any) => c.user_id);
  const { data: profiles } = await supabase
    .from('profiles').select('user_id, full_name, phone, email').in('user_id', userIds);
  const profMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
  const { data: subs } = await supabase
    .from('subscriptions').select('user_id, end_date, plan_id').in('user_id', userIds);
  const subMap = new Map((subs || []).map((s: any) => [s.user_id, s]));

  const origin = SUPABASE_URL.replace(/^https:\/\/([^.]+)\.supabase\.co/, 'https://$1.lovable.app');

  let processed = 0, sent = 0, failed = 0, skipped = 0;
  for (const camp of campaigns) {
    processed++;
    const prof: any = profMap.get(camp.user_id);
    const sub: any = subMap.get(camp.user_id);
    if (!prof?.phone) { skipped++; continue; }
    const stage = camp.stage || 1;
    const tplKey = STAGE_TEMPLATE_KEYS[stage] || STAGE_TEMPLATE_KEYS[1];
    const { data: tpl } = await supabase
      .from('message_templates').select('id, content, image_url').eq('system_key', tplKey).maybeSingle();
    if (!tpl) { skipped++; continue; }

    const rendered = renderBillingTemplate(tpl.content, {
      full_name: prof.full_name, phone: prof.phone, email: prof.email,
      user_id: camp.user_id, end_date: sub?.end_date, origin,
    });
    const finalMessage = rendered.includes('Comunicação automática STH METHOD')
      ? rendered : `${rendered}${AUTO_FOOTER}`;

    let autoOk = false; let deliveryError: string | null = null;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-wapi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
        body: JSON.stringify({ phone: prof.phone, message: finalMessage, image_url: tpl.image_url || null }),
      });
      const j = await res.json().catch(() => ({}));
      if (j?.ok) autoOk = true; else deliveryError = j?.error || 'falha no envio';
    } catch (err: any) {
      deliveryError = err?.message || String(err);
    }

    await supabase.from('billing_charges').insert({
      campaign_id: camp.id, user_id: camp.user_id, stage,
      template_key: tplKey, responsible_user_id: null, phone: prof.phone,
      message: finalMessage, image_url: tpl.image_url || null,
      document_url: null, document_name: null,
      delivery_status: autoOk ? 'sent' : 'failed', delivery_error: deliveryError,
    });
    await supabase.rpc('advance_billing_campaign', { _campaign_id: camp.id });

    await supabase.from('sth_auto_events').insert({
      phone: prof.phone, user_id: camp.user_id,
      classification: 'cobranca', intent: 'renovacao',
      source: 'billing_tick', decision: tplKey,
      action_taken: autoOk ? 'message_sent' : 'message_failed',
      payload: { stage, campaign_id: camp.id, error: deliveryError },
    });

    if (autoOk) sent++; else failed++;
  }
  return { ok: true, processed, sent, failed, skipped };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'inbound';

    let result: any;
    if (action === 'scheduler') result = await handleScheduler(supabase);
    else if (action === 'billing_tick') result = await handleBillingTick(supabase);
    else result = await handleInbound(supabase, body);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('sth-automation-engine error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});