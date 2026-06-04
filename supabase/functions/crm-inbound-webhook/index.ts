import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

function localEngineReply(input: string): string {
  const t = (input || '').toLowerCase();
  if (/^\s*(ol[áa]|oi|bom dia|boa tarde|boa noite)/.test(t)) {
    return 'Olá! Seja bem-vindo(a) à STH METHOD. 👋\n\nComo posso ajudar?\n1️⃣ Conhecer planos\n2️⃣ Como funciona\n3️⃣ Falar com consultor\n4️⃣ Já sou aluno';
  }
  if (/\b1\b|plano|valor|pre[çc]o/.test(t)) {
    return 'Temos planos mensais, trimestrais e semestrais. Posso te enviar os valores atualizados — me diga seu objetivo (emagrecimento, hipertrofia, performance ou saúde).';
  }
  if (/\b2\b|como funciona|metodologia/.test(t)) {
    return 'A STH METHOD é uma consultoria científica: planejamento alimentar individualizado, treino guiado pelo app ST Coach, protocolos estratégicos e acompanhamento de exames.';
  }
  if (/\b3\b|consultor|humano|atendente/.test(t)) {
    return 'Vou te encaminhar para um consultor humano. Pode me confirmar seu nome completo e e-mail?';
  }
  if (/\b4\b|aluno|j[áa] sou|nutri/.test(t)) {
    return 'Perfeito! O canal exclusivo para alunos ativos é o Fale com o Nutri: https://wa.me/5521998984153';
  }
  return 'Recebi sua mensagem. Para te ajudar melhor, responda com 1️⃣ Planos, 2️⃣ Como funciona, 3️⃣ Falar com consultor ou 4️⃣ Já sou aluno.';
}

async function generateAiReply({
  admin,
  conversationId,
  phone,
}: {
  admin: ReturnType<typeof createClient>;
  conversationId: string;
  phone: string;
}): Promise<{ response: string; model: string; engine: string }> {
  let systemPrompt = 'Você é um assistente de atendimento ao aluno da consultoria STH METHOD. Seja claro, técnico, neutro e cordial. Responda em português do Brasil.';
  let engine: 'lovable' | 'local' | 'gemini_api' = 'lovable';

  const [{ data: cfg }, { data: engCfg }] = await Promise.all([
    admin.from('crm_settings').select('value').eq('key', 'ai_prompt_comercial').maybeSingle(),
    admin.from('crm_settings').select('value').eq('key', 'ai_engine').maybeSingle(),
  ]);

  const storedPrompt = (cfg?.value as any)?.prompt;
  if (storedPrompt && typeof storedPrompt === 'string' && storedPrompt.trim()) {
    systemPrompt = storedPrompt;
  }

  const storedEngine = (engCfg?.value as any)?.engine;
  if (storedEngine === 'lovable' || storedEngine === 'local' || storedEngine === 'gemini_api') {
    engine = storedEngine;
  }

  const [{ data: msgs }, { data: profiles }] = await Promise.all([
    admin
      .from('crm_messages')
      .select('direction, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10),
    admin
      .from('profiles')
      .select('full_name, objective, weight')
      .in('phone', phoneCandidates(phone))
      .limit(1),
  ]);

  const history = (msgs || [])
    .reverse()
    .map((m: any) => `${m.direction === 'in' ? 'Aluno' : 'Atendente'}: ${m.body}`)
    .join('\n');

  let context = history ? `Histórico recente da conversa:\n${history}\n\n` : '';
  if (profiles?.[0]) {
    context += `Aluno: ${profiles[0].full_name} | Objetivo: ${profiles[0].objective || '—'} | Peso: ${profiles[0].weight || '—'}kg\n\n`;
  }

  const userPrompt = 'Com base no contexto acima, responda a última mensagem de forma curta, cordial e profissional (tom STH METHOD, neutro e técnico, em português do Brasil). Não use emojis em excesso. Máximo 4 frases.';

  if (engine === 'local') {
    return { response: localEngineReply(context), model: 'local/rules', engine };
  }

  if (engine === 'gemini_api') {
    const gkey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY_FALLBACK');
    if (!gkey) throw new Error('GEMINI_API_KEY missing');

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${gkey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: `${context}\n${userPrompt}` }] }],
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Gemini API error: ${JSON.stringify(d)}`);

    return {
      response: (d as any)?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '',
      model: 'gemini-2.5-flash (api)',
      engine,
    };
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY missing');

  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${context}\n${userPrompt}` },
      ],
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`AI gateway error: ${JSON.stringify(data)}`);

  return {
    response: (data as any)?.choices?.[0]?.message?.content || '',
    model: 'google/gemini-2.5-flash',
    engine,
  };
}

// Public webhook (no JWT). Use ?provider=zapi|wapi and ?secret=... in URL.
// Z-API → channel "comercial" (STH One)
// W-API → channel "nutri" (Fale com o Nutri)

function normalizePhone(raw: string): string {
  let d = String(raw || '').replace(/\D+/g, '').replace(/^0+/, '');
  if (d.length >= 12 && d.startsWith('55')) return d;
  if (d.length === 10 || d.length === 11) return '55' + d;
  return d;
}

// === Horário de atendimento humano (timezone America/Sao_Paulo) ===
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
  if (!cfg) return true; // sem config = sempre atendendo
  const { dow, minutes } = spNow();
  let win: any = null;
  if (dow >= 1 && dow <= 5) win = cfg.mon_fri;
  else if (dow === 6) win = cfg.sat;
  else win = cfg.sun;
  if (!win || !win.start || !win.end) return false;
  return minutes >= hhmmToMin(win.start) && minutes < hhmmToMin(win.end);
}

