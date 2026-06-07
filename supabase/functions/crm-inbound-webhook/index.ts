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
    return 'Perfeito! O canal exclusivo para alunos ativos é o Sucesso do Aluno: https://wa.me/5521972486650';
  }
  return 'Recebi sua mensagem. Para te ajudar melhor, responda com 1️⃣ Planos, 2️⃣ Como funciona, 3️⃣ Falar com consultor ou 4️⃣ Já sou aluno.';
}

async function generateAiReply({
  admin,
  conversationId,
  phone,
  queue = 'comercial',
}: {
  admin: ReturnType<typeof createClient>;
  conversationId: string;
  phone: string;
  queue?: string;
}): Promise<{ response: string; model: string; engine: string }> {
  let systemPrompt = 'Você é um assistente de atendimento ao aluno da consultoria STH METHOD. Seja claro, técnico, neutro e cordial. Responda em português do Brasil.';
  let engine: 'lovable' | 'local' | 'gemini_api' = 'lovable';

  const promptKey = queue === 'sucesso' ? 'ai_prompt_sucesso' : 'ai_prompt_comercial';
  
  const [{ data: cfg }, { data: engCfg }] = await Promise.all([
    admin.from('crm_settings').select('value').eq('key', promptKey).maybeSingle(),
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

  const [{ data: msgs }, profile] = await Promise.all([
    admin
      .from('crm_messages')
      .select('direction, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10),
    findProfileByPhone(admin, phone, 'full_name, objective, weight, phone'),
  ]);

  const history = (msgs || [])
    .reverse()
    .map((m: any) => `${m.direction === 'in' ? 'Aluno' : 'Atendente'}: ${m.body}`)
    .join('\n');

  let context = history ? `Histórico recente da conversa:\n${history}\n\n` : '';
  if (profile) {
    context += `Aluno: ${profile.full_name} | Objetivo: ${profile.objective || '—'} | Peso: ${profile.weight || '—'}kg\n\n`;
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

function normalizePhone(raw: string): string {
  let d = String(raw || '').replace(/\D+/g, '').replace(/^0+/, '');
  if (d.length >= 12 && d.startsWith('55')) return d;
  if (d.length === 10 || d.length === 11) return '55' + d;
  return d;
}

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

function digitsOnly(raw: string | null | undefined): string {
  return String(raw || '').replace(/\D+/g, '').replace(/^0+/, '');
}

function phoneMatchScore(candidatePhone: string | null | undefined, targetPhone: string): number {
  const candidate = digitsOnly(candidatePhone);
  const target = digitsOnly(targetPhone);
  if (!candidate || !target) return 0;
  if (candidate === target) return 100;
  if (candidate.length >= 11 && target.length >= 11 && candidate.slice(-11) === target.slice(-11)) return 80;
  if (candidate.length >= 10 && target.length >= 10 && candidate.slice(-10) === target.slice(-10)) return 60;
  return 0;
}

function buildPhoneSearchPatterns(phone: string): string[] {
  const patterns = new Set<string>();

  for (const variant of phoneCandidates(phone)) {
    const digits = digitsOnly(variant);
    const local = digits.startsWith('55') ? digits.slice(2) : digits;
    if (local.length < 10) continue;

    const ddd = local.slice(0, 2);
    const middle = local.slice(2, -4);
    const last4 = local.slice(-4);

    patterns.add(`%${ddd}%${middle}%${last4}%`);
    patterns.add(`%${middle}%${last4}%`);
  }

  return Array.from(patterns);
}

async function findProfileByPhone(admin: ReturnType<typeof createClient>, phone: string, selectFields: string) {
  const patterns = buildPhoneSearchPatterns(phone);
  if (!patterns.length) return null;

  let query = admin.from('profiles').select(selectFields).not('phone', 'is', null);
  query = query.or(patterns.map((pattern) => `phone.ilike.${pattern}`).join(','));

  const { data, error } = await query.limit(20);
  if (error) throw error;

  const ranked = (data || [])
    .map((row: any) => ({ ...row, _score: phoneMatchScore(row.phone, phone), _digits: digitsOnly(row.phone) }))
    .filter((row: any) => row._score > 0)
    .sort((a: any, b: any) => b._score - a._score || b._digits.length - a._digits.length);

  return ranked[0] ?? null;
}

function classify(text: string): { queue: 'comercial'|'nutri'|'sucesso'|'financeiro'|null; nutriCategory: string | null; tags: string[] } {
  const t = String(text || '').toLowerCase();
  const tags: string[] = [];
  let queue: any = null;
  let nutriCategory: string | null = null;
  const has = (...kw: string[]) => kw.some(k => t.includes(k));

  if (has('cobran', 'pagamento', 'pagar', 'pix', 'boleto', 'comprovante', 'fatura', 'cartao', 'cartão', 'financeiro', 'vencido')) {
    queue = 'sucesso'; tags.push('FINANCEIRO','PAGAMENTO');
  }
  else if (has('renovar', 'renovação', 'renovacao', 'reativar', 'renova')) {
    queue = 'sucesso'; tags.push('RENOVACAO');
  }
  else if (has('peso', 'medidas', 'foto', 'evolução', 'evolucao', 'atualização', 'atualizacao', 'progresso', 'exame', 'exames')) {
    queue = 'sucesso'; tags.push('SUCESSO','ATUALIZACAO');
  }
  else if (has('preço','preco','plano','planos','contratar','assinar','quero entrar','quero começar','quero comecar','quanto custa','valor','valores')) {
    queue = 'comercial'; tags.push('COMERCIAL','INTERESSE');
  }
  else if (has('dieta','refeição','refeicao','cardápio','cardapio','calorias','macros')) {
    queue = 'nutri'; nutriCategory = 'Dieta'; tags.push('NUTRI','DIETA');
  }
  else if (has('treino','exercicio','exercício','série','serie','academia','musculação','musculacao')) {
    queue = 'nutri'; nutriCategory = 'Treino'; tags.push('NUTRI','TREINO');
  }
  else if (has('protocolo','suplemento','hormonio','hormônio','peptide','peptideo','peptídeo','ciclo')) {
    queue = 'nutri'; nutriCategory = 'Protocolo'; tags.push('NUTRI','PROTOCOLO');
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
    const requestedProvider = (url.searchParams.get('provider') || '').toLowerCase();
    const expectedSecret = Deno.env.get('MP_WEBHOOK_SECRET') || '';
    const provided = req.headers.get('x-webhook-secret') || url.searchParams.get('secret') || '';
    
    let payload: any;
    try {
      payload = await req.json();
    } catch (e) {
      console.error('Failed to parse JSON payload:', e);
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'invalid_json' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const payloadInstance = String(payload?.instanceId || payload?.instance_id || payload?.instance || payload?.data?.instanceId || '').trim();
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const [{ data: wapiCfgRow }, { data: wapiSucessoCfgRow }, { data: zapiCfgRow }] = await Promise.all([
      admin.from('crm_settings').select('value').eq('key', 'wapi').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'wapi_sucesso').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'zapi').maybeSingle(),
    ]);

    const configuredInstances = {
      zapi: String((zapiCfgRow?.value as any)?.instance_id || Deno.env.get('ZAPI_INSTANCE_ID') || '').trim(),
      wapi: String((wapiCfgRow?.value as any)?.instance_id || Deno.env.get('WAPI_INSTANCE_ID') || '').trim(),
      wapi_sucesso: String((wapiSucessoCfgRow?.value as any)?.instance_id || '').trim(),
    };

    let provider = requestedProvider || 'wapi';
    if (payloadInstance) {
      if (payloadInstance === configuredInstances.zapi) provider = 'zapi';
      else if (payloadInstance === configuredInstances.wapi_sucesso) provider = 'wapi_sucesso';
      else if (payloadInstance === configuredInstances.wapi) provider = 'wapi';
    }

    console.log(`Incoming webhook from ${provider}:`, JSON.stringify(payload));

    const isZapiMatch = payloadInstance && payloadInstance === configuredInstances.zapi;
    const isWapiMatch = payloadInstance && (payloadInstance === configuredInstances.wapi || payloadInstance === configuredInstances.wapi_sucesso);
    const secretOk = expectedSecret && provided === expectedSecret;
    
    if (expectedSecret && !secretOk && !isZapiMatch && !isWapiMatch) {
      console.error(`Invalid secret or instance. Secret: ${provided}, Instance: ${payloadInstance}, Requested provider: ${requestedProvider || 'none'}, Resolved provider: ${provider}`);
    }



    const phoneRaw = payload?.data?.from || payload?.phone || payload?.from || payload?.message?.from || payload?.sender?.id || '';
    const rawText = payload?.data?.body || (typeof payload?.text === 'string' ? payload.text : payload?.text?.message) || payload?.message?.conversation || (typeof payload?.message === 'string' ? payload.message : '') || payload?.image?.caption || payload?.video?.caption || payload?.document?.caption || payload?.body || payload?.data?.message?.text || payload?.msgContent?.conversation || '';
    const body = typeof rawText === 'string' ? rawText : '';
    const externalId = payload?.messageId || payload?.id || null;
    const name = payload?.senderName || payload?.pushName || payload?.sender?.pushName || null;

    if (payload?.fromMe === true || payload?.from_me === true || payload?.isGroup === true || payload?.is_group === true || String(phoneRaw).startsWith('120363') || String(phoneRaw).includes('-') || String(phoneRaw).includes('@g.us')) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const phone = normalizePhone(phoneRaw);
    if (!phone || !body) return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // OPT-OUT and MANUAL CLOSE
    const normalizedBody = String(body).trim().toUpperCase();
    if (/\bCANCELAR\s+ENVIO\b/.test(normalizedBody) || /^VOLTAR$/.test(normalizedBody) || normalizedBody === '#SAIR' || normalizedBody === '#ENCERRAR') {
      const isOptOut = /\bCANCELAR\s+ENVIO\b/.test(normalizedBody);
      const isManualClose = normalizedBody === '#SAIR' || normalizedBody === '#ENCERRAR';
      
      const profile = await findProfileByPhone(admin, phone, 'user_id, full_name, phone');
      
      if (isManualClose) {
        const { data: conv } = await admin.from('crm_conversations').select('id').eq('phone', phone).maybeSingle();
        if (conv) {
          const farewellMsg = "Atendimento encerrado com sucesso. Caso precise de algo mais, estamos à disposição! 👋";
          
          // Enviar mensagem de despedida
          if (provider === 'zapi') {
            const c = (zapiCfgRow?.value as any) || {};
            const INSTANCE_ID = (c.instance_id || Deno.env.get('ZAPI_INSTANCE_ID') || '').trim();
            const INSTANCE_TOKEN = (c.instance_token || Deno.env.get('ZAPI_INSTANCE_TOKEN') || '').trim();
            const CLIENT_TOKEN = (c.client_token || Deno.env.get('ZAPI_CLIENT_TOKEN') || '').trim();
            if (INSTANCE_ID && INSTANCE_TOKEN) {
              await fetch(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(CLIENT_TOKEN ? { 'Client-Token': CLIENT_TOKEN } : {}) },
                body: JSON.stringify({ phone, message: farewellMsg }),
              });
            }
          } else {
            const fnName = provider === 'wapi_sucesso' ? 'send-wapi-sucesso' : 'send-wapi';
            await admin.functions.invoke(fnName, { body: { phone, message: farewellMsg } });
          }

          await admin.from('crm_messages').insert({ conversation_id: conv.id, direction: 'out', body: farewellMsg, source: provider, status: 'sent', metadata: { type: 'manual_close' } });
          await admin.from('crm_conversations').update({ 
            status: 'closed', 
            human_handoff: false, 
            assigned_to: null,
            flow_state: null,
            flow_context: {},
            session_expires_at: new Date().toISOString() 
          }).eq('id', conv.id);
        }
        return new Response(JSON.stringify({ ok: true, manual_close: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (profile?.user_id) {
        await admin.from('profiles').update({ whatsapp_opt_out: isOptOut, whatsapp_opt_out_at: isOptOut ? new Date().toISOString() : null }).eq('user_id', profile.user_id);
      }
      return new Response(JSON.stringify({ ok: true, opt_out: isOptOut }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const [{ data: aiModeCfg }, { data: wapiCfg }, { data: zapiCfg }, { data: wapiSucessoCfg }, { data: hoursComCfg }, { data: hoursNutriCfg }, { data: hoursSucessoCfg }, { data: nutriAwayActive }, { data: nutriAwayInactive }, { data: comAwayLead }, { data: comAwayActive }, { data: comAwayExpired }, { data: flowSteps }] = await Promise.all([
      admin.from('crm_settings').select('value').eq('key', 'ai_mode').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'wapi').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'zapi').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'wapi_sucesso').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'business_hours_comercial').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'business_hours_nutri').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'business_hours_sucesso').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'nutri_away_active').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'nutri_away_inactive').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'comercial_away_lead').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'comercial_away_active').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'comercial_away_expired').maybeSingle(),
      admin.from('crm_flow_steps').select('*'),
    ]);

    const getFlowStep = (key: string) => (flowSteps || []).find(s => s.key === key);
    const channelHours = provider === 'wapi_sucesso' ? hoursSucessoCfg?.value : (provider === 'wapi' ? hoursNutriCfg?.value : hoursComCfg?.value);
    const withinHours = isWithinBusinessHours(channelHours);
    
    // NOVO: Redirecionamento automático para Sucesso do Aluno quando fora do horário comercial
    let forceSucessoQueue = false;
    let redirectToSucessoNumber = false;
    if (!withinHours && provider === 'zapi') {
      forceSucessoQueue = true;
      redirectToSucessoNumber = true;
    }

    const profile = await findProfileByPhone(admin, phone, 'user_id, full_name, objective, phone');
    let displayName = name || profile?.full_name || null;
    let identifiedAs: 'aluno_ativo' | 'aluno_vencido' | 'lead' | 'ex_aluno' = 'lead';

    if (profile) {
      const { data: subs } = await admin.from('subscriptions').select('end_date').eq('user_id', profile.user_id).order('end_date', { ascending: false }).limit(1);
      const sub = subs?.[0];
      if (sub) {
        const days = Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000);
        if (days < -365) identifiedAs = 'ex_aluno';
        else if (days < 0) identifiedAs = 'aluno_vencido';
        else identifiedAs = 'aluno_ativo';
      }
    }

    const cls = classify(body);
    let finalQueue = cls.queue || (provider === 'zapi' ? 'comercial' : 'nutri');
    if ((identifiedAs !== 'lead' && provider === 'zapi') || forceSucessoQueue) finalQueue = 'sucesso';

    const [{ data: sessionTimeoutCfg }, { data: farewellMsgCfg }] = await Promise.all([
      admin.from('crm_settings').select('value').eq('key', 'session_timeout_minutes').maybeSingle(),
      admin.from('crm_settings').select('value').eq('key', 'farewell_message').maybeSingle(),
    ]);

    const timeoutMinutes = (sessionTimeoutCfg?.value as any)?.minutes || 120;
    const farewellMessage = (farewellMsgCfg?.value as any)?.message || 'Atendimento encerrado por inatividade. Caso precise, envie uma nova mensagem.';

    const SESSION_TTL_MS = timeoutMinutes * 60 * 1000;
    const now = new Date();
    const sessionExpiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    let { data: conv } = await admin.from('crm_conversations').select('*').eq('phone', phone).maybeSingle();
    const isExpired = conv?.session_expires_at && new Date(conv.session_expires_at).getTime() < now.getTime();
    
    // CRITICAL FIX: If human is active, prevent session reset/expiry logic that could re-enable the bot
    const isHumanActive = conv?.human_handoff === true || !!conv?.assigned_to;
    const isNewSession = !conv || conv.status === 'closed' || (isExpired && !isHumanActive);

    if (!conv) {
      const ins = await admin.from('crm_conversations').insert({ phone, display_name: displayName, channel: 'whatsapp', status: 'open', provider, queue_type: finalQueue, nutri_category: cls.nutriCategory, is_lead: identifiedAs === 'lead', user_id: profile?.user_id, identified_as: identifiedAs, session_started_at: now.toISOString(), session_expires_at: sessionExpiresAt.toISOString(), session_count: 1 }).select('*').single();
      conv = ins.data;
    } else {
      if (isExpired && conv.status === 'open' && !isHumanActive) {
        // Enviar despedida por timeout se estava aberto e não é atendimento humano
        const fnName = provider === 'wapi_sucesso' ? 'send-wapi-sucesso' : (provider === 'zapi' ? null : 'send-wapi');
        if (fnName) {
          await admin.functions.invoke(fnName, { body: { phone, message: farewellMessage } });
        }
        await admin.from('crm_messages').insert({ conversation_id: conv.id, direction: 'out', body: farewellMessage, source: provider, status: 'sent', metadata: { type: 'timeout_farewell' } });
      }

      const upd: any = { provider, queue_type: finalQueue, nutri_category: cls.nutriCategory, session_expires_at: sessionExpiresAt.toISOString(), status: 'open', is_lead: identifiedAs === 'lead', user_id: profile?.user_id, identified_as: identifiedAs };
      
      if (isNewSession) { 
        upd.session_started_at = now.toISOString(); 
        upd.session_count = (conv.session_count || 0) + 1; 
        upd.flow_state = null; 
        upd.flow_context = {}; 
        
        // Se a conversa estava fechada ou expirou sem um atendente fixo (e não é humano ativo), resetamos para o bot
        if (conv.status === 'closed' || !conv.assigned_to) {
          upd.human_handoff = false; 
          upd.assigned_to = null;
        }
      } else if (isHumanActive) {
        // Se humano está ativo, garantimos que human_handoff permaneça true mesmo se houver nova mensagem
        upd.human_handoff = true;
      }

      if (displayName) upd.display_name = displayName;
      await admin.from('crm_conversations').update(upd).eq('id', conv.id);
      conv = { ...conv, ...upd };
    }

    await admin.from('crm_messages').insert({ conversation_id: conv.id, direction: 'in', body: String(body), source: provider, external_id: externalId, status: 'received' });

    const FIRST_NAME = (displayName || profile?.full_name || '').toString().split(' ')[0] || '';
    const renderTpl = (s: string, extra: Record<string, string> = {}) => {
      let out = String(s || '')
        .replace(/\\n/g, '\n') // Fix literal \n strings to real newlines
        .replace(/\{nome\}/gi, extra.nome || FIRST_NAME)
        .replace(/\{nomeSep\}/gi, (extra.nome || FIRST_NAME) ? ' ' : '');
      for (const [k, v] of Object.entries(extra)) if (k !== 'nome') out = out.replace(new RegExp(`\\{${k}\\}`, 'gi'), String(v ?? ''));
      return out;
    };

    const sendMessage = async (message: string, tag: string, imageUrl?: string | null, targetProvider?: string) => {
      const tplMessage = renderTpl(message);
      let sent = false; let messageId: string | null = null;
      const activeProvider = targetProvider || provider;
      
      if (activeProvider === 'zapi') {
        const c = (zapiCfg?.value as any) || {};
        const INSTANCE_ID = (c.instance_id || Deno.env.get('ZAPI_INSTANCE_ID') || '').trim();
        const INSTANCE_TOKEN = (c.instance_token || Deno.env.get('ZAPI_INSTANCE_TOKEN') || '').trim();
        const CLIENT_TOKEN = (c.client_token || Deno.env.get('ZAPI_CLIENT_TOKEN') || '').trim();
        if (INSTANCE_ID && INSTANCE_TOKEN) {
          const isPdf = String(imageUrl || '').toLowerCase().includes('.pdf');
          const endpoint = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-${imageUrl ? (isPdf ? 'document' : 'image') : 'text'}`;
          const bodyPayload: any = { phone, message: tplMessage };
          if (imageUrl) { if (isPdf) { bodyPayload.document = imageUrl; bodyPayload.fileName = 'documento.pdf'; bodyPayload.caption = tplMessage; } else { bodyPayload.image = imageUrl; bodyPayload.caption = tplMessage; } }
          const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(CLIENT_TOKEN ? { 'Client-Token': CLIENT_TOKEN } : {}) }, body: JSON.stringify(bodyPayload) });
          const j = await r.json().catch(() => ({})); sent = r.ok; messageId = j?.messageId || j?.id || null;
        }
      } else {
        const fnName = activeProvider === 'wapi_sucesso' ? 'send-wapi-sucesso' : 'send-wapi';
        console.log(`Invoking ${fnName} for phone ${phone}`);
        const { data, error } = await admin.functions.invoke(fnName, { body: { phone, message: tplMessage, image_url: imageUrl } });
        console.log(`Response from ${fnName}:`, { data, error });
        if (!error && (data?.ok || data?.messageId)) { sent = true; messageId = data.messageId || data?.id; }
      }
      if (sent) {
        await admin.from('crm_messages').insert({ conversation_id: conv.id, direction: 'out', body: tplMessage, source: activeProvider, external_id: messageId, status: 'sent', metadata: { tag } });
        await admin.from('crm_conversations').update({ last_bot_message_at: new Date().toISOString(), inactivity_warned_at: null }).eq('id', conv.id);
      }
      return { sent, messageId, tag };
    };

    const handoffConsultor = async () => {
      await admin.from('crm_conversations').update({ flow_state: 'handoff_consultor', human_handoff: true }).eq('id', conv.id);
      const qName = provider === 'wapi' ? 'Dieta' : (provider === 'wapi_sucesso' ? 'Sucesso do Aluno' : 'Atendimento Comercial');
      const { data: q } = await admin.from('crm_queues').select('id').eq('name', qName).maybeSingle();
      if (q) {
        const { data: open } = await admin.from('crm_queue_items').select('id').eq('conversation_id', conv.id).is('closed_at', null).maybeSingle();
        if (open) await admin.from('crm_queue_items').update({ priority: 0 }).eq('id', open.id);
        else await admin.from('crm_queue_items').insert({ queue_id: q.id, conversation_id: conv.id, phone, priority: 0 });
      }
      const r = await sendMessage(String(getFlowStep('comercial_handoff_consultor')?.message || 'Vou te encaminhar para um consultor da equipe STH Method. Aguarde alguns instantes. 🙏'), 'handoff_consultor');
      return { sent: r.sent, engine: 'flow', model: 'handoff_consultor' };
    };

    let autoReply: any;
    const channelEnabled = provider === 'wapi' ? (wapiCfg?.value as any)?.enabled === true : (provider === 'wapi_sucesso' ? (wapiSucessoCfg?.value as any)?.enabled === true : (zapiCfg?.value as any)?.enabled === true);

    // Se houver atendente humano ou flag de handoff, ignoramos mensagens automáticas de fluxo,
    // MAS ainda enviamos mensagem de ausência se estiver fora do horário de expediente.
    const isChannelEnabled = channelEnabled;

    if (!isChannelEnabled) {
      autoReply = { sent: false, reason: 'disabled' };
    } else if (!withinHours) {
      // Fora do horário de expediente: enviar mensagem de ausência se for nova sessão 
      // ou se não enviamos uma mensagem de ausência recentemente (últimas 4 horas)
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const { data: lastAwayMsg } = await admin.from('crm_messages')
        .select('id')
        .eq('conversation_id', conv.id)
        .eq('direction', 'out')
        .gt('created_at', fourHoursAgo)
        .or('metadata->>tag.eq.away,metadata->>tag.eq.away_redirect,body.ilike.%fora do horário%,body.ilike.%expediente%')
        .maybeSingle();

      if (isNewSession || forceSucessoQueue || !lastAwayMsg) {
        let msg = '';
        if (provider === 'zapi') {
          // Comercial (Z-API)
          if (forceSucessoQueue) {
            msg = "No momento estamos fora do horário de expediente no canal Comercial.\n\nPara um atendimento automatizado agora, por favor acesse nosso canal de Sucesso do Aluno: https://wa.me/5521972486650\n\nEstamos encerrando este atendimento aqui para você seguir por lá! 👋";
            const r = await sendMessage(msg, 'away_redirect');
            await admin.from('crm_conversations').update({ 
              status: 'closed', 
              human_handoff: false, 
              assigned_to: null,
              flow_state: null,
              flow_context: {},
              session_expires_at: new Date().toISOString() 
            }).eq('id', conv.id);
            autoReply = { sent: r.sent, engine: 'away_redirect' };
            msg = ''; 
          } else {
            if (identifiedAs === 'lead') msg = comAwayLead?.value?.message || "Olá! No momento estamos fora do horário de expediente no canal Comercial.\n\nPara conhecer nossos planos e contratar agora mesmo de forma 100% automatizada, acesse nosso site:\n\n🌐 Site: https://sthmethod.com.br\n\nResponderemos sua mensagem assim que retornarmos! 👋";
            else if (identifiedAs === 'aluno_ativo') msg = comAwayActive?.value?.message || "Olá! No momento estamos fora do horário de expediente no canal Comercial. Como você é um aluno ativo, você pode tirar dúvidas técnicas diretamente com seu Nutri ou tratar assuntos administrativos no Sucesso do Aluno:\n\n🍎 Fale com o Nutri: https://wa.me/5521972486650\n🎓 Sucesso do Aluno: https://wa.me/5521972486650\n\nResponderemos assim que retornarmos! 👋";
            else msg = comAwayExpired?.value?.message || "Olá! No momento estamos fora do horário de expediente.\n\nLocalizamos seu cadastro e vimos que seu plano está inativo. Para renovar agora de forma 100% automatizada, utilize os links abaixo:\n\n🔗 Renovação: https://sthmethod.com.br/renovacao\n🌐 Site: https://sthmethod.com.br\n\nResponderemos sua mensagem assim que retornarmos! 👋";
          }
        } else if (provider === 'wapi_sucesso') {
          // Sucesso do Aluno (W-API Sucesso)
          msg = "Olá! No momento estamos fora do horário de expediente no canal Sucesso do Aluno.\n\nPara um autoatendimento rápido, você pode utilizar as opções abaixo:\n\n1️⃣ Atualizar Peso/Medidas (App)\n2️⃣ Renovação de Plano: https://sthmethod.com.br/renovacao\n3️⃣ Financeiro/Pagamentos: https://sthmethod.com.br/financeiro\n\nDeixe sua mensagem e responderemos assim que retornarmos! 👋";
        } else {
          // Fale com o Nutri (W-API)
          if (identifiedAs === 'aluno_ativo') msg = nutriAwayActive?.value?.message || "Olá! No momento estamos fora do horário de expediente no canal Fale com o Nutri. Deixe sua dúvida técnica e responderemos assim que retornarmos! 👋";
          else msg = nutriAwayInactive?.value?.message || "No momento estamos fora do horário de expediente no canal Fale com o Nutri.\n\nIdentificamos que seu plano não está ativo. Você pode realizar sua renovação agora mesmo de forma automática pelo link abaixo:\n\n🔗 Renovação: https://sthmethod.com.br/renovacao\n🌐 Site: https://sthmethod.com.br\n\nPara outros assuntos, acesse nosso canal de Sucesso do Aluno: https://wa.me/5521972486650";
        }
        if (msg) { 
          const r = await sendMessage(msg, 'away'); 
          autoReply = { sent: r.sent, engine: 'away' }; 
        }
      } else {
        autoReply = { sent: false, reason: 'away_already_sent' };
      }
    } else if (conv.human_handoff === true || !!conv.assigned_to) {
      console.log(`Human active on conversation ${conv.id} (assigned: ${conv.assigned_to}, handoff: ${conv.human_handoff}). Skipping auto-replies.`);
      autoReply = { sent: false, reason: 'human_active' };
    } else if (!conv.flow_state) {
      if (provider === 'wapi') {
        if (identifiedAs === 'lead') {
          const r = await sendMessage(String(getFlowStep('nutri_ident_lead')?.message || 'Identificamos que você ainda não possui uma consultoria ativa...'), 'nutri_ident_lead');
          autoReply = { sent: r.sent, engine: 'flow' };
        } else if (identifiedAs === 'aluno_vencido' || identifiedAs === 'ex_aluno') {
          const step = identifiedAs === 'aluno_vencido' ? 'nutri_ident_inativo' : 'nutri_ident_exaluno';
          const r = await sendMessage(String(getFlowStep(step)?.message || 'Localizamos seu cadastro, porém sua consultoria encontra-se inativa...'), step);
          autoReply = { sent: r.sent, engine: 'flow' };
        } else {
          const r = await sendMessage(String(getFlowStep('nutri_reception')?.message || 'Olá! Você está no canal Fale com o Nutri...'), 'nutri_reception');
          await admin.from('crm_conversations').update({ flow_state: 'nutri_main' }).eq('id', conv.id);
          autoReply = { sent: r.sent, engine: 'flow' };
        }
      } else if (provider === 'wapi_sucesso') {
        const r = await sendMessage(String(getFlowStep('sucesso_main_menu')?.message || 'Bem-vindo ao Sucesso do Aluno...'), 'sucesso_main_menu');
        await admin.from('crm_conversations').update({ flow_state: 'sucesso_main_menu', queue_type: 'sucesso' }).eq('id', conv.id);
        autoReply = { sent: r.sent, engine: 'flow' };
      } else {
        if (identifiedAs !== 'lead') {
          const step = identifiedAs === 'aluno_ativo' ? 'comercial_ident_ativo' : (identifiedAs === 'aluno_vencido' ? 'comercial_ident_inativo' : 'comercial_ident_exaluno');
          await sendMessage(String(getFlowStep(step)?.message || 'Redirecionando para Sucesso...'), step);
          const r = await sendMessage(String(getFlowStep('sucesso_main_menu')?.message || 'Bem-vindo ao Sucesso do Aluno...'), 'sucesso_main_menu');
          await admin.from('crm_conversations').update({ flow_state: 'sucesso_main_menu', queue_type: 'sucesso' }).eq('id', conv.id);
          autoReply = { sent: r.sent, engine: 'flow' };
        } else {
          const r = await sendMessage(String(getFlowStep('comercial_saudacao_lead')?.message || 'Seja bem-vindo à STH Method...'), 'comercial_saudacao_lead');
          await admin.from('crm_conversations').update({ flow_state: 'lead_main_menu' }).eq('id', conv.id);
          autoReply = { sent: r.sent, engine: 'flow' };
        }
      }
    } else if (conv.flow_state === 'nutri_main') {
      const has = (...kw: string[]) => kw.some(k => body.toLowerCase().includes(k));
      if (has('renov', 'pagamento', 'pagar', 'cobran', 'segunda via', 'cadastro', 'senha', 'acesso', 'contrato', 'reativar')) {
        const r = await sendMessage(String(getFlowStep('nutri_transfer_sucesso')?.message || 'Sua solicitação é administrativa. Redirecionando para Sucesso...'), 'nutri_transfer_sucesso');
        await admin.from('crm_conversations').update({ flow_state: 'sucesso_main_menu', queue_type: 'sucesso' }).eq('id', conv.id);
        await sendMessage(String(getFlowStep('sucesso_main_menu')?.message || 'Bem-vindo ao Sucesso do Aluno...'), 'sucesso_main_menu', null, 'wapi_sucesso');
        autoReply = { sent: r.sent, engine: 'flow' };
      }
    } else if (conv.flow_state === 'sucesso_main_menu') {
      const trimmed = body.trim();
      const lower = trimmed.toLowerCase();
      const isBack = trimmed === '0' || ['menu','voltar','inicio','início','start'].includes(lower);
      const menuHint = '\n\n_Digite *0* para voltar ao menu ou *#SAIR* para encerrar._';

      if (isBack) {
        await sendMessage(String(getFlowStep('sucesso_main_menu')?.message || 'Menu principal.'), 'sucesso_back_menu');
      } else if (trimmed === '1') {
        await sendMessage(String(getFlowStep('sucesso_atualizar_peso')?.message || 'Acesse a plataforma para atualizar peso.') + menuHint, 'sucesso_atualizacao');
      } else if (trimmed === '2' || trimmed === '4') {
        // 100% AUTOMATIZADO — sem handoff humano. Apenas envia link e oferece retorno ao menu.
        const stepKey = trimmed === '2' ? 'sucesso_renovar' : 'sucesso_reativar';
        let customMsg = String(getFlowStep(stepKey)?.message || 'Para renovar ou reativar sua consultoria de forma 100% automática, acesse o link abaixo:');
        if (!customMsg.includes('sthmethod.com.br')) {
          customMsg += '\n\n🔗 Renovação: https://sthmethod.com.br/renovacao\n🌐 Site: https://sthmethod.com.br';
        }
        customMsg += '\n\n✅ O processo é 100% automatizado — basta acessar o link e concluir em poucos cliques.' + menuHint;
        await sendMessage(customMsg, stepKey);
      } else if (trimmed === '3') {
        await sendMessage(String(getFlowStep('sucesso_verificar_pagamentos')?.message || 'Verificando pagamentos...') + menuHint, 'sucesso_pag');
      } else if (trimmed === '5') {
        await sendMessage(String(getFlowStep('sucesso_receber_acessos')?.message || 'Enviando seus acessos...') + menuHint, 'sucesso_acessos');
      } else if (trimmed === '6') {
        // Última opção — humano. Antes oferece autoatendimento.
        const selfHelp = 'Antes de chamar um atendente, confira se uma das opções abaixo já resolve sua dúvida (mais rápido!):\n\n1️⃣ Atualizar Peso e Fotos\n2️⃣ Renovar Consultoria (automático)\n3️⃣ Verificar Pagamentos\n4️⃣ Reativar Consultoria (automático)\n5️⃣ Receber Acessos\n\n_Se mesmo assim precisar de atendimento humano, digite *6* novamente._' + menuHint;
        // marca flag para que o próximo "6" force handoff
        if ((conv.flow_context as any)?.human_requested) {
          await handoffConsultor();
        } else {
          await admin.from('crm_conversations').update({ flow_context: { ...(conv.flow_context || {}), human_requested: true } }).eq('id', conv.id);
          await sendMessage(selfHelp, 'sucesso_human_confirm');
        }
      } else if (trimmed === '7') {
        // Transferência automática para o Nutri — NÃO marcar human_handoff (deixar o bot do Nutri assumir).
        await sendMessage(String(getFlowStep('sucesso_nutri_handoff')?.message || 'Transferindo para o Nutri...'), 'sucesso_nutri');
        await admin.from('crm_conversations').update({
          flow_state: null,
          flow_context: {},
          human_handoff: false,
          queue_type: 'nutri',
        }).eq('id', conv.id);
        await sendMessage(String(getFlowStep('nutri_reception')?.message || 'Olá! Você está no canal Fale com o Nutri...'), 'nutri_reception', null, 'wapi');
      } else {
        await sendMessage(String(getFlowStep('sucesso_main_menu')?.message || 'Escolha uma opção válida.') + menuHint, 'sucesso_repeat');
      }
      autoReply = { sent: true, engine: 'flow' };
    } else if (conv.flow_state === 'lead_main_menu') {
      const trimmed = body.trim();
      if (trimmed === '1') { await sendMessage(String(getFlowStep('comercial_conhecer_consultoria')?.message || 'Sobre a consultoria...'), 'com_conhecer'); }
      else if (trimmed === '5') { await handoffConsultor(); }
      else { await sendMessage(String(getFlowStep('comercial_saudacao_lead')?.message || 'Escolha uma opção.'), 'com_repeat'); }
      autoReply = { sent: true, engine: 'flow' };
    }

    if (!autoReply && (aiModeCfg?.value as any)?.mode === 'auto') {
      const ai = await generateAiReply({ admin, conversationId: conv.id, phone, queue: conv.queue_type });
      if (ai.response) { const r = await sendMessage(ai.response, 'ai'); autoReply = { sent: r.sent, engine: ai.engine }; }
    }

    return new Response(JSON.stringify({ ok: true, autoReply }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
