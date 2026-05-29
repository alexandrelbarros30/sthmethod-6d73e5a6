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

  // 6. Generate AI draft (never auto-send — human approval queue)
  let decision = 'human';
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/sth-ai-engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
      body: JSON.stringify({ action: 'draft', phone, text, intent, classification }),
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

  return { ok: true, classification, intent, memory_id: memId, score_delta: delta };
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'inbound';

    let result: any;
    if (action === 'scheduler') result = await handleScheduler(supabase);
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