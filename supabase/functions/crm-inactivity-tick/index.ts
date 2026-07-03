import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Roda a cada 1 min via pg_cron.
// Para todos os canais (Z-API e W-API):
//  - 5 min após a última msg do bot sem resposta → envia 1º aviso.
//  - 5 min depois (10 min total) → envia encerramento e fecha sessão.
// Suspenso quando human_handoff = true.
//
// Adicional: para conversas em ATENDIMENTO HUMANO (human_handoff=true ou assigned_to),
// se ficarem MUDAS por 10 minutos após a última mensagem (do atendente OU do cliente),
// envia mensagem de encerramento e fecha a conversa, resetando o handoff.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // ---- Horário de expediente por canal ----
  function spNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    const wd = parts.find(p => p.type === 'weekday')?.value || '';
    const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const map: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
    return { dow: map[wd] ?? 0, minutes: h * 60 + m };
  }
  function hhmmToMin(s: string): number {
    const [h, m] = String(s || '0:0').split(':').map(n => parseInt(n, 10) || 0);
    return h * 60 + m;
  }
  function isWithinBusinessHours(cfg: any): boolean {
    if (!cfg) return true;
    const { dow, minutes } = spNow();
    let win: any = null;
    if (dow >= 1 && dow <= 5) win = cfg.mon_fri;
    else if (dow === 6) win = cfg.sat;
    else win = cfg.sun;
    if (!win || !win.start || !win.end) return false;
    return minutes >= hhmmToMin(win.start) && minutes < hhmmToMin(win.end);
  }
  const [{ data: hoursComCfg }, { data: hoursNutriCfg }, { data: hoursSucessoCfg }] = await Promise.all([
    admin.from('crm_settings').select('value').eq('key', 'business_hours_comercial').maybeSingle(),
    admin.from('crm_settings').select('value').eq('key', 'business_hours_nutri').maybeSingle(),
    admin.from('crm_settings').select('value').eq('key', 'business_hours_sucesso').maybeSingle(),
  ]);
  const hoursByProvider = (provider: string) => provider === 'wapi_sucesso' ? hoursSucessoCfg?.value
    : provider === 'wapi' ? hoursNutriCfg?.value : hoursComCfg?.value;
  const channelLabel = (provider: string) => provider === 'wapi' ? 'Fale com o Nutri'
    : provider === 'wapi_sucesso' ? 'Sucesso do Aluno' : 'Comercial';
  const buildFarewell = (firstName: string, provider: string) => {
    const nomeSep = firstName ? ' ' : '';
    const inHours = isWithinBusinessHours(hoursByProvider(provider));
    const canal = channelLabel(provider);
    const humanLine = inHours
      ? `O atendimento humano deste canal (${canal}) também foi encerrado.`
      : `O atendimento humano do canal ${canal} já está encerrado conforme horário de expediente.`;
    return `Olá${nomeSep}${firstName}.\n\nEstamos encerrando este atendimento por inatividade (mais de 10 minutos sem resposta).\n\n${humanLine}\n\nSe precisar de algo, é só nos chamar novamente por aqui que retomamos assim que possível. Um abraço da equipe STH Method. 🙏`;
  };

  const sendViaCrm = async (phone: string, body: string, conversation_id: string, provider: string) => {
    try {
      const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-send-whatsapp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({ phone, body, conversation_id, provider }),
      });
      const data = await r.json().catch(() => ({}));
      return { ok: r.ok && data?.ok, error: data?.error };
    } catch (e) {
      console.error('inactivity send failed', provider, e);
      return { ok: false, error: String(e) };
    }
  };

  const now = Date.now();
  const FIVE_MIN = 5 * 60 * 1000;

  // Conversas elegíveis: bot já respondeu, está ativo, sem handoff
  const { data: convs } = await admin
    .from('crm_conversations')
    .select('id, phone, display_name, last_bot_message_at, inactivity_warned_at, flow_state, status, provider')
    .eq('status', 'open')
    .eq('human_handoff', false)
    .is('assigned_to', null)
    .not('last_bot_message_at', 'is', null)
    .limit(500);

  let warned = 0;
  let closed = 0;
  let humanClosed = 0;

  for (const c of convs || []) {
    if (!c.last_bot_message_at) continue;
    const lastBot = new Date(c.last_bot_message_at).getTime();
    const sinceBot = now - lastBot;

    // Confere se houve mensagem do cliente após a última do bot
    const { data: latestIn } = await admin
      .from('crm_messages')
      .select('created_at')
      .eq('conversation_id', c.id)
      .eq('direction', 'in')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastIn = latestIn?.created_at ? new Date(latestIn.created_at).getTime() : 0;
    if (lastIn > lastBot) continue; // cliente já respondeu

    const firstName = String(c.display_name || '').split(' ')[0] || '';
    const nomeSep = firstName ? ' ' : '';

    if (!c.inactivity_warned_at && sinceBot >= FIVE_MIN) {
      const msg = `Olá${nomeSep}${firstName}.\n\nPercebi que você não respondeu à nossa última mensagem.\n\nSe ainda precisar de ajuda, basta responder esta conversa. 🙂`;
      const { ok } = await sendViaCrm(c.phone, msg, c.id, c.provider || 'zapi');
      
      if (ok) {
        await admin.from('crm_conversations').update({
          inactivity_warned_at: new Date().toISOString(),
          last_bot_message_at: new Date().toISOString(),
        }).eq('id', c.id);
        warned++;
      }
    } else if (c.inactivity_warned_at) {
      const sinceWarn = now - new Date(c.inactivity_warned_at).getTime();
      if (sinceWarn >= FIVE_MIN) {
        // Encerramento informativo (10 min total sem resposta do cliente).
        const farewell = buildFarewell(firstName, c.provider || 'zapi');
        await sendViaCrm(c.phone, farewell, c.id, c.provider || 'zapi');
        await admin.from('crm_conversations').update({
          status: 'closed',
          human_handoff: false,
          assigned_to: null,
          human_intro_sent: false,
          ai_paused_until: null,
          flow_state: null,
          flow_context: {},
          inactivity_warned_at: null,
          last_bot_message_at: null,
          session_started_at: null,
          session_expires_at: null,
        }).eq('id', c.id);
        await admin.from('automation_logs').insert({
          contact_phone: c.phone,
          event_type: 'conversation_auto_closed',
          reason: '10 min sem resposta do cliente após última mensagem do bot',
          metadata: { conversation_id: c.id },
        });
        closed++;
      }
    }
  }

  // ===== Encerramento pós-atendimento humano (10 min de silêncio) =====
  const TEN_MIN = 10 * 60 * 1000;
  const { data: humanConvs } = await admin
    .from('crm_conversations')
    .select('id, phone, display_name, provider, human_handoff, assigned_to')
    .eq('status', 'open')
    .or('human_handoff.eq.true,assigned_to.not.is.null')
    .limit(500);

  for (const c of humanConvs || []) {
    // Pega a última mensagem (in ou out) da conversa
    const { data: lastMsg } = await admin
      .from('crm_messages')
      .select('created_at, direction, sent_by')
      .eq('conversation_id', c.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!lastMsg?.created_at) continue;

    // Só encerra se a ÚLTIMA mensagem foi de um atendente humano (out com sent_by)
    // — se o cliente respondeu por último, o atendente ainda pode voltar.
    if (lastMsg.direction !== 'out' || !lastMsg.sent_by) continue;

    const sinceLast = now - new Date(lastMsg.created_at).getTime();
    if (sinceLast < TEN_MIN) continue;

    const firstName = String(c.display_name || '').split(' ')[0] || '';
    const farewell = buildFarewell(firstName, c.provider || 'wapi');

    const { ok } = await sendViaCrm(c.phone, farewell, c.id, c.provider || 'wapi');

    await admin.from('crm_conversations').update({
      status: 'closed',
      human_handoff: false,
      assigned_to: null,
      human_intro_sent: false,
      ai_paused_until: null,
      flow_state: null,
      flow_context: {},
      inactivity_warned_at: null,
      last_bot_message_at: null,
      session_started_at: null,
      session_expires_at: null,
    }).eq('id', c.id);

    await admin.from('automation_logs').insert({
      contact_phone: c.phone,
      event_type: 'human_handoff_auto_closed',
      reason: '10 min sem resposta do cliente após última mensagem do atendente',
      metadata: { conversation_id: c.id, sent: ok },
    });
    humanClosed++;
  }

  return new Response(JSON.stringify({ ok: true, warned, closed, humanClosed, checked: convs?.length || 0, humanChecked: humanConvs?.length || 0 }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