function phoneCandidates(d: string): string[] {
  if (!d) return [];
  const set = new Set<string>([d]);
  const local = d.startsWith('55') ? d.slice(2) : d;
  if (local) {
    set.add(local);
    set.add('55' + local);
    if (local.length === 11 && local[2] === '9') set.add(local.slice(0,2) + local.slice(3));
    if (local.length === 10) set.add(local.slice(0,2) + '9' + local.slice(2));
  }
  return Array.from(set);
}

// Triagem por palavras-chave
function classify(text: string): { queue: 'comercial'|'nutri'|'financeiro'|null; nutriCategory: string | null; tags: string[] } {
  const t = String(text || '').toLowerCase();
  const tags: string[] = [];
  let queue: any = null;
  let nutriCategory: string | null = null;

  const has = (...kw: string[]) => kw.some(k => t.includes(k));

  // Financeiro
  if (has('cobran', 'pagamento', 'pagar', 'pix', 'boleto', 'comprovante', 'fatura', 'cartao', 'cartão')) {
    queue = 'financeiro'; tags.push('FINANCEIRO','PAGAMENTO');
  }
  // Comercial
  else if (has('preço','preco','plano','planos','contratar','assinar','quero entrar','quero começar','quero comecar','quanto custa','valor','valores')) {
    queue = 'comercial'; tags.push('COMERCIAL','INTERESSE');
  }
  else if (has('renovar','renovação','renovacao','reativar')) {
    queue = 'comercial'; tags.push('COMERCIAL','RENOVACAO');
  }
  // Nutri
  else if (has('dieta','refeição','refeicao','cardápio','cardapio','calorias','macros')) {
    queue = 'nutri'; nutriCategory = 'Dieta'; tags.push('NUTRI','DIETA');
  }
  else if (has('treino','exercicio','exercício','série','serie','academia','musculação','musculacao')) {
    queue = 'nutri'; nutriCategory = 'Treino'; tags.push('NUTRI','TREINO');
  }
  else if (has('protocolo','suplemento','hormonio','hormônio','peptide','peptideo','peptídeo','ciclo')) {
    queue = 'nutri'; nutriCategory = 'Protocolo'; tags.push('NUTRI','PROTOCOLO');
  }
  else if (has('exame','exames','laboratório','laboratorio','sangue','hemograma')) {
    queue = 'nutri'; nutriCategory = 'Exames'; tags.push('NUTRI','EXAMES');
  }
  else if (has('peso','medidas','foto','evolução','evolucao','atualização','atualizacao','progresso')) {
    queue = 'nutri'; nutriCategory = 'Atualização'; tags.push('NUTRI','ATUALIZACAO');
  }
  else if (has('urgente','urgência','urgencia','prioridade','emergência','emergencia')) {
    queue = 'nutri'; nutriCategory = 'Prioridade'; tags.push('NUTRI','PRIORIDADE');
  }

  return { queue, nutriCategory, tags };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const provider = (url.searchParams.get('provider') || 'wapi').toLowerCase(); // zapi | wapi
    const expectedSecret = Deno.env.get('MP_WEBHOOK_SECRET') || '';
    const provided = req.headers.get('x-webhook-secret') || url.searchParams.get('secret') || '';

    const payload = await req.json().catch(() => ({})) as any;

    // Autenticação flexível:
    // 1) secret correto via header/query OU
    // 2) instanceId do payload bate com o ZAPI_INSTANCE_ID / WAPI_INSTANCE_ID configurado
    const payloadInstance = String(
      payload?.instanceId || payload?.instance_id || payload?.instance || ''
    ).trim();
    const expectedInstance = (
      provider === 'zapi'
        ? Deno.env.get('ZAPI_INSTANCE_ID')
        : Deno.env.get('WAPI_INSTANCE_ID')
    ) || '';
    const secretOk = expectedSecret && provided === expectedSecret;
    const instanceOk = expectedInstance && payloadInstance && payloadInstance === expectedInstance;
    if (expectedSecret && !secretOk && !instanceOk) {
      return new Response(JSON.stringify({ error: 'invalid secret' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const phoneRaw = payload?.phone || payload?.from || payload?.data?.from || payload?.message?.from || '';
    // Z-API: text.message | image.caption | audio (sem texto) | document.caption
    const rawText =
      (typeof payload?.text === 'string' ? payload.text : payload?.text?.message) ||
      payload?.message?.conversation ||
      (typeof payload?.message === 'string' ? payload.message : '') ||
      payload?.image?.caption ||
      payload?.video?.caption ||
      payload?.document?.caption ||
      payload?.body ||
      payload?.data?.message?.text ||
      '';
    const body = typeof rawText === 'string' ? rawText : '';
    const externalId = payload?.messageId || payload?.id || null;
    const name = payload?.senderName || payload?.pushName || null;

    // Ignora mensagens enviadas por mim e mensagens de grupo
    const isFromMe = payload?.fromMe === true || payload?.from_me === true;
    const isGroup =
      payload?.isGroup === true ||
      payload?.is_group === true ||
      String(phoneRaw).startsWith('120363') ||
      String(phoneRaw).includes('-') ||
      String(phoneRaw).includes('@g.us');
    if (isFromMe || isGroup) {
      return new Response(JSON.stringify({ ok: true, skipped: isFromMe ? 'fromMe' : 'group' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const phone = normalizePhone(phoneRaw);
    if (!phone || !body) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // === OPT-OUT por palavra-chave ===
    // "CANCELAR ENVIO" → marca o aluno como opt-out e responde 1x confirmando.
    // "VOLTAR" → reativa o recebimento (se já estava opt-out).
    const normalizedBody = String(body).trim().toUpperCase();
    const isOptOutKeyword = /\bCANCELAR\s+ENVIO\b/.test(normalizedBody);
    const isReactivateKeyword = /^VOLTAR$/.test(normalizedBody);
    if (isOptOutKeyword || isReactivateKeyword) {
      const candidates = phoneCandidates(phone);
      const { data: matchedProfile } = await admin
        .from('profiles').select('user_id, full_name').in('phone', candidates).limit(1).maybeSingle();

      if (matchedProfile?.user_id) {
        await admin.from('profiles').update({
          whatsapp_opt_out: isOptOutKeyword,
          whatsapp_opt_out_at: isOptOutKeyword ? new Date().toISOString() : null,
          whatsapp_opt_out_reason: isOptOutKeyword ? 'Solicitação do aluno via WhatsApp (CANCELAR ENVIO)' : null,
        }).eq('user_id', matchedProfile.user_id);
      }

      // Registra a mensagem do aluno na conversa (mesmo que mute as automações depois)
      let { data: convRow } = await admin.from('crm_conversations').select('id').eq('phone', phone).maybeSingle();
      if (!convRow) {
        const ins = await admin.from('crm_conversations').insert({
          phone, display_name: name || matchedProfile?.full_name || null,
          channel: 'whatsapp', status: 'open', provider,
          queue_type: provider === 'zapi' ? 'comercial' : 'nutri',
          is_lead: !matchedProfile,
        }).select('id').single();
        convRow = ins.data;
      }
      await admin.from('crm_messages').insert({
        conversation_id: convRow!.id, direction: 'in', body: String(body),
        source: provider === 'zapi' ? 'zapi' : 'wapi', external_id: externalId, status: 'received',
      });

      // Responde diretamente via API do provider — NÃO usa send-whatsapp/send-wapi
      // pois eles bloqueariam pelo próprio opt-out que acabamos de marcar.
      const firstName = (matchedProfile?.full_name || '').split(' ')[0] || 'Aluno';
      const replyMessage = isOptOutKeyword
        ? `Tudo certo, ${firstName}. Você não receberá mais mensagens automáticas da STH METHOD. ✅\n\nPara reativar a qualquer momento, basta responder *VOLTAR*.`
        : `Bem-vindo de volta, ${firstName}! 💪 Você voltará a receber as comunicações da STH METHOD normalmente.`;
      try {
        if (provider === 'wapi') {
          const { data: wcfg } = await admin.from('crm_settings').select('value').eq('key', 'wapi').maybeSingle();
          const c: any = wcfg?.value || {};
          const INSTANCE_ID = (c.instance_id || '').trim() || Deno.env.get('WAPI_INSTANCE_ID');
          const TOKEN = (c.token || '').trim() || Deno.env.get('WAPI_TOKEN');
          const CLIENT_TOKEN = (c.client_token || '').trim() || Deno.env.get('WAPI_CLIENT_TOKEN');
          const serverUrl = ((c.server_url || '').trim() || 'https://api.w-api.app').replace(/\/$/, '');
          if (INSTANCE_ID && TOKEN) {
            const h: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };
            if (CLIENT_TOKEN) h['Client-Token'] = CLIENT_TOKEN;
            await fetch(`${serverUrl}/v1/message/send-text?instanceId=${INSTANCE_ID}`, {
              method: 'POST', headers: h,
              body: JSON.stringify({ phone, message: replyMessage }),
            });
          }
        } else {
          const { data: zcfg } = await admin.from('crm_settings').select('value').eq('key', 'zapi').maybeSingle();
          const c: any = zcfg?.value || {};
          const INSTANCE_ID = (c.instance_id || '').trim() || Deno.env.get('ZAPI_INSTANCE_ID');
          const INSTANCE_TOKEN = (c.instance_token || '').trim() || Deno.env.get('ZAPI_INSTANCE_TOKEN');
          const CLIENT_TOKEN = (c.client_token || '').trim() || Deno.env.get('ZAPI_CLIENT_TOKEN');
          if (INSTANCE_ID && INSTANCE_TOKEN && CLIENT_TOKEN) {
            await fetch(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-text`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Client-Token': CLIENT_TOKEN },
              body: JSON.stringify({ phone, message: replyMessage }),
            });
          }
        }
        await admin.from('crm_messages').insert({
          conversation_id: convRow!.id, direction: 'out', body: replyMessage,
          source: provider === 'zapi' ? 'zapi' : 'wapi', status: 'sent',
        });
      } catch (e) {
        console.error('opt-out confirm reply failed', e);
      }

      return new Response(JSON.stringify({
        ok: true, opt_out: isOptOutKeyword, reactivated: isReactivateKeyword,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const [{ data: aiModeCfg }, { data: wapiCfg }, { data: zapiCfg }] = await Promise.all([
      admin.from('crm_settings').select('value').eq('key', 'ai_mode').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'wapi').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'zapi').maybeSingle(),
    ]);

    // Horários de atendimento humano (separados por canal)
    const [
      { data: hoursComCfg },
      { data: hoursNutriCfg },
      { data: nutriAwayActive },
      { data: nutriAwayInactive },
      { data: comAwayActiveCfg },
      { data: comAwayExpiredCfg },
      { data: comAwayLeadCfg },
    ] = await Promise.all([
      admin.from('crm_settings').select('value').eq('key', 'business_hours_comercial').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'business_hours_nutri').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'nutri_away_active').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'nutri_away_inactive').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'comercial_away_active').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'comercial_away_expired').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'comercial_away_lead').maybeSingle(),
    ]);
    // 1. Fetch all flow steps from crm_flow_steps
    const { data: flowSteps } = await admin.from('crm_flow_steps').select('*');
    const getFlowStep = (key: string) => {
      const step = (flowSteps || []).find(s => s.key === key);
      if (step) return { value: { message: step.message, image_url: step.media_url, media_type: step.media_type } };
      return null;
    };

    const comIdActive = getFlowStep('comercial_id_active');
    const comIdExpired = getFlowStep('comercial_id_expired');
    const comIdLead = getFlowStep('comercial_id_lead');

    const menu1Cfg = getFlowStep('comercial_menu_1_planos');
    const menu2Cfg = getFlowStep('comercial_menu_2_como_funciona');
    const menu3Cfg = getFlowStep('comercial_menu_3_consultor');
    const menu4ExCfg = getFlowStep('comercial_menu_4_ex_aluno');
    const menu4ActiveCfg = getFlowStep('comercial_menu_4_aluno_ativo');
    const menu5Cfg = getFlowStep('comercial_menu_5_financeiro');

    const leadMenuCfg = getFlowStep('comercial_lead_menu');
    const formasPagCfg = getFlowStep('comercial_formas_pagamento');
    const handoffConsCfg = getFlowStep('comercial_handoff_consultor');
    const listaPlanosCfg = getFlowStep('comercial_lista_planos');
    const channelHours = provider === 'wapi' ? (hoursNutriCfg?.value as any) : (hoursComCfg?.value as any);
    const withinHours = isWithinBusinessHours(channelHours);

    // 1. lookup profile + subscription (identificação do contato)
    const candidates = phoneCandidates(phone);
    const { data: profiles } = await admin.from('profiles').select('user_id, full_name, objective').in('phone', candidates).limit(1);
    const profile = profiles?.[0];
    let displayName = name || profile?.full_name || null;
    let isLead = !profile;
    let queueOverride: string | null = null;
    const tagsToApply: string[] = [];
    let identifiedAs: 'aluno_ativo' | 'aluno_vencido' | 'lead' = 'lead';

    if (profile) {
      const { data: subs } = await admin.from('subscriptions').select('end_date,status').eq('user_id', profile.user_id).order('end_date', { ascending: false }).limit(1);
      const sub = subs?.[0];
      if (sub) {
        const days = Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000);
        if (days < 0) { tagsToApply.push('RENOVACAO'); queueOverride = 'comercial'; identifiedAs = 'aluno_vencido'; }
        else { tagsToApply.push('ALUNO_ATIVO'); identifiedAs = 'aluno_ativo'; }
      } else {
        tagsToApply.push('LEAD'); isLead = true; identifiedAs = 'lead';
      }
    } else {
      tagsToApply.push('LEAD');
      identifiedAs = 'lead';
    }

    // 2. classify message
    const cls = classify(body);
    const finalQueue = queueOverride || cls.queue || (provider === 'zapi' ? 'comercial' : 'nutri');
    for (const t of cls.tags) if (!tagsToApply.includes(t)) tagsToApply.push(t);

    // 3. upsert conversation + regra de sessão (janela 2h, reset silencioso)
    const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas
    const now = new Date();
    const sessionExpiresAt = new Date(now.getTime() + SESSION_TTL_MS);

    let { data: conv } = await admin
      .from('crm_conversations')
      .select('id, queue_type, status, session_expires_at, session_count')
      .eq('phone', phone)
      .maybeSingle();

    // Define se é uma NOVA sessão: conversa nova, encerrada, ou expirada.
    const isNewSession = !conv
      || conv.status === 'closed'
      || !conv.session_expires_at
      || new Date(conv.session_expires_at).getTime() < now.getTime();

    if (!conv) {
      const ins = await admin.from('crm_conversations').insert({
        phone, display_name: displayName, channel: 'whatsapp', status: 'open',
        provider, queue_type: finalQueue, nutri_category: cls.nutriCategory, is_lead: isLead,
        user_id: profile?.user_id || null,
        identified_as: identifiedAs,
        session_started_at: now.toISOString(),
        session_expires_at: sessionExpiresAt.toISOString(),
        session_count: 1,
      }).select('id, queue_type').single();
      conv = ins.data;
    } else if (isNewSession) {
      // Nova sessão → reidentifica do zero (silenciosamente)
      await admin.from('crm_conversations').update({
        provider,
        status: 'open',
        display_name: displayName || undefined,
        queue_type: finalQueue,
        nutri_category: cls.nutriCategory,
        is_lead: isLead,
        user_id: profile?.user_id || null,
        identified_as: identifiedAs,
        session_started_at: now.toISOString(),
        session_expires_at: sessionExpiresAt.toISOString(),
        session_count: (conv.session_count || 0) + 1,
      }).eq('id', conv.id);
    } else {
      // Mesma sessão → mantém identificação, só estende janela
      const upd: any = { provider, session_expires_at: sessionExpiresAt.toISOString() };
      if (displayName) upd.display_name = displayName;
      if (!conv.queue_type) upd.queue_type = finalQueue;
      if (cls.nutriCategory) upd.nutri_category = cls.nutriCategory;
      upd.is_lead = isLead;
      if (profile?.user_id) upd.user_id = profile.user_id;
      upd.identified_as = identifiedAs;
      await admin.from('crm_conversations').update(upd).eq('id', conv.id);
    }

    // 4. insert message
    await admin.from('crm_messages').insert({
      conversation_id: conv!.id, direction: 'in', body: String(body),
      source: provider === 'zapi' ? 'zapi' : 'wapi', external_id: externalId, status: 'received',
    });

    // 5. apply tags
    if (tagsToApply.length) {
      const { data: tagRows } = await admin.from('crm_tags').select('id,name').in('name', tagsToApply);
      const existing = await admin.from('crm_conversation_tags').select('tag_id').eq('conversation_id', conv!.id);
      const existSet = new Set((existing.data || []).map((r: any) => r.tag_id));
      const toInsert = (tagRows || []).filter((t: any) => !existSet.has(t.id)).map((t: any) => ({ conversation_id: conv!.id, tag_id: t.id }));
      if (toInsert.length) await admin.from('crm_conversation_tags').insert(toInsert);
    }

    // Tag OUT_OF_HOURS para visibilidade no CRM (fora do horário humano)
    if (!withinHours) {
      const { data: tagRow } = await admin.from('crm_tags').select('id').eq('name', 'OUT_OF_HOURS').maybeSingle();
      if (tagRow?.id) {
        await admin.from('crm_conversation_tags').upsert(
          { conversation_id: conv!.id, tag_id: tagRow.id },
          { onConflict: 'conversation_id,tag_id', ignoreDuplicates: true } as any,
        );
      }
    }

    // 6. enqueue
    const queueName = finalQueue === 'comercial' ? 'Atendimento Comercial'
      : finalQueue === 'financeiro' ? 'Financeiro'
      : (cls.nutriCategory || 'Dieta');
    const { data: queue } = await admin.from('crm_queues').select('id').eq('name', queueName).maybeSingle();
    if (queue) {
      const { data: openItem } = await admin.from('crm_queue_items').select('id').eq('conversation_id', conv!.id).is('closed_at', null).maybeSingle();
      if (!openItem) {
        await admin.from('crm_queue_items').insert({
          queue_id: queue.id, conversation_id: conv!.id, phone,
          priority: finalQueue === 'comercial' ? 2 : (cls.nutriCategory === 'Prioridade' ? 0 : 5),
        });
      }
    }

    let autoReply: { sent: boolean; reason?: string; engine?: string; model?: string } | undefined;
    const aiMode = ((aiModeCfg?.value as any)?.mode || 'copilot') as 'copilot' | 'auto';
    const channelEnabled = provider === 'wapi'
      ? (wapiCfg?.value as any)?.enabled === true
      : (zapiCfg?.value as any)?.enabled === true;

    const FIRST_NAME = (displayName || profile?.full_name || '').toString().split(' ')[0] || '';
    const NOME_SEP = FIRST_NAME ? ' ' : '';
    const renderTpl = (s: string, extra: Record<string, string> = {}) => {
      const nameToUse = extra.nome || FIRST_NAME;
      let out = String(s || '')
        .replace(/\{nome\}/gi, nameToUse)
        .replace(/\{nomeSep\}/gi, nameToUse ? ' ' : '');
      for (const [k, v] of Object.entries(extra)) {
        if (k === 'nome') continue;
        out = out.replace(new RegExp(`\\{${k}\\}`, 'gi'), String(v ?? ''));
      }
      return out;
    };

    // Helper: envia texto via Z-API, registra em crm_messages e atualiza timer de inatividade.
    const sendZapiText = async (message: string, modelTag: string) => {
      return sendZapiMedia(message, null, modelTag);
    };
    const sendZapiMedia = async (message: string, imageUrl: string | null | undefined, modelTag: string) => {
      const c = (zapiCfg?.value as any) || {};
      const INSTANCE_ID = (c.instance_id || Deno.env.get('ZAPI_INSTANCE_ID') || '').trim();
      const INSTANCE_TOKEN = (c.instance_token || Deno.env.get('ZAPI_INSTANCE_TOKEN') || '').trim();
      const CLIENT_TOKEN = (c.client_token || Deno.env.get('ZAPI_CLIENT_TOKEN') || '').trim();
      let sent = false;
      let messageId: string | null = null;
      if (INSTANCE_ID && INSTANCE_TOKEN && (message || imageUrl)) {
        const useImage = !!(imageUrl && String(imageUrl).trim());
        const endpoint = useImage
          ? `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-image`
          : `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-text`;
        const body = useImage
          ? { phone, image: String(imageUrl).trim(), caption: message }
          : { phone, message };
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(CLIENT_TOKEN ? { 'Client-Token': CLIENT_TOKEN } : {}) },
          body: JSON.stringify(body),
        });
        const j = await r.json().catch(() => ({}));
        sent = r.ok;
        messageId = j?.messageId || j?.id || null;
      }
      await admin.from('crm_messages').insert({
        conversation_id: conv!.id,
        direction: 'out',
        body: message,
        source: 'zapi',
        external_id: messageId,
        status: sent ? 'sent' : 'failed',
      });
      await admin.from('crm_conversations').update({
        last_bot_message_at: new Date().toISOString(),
        inactivity_warned_at: null,
      }).eq('id', conv!.id);
      return { sent, messageId, modelTag };
    };

    // ============================================================
    // === Canal Comercial (Z-API) — Máquina de estados STH ONE ===
    // ============================================================
    if (provider === 'zapi') {
      // Em nova sessão: reseta estado e handoff (fluxo reinicia do zero)
      if (isNewSession) {
        await admin.from('crm_conversations').update({
          flow_state: null,
          flow_context: {},
          human_handoff: false,
          inactivity_warned_at: null,
        }).eq('id', conv!.id);
      } else {
        // Resposta do cliente zera o aviso (cron não vai encerrar)
        await admin.from('crm_conversations').update({ inactivity_warned_at: null }).eq('id', conv!.id);
      }

      const { data: cstate } = await admin
        .from('crm_conversations')
        .select('flow_state, flow_context, human_handoff')
        .eq('id', conv!.id)
        .maybeSingle();
      const flowState = isNewSession ? null : ((cstate?.flow_state as string | null) || null);
      const flowCtx: any = isNewSession ? {} : ((cstate?.flow_context as any) || {});
      const isHandoff = !isNewSession && cstate?.human_handoff === true;

      const trimmed = String(body).trim();

      // === Templates principais (sobrescrevíveis por crm_settings) ===
      const tplAtivo = String((comIdActive?.value as any)?.message ||
        'Olá{nomeSep}{nome}! 👋\n\nIdentificamos que você possui um *acompanhamento ativo* na STH METHOD.\n\nPara assuntos sobre *dieta, treino, protocolo, exames ou evolução*, utilize uma das opções abaixo:\n\n🟢 Digite *NUTRI*\nou\n🟢 Clique em *Fale com o Nutri*:\n👉 https://wa.me/5521998984153');
      const tplInativoMenu = String((comIdExpired?.value as any)?.message ||
        'Olá{nomeSep}{nome}! 👋\n\nIdentificamos que você já fez parte da STH METHOD.\n\nComo podemos ajudar?\n\n1️⃣ Conhecer os planos\n2️⃣ Formas de pagamento\n3️⃣ Falar com um consultor');
      const tplLeadAskName = String((comIdLead?.value as any)?.message ||
        'Olá! 👋\n\nSeja bem-vindo(a) à *STH METHOD*.\n\nQual é o seu *nome*?');
      const tplLeadMenu = String((leadMenuCfg?.value as any)?.message ||
        'Prazer, {nome}.\n\nComo posso ajudar?\n\n1️⃣ Como funciona\n2️⃣ Conhecer os planos\n3️⃣ Falar com um consultor');
      const tplComoFunciona = String((menu2Cfg?.value as any)?.message ||
        '*Como funciona a STH METHOD* 🧬\n\nA STH METHOD é uma consultoria em performance, saúde e transformação corporal, baseada em ciência e estratégia.\n\n✅ *Plano Alimentar Personalizado*\n✅ *Treino Personalizado*\n✅ *Protocolo Inteligente*\n✅ *Análise de Exames*\n✅ *Acompanhamento Contínuo*\n✅ *Avaliação Mensal*');
      const tplFormasPag = String((formasPagCfg?.value as any)?.message ||
        '*Formas de pagamento* 💳\n\n💳 Cartão de Crédito\n📲 PIX\n💰 Parcelamento disponível conforme o plano\n\n1️⃣ Ver Planos\n2️⃣ Falar com consultor\n0️⃣ Voltar');
      const tplConsultorMsg = String((handoffConsCfg?.value as any)?.message ||
        'Perfeito.\n\nVou encaminhar você para um *consultor* da equipe STH METHOD.\n\nAguarde alguns instantes. 🙏');

      // Imagens opcionais por template
      const imgIdActive = ((comIdActive?.value as any)?.image_url as string | undefined) || null;
      const imgIdExpired = ((comIdExpired?.value as any)?.image_url as string | undefined) || null;
      const imgIdLead = ((comIdLead?.value as any)?.image_url as string | undefined) || null;
      const imgListaPlanos = ((listaPlanosCfg?.value as any)?.image_url as string | undefined) || null;
      const tplListaPlanos = ((listaPlanosCfg?.value as any)?.message as string | undefined) || '';

      // === Lista de planos ativos (deduplicada por duração) ===
      const { data: planList } = await admin.from('plans')
        .select('id, name, price, duration_days')
        .eq('active', true)
        .order('duration_days', { ascending: true });
      const seenDur = new Set<number>();
      const plans = (planList || []).filter((p: any) => {
        if (!p?.duration_days || seenDur.has(p.duration_days)) return false;
        seenDur.add(p.duration_days);
        return true;
      });
      const renderPlanList = (cta: string) => {
        if (!plans.length) {
          return '*Planos STH METHOD* 💎\n\nAcesse https://sthmethod.com.br para conhecer os planos atuais.';
        }
        const lines = plans.map((p: any, i: number) =>
          `${i + 1}️⃣ *${p.name}* — ${p.price} (${p.duration_days} dias) no Pix`);
        const planosTxt = lines.join('\n');
        const tpl = (tplListaPlanos && tplListaPlanos.trim())
          ? tplListaPlanos
          : '*Planos STH METHOD* 💎\n\n{planos}\n\n{cta}\n\n0️⃣ Voltar';
        return tpl
          .replace(/\{planos\}/g, planosTxt)
          .replace(/\{cta\}/g, cta);
      };

      // === Transferência para consultor humano ===
      const handoffConsultor = async () => {
        await admin.from('crm_conversations').update({
          flow_state: 'handoff_consultor',
          human_handoff: true,
        }).eq('id', conv!.id);
        const { data: q } = await admin.from('crm_queues').select('id').eq('name', 'Atendimento Comercial').maybeSingle();
        if (q) {
          const { data: openItem } = await admin.from('crm_queue_items')
            .select('id').eq('conversation_id', conv!.id).is('closed_at', null).maybeSingle();
          if (openItem) {
            await admin.from('crm_queue_items').update({ priority: 0 }).eq('id', openItem.id);
          } else {
            await admin.from('crm_queue_items').insert({
              queue_id: q.id, conversation_id: conv!.id, phone, priority: 0,
            });
          }
        }
        const r = await sendZapiText(renderTpl(tplConsultorMsg), 'handoff_consultor');
        autoReply = { sent: r.sent, engine: 'flow', model: 'handoff_consultor' };
      };

      // === Roteamento ===
      if (!channelEnabled) {
        autoReply = { sent: false, reason: 'channel_disabled' };
      } else if (isHandoff || flowState === 'handoff_consultor' || flowState === 'handoff_nutri') {
        // Atendimento humano em andamento → bot silencioso. Timer suspenso.
        autoReply = { sent: false, reason: 'human_handoff_active' };
      } else if (!flowState) {
        // === 1ª mensagem da sessão → identificação por perfil ===
        if (identifiedAs === 'aluno_ativo') {
          const r = await sendZapiMedia(renderTpl(tplAtivo), imgIdActive, 'id_ativo');
          await admin.from('crm_conversations').update({ flow_state: 'ativo_aguardando_nutri' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'ativo_aguardando_nutri' };
        } else if (identifiedAs === 'aluno_vencido') {
          const r = await sendZapiMedia(renderTpl(tplInativoMenu), imgIdExpired, 'id_inativo');
          await admin.from('crm_conversations').update({ flow_state: 'inativo_main_menu' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'inativo_main_menu' };
        } else {
          const r = await sendZapiMedia(renderTpl(tplLeadAskName), imgIdLead, 'lead_ask_name');
          await admin.from('crm_conversations').update({ flow_state: 'lead_awaiting_name' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'lead_awaiting_name' };
        }
      }
      // === ALUNO ATIVO ===
      else if (flowState === 'ativo_aguardando_nutri') {
        if (/^(nutri|fale com o nutri)$/i.test(trimmed)) {
          const r = await sendZapiText(
            `Perfeito${NOME_SEP}${FIRST_NAME}! Continue o atendimento com o Nutri por aqui:\n👉 https://wa.me/5521998984153`,
            'handoff_nutri',
          );
          await admin.from('crm_conversations').update({
            flow_state: 'handoff_nutri',
            human_handoff: true,
          }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'handoff_nutri' };
        } else {
          const r = await sendZapiMedia(renderTpl(tplAtivo), imgIdActive, 'id_ativo_repeat');
          autoReply = { sent: r.sent, engine: 'flow', model: 'ativo_aguardando_nutri' };
        }
      }
      // === ALUNO INATIVO ===
      else if (flowState === 'inativo_main_menu') {
        if (trimmed === '1') {
          const r = await sendZapiMedia(renderPlanList('Responda com o *número* do plano para gerar seu link de renovação.'), imgListaPlanos, 'inativo_planos');
          await admin.from('crm_conversations').update({ flow_state: 'inativo_awaiting_plan' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'inativo_awaiting_plan' };
        } else if (trimmed === '2') {
          const r = await sendZapiText(tplFormasPag, 'inativo_pag');
          await admin.from('crm_conversations').update({ flow_state: 'inativo_pay_menu' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'inativo_pay_menu' };
        } else if (trimmed === '3') {
          await handoffConsultor();
        } else {
          const r = await sendZapiText(renderTpl(tplInativoMenu), 'id_inativo_repeat');
          autoReply = { sent: r.sent, engine: 'flow', model: 'inativo_main_menu' };
        }
      }
      else if (flowState === 'inativo_awaiting_plan') {
        if (trimmed === '0') {
          const r = await sendZapiMedia(renderTpl(tplInativoMenu), imgIdExpired, 'id_inativo_back');
          await admin.from('crm_conversations').update({ flow_state: 'inativo_main_menu' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'inativo_main_menu' };
        } else if (/^[1-9]$/.test(trimmed) && plans[parseInt(trimmed, 10) - 1]) {
          const chosen: any = plans[parseInt(trimmed, 10) - 1];
          const link = `https://sthmethod.com.br/aluno/renovar?plan=${chosen.id}`;
          const msg = `Perfeito${NOME_SEP}${FIRST_NAME}.\n\nVocê escolheu o plano *${chosen.name}* (${chosen.price}).\n\n🔗 *Link de Renovação:*\n${link}\n\nSeu cadastro já foi localizado em nosso sistema. Após a confirmação do pagamento sua consultoria será reativada.\n\nCaso não localize o cadastro:\n🔗 https://sthmethod.com.br/cadastro\n\n0️⃣ Voltar ao menu`;
          const r = await sendZapiText(msg, 'inativo_renew_link');
          await admin.from('crm_conversations').update({
            flow_state: 'inativo_main_menu',
            flow_context: { ...flowCtx, plano_escolhido: chosen.id },
          }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'inativo_renew_link' };
        } else {
          const r = await sendZapiText('Não entendi sua escolha. Responda com o *número* do plano desejado, ou *0* para voltar.', 'inativo_plan_invalid');
          autoReply = { sent: r.sent, engine: 'flow', model: 'inativo_awaiting_plan' };
        }
      }
      else if (flowState === 'inativo_pay_menu') {
        if (trimmed === '1') {
          const r = await sendZapiMedia(renderPlanList('Responda com o *número* do plano para gerar seu link de renovação.'), imgListaPlanos, 'inativo_planos');
          await admin.from('crm_conversations').update({ flow_state: 'inativo_awaiting_plan' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'inativo_awaiting_plan' };
        } else if (trimmed === '2') {
          await handoffConsultor();
        } else if (trimmed === '0') {
          const r = await sendZapiMedia(renderTpl(tplInativoMenu), imgIdExpired, 'id_inativo_back');
          await admin.from('crm_conversations').update({ flow_state: 'inativo_main_menu' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'inativo_main_menu' };
        } else {
          const r = await sendZapiText(tplFormasPag, 'inativo_pag_repeat');
          autoReply = { sent: r.sent, engine: 'flow', model: 'inativo_pay_menu' };
        }
      }
      // === LEAD ===
      else if (flowState === 'lead_awaiting_name') {
        const captured = trimmed.replace(/[^\p{L}\s'\-]/gu, '').trim().slice(0, 40);
        const firstWord = (captured.split(/\s+/)[0] || 'amigo(a)').slice(0, 24);
        const newCtx = { ...flowCtx, nome: firstWord };
        const upd: any = {
          flow_state: 'lead_main_menu',
          flow_context: newCtx,
        };
        if (captured) upd.display_name = captured;
        await admin.from('crm_conversations').update(upd).eq('id', conv!.id);
        const r = await sendZapiText(renderTpl(tplLeadMenu, { nome: firstWord }), 'lead_main_menu');
        autoReply = { sent: r.sent, engine: 'flow', model: 'lead_main_menu' };
      }
      else if (flowState === 'lead_main_menu') {
        const leadName = (flowCtx?.nome as string) || FIRST_NAME;
        if (trimmed === '1') {
          const r = await sendZapiText(
            renderTpl(tplComoFunciona, { nome: leadName }) + '\n\n1️⃣ Conhecer os planos\n2️⃣ Falar com consultor\n0️⃣ Voltar',
            'lead_como_funciona',
          );
          await admin.from('crm_conversations').update({ flow_state: 'lead_como_funciona' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'lead_como_funciona' };
        } else if (trimmed === '2') {
          const r = await sendZapiMedia(renderPlanList('Responda com o *número* do plano escolhido.'), imgListaPlanos, 'lead_planos');
          await admin.from('crm_conversations').update({ flow_state: 'lead_awaiting_plan' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'lead_awaiting_plan' };
        } else if (trimmed === '3') {
          await handoffConsultor();
        } else {
          const r = await sendZapiText(renderTpl(tplLeadMenu, { nome: leadName }), 'lead_main_menu_repeat');
          autoReply = { sent: r.sent, engine: 'flow', model: 'lead_main_menu' };
        }
      }
      else if (flowState === 'lead_como_funciona') {
        const leadName = (flowCtx?.nome as string) || FIRST_NAME;
        if (trimmed === '1') {
          const r = await sendZapiMedia(renderPlanList('Responda com o *número* do plano escolhido.'), imgListaPlanos, 'lead_planos');
          await admin.from('crm_conversations').update({ flow_state: 'lead_awaiting_plan' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'lead_awaiting_plan' };
        } else if (trimmed === '2') {
          await handoffConsultor();
        } else if (trimmed === '0') {
          const r = await sendZapiText(renderTpl(tplLeadMenu, { nome: leadName }), 'lead_main_menu_back');
          await admin.from('crm_conversations').update({ flow_state: 'lead_main_menu' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'lead_main_menu' };
        } else {
          const r = await sendZapiText('Responda: *1* Conhecer planos · *2* Falar com consultor · *0* Voltar.', 'lead_como_funciona_repeat');
          autoReply = { sent: r.sent, engine: 'flow', model: 'lead_como_funciona' };
        }
      }
      else if (flowState === 'lead_awaiting_plan') {
        const leadName = (flowCtx?.nome as string) || FIRST_NAME;
        if (trimmed === '0') {
          const r = await sendZapiText(renderTpl(tplLeadMenu, { nome: leadName }), 'lead_main_menu_back');
          await admin.from('crm_conversations').update({ flow_state: 'lead_main_menu' }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'lead_main_menu' };
        } else if (/^[1-9]$/.test(trimmed) && plans[parseInt(trimmed, 10) - 1]) {
          const chosen: any = plans[parseInt(trimmed, 10) - 1];
          const msg = `Excelente escolha, ${leadName}.\n\nVocê escolheu o plano *${chosen.name}* (${chosen.price}).\n\nPara iniciar seu acompanhamento:\n🔗 https://sthmethod.com.br/cadastro\n\nApós finalizar o cadastro nossa equipe continuará seu atendimento.\n\n0️⃣ Voltar ao menu`;
          const r = await sendZapiText(msg, 'lead_cadastro_link');
          await admin.from('crm_conversations').update({
            flow_state: 'lead_main_menu',
            flow_context: { ...flowCtx, plano_escolhido: chosen.id },
          }).eq('id', conv!.id);
          autoReply = { sent: r.sent, engine: 'flow', model: 'lead_cadastro_link' };
        } else {
          const r = await sendZapiText('Não entendi sua escolha. Responda com o *número* do plano, ou *0* para voltar.', 'lead_plan_invalid');
          autoReply = { sent: r.sent, engine: 'flow', model: 'lead_awaiting_plan' };
        }
      }
      else {
        // Estado desconhecido → reseta
        await admin.from('crm_conversations').update({ flow_state: null }).eq('id', conv!.id);
        autoReply = { sent: false, reason: 'unknown_state_reset' };
      }

      return new Response(
        JSON.stringify({ ok: true, queue: finalQueue, is_lead: isLead, tags: tagsToApply, auto_reply: autoReply, flow_state: flowState }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ============================================================
    // === Canal Nutri (W-API) — comportamento original ===========
    // ============================================================
    // Fora do horário → mensagem de ausência (só 1x por sessão).
    // Aluno ativo recebe mensagem priorizada; lead/vencido é direcionado ao Comercial.
    if (provider === 'wapi' && !withinHours && channelEnabled) {
      const isFirstOfSession = isNewSession;
      if (isFirstOfSession) {
        const tplVal = identifiedAs === 'aluno_ativo'
          ? (nutriAwayActive?.value as any)?.message
          : (nutriAwayInactive?.value as any)?.message;
        const firstName = (displayName || profile?.full_name || '').toString().split(' ')[0] || 'Aluno';
        const awayMessage = String(tplVal || '').replace(/\{nome\}/gi, firstName);
        if (awayMessage) {
          try {
            const { data: sendData, error: sendError } = await admin.functions.invoke('send-wapi', {
              body: { phone, message: awayMessage },
            });
            if (sendError) throw sendError;
            await admin.from('crm_messages').insert({
              conversation_id: conv!.id,
              direction: 'out',
              body: awayMessage,
              source: 'wapi',
              external_id: sendData?.messageId || null,
              status: sendData?.ok ? 'sent' : 'failed',
            });
            autoReply = { sent: !!sendData?.ok, engine: 'away', model: `nutri_away_${identifiedAs}` };
          } catch (e) {
            console.error('nutri away message failed', e);
            autoReply = { sent: false, reason: String(e) };
          }
        }
      } else {
        autoReply = { sent: false, reason: 'out_of_hours_silent_after_first' };
      }
    }
    else if (aiMode === 'auto' && channelEnabled) {
      try {
        const ai = await generateAiReply({ admin, conversationId: conv!.id, phone });
        if (ai.response?.trim()) {
          const fnName = provider === 'wapi' ? 'send-wapi' : 'send-whatsapp';
          const { data: sendData, error: sendError } = await admin.functions.invoke(fnName, {
            body: { phone, message: ai.response.trim() },
          });

          if (sendError) throw sendError;
          if (!sendData?.ok) throw new Error(sendData?.error || 'Falha no envio automático');

          await admin.from('crm_messages').insert({
            conversation_id: conv!.id,
            direction: 'out',
            body: ai.response.trim(),
            source: provider === 'zapi' ? 'zapi' : 'wapi',
            external_id: sendData?.messageId || null,
            status: 'sent',
          });

          autoReply = { sent: true, engine: ai.engine, model: ai.model };
        }
      } catch (autoErr) {
        console.error('crm-inbound-webhook auto-reply', autoErr);
        autoReply = { sent: false, reason: String(autoErr) };
      }
    }

    return new Response(JSON.stringify({ ok: true, queue: finalQueue, is_lead: isLead, tags: tagsToApply, auto_reply: autoReply }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('crm-inbound-webhook', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});