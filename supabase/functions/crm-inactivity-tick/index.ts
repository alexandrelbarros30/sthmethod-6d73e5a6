import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Roda a cada 1 min via pg_cron.
// Para todos os canais (Z-API e W-API):
//  - 15 min após a última msg do bot sem resposta → envia 1º aviso.
//  - 15 min depois (30 min total) → envia encerramento e fecha sessão.
// Suspenso quando human_handoff = true.
//
// Adicional: para conversas em ATENDIMENTO HUMANO (human_handoff=true ou assigned_to),
// se ficarem MUDAS por 30 minutos após a última mensagem (do atendente OU do cliente),
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
    return `Olá${nomeSep}${firstName}.\n\nEstamos encerrando este atendimento por inatividade (mais de 30 minutos sem resposta).\n\n${humanLine}\n\nSe precisar de algo, é só nos chamar novamente por aqui que retomamos assim que possível. Um abraço da equipe STH Method. 🙏`;
  };

  const buildClosureRequest = (firstName: string) => {
    const sep = firstName ? ' ' : '';
    return `Olá${sep}${firstName}.\n\nNotamos que você não respondeu à nossa última mensagem. Ainda precisa de ajuda por aqui?\n\nSe não houver resposta nos próximos 15 minutos, vamos encerrar este atendimento — mas fique tranquilo, é só nos chamar de volta a qualquer momento. 🙂`;
  };

  const normalizeWhatsappTarget = (phone: string) => {
    const raw = String(phone || '').trim();
    if (raw.includes('@g.us') || raw.includes('-group')) return raw;
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (raw.startsWith('+')) return digits;
    if (digits.startsWith('00') && digits.length > 11) return digits.slice(2);
    if (digits.startsWith('55')) return digits;
    if (digits.length > 11 && !digits.startsWith('0')) return digits;
    return `55${digits}`;
  };

  // Resolve o nome real do aluno pelo telefone (evita usar push name do WhatsApp,
  // ex.: "Inefável💎" no lugar de "Danielle M D S Gil"). Fallback = display_name.
  const resolveStudentFirstName = async (phone: string, fallbackDisplayName?: string | null) => {
    // Filtra tokens ruins do push name do WhatsApp (ex.: "~~ Marcos", "💎 Nome", "🧚🏻").
    const pickFirstNameToken = (raw: string): string => {
      const cleaned = String(raw || '')
        // remove emojis / símbolos, mantém letras (inclui acentuadas) e espaços
        .replace(/[^\p{L}\s'-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const tokens = cleaned.split(' ').filter(t => /^\p{L}/u.test(t) && t.length >= 2);
      return tokens[0] || '';
    };
    try {
      const digits = String(phone || '').replace(/\D/g, '');
      const normalized = digits.startsWith('55') ? digits.slice(2) : digits;
      if (normalized.length >= 10) {
        const { data: prof } = await admin
          .from('profiles')
          .select('full_name, phone')
          .filter('phone', 'ilike', `%${normalized}%`)
          .not('full_name', 'is', null)
          .limit(1)
          .maybeSingle();
        const full = String(prof?.full_name || '').trim();
        if (full) {
          const t = pickFirstNameToken(full);
          if (t) return t;
        }
      }
    } catch (_) { /* ignore */ }
    return pickFirstNameToken(String(fallbackDisplayName || ''));
  };

  const sendViaCrm = async (phone: string, body: string, conversation_id: string, provider: string) => {
    const resolvedProvider = provider === 'zapi' ? 'zapi' : (provider === 'wapi_sucesso' ? 'wapi_sucesso' : 'wapi');
    const source = resolvedProvider;

    try {
      const { data: cfgRow } = await admin
        .from('crm_settings')
        .select('value')
        .eq('key', resolvedProvider)
        .maybeSingle();
      const cfg: any = cfgRow?.value || {};
      if (cfg.enabled !== true) {
        const error = `Canal ${resolvedProvider.toUpperCase()} inativo`;
        console.warn('inactivity send blocked', { provider: resolvedProvider, conversation_id, error });
        return { ok: false, error };
      }

      const fullPhone = normalizeWhatsappTarget(phone);
      let resp: Response;
      let sendData: any = {};

      if (resolvedProvider === 'zapi') {
        const id = (cfg.instance_id || '').trim() || Deno.env.get('ZAPI_INSTANCE_ID');
        const tok = (cfg.instance_token || '').trim() || Deno.env.get('ZAPI_INSTANCE_TOKEN');
        const client = (cfg.client_token || '').trim() || Deno.env.get('ZAPI_CLIENT_TOKEN');
        if (!id || !tok || !client) return { ok: false, error: 'Credenciais Z-API ausentes' };

        resp = await fetch(`https://api.z-api.io/instances/${id}/token/${tok}/send-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Client-Token': client },
          body: JSON.stringify({ phone: fullPhone, message: body }),
        });
        sendData = await resp.json().catch(() => ({}));
      } else {
        const serverUrl = ((cfg.server_url || '').trim() || 'https://api.w-api.app').replace(/\/$/, '');
        const id = (cfg.instance_id || '').trim() || Deno.env.get('WAPI_INSTANCE_ID');
        const tok = (cfg.token || '').trim() || Deno.env.get('WAPI_TOKEN');
        const client = (cfg.client_token || '').trim() || Deno.env.get('WAPI_CLIENT_TOKEN');
        if (!id || !tok) return { ok: false, error: 'Credenciais W-API ausentes' };

        const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` };
        if (client) headers['Client-Token'] = client;
        resp = await fetch(`${serverUrl}/v1/message/send-text?instanceId=${id}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ phone: fullPhone, message: body }),
        });
        sendData = await resp.json().catch(() => ({}));
      }

      const ok = resp.ok && !sendData?.error;
      const externalId = sendData?.messageId || sendData?.id || sendData?.zaapId || null;

      await admin.from('crm_messages').insert({
        conversation_id,
        direction: 'out',
        body,
        source,
        status: ok ? 'sent' : 'failed',
        external_id: externalId,
      });

      if (!ok) {
        console.error('inactivity whatsapp send failed', {
          provider: resolvedProvider,
          conversation_id,
          status: resp.status,
          error: sendData?.error || sendData?.message || 'Falha no envio',
        });
      }

      return { ok, error: sendData?.error || sendData?.message || (ok ? null : `HTTP ${resp.status}`) };
    } catch (e) {
      console.error('inactivity send failed', provider, e);
      return { ok: false, error: String(e) };
    }
  };

  const requestBody = await req.clone().json().catch(() => ({}));
  const mode = String(requestBody?.mode || 'tick');

  if (mode === 'resend_failed_closures') {
    // Encerramentos são silenciosos — não há mensagem para reenviar.
    return new Response(JSON.stringify({ ok: true, disabled: true, reason: 'Encerramentos silenciosos ativos' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const now = Date.now();
  // Janela de cada etapa (aviso e encerramento). 15 min + 15 min = 30 min totais.
  const FIVE_MIN = 15 * 60 * 1000;

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

    // Encerramento SILENCIOSO após 30 min sem resposta do cliente.
    // Nenhuma mensagem é enviada — apenas a conversa é fechada.
    if (sinceBot >= 2 * FIVE_MIN) {
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
        reason: '30 min sem resposta do cliente após última mensagem do bot (encerramento silencioso)',
        metadata: { conversation_id: c.id, silent: true },
      });
      closed++;
    }
  }

  // ===== Encerramento pós-atendimento humano (30 min de silêncio) =====
  const TEN_MIN = 30 * 60 * 1000;
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
      .select('created_at, direction, sent_by, metadata')
      .eq('conversation_id', c.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!lastMsg?.created_at) continue;

    // Só encerra se a ÚLTIMA mensagem foi de um atendente humano (out com sent_by)
    // — se o cliente respondeu por último, o atendente ainda pode voltar.
    // Considera tanto envios pelo painel (sent_by preenchido) quanto respostas
    // manuais do atendente pelo próprio WhatsApp (metadata.type='manual_human',
    // inserido pelo crm-inbound-webhook em eventos fromMe/SendCallback).
    const isHumanOut =
      lastMsg.direction === 'out' &&
      (!!lastMsg.sent_by || (lastMsg.metadata as any)?.type === 'manual_human');
    if (!isHumanOut) continue;

    const sinceLast = now - new Date(lastMsg.created_at).getTime();

    // Busca estado de aviso separadamente (não estava no SELECT inicial).
    const { data: convState } = await admin
      .from('crm_conversations')
      .select('inactivity_warned_at')
      .eq('id', c.id)
      .maybeSingle();
    const warnedAt = convState?.inactivity_warned_at
      ? new Date(convState.inactivity_warned_at).getTime()
      : 0;

    // Encerramento SILENCIOSO após 30 min sem resposta do cliente pós-atendimento humano.
    if (sinceLast >= TEN_MIN) {
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
        reason: '30 min sem resposta do cliente após atendimento humano (encerramento silencioso)',
        metadata: { conversation_id: c.id, silent: true },
      });
      humanClosed++;
    }
  }

  // ===== Catch-all: qualquer conversa aberta parada há >30 min =====
  // Cobre casos em que last_bot_message_at nunca foi setado (fluxo antigo,
  // handoff que não passou pelo bot, etc). Envia farewell e fecha.
  const cutoffIso = new Date(now - TEN_MIN).toISOString();
  const { data: staleConvs } = await admin
    .from('crm_conversations')
    .select('id, phone, display_name, provider, last_message_at, human_handoff, assigned_to')
    .eq('status', 'open')
    .lt('last_message_at', cutoffIso)
    .limit(500);

  let staleClosed = 0;
  for (const c of staleConvs || []) {
    // Só aplica o catch-all se a conversa tem histórico de resposta do bot/atendente.
    // Caso contrário, deixa o fluxo principal do webhook responder (away/AI) —
    // mandar farewell direto numa conversa sem interação gera silêncio total
    // para o cliente e induz a erro de auditoria.
    const { data: hadOut } = await admin
      .from('crm_messages')
      .select('id')
      .eq('conversation_id', c.id)
      .eq('direction', 'out')
      .limit(1)
      .maybeSingle();
    if (!hadOut) continue;

    // Encerramento SILENCIOSO — sem envio de mensagem.
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
      event_type: 'conversation_stale_auto_closed',
      reason: 'Conversa parada há mais de 30 min — encerramento silencioso',
      metadata: { conversation_id: c.id, silent: true, last_message_at: c.last_message_at },
    });
    staleClosed++;
  }

  return new Response(JSON.stringify({ ok: true, warned, closed, humanClosed, staleClosed, checked: convs?.length || 0, humanChecked: humanConvs?.length || 0, staleChecked: staleConvs?.length || 0 }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
