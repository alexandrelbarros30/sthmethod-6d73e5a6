import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.192.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.192.0/encoding/hex.ts";
import { callAiEngine, loadEngineAndPrompt, fetchAiMemories, renderMemoryBlock, extractAndSaveAiMemory } from '../_shared/ai-engine.ts';
import { buildStudentContext } from '../_shared/student-context.ts';

// ===== Transcrição de áudio (WhatsApp PTT) via Lovable AI =====
// Baixa o arquivo de áudio e envia para o endpoint OpenAI-compatible do
// Lovable AI Gateway. Retorna o texto transcrito ou null em caso de falha.
// Aplica-se a TODOS os canais IA (Comercial, Nutri, Sucesso do Aluno) —
// o áudio passa a ser tratado como mensagem de texto para que a IA
// responda normalmente e a ausência fora do expediente também dispare.
async function transcribeAudioFromUrl(url: string): Promise<string | null> {
  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey || !url) return null;

    const audioRes = await fetch(url);
    if (!audioRes.ok) {
      console.error(`[transcribe] download falhou: ${audioRes.status}`);
      return null;
    }
    const audioBlob = await audioRes.blob();
    if (!audioBlob.size || audioBlob.size > 24 * 1024 * 1024) {
      console.error(`[transcribe] tamanho inválido: ${audioBlob.size}`);
      return null;
    }

    // WhatsApp PTT é geralmente .ogg/opus. O endpoint aceita ogg.
    const ct = (audioBlob.type || '').toLowerCase();
    const ext = ct.includes('mp4') || ct.includes('m4a') ? 'm4a'
      : ct.includes('webm') ? 'webm'
      : ct.includes('wav') ? 'wav'
      : ct.includes('mpeg') || ct.includes('mp3') ? 'mp3'
      : 'ogg';

    const form = new FormData();
    form.append('model', 'openai/gpt-4o-mini-transcribe');
    form.append('file', audioBlob, `audio.${ext}`);
    form.append('language', 'pt');

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      console.error(`[transcribe] gateway ${res.status}: ${await res.text().catch(() => '')}`);
      return null;
    }
    const data = await res.json().catch(() => null) as any;
    const text = typeof data?.text === 'string' ? data.text.trim() : '';
    return text || null;
  } catch (e) {
    console.error('[transcribe] erro:', e);
    return null;
  }
}

// ===== Detecção de mídia (imagem/vídeo/documento/sticker) =====
// Política STH METHOD: arquivos não são aceitos pelo WhatsApp em nenhum
// canal IA (Comercial, Nutri, Sucesso). O aluno deve enviar pelo sistema
// sthmethod.com.br para que o material entre no prontuário e seja
// autorizado/registrado corretamente. Áudio (PTT) NÃO entra nesta regra —
// é transcrito e respondido como texto.
function detectIncomingMediaKind(payload: any): 'image' | 'video' | 'document' | 'sticker' | null {
  if (!payload) return null;
  const d = payload?.data || {};
  // Z-API: payload.image / payload.video / payload.document / payload.sticker
  if (payload?.image || d?.image) return 'image';
  if (payload?.video || d?.video) return 'video';
  if (payload?.document || d?.document) return 'document';
  if (payload?.sticker || d?.sticker) return 'sticker';
  // W-API / Baileys: msgContent.{imageMessage|videoMessage|documentMessage|stickerMessage|documentWithCaptionMessage}
  // ou aninhado em message.* (variações de provider).
  const containers = [payload?.msgContent, d?.msgContent, payload?.message, d?.message, payload?.messageContent].filter(Boolean);
  for (const c of containers) {
    if (!c || typeof c !== 'object') continue;
    if (c.imageMessage) return 'image';
    if (c.videoMessage) return 'video';
    if (c.documentMessage || c.documentWithCaptionMessage || c.fileMessage) return 'document';
    if (c.stickerMessage) return 'sticker';
    // documentWithCaptionMessage costuma envelopar outro message
    if (c.documentWithCaptionMessage?.message?.documentMessage) return 'document';
  }
  const mt = String(payload?.messageType || payload?.type || d?.messageType || '').toLowerCase();
  if (mt.includes('imagemessage') || mt === 'image') return 'image';
  if (mt.includes('videomessage') || mt === 'video') return 'video';
  if (mt.includes('documentmessage') || mt === 'document' || mt.includes('file')) return 'document';
  if (mt.includes('stickermessage') || mt === 'sticker') return 'sticker';
  // Mimetype direto no payload (alguns providers expõem assim)
  const mime = String(payload?.mimetype || d?.mimetype || payload?.mimeType || d?.mimeType || '').toLowerCase();
  if (mime.startsWith('image/')) return mime.includes('webp') ? 'sticker' : 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('application/') || mime === 'text/plain' || mime.includes('pdf')) return 'document';
  return null;
}

async function generateAiReply({
  admin,
  conversationId,
  phone,
  waId = null,
  queue = 'comercial',
}: {
  admin: ReturnType<typeof createClient>;
  conversationId: string;
  phone: string;
  waId?: string | null;
  queue?: string;
}): Promise<{ response: string; model: string; engine: string }> {
  const promptKey: 'ai_prompt_comercial' | 'ai_prompt_sucesso' | 'ai_prompt_nutri' =
    queue === 'sucesso' ? 'ai_prompt_sucesso'
    : queue === 'nutri' ? 'ai_prompt_nutri'
    : 'ai_prompt_comercial';
  const { engine, systemPrompt: basePrompt } = await loadEngineAndPrompt(admin as any, promptKey);

  const [{ data: msgs }, profile] = await Promise.all([
    admin
      .from('crm_messages')
      .select('direction, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10),
    findProfileByPhone(admin, phone, 'user_id, full_name, objective, weight, phone', waId),
  ]);

  const history = (msgs || [])
    .reverse()
    .map((m: any) => `${m.direction === 'in' ? 'Aluno' : 'Atendente'}: ${m.body}`)
    .join('\n');

  let context = '';
  if (profile?.user_id) {
    const dossier = await buildStudentContext(admin as any, profile.user_id);
    if (dossier) context += dossier + '\n';
  } else if (profile) {
    context += `Aluno: ${profile.full_name} | Objetivo: ${profile.objective || '—'} | Peso: ${profile.weight || '—'}kg\n\n`;
  }
  if (history) context += `Histórico recente da conversa:\n${history}\n\n`;

  // 🧠 Memória da IA — aprendizados acumulados de conversas anteriores.
  const memories = await fetchAiMemories(admin as any, { phone, userId: profile?.user_id || null });
  const systemPrompt = basePrompt + renderMemoryBlock(memories);

  const contactFirstName = (profile?.full_name || '').toString().trim().split(/\s+/)[0] || '';
  const nameGuard = queue !== 'nutri'
    ? `\n⚠️ REGRA DE NOME: ${contactFirstName ? `o interlocutor se chama "${contactFirstName}" — use APENAS este primeiro nome ao se dirigir a ele.` : 'não há nome confirmado no contexto — trate por "você".'} NUNCA chame o interlocutor de "Alexandre" (esse nome pertence ao Nutri, não ao lead/aluno) nem invente qualquer outro nome.`
    : '';
  const userPrompt = `${context}${nameGuard}\nCom base no contexto acima, responda a última mensagem do aluno de forma curta, cordial e profissional (tom STH METHOD, neutro e técnico, em português do Brasil). Não use emojis em excesso. Máximo 4 frases.`;

  const reply = await callAiEngine({ engine, systemPrompt, userPrompt });

  // Extração assíncrona (best-effort, não bloqueia a resposta).
  if (history) {
    const tailHistory = history + `\nAtendente: ${reply.response}`;
    extractAndSaveAiMemory({
      admin,
      engine,
      phone,
      userId: profile?.user_id || null,
      conversationId,
      recentHistory: tailHistory,
    }).catch(() => {});
  }

  return reply;
}

function normalizePhone(raw: string): string {
  // Remove tudo que não é dígito, exceto se for um ID de contato do WhatsApp (ex: @s.whatsapp.net)
  // Mas para o telefone em si, queremos apenas os dígitos.
  let clean = String(raw || '').split('@')[0]; // Remove @s.whatsapp.net se houver
  let d = clean.replace(/\D+/g, '').replace(/^0+/, '');
  
  // Se o número começar com 55 e tiver 12 ou 13 dígitos, é um número brasileiro com DDI
  // Se tiver 10 ou 11 dígitos, assumimos que falta o DDI 55
  if (d.length === 10 || d.length === 11) return '55' + d;
  
  // Caso especial: alguns provedores mandam 550... ou algo assim
  if (d.startsWith('550')) d = '55' + d.substring(3);

  return d;
}

async function hashTemplate(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
  const digits = digitsOnly(d);
  const set = new Set<string>([digits]);
  
  // Se tem 55, adiciona versão sem 55
  if (digits.startsWith('55') && digits.length > 10) {
    const sans55 = digits.slice(2);
    set.add(sans55);
    // Brasil: DDD + 9 ou 8 dígitos
    const ddd = sans55.slice(0, 2);
    const rest = sans55.slice(2);
    
    // Se tem 9 dígitos começando com 9, gera a versão com 8
    if (rest.length === 9 && rest[0] === '9') set.add(ddd + rest.slice(1));
    // Se tem 8 dígitos, gera a versão com 9 extra
    if (rest.length === 8) set.add(ddd + '9' + rest);
  } else if (digits.length >= 8) {
    // Se não tem 55, adiciona versão com 55
    set.add('55' + digits);
    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);
    
    if (rest.length === 9 && rest[0] === '9') set.add(ddd + rest.slice(1));
    if (rest.length === 8) set.add(ddd + '9' + rest);
  }
  
  return Array.from(set);
}

function digitsOnly(raw: string | null | undefined): string {
  if (!raw) return '';
  // Remove tudo que não é dígito, mas se for wa_id completo, pega só a parte numérica antes do @
  const clean = String(raw).split('@')[0];
  return clean.replace(/\D+/g, '').replace(/^0+/, '');
}

function buildInternalPhones(_configuredInstances: { zapi: string; wapi: string; wapi_sucesso: string }, connectedPhone: string): Set<string> {
  const numbers = new Set<string>();
  const hardcodedKnownInternalNumbers = [
    '5521998984153',
    '5521998496289',
  ];

  for (const raw of [connectedPhone, ...hardcodedKnownInternalNumbers]) {
    const digits = digitsOnly(raw);
    if (digits) numbers.add(digits);
  }

  return numbers;
}

function phoneMatchScore(row: any, targetPhone: string, targetWaId: string | null): number {
  const candidate = digitsOnly(row.phone);
  const candidateWaId = row.whatsapp_id;
  const target = digitsOnly(targetPhone);
  
  // Prioridade máxima: whatsapp_id exato
  if (targetWaId && candidateWaId === targetWaId) return 1000;
  
  if (!candidate || !target) return 0;
  
  // Match exato (normalizado)
  if (candidate === target) return 100;
  
  // Match dos últimos 8 dígitos (corpo do número sem 9 extra e sem DDD)
  const c8 = candidate.slice(-8);
  const t8 = target.slice(-8);
  
  if (c8 === t8) {
    // Se os últimos 8 batem, verificamos o DDD.
    // O DDD geralmente está antes dos últimos 8 ou 9 dígitos.
    const getDDD = (s: string) => {
      const sansDDI = s.startsWith('55') ? s.slice(2) : s;
      return sansDDI.slice(0, 2);
    };
    
    const cDDD = getDDD(candidate);
    const tDDD = getDDD(target);
    
    if (cDDD === tDDD) {
       // Se o DDD bate e os últimos 8 batem, é quase certamente o mesmo aluno
       // (podendo variar apenas o 9º dígito ou o DDI)
       if (candidate.slice(-11) === target.slice(-11)) return 95;
       if (candidate.slice(-10) === target.slice(-10)) return 90;
       return 85;
    }
    
    return 60;
  }
  
  return 0;
}

function buildPhoneSearchPatterns(phone: string): string[] {
  const patterns = new Set<string>();
  const digits = digitsOnly(phone);
  
  // SEMPRE incluir o padrão dos últimos 8 dígitos como fallback global
  if (digits.length >= 8) {
    patterns.add(`%${digits.slice(-8)}%`);
  }

  for (const variant of phoneCandidates(phone)) {
    const local = digitsOnly(variant).startsWith('55') ? digitsOnly(variant).slice(2) : digitsOnly(variant);
    if (local.length < 8) continue;

    const last4 = local.slice(-4);
    const middle = local.slice(-8, -4);
    
    patterns.add(`%${middle}%${last4}%`);
    
    if (local.length >= 10) {
      const ddd = local.slice(0, 2);
      patterns.add(`%${ddd}%${middle}%${last4}%`);
    }
  }

  return Array.from(patterns);
}

async function findProfileByPhone(admin: ReturnType<typeof createClient>, phone: string, selectFields: string, waId: string | null = null) {
  const patterns = buildPhoneSearchPatterns(phone);
  
  // Se tiver waId, incluímos na busca OR
  const conditions = patterns.map((p) => `phone.ilike.${p}`);
  if (waId) {
    conditions.unshift(`whatsapp_id.eq.${waId}`);
  }

  if (conditions.length === 0) return null;
  const orCondition = conditions.join(',');

  // Busca inicial ampla para capturar variações
  const { data, error } = await admin
    .from('profiles')
    .select(selectFields + ', phone, whatsapp_id')
    .or(orCondition)
    .limit(50);

  if (error) {
    console.error('findProfileByPhone error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log(`Nenhum perfil encontrado para padrões: ${patterns.join(', ')} e waId: ${waId}`);
    return null;
  }

  // Ranking refinado em memória
  const ranked = data
    .map((row: any) => ({ 
      ...row, 
      _score: phoneMatchScore(row, phone, waId), 
      _digits: digitsOnly(row.phone) 
    }))
    .filter((row: any) => row._score > 40)
    .sort((a: any, b: any) => b._score - a._score || b._digits.length - a._digits.length);

  if (ranked.length > 0) {
    const found = ranked[0];
    console.log(`Perfil encontrado: ${found.full_name} (Score: ${found._score}) para o telefone ${phone}`);
    
    // Auto-update do whatsapp_id se não estiver preenchido e tivermos um waId
    if (waId && !found.whatsapp_id && found._score >= 80) {
       console.log(`Atualizando whatsapp_id para o perfil ${found.full_name}`);
       await admin.from('profiles').update({ whatsapp_id: waId }).eq('phone', found.phone);
    }

    return found;
  }

  return null;
}




async function getPlansFormatted(admin: ReturnType<typeof createClient>): Promise<string> {
  const { data: plans } = await admin.from('plans').select('*').eq('active', true).order('order_index', { ascending: true });
  if (!plans || plans.length === 0) return 'Consulte nossos consultores para valores atualizados.';
  
  return plans.map(p => {
    let s = `📋 *${p.name}*\n`;
    if (p.description) s += `${p.description}\n`;
    s += `💰 Investimento: R$ ${p.price}\n`;
    if (p.duration_months) s += `📅 Período: ${p.duration_months} meses\n`;
    return s;
  }).join('\n');
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

  let lockAcquired = false;
  let releaseLock: null | (() => Promise<void>) = null;

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
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
    const phone = normalizePhone(phoneRaw);
    const waId = String(phoneRaw || '').split('@')[0]; // Usamos o ID puramente numérico como waId
    
    const connectedPhone = normalizePhone(payload?.connectedPhone || payload?.data?.connectedPhone || '');
    // Detecta áudio em múltiplos formatos: Z-API (payload.audio.audioUrl),
    // W-API/Baileys (payload.msgContent.audioMessage.URL) e fallbacks.
    const audioMsg = payload?.msgContent?.audioMessage || payload?.message?.audioMessage || null;
    const audioUrl: string | null =
      payload?.audio?.audioUrl ||
      payload?.audioUrl ||
      audioMsg?.URL ||
      audioMsg?.url ||
      payload?.audio?.url ||
      null;
    const hasAudio = !!audioUrl || !!audioMsg ||
      String(payload?.audio?.mimeType || audioMsg?.mimetype || '').toLowerCase().startsWith('audio/');
    let rawText = payload?.data?.body || (typeof payload?.text === 'string' ? payload.text : payload?.text?.message) || payload?.message?.conversation || (typeof payload?.message === 'string' ? payload.message : '') || payload?.image?.caption || payload?.video?.caption || payload?.document?.caption || payload?.body || payload?.data?.message?.text || payload?.msgContent?.conversation || '';
    let isTranscribedAudio = false;
    // Se veio áudio (PTT) e nenhum texto/caption, tenta transcrever via Lovable AI
    // e usa a transcrição como o corpo da mensagem. Assim a IA responde
    // normalmente e a regra de ausência fora do expediente também dispara.
    // Importante: mesmo se a URL estiver criptografada (W-API .enc) ou faltar,
    // setamos placeholder para que o fluxo continue (sem placeholder o webhook
    // abortaria em "!body" e a ausência fora do expediente NÃO dispararia).
    if (hasAudio && (!rawText || typeof rawText !== 'string' || !rawText.trim())) {
      if (audioUrl) {
        const transcript = await transcribeAudioFromUrl(audioUrl);
        if (transcript) {
          rawText = `[Áudio do aluno] ${transcript}`;
          isTranscribedAudio = true;
          console.log(`[audio] transcrição ok (${transcript.length} chars)`);
        } else {
          rawText = '[Áudio recebido]';
          isTranscribedAudio = true;
          console.warn('[audio] transcrição falhou — usando placeholder (fluxo segue)');
        }
      } else {
        rawText = '[Áudio recebido]';
        isTranscribedAudio = true;
        console.warn('[audio] sem URL acessível (provavelmente criptografado) — usando placeholder');
      }
    }
    // Detecta mídia (imagem/vídeo/documento/sticker). Se houver, bloqueamos
    // o conteúdo: o WhatsApp não recebe arquivos em nenhum canal IA. O aluno
    // será orientado a enviar pelo sistema oficial sthmethod.com.br.
    const blockedMediaKind = detectIncomingMediaKind(payload);
    const hasBlockedMedia = !!blockedMediaKind && !isTranscribedAudio;
    if (hasBlockedMedia) {
      // Ignora qualquer caption — não respondemos ao texto que acompanha o anexo.
      rawText = '';
    }
    const body = typeof rawText === 'string' ? rawText : '';
    const externalId = payload?.messageId || payload?.id || null;
    const name = payload?.senderName || payload?.pushName || payload?.sender?.pushName || null;

    // ===== Detecção de mensagem enviada manualmente pelo atendente =====
    // Z-API envia type="SendCallback" com fromMe=true quando habilitado.
    // W-API costuma enviar fromMe=true em qualquer envio.
    // fromApi=true significa que partiu da nossa própria automação — NÃO é handoff.
    const evtType = String(payload?.type || payload?.event || '').toLowerCase();
    const isFromMe = payload?.fromMe === true || payload?.from_me === true || payload?.data?.fromMe === true;
    const isFromApi = payload?.fromApi === true || payload?.from_api === true || payload?.data?.fromApi === true;
    const isSendEvent = evtType === 'sendcallback' || evtType === 'send_callback' || evtType === 'sentcallback' || evtType === 'sent_callback';
    const isStatusEvent = evtType === 'messagestatuscallback' || evtType === 'message_status_callback';
    const isReactionEvent = !!payload?.reaction;
    const isEditEvent = payload?.isEdit === true || payload?.is_edit === true;
    if ((isFromMe || isSendEvent) && !isFromApi) {
      if (phone) {
        console.log(`Atendente respondeu manualmente para ${phone} via ${provider} (type=${evtType||'-'}, fromMe=${isFromMe}, fromApi=${isFromApi}). Ativando handoff humano e silenciando o bot por 24h.`);
        // Atualiza TODAS as conversas desse telefone (vale para canal comercial, sucesso e nutri).
        await admin.from('crm_conversations').update({
          human_handoff: true,
          status: 'open',
          updated_at: new Date().toISOString(),
        }).eq('phone', phone);

        // Registra a mensagem no histórico (quando vier conteúdo) para o painel mostrar o que o humano enviou.
        try {
          if (body && body.trim().length > 0) {
            const { data: convRow } = await admin
              .from('crm_conversations')
              .select('id')
              .eq('phone', phone)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (convRow?.id) {
              await admin.from('crm_messages').insert({
                conversation_id: convRow.id,
                direction: 'out',
                source: provider,
                status: 'sent',
                body,
                metadata: { type: 'manual_human', external_id: externalId },
              });
              await admin.from('crm_conversations').update({
                last_message_at: new Date().toISOString(),
                last_message_preview: body.slice(0, 200),
                last_direction: 'out',
              }).eq('id', convRow.id);
            }
          }
        } catch (e) {
          console.error('Falha ao registrar mensagem manual do atendente:', e);
        }
      }
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'human_manual_reply' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (payload?.isGroup === true || payload?.is_group === true || String(phoneRaw).startsWith('120363') || String(phoneRaw).includes('-') || String(phoneRaw).includes('@g.us')) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'group_message' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (isStatusEvent || isReactionEvent || isEditEvent) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'non_message_event' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const internalPhones = buildInternalPhones(configuredInstances, connectedPhone);

    if ((connectedPhone && phone === connectedPhone) || internalPhones.has(phone)) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'self_echo' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // phone ja foi declarado acima

    if (!phone) return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!body && !hasBlockedMedia) return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // CRITICAL LOCK: Evitar processamento paralelo para o mesmo telefone
    // Remove locks expirados (mais de 10 segundos)
    await admin.from('crm_message_locks').delete().lt('locked_at', new Date(Date.now() - 10000).toISOString());
    
    // Tenta obter o lock
    const { error: lockError } = await admin.from('crm_message_locks').insert({ phone });
    if (lockError) {
      console.log(`Lock ativo para ${phone}. Ignorando processamento paralelo.`);
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'concurrency_lock' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    lockAcquired = true;

    // Função para liberar o lock sempre ao final
    releaseLock = async () => {
      await admin.from('crm_message_locks').delete().eq('phone', phone);
    };

    const finish = async (payload: Record<string, unknown>, status = 200) => {
      if (lockAcquired && releaseLock) {
        lockAcquired = false;
        await releaseLock();
      }
      return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    };

    if (externalId) {
      const { data: existingByExternalId } = await admin
        .from('crm_messages')
        .select('id')
        .eq('source', provider)
        .eq('external_id', externalId)
        .limit(1)
        .maybeSingle();

      if (existingByExternalId) {
        await admin.from('automation_logs').insert({
          contact_phone: phone,
          event_type: 'blocked_duplicate',
          reason: 'Duplicate webhook event by external_id',
          metadata: { provider, external_id: externalId },
        });
        return await finish({ ok: true, skipped: true, reason: 'duplicate_external_id' });
      }
    }

    // ============================================================
    // BLOQUEIO DE MÍDIA — TODOS OS CANAIS (Comercial, Nutri, Sucesso)
    // Política: WhatsApp NÃO recebe imagens, vídeos, documentos nem
    // stickers. O aluno/cliente é orientado a enviar pelo sistema
    // sthmethod.com.br, onde o material é registrado, autorizado e
    // vinculado ao prontuário. Áudio continua sendo transcrito.
    // Dedup: 1 aviso a cada 4h por conversa (evita spam se o usuário
    // disparar várias fotos em sequência).
    // ============================================================
    if (hasBlockedMedia) {
      const blockedMsg = (
        "📎 Por aqui não recebemos *fotos, vídeos ou documentos* — eles ficam soltos e não entram no seu prontuário.\n\n" +
        "✅ Envie pelo sistema oficial *STH METHOD*, onde tudo é registrado, autorizado e vinculado ao seu acompanhamento:\n" +
        "👉 https://sthmethod.com.br/dashboard\n\n" +
        "• *Fotos de evolução* → menu *Evolução*\n" +
        "• *Exames / laudos* → menu *Documentos*\n" +
        "• *Comprovante de pagamento* → menu *Assinatura*\n\n" +
        "Assim seu envio chega ao time certo e fica salvo no histórico. 🙏"
      );

      // Garante uma conversa para registrar a inbound (mídia) e a outbound.
      let { data: convRow } = await admin
        .from('crm_conversations')
        .select('id, queue_type')
        .eq('phone', phone)
        .maybeSingle();
      if (!convRow) {
        const ins = await admin.from('crm_conversations').insert({
          phone,
          wa_id: waId,
          display_name: name || null,
          channel: 'whatsapp',
          status: 'open',
          provider,
          queue_type: provider === 'zapi' ? 'comercial' : (provider === 'wapi_sucesso' ? 'sucesso' : 'nutri'),
          session_started_at: new Date().toISOString(),
        }).select('id, queue_type').single();
        convRow = ins.data as any;
      }

      // Registra a mídia recebida (placeholder no histórico).
      try {
        await admin.from('crm_messages').insert({
          conversation_id: convRow!.id,
          direction: 'in',
          source: provider,
          status: 'received',
          body: `[${blockedMediaKind} bloqueado — enviar pelo sistema]`,
          external_id: externalId,
          metadata: { type: 'media_blocked_in', media_kind: blockedMediaKind },
        });
      } catch (e) {
        console.error('media_blocked: erro ao registrar inbound', e);
      }

      // Dedup 4h: não repete o aviso se já enviado recentemente.
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const { data: recentBlock } = await admin
        .from('crm_messages')
        .select('id')
        .eq('conversation_id', convRow!.id)
        .eq('direction', 'out')
        .gt('created_at', fourHoursAgo)
        .filter('metadata->>tag', 'eq', 'media_blocked')
        .maybeSingle();

      if (!recentBlock) {
        try {
          if (provider === 'zapi') {
            const c = (zapiCfgRow?.value as any) || {};
            const INSTANCE_ID = (c.instance_id || Deno.env.get('ZAPI_INSTANCE_ID') || '').trim();
            const INSTANCE_TOKEN = (c.instance_token || Deno.env.get('ZAPI_INSTANCE_TOKEN') || '').trim();
            const CLIENT_TOKEN = (c.client_token || Deno.env.get('ZAPI_CLIENT_TOKEN') || '').trim();
            if (INSTANCE_ID && INSTANCE_TOKEN) {
              await fetch(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(CLIENT_TOKEN ? { 'Client-Token': CLIENT_TOKEN } : {}) },
                body: JSON.stringify({ phone, message: blockedMsg }),
              });
            }
          } else {
            const fnName = provider === 'wapi_sucesso' ? 'send-wapi-sucesso' : 'send-wapi';
            await admin.functions.invoke(fnName, { body: { phone, message: blockedMsg } });
          }

          await admin.from('crm_messages').insert({
            conversation_id: convRow!.id,
            direction: 'out',
            source: provider,
            status: 'sent',
            body: blockedMsg,
            metadata: { type: 'media_blocked', tag: 'media_blocked', media_kind: blockedMediaKind },
          });
        } catch (e) {
          console.error('media_blocked: erro ao enviar aviso', e);
        }
      }

      await admin.from('automation_logs').insert({
        contact_phone: phone,
        event_type: 'media_blocked',
        reason: 'WhatsApp não recebe arquivos — direcionado ao sistema',
        metadata: { provider, media_kind: blockedMediaKind, deduped: !!recentBlock },
      });

      return await finish({ ok: true, blocked: true, reason: 'media_not_allowed', media_kind: blockedMediaKind });
    }

    // LOG DE INÍCIO
    await admin.from('automation_logs').insert({
      contact_phone: phone,
      event_type: 'automation_triggered',
      metadata: { body: body.substring(0, 50), provider }
    });


    // OPT-OUT and MANUAL CLOSE
    const normalizedBody = String(body).trim().toUpperCase();
    if (/\bCANCELAR\s+ENVIO\b/.test(normalizedBody) || /^VOLTAR$/.test(normalizedBody) || normalizedBody === '#SAIR' || normalizedBody === '#ENCERRAR') {
      const isOptOut = /\bCANCELAR\s+ENVIO\b/.test(normalizedBody);
      const isManualClose = normalizedBody === '#SAIR' || normalizedBody === '#ENCERRAR';
      
      const profile = await findProfileByPhone(admin, phone, 'user_id, full_name, phone', waId);
      
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
        return await finish({ ok: true, manual_close: true });
      }

      if (profile?.user_id) {
        await admin.from('profiles').update({ whatsapp_opt_out: isOptOut, whatsapp_opt_out_at: isOptOut ? new Date().toISOString() : null }).eq('user_id', profile.user_id);
      }

      if (isOptOut) {
        const optOutMsg = "Ok, entendi. Você não receberá mais lembretes automáticos de renovação da STH METHOD. Se quiser voltar a falar com a gente, é só enviar uma mensagem. 👋";
        const { data: conv } = await admin.from('crm_conversations').select('id').eq('phone', phone).maybeSingle();

        if (provider === 'zapi') {
          const c = (zapiCfgRow?.value as any) || {};
          const INSTANCE_ID = (c.instance_id || Deno.env.get('ZAPI_INSTANCE_ID') || '').trim();
          const INSTANCE_TOKEN = (c.instance_token || Deno.env.get('ZAPI_INSTANCE_TOKEN') || '').trim();
          const CLIENT_TOKEN = (c.client_token || Deno.env.get('ZAPI_CLIENT_TOKEN') || '').trim();
          if (INSTANCE_ID && INSTANCE_TOKEN) {
            await fetch(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-text`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(CLIENT_TOKEN ? { 'Client-Token': CLIENT_TOKEN } : {}) },
              body: JSON.stringify({ phone, message: optOutMsg }),
            });
          }
        } else {
          const fnName = provider === 'wapi_sucesso' ? 'send-wapi-sucesso' : 'send-wapi';
          await admin.functions.invoke(fnName, { body: { phone, message: optOutMsg } });
        }

        if (conv?.id) {
          await admin.from('crm_messages').insert({ conversation_id: conv.id, direction: 'out', body: optOutMsg, source: provider, status: 'sent', metadata: { type: 'opt_out_confirmation' } });
        }
      }

      return await finish({ ok: true, opt_out: isOptOut });
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

    // AVISO DO DIA (Nutri): janela pontual que sobrepõe o atendimento até `start_hhmm`.
    // Após esse horário (mesmo dia), volta ao comportamento padrão automaticamente.
    let todayNoticeActive = false;
    let todayNoticeMessage = '';
    if (provider === 'wapi') {
      try {
        const { data: noticeCfg } = await admin
          .from('crm_settings').select('value').eq('key', 'nutri_today_notice').maybeSingle();
        const v: any = noticeCfg?.value || null;
        if (v?.enabled !== false && v?.date && v?.start_hhmm && v?.message) {
          const spDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
          }).format(new Date());
          if (spDate === String(v.date)) {
            const { minutes } = spNow();
            if (minutes < hhmmToMin(String(v.start_hhmm))) {
              todayNoticeActive = true;
              todayNoticeMessage = String(v.message);
            }
          }
        }
      } catch (e) {
        console.error('today_notice check failed', e);
      }
    }
    
    // Canal Sucesso do Aluno está SUSPENSO — nunca redirecionar contatos do Comercial
    // para lá fora do horário. Em vez disso, fora do expediente seguimos a política:
    //   - lead → cadastro (1ª adesão)
    //   - aluno_vencido / ex_aluno → renovação automatizada
    //   - aluno_ativo → mensagem de ausência do Comercial (sem citar Sucesso)
    const forceSucessoQueue = false;
    const redirectToSucessoNumber = false;

    const profile = await findProfileByPhone(admin, phone, 'user_id, full_name, objective, phone', waId);
    let displayName = name || profile?.full_name || null;
    let identifiedAs: 'aluno_ativo' | 'aluno_vencido' | 'lead' | 'ex_aluno' = 'lead';

    if (profile) {
      const { data: subs } = await admin.from('subscriptions').select('end_date, status').eq('user_id', profile.user_id).order('end_date', { ascending: false }).limit(1);
      const sub = subs?.[0];
      if (sub) {
        // Se o status for explicitamente 'active', consideramos ativo independente da data (ex: planos vitalícios ou com erro de data)
        // Ou se a data de término for no futuro
        const isFuture = new Date(sub.end_date).getTime() > Date.now();
        if (sub.status === 'active' || isFuture) {
          identifiedAs = 'aluno_ativo';
        } else {
          const days = Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000);
          if (days < -365) identifiedAs = 'ex_aluno';
          else identifiedAs = 'aluno_vencido';
        }
      }
    }

    // Whitelist manual do canal Fale com o Nutri: números listados aqui
    // são atendidos como aluno_ativo (parceiros, jornalistas, casos especiais),
    // pulando o bloqueio automático. Só faz sentido para o provider WAPI (Nutri).
    if (provider === 'wapi' && identifiedAs !== 'aluno_ativo') {
      const phoneDigitsForWL = String(phone || '').replace(/\D/g, '');
      const { data: whitelistHit } = await admin
        .from('crm_nutri_whitelist')
        .select('id')
        .eq('phone', phoneDigitsForWL)
        .maybeSingle();
      if (whitelistHit) {
        identifiedAs = 'aluno_ativo';
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

    const recentEchoThreshold = new Date(Date.now() - 120000).toISOString();
    const looksLikeBotTemplate = body.length >= 80 || body.includes('\n');
    if (looksLikeBotTemplate && conv?.id) {
      const { data: recentEcho } = await admin
        .from('crm_messages')
        .select('id')
        .eq('conversation_id', conv.id)
        .eq('direction', 'out')
        .eq('source', provider)
        .eq('body', body)
        .gt('created_at', recentEchoThreshold)
        .limit(1)
        .maybeSingle();

      if (recentEcho) {
        await admin.from('automation_logs').insert({
          contact_phone: phone,
          event_type: 'blocked_duplicate',
          reason: 'Provider echo matched a recent outbound template',
          metadata: { provider, external_id: externalId, conversation_id: conv.id },
        });
        return await finish({ ok: true, skipped: true, reason: 'provider_echo' });
      }
    }
    
    // CRITICAL FIX: If human is active, prevent session reset/expiry logic that could re-enable the bot
    const isHumanActive = conv?.human_handoff === true || !!conv?.assigned_to;
    const isNewSession = !conv || conv.status === 'closed' || (isExpired && !isHumanActive);

    if (!conv) {
      const ins = await admin.from('crm_conversations').insert({ 
        phone, 
        wa_id: waId,
        display_name: displayName, 
        channel: 'whatsapp', 
        status: 'open', 
        provider, 
        queue_type: finalQueue, 
        nutri_category: cls.nutriCategory, 
        is_lead: identifiedAs === 'lead', 
        user_id: profile?.user_id, 
        identified_as: identifiedAs, 
        session_started_at: now.toISOString(), 
        session_expires_at: sessionExpiresAt.toISOString(), 
        session_count: 1 
      }).select('*').single();
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

      const upd: any = { 
        provider, 
        wa_id: waId,
        queue_type: finalQueue, 
        nutri_category: cls.nutriCategory, 
        session_expires_at: sessionExpiresAt.toISOString(), 
        status: 'open', 
        is_lead: identifiedAs === 'lead', 
        user_id: profile?.user_id, 
        identified_as: identifiedAs 
      };
      
      if (isNewSession) { 

        upd.session_started_at = now.toISOString(); 
        upd.session_count = (conv.session_count || 0) + 1; 
        upd.flow_state = null; 
        upd.flow_context = {}; 
        
        // Se a conversa estava fechada ou expirou sem um atendente fixo (e não é humano ativo), resetamos para o bot
        if (conv.status === 'closed' || !conv.assigned_to) {
          upd.human_handoff = false; 
          upd.assigned_to = null;
          upd.human_intro_sent = false;
          upd.ai_paused_until = null;
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

    const sendMessage = async (message: string, tag: string, imageUrl?: string | null, targetProvider?: string, extraTplData: Record<string, string> = {}, flowStep?: any) => {
      const tplMessage = renderTpl(message, extraTplData);
      let sent = false; let messageId: string | null = null;
      const activeProvider = targetProvider || provider;
      
      if (activeProvider === 'zapi') {
        const c = (zapiCfg?.value as any) || {};
        const INSTANCE_ID = (c.instance_id || Deno.env.get('ZAPI_INSTANCE_ID') || '').trim();
        const INSTANCE_TOKEN = (c.instance_token || Deno.env.get('ZAPI_INSTANCE_TOKEN') || '').trim();
        const CLIENT_TOKEN = (c.client_token || Deno.env.get('ZAPI_CLIENT_TOKEN') || '').trim();
        
        if (INSTANCE_ID && INSTANCE_TOKEN) {
          const isPdf = String(imageUrl || '').toLowerCase().includes('.pdf');
          let endpoint = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-${imageUrl ? (isPdf ? 'document' : 'image') : 'text'}`;
          let bodyPayload: any = { phone, message: tplMessage };

          // Suporte a Menus Interativos no Z-API
          if (flowStep?.display_format === 'buttons' && flowStep.actions?.length > 0) {
            endpoint = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-button-list`;
            bodyPayload = {
              phone,
              message: tplMessage,
              buttonList: {
                buttons: flowStep.actions.slice(0, 3).map((a: any) => ({
                  id: a.label,
                  label: a.label.length > 20 ? a.label.substring(0, 17) + '...' : a.label
                }))
              }
            };
          } else if (flowStep?.display_format === 'list' && flowStep.actions?.length > 0) {
            endpoint = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/send-option-list`;
            bodyPayload = {
              phone,
              message: tplMessage,
              optionList: {
                title: 'Opções',
                buttonLabel: 'Ver Opções',
                options: flowStep.actions.slice(0, 10).map((a: any, i: number) => ({
                  id: a.label,
                  title: a.label.length > 20 ? a.label.substring(0, 17) + '...' : a.label,
                  description: `Opção ${i + 1}`
                }))
              }
            };
          } else if (imageUrl) {
            if (isPdf) { 
              bodyPayload.document = imageUrl; 
              bodyPayload.fileName = 'documento.pdf'; 
              bodyPayload.caption = tplMessage; 
            } else { 
              bodyPayload.image = imageUrl; 
              bodyPayload.caption = tplMessage; 
            }
          }

          const r = await fetch(endpoint, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', ...(CLIENT_TOKEN ? { 'Client-Token': CLIENT_TOKEN } : {}) }, 
            body: JSON.stringify(bodyPayload) 
          });
          const j = await r.json().catch(() => ({})); 
          sent = r.ok; 
          messageId = j?.messageId || j?.id || null;
        }
      } else {
        const fnName = activeProvider === 'wapi_sucesso' ? 'send-wapi-sucesso' : 'send-wapi';
        console.log(`Invoking ${fnName} for phone ${phone}`);
        
        let buttons = null;
        let list = null;
        
        if (flowStep?.display_format === 'buttons' && flowStep.actions?.length > 0) {
          buttons = flowStep.actions.slice(0, 3).map((a: any) => ({
            id: a.label, // Usamos o gatilho como ID
            label: a.label.length > 20 ? a.label.substring(0, 17) + '...' : a.label
          }));
        } else if (flowStep?.display_format === 'list' && flowStep.actions?.length > 0) {
          list = {
            title: 'Opções',
            buttonLabel: 'Ver Opções',
            sections: [{
              title: 'Escolha uma opção',
              rows: flowStep.actions.slice(0, 10).map((a: any) => ({
                id: a.label,
                title: a.label.length > 20 ? a.label.substring(0, 17) + '...' : a.label
              }))
            }]
          };
        }

        const { data, error } = await admin.functions.invoke(fnName, { 
          body: { 
            phone, 
            message: tplMessage, 
            image_url: imageUrl,
            buttons,
            list
          } 
        });
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
      const flowStep = getFlowStep('comercial_handoff_consultor');
      const r = await sendMessage(String(flowStep?.message || 'Vou te encaminhar para um consultor da equipe STH Method. Aguarde alguns instantes. 🙏'), 'handoff_consultor', null, undefined, {}, flowStep);
      return { sent: r.sent, engine: 'flow', model: 'handoff_consultor' };
    };

    let autoReply: any;
    const channelEnabled = provider === 'wapi' ? (wapiCfg?.value as any)?.enabled === true : (provider === 'wapi_sucesso' ? (wapiSucessoCfg?.value as any)?.enabled === true : (zapiCfg?.value as any)?.enabled === true);

    // Se houver atendente humano ou flag de handoff, ignoramos mensagens automáticas de fluxo e ausência.
    const isChannelEnabled = channelEnabled;
    const aiMode = String((aiModeCfg?.value as any)?.mode || 'auto'); // off | auto | ai_only

    if (!isChannelEnabled) {
      autoReply = { sent: false, reason: 'disabled' };
    } else if (conv.human_handoff === true || !!conv.assigned_to) {
      // Atendente humano ativo: IA fica TOTALMENTE silenciada até o handoff ser encerrado manualmente.
      // (Removido o "AI takeover" por inatividade — causava respostas duplicadas com a atendente.)
      console.log(`Atendimento humano ativo na conversa ${conv.id}. Bloqueando automação por completo.`);
      await admin.from('automation_logs').insert({
        contact_phone: phone,
        event_type: 'blocked_human_active',
        reason: 'Conversation assigned to agent or handoff active',
        metadata: { conversation_id: conv.id, assigned_to: conv.assigned_to }
      });
      await admin.from('crm_conversations').update({ human_handoff: true }).eq('id', conv.id);
      await admin.from('crm_away_locks').upsert({
        conversation_id: conv.id,
        last_sent_at: new Date().toISOString()
      });
      autoReply = { sent: false, reason: 'human_active' };

    } else if ((conv as any).ai_paused_until && new Date((conv as any).ai_paused_until).getTime() > Date.now()) {
      // Atendente humano está DIGITANDO no painel — IA pausada temporariamente.
      console.log(`IA pausada por digitação humana até ${(conv as any).ai_paused_until} (conv ${conv.id}).`);
      await admin.from('automation_logs').insert({
        contact_phone: phone,
        event_type: 'blocked_human_typing',
        reason: 'Human agent typing in panel',
        metadata: { conversation_id: conv.id, ai_paused_until: (conv as any).ai_paused_until }
      });
      // Envia aviso discreto ao aluno APENAS na primeira vez do handoff de digitação.
      if (!(conv as any).human_intro_sent) {
        try {
          await sendMessage('Um consultor da equipe vai te responder em instantes 🙏', 'human_intro');
          await admin.from('crm_conversations').update({ human_intro_sent: true }).eq('id', conv.id);
        } catch (e) {
          console.error('failed to send human_intro', e);
        }
      }
      autoReply = { sent: false, reason: 'human_typing' };

    } else if (aiMode === 'ai_only' && withinHours && !todayNoticeActive) {
      // MODO AI GLOBAL: ignora fluxo e menus — IA responde tudo DENTRO do expediente.
      // Fora do horário, deixa cair para o bloco de ausência abaixo, senão o aluno
      // recebe resposta de IA 24h e nunca o aviso de fora de expediente.
      try {
        const ai = await generateAiReply({ admin, conversationId: conv.id, phone, waId: conv.wa_id, queue: conv.queue_type });
        if (ai.response) {
          const r = await sendMessage(ai.response, 'ai_only');
          autoReply = { sent: r.sent, engine: ai.engine, mode: 'ai_only' };
        } else {
          autoReply = { sent: false, reason: 'ai_empty_response' };
        }
      } catch (e) {
        console.error('ai_only failed', e);
        autoReply = { sent: false, reason: 'ai_error', error: String(e) };
      }
    } else if (todayNoticeActive) {
      // Dedup: 1x por sessão / 4h, como o away.
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const { data: lastNotice } = await admin.from('crm_messages')
        .select('id')
        .eq('conversation_id', conv.id)
        .eq('direction', 'out')
        .gt('created_at', fourHoursAgo)
        .filter('metadata->>tag', 'eq', 'today_notice')
        .maybeSingle();
      if (isNewSession || !lastNotice) {
        const r = await sendMessage(todayNoticeMessage, 'today_notice');
        autoReply = { sent: r.sent, engine: 'today_notice' };
      } else {
        autoReply = { sent: false, reason: 'today_notice_already_sent' };
      }
    } else if (!withinHours) {
      // Fora do horário de expediente: SEMPRE enviar mensagem de ausência,
      // independente de canal, identificação (lead/ativo/vencido) ou estado
      // da conversa (nova sessão, fluxo em andamento, etc.). Dedup por 4h
      // via crm_away_locks para não repetir na mesma janela.
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      
      // Tentamos buscar um "lock" ativo para esta conversa
      const { data: awayLock } = await admin.from('crm_away_locks')
        .select('last_sent_at')
        .eq('conversation_id', conv.id)
        .gt('last_sent_at', fourHoursAgo)
        .maybeSingle();

      if (!awayLock) {
        // Se não houver lock ativo, marcamos ou atualizamos o lock ANTES de enviar para evitar race conditions
        const { error: lockErr } = await admin.from('crm_away_locks').upsert({ 
          conversation_id: conv.id, 
          last_sent_at: new Date().toISOString() 
        });
        
        if (lockErr) console.error('Error setting away lock:', lockErr);
        let msg = '';
        // Link sempre disponível para a IA / fallback usar nas mensagens
        const renewalLink = (identifiedAs === 'aluno_ativo' || identifiedAs === 'aluno_vencido' || identifiedAs === 'ex_aluno')
          ? (profile?.user_id ? `https://sthmethod.com.br/renovacao?u=${profile.user_id}` : 'https://sthmethod.com.br/renovacao')
          : 'https://sthmethod.com.br/cadastro';

        // ============================================================
        // AWAY ATIVO COM IA (STHIA) — fora do expediente, sem humano,
        // a IA gera a mensagem persuasiva seguindo a política do canal:
        //   - lead          → 1ª adesão (ancora plano 90D, link /cadastro)
        //   - aluno_vencido / ex_aluno → renovação (link /renovacao)
        //   - aluno_ativo   → ausência cordial (sem vender)
        // Mantemos o framing "fora do expediente" e o retorno humano no
        // próximo turno. Em caso de falha da IA, caímos no texto estático.
        // ============================================================
        const tryAiAway = async (queueForAi: 'comercial' | 'sucesso' | 'nutri'): Promise<string | null> => {
          try {
            const promptKey = queueForAi === 'sucesso' ? 'ai_prompt_sucesso'
              : queueForAi === 'nutri' ? 'ai_prompt_nutri'
              : 'ai_prompt_comercial';
            const { engine, systemPrompt: basePrompt } = await loadEngineAndPrompt(admin as any, promptKey as any);

            const { data: msgs } = await admin
              .from('crm_messages')
              .select('direction, body, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(8);
            const history = (msgs || []).reverse()
              .map((m: any) => `${m.direction === 'in' ? 'Contato' : 'Atendente'}: ${m.body}`)
              .join('\n');

            let ctx = '';
            if (profile?.user_id) {
              const dossier = await buildStudentContext(admin as any, profile.user_id);
              if (dossier) ctx += dossier + '\n';
            } else if (profile) {
              ctx += `Contato: ${profile.full_name || displayName || ''} | Objetivo: ${(profile as any).objective || '—'}\n`;
            } else if (displayName) {
              ctx += `Contato: ${displayName}\n`;
            }
            if (history) ctx += `\nHistórico recente:\n${history}\n`;

            const memories = await fetchAiMemories(admin as any, { phone, userId: profile?.user_id || null });
            const systemPrompt = basePrompt + renderMemoryBlock(memories);

            const intentBlock = identifiedAs === 'lead'
              ? `INTENÇÃO: 1ª ADESÃO. Conduza com abordagem consultiva/psicanalítica do método, ancorando o Plano 90D (Trimestral) como ideal (12 semanas = ciclo biológico completo), sem esconder os demais planos. Inclua o link de cadastro: ${renewalLink}`
              : (identifiedAs === 'aluno_ativo'
                  ? `INTENÇÃO: AUSÊNCIA CORDIAL para aluno ATIVO. NÃO vender, NÃO oferecer plano. Apenas reconhecer fora do expediente e orientar a aguardar retorno humano no próximo turno. Se for dúvida técnica, mencionar o canal "Fale com o Nutri".`
                  : `INTENÇÃO: RENOVAÇÃO de aluno ${identifiedAs === 'ex_aluno' ? 'EX-ALUNO' : 'COM PLANO VENCIDO'}. Reengaje com tom consultivo do método, reforçando continuidade biológica e resultado, e ofereça renovação 100% automatizada. Inclua o link: ${renewalLink}`);

            const awayFirstName = ((profile?.full_name as string) || displayName || '').toString().trim().split(/\s+/)[0] || '';
            const awayNameGuard = queueForAi !== 'nutri'
              ? `\n⚠️ REGRA DE NOME: ${awayFirstName ? `o interlocutor se chama "${awayFirstName}" — use APENAS este primeiro nome.` : 'sem nome no contexto — trate por "você".'} NUNCA chame o interlocutor de "Alexandre" (nome exclusivo do Nutri) nem invente outro nome.`
              : '';
            const userPrompt = `${ctx}${awayNameGuard}
⚠️ MODO AUSÊNCIA (fora do horário de expediente — sem humano disponível agora).
Você é a STHIA respondendo no canal ${queueForAi.toUpperCase()}.
REGRAS DESTE TURNO:
- Deixe claro, em uma linha, que estamos fora do expediente e que o time humano retorna no próximo turno.
- Mantenha persona e tom STH METHOD (técnico, consultivo, neutro, em PT-BR).
- ${intentBlock}
- Máximo 5 frases curtas. Sem emojis em excesso.
- NÃO prometa retorno imediato; enfatize a alternativa 100% automatizada quando houver link.
- NÃO cite "Sucesso do Aluno" como canal externo (está suspenso).
- NUNCA use a expressão "modo deus" (nem variações).

Gere a mensagem final agora.`;

            const reply = await callAiEngine({ engine, systemPrompt, userPrompt });
            return (reply?.response || '').trim() || null;
          } catch (e) {
            console.error('away_ai_failed', e);
            return null;
          }
        };

        if (provider === 'zapi') {
          // Comercial (Z-API)
          const aiMsg = await tryAiAway('comercial');
          if (aiMsg) { msg = aiMsg; }
          else
          if (identifiedAs === 'lead') {
            msg = comAwayLead?.value?.message || "Olá! No momento estamos fora do horário de expediente no canal Comercial.\n\nPara conhecer nossos planos e fazer sua *1ª adesão* agora mesmo, de forma 100% automatizada, acesse:\n\n🌐 Cadastro e planos: https://sthmethod.com.br/cadastro\n\nResponderemos sua mensagem assim que retornarmos! 👋";
          } else if (identifiedAs === 'aluno_ativo') {
            msg = comAwayActive?.value?.message || "Olá! No momento estamos fora do horário de expediente no canal Comercial.\n\nDeixe sua mensagem que retornamos no próximo expediente. Se for dúvida técnica de consultoria, fale com seu Nutri pelo canal *Fale com o Nutri*.\n\nObrigado pela paciência! 👋";
          } else {
            msg = comAwayExpired?.value?.message || "Olá! No momento estamos fora do horário de expediente no canal Comercial.\n\nLocalizamos seu cadastro e vimos que seu plano está inativo. Para *renovar agora* de forma 100% automatizada:\n\n🔗 Renovação: {link_renovacao}\n🌐 Site: https://sthmethod.com.br\n\nResponderemos sua mensagem assim que retornarmos! 👋";
          }
        } else if (provider === 'wapi_sucesso') {
          // Sucesso do Aluno (W-API Sucesso)
          if (identifiedAs === 'lead') {
            msg = comAwayLead?.value?.message || "Olá! 🌙 Nosso atendimento de hoje foi encerrado.\n\nPara conhecer nossos planos e realizar seu cadastro agora mesmo, acesse:\n\n🌐 Cadastro: https://sthmethod.com.br/cadastro\n\nResponderemos sua mensagem assim que retornarmos! 👋";
          } else {
            msg = "Olá! No momento estamos fora do horário de expediente no canal Sucesso do Aluno.\n\nPara um autoatendimento rápido, você pode utilizar as opções abaixo:\n\n1️⃣ Atualizar Peso/Medidas (App)\n2️⃣ Renovação de Plano: {link_renovacao}\n3️⃣ Financeiro/Pagamentos: https://sthmethod.com.br/financeiro\n\nDeixe sua mensagem e responderemos assim que retornarmos! 👋";
          }
        } else {
          // Fale com o Nutri (W-API)
          const aiMsg = await tryAiAway('nutri');
          if (aiMsg) { msg = aiMsg; }
          else if (identifiedAs === 'aluno_ativo') msg = nutriAwayActive?.value?.message || "Olá! No momento estamos fora do horário de expediente no canal Fale com o Nutri. Deixe sua dúvida técnica e responderemos assim que retornarmos! 👋";
          else msg = nutriAwayInactive?.value?.message || "No momento estamos fora do horário de expediente no canal Fale com o Nutri.\n\nIdentificamos que sua consultoria está inativa. Você pode realizar sua renovação agora mesmo de forma automática:\n\n🔗 Renovação: {link_renovacao}\n🌐 Site: https://sthmethod.com.br";
        }
        if (msg) { 
          const r = await sendMessage(msg, 'away', null, undefined, { link_renovacao: renewalLink });
          autoReply = { sent: r.sent, engine: 'away_ai' };
        }
      } else {
        autoReply = { sent: false, reason: 'away_already_sent' };
      }
    } else if (provider === 'wapi' && identifiedAs !== 'aluno_ativo') {
      // BLOQUEIO DO CANAL "FALE COM O NUTRI": exclusivo para alunos ATIVOS.
      // Leads, alunos vencidos e ex-alunos são imediatamente redirecionados
      // para o canal Comercial, preservando a prioridade do aluno ativo.
      // Modo silencioso opcional — configurável em crm_settings.key='nutri_block_mode' ({ silent: true })
      const { data: modeRow } = await admin
        .from('crm_settings')
        .select('value')
        .eq('key', 'nutri_block_mode')
        .maybeSingle();
      const silentMode = !!(modeRow?.value as any)?.silent;
      const blockKey = `nutri_block_redirect_${conv.session_count || 1}`;
      const { data: existingBlock } = await admin
        .from('automation_logs')
        .select('id')
        .eq('contact_phone', phone)
        .eq('idempotency_key', blockKey)
        .eq('event_type', 'nutri_block_redirect')
        .maybeSingle();

      if (!existingBlock) {
        const renewalLink = profile?.user_id
          ? `https://sthmethod.com.br/renovacao?u=${profile.user_id}`
          : 'https://sthmethod.com.br/cadastro';

        const blockMsg = identifiedAs === 'lead'
          ? `Olá${FIRST_NAME ? ' ' + FIRST_NAME : ''}! 👋\n\nEste canal *Fale com o Nutri* é exclusivo para alunos ATIVOS da consultoria, para garantir prioridade no atendimento técnico de quem já está em acompanhamento.\n\nComo você ainda não possui consultoria ativa, o canal correto é o *Comercial*, onde nossa equipe vai te apresentar os planos e iniciar sua jornada:\n\n👉 https://wa.me/5521998496289\n🌐 Site: https://sthmethod.com.br\n\nEstamos encerrando este atendimento por aqui para você seguir pelo Comercial. Conte Comigo!`
          : `Olá${FIRST_NAME ? ' ' + FIRST_NAME : ''}! 👋\n\nEste canal *Fale com o Nutri* é exclusivo para alunos *ATIVOS* na consultoria — é o que garante o atendimento direto e o acompanhamento personalizado do *Nutri Alexandre*, com prioridade técnica para quem está em acompanhamento.\n\nIdentificamos que sua consultoria está *inativa* no momento. Para que suas dúvidas, ajustes e solicitações sejam respondidas pelo Nutri Alexandre de forma personalizada e dentro deste canal, é necessário estar com a consultoria ativa.\n\nPara reativar agora, de forma 100% automatizada:\n🔗 Renovação: ${renewalLink}\n\nAssim que sua consultoria for reativada, você volta a ser atendido(a) diretamente aqui no *Fale com o Nutri*, com acompanhamento personalizado.\n\nEnquanto isso, dúvidas comerciais (planos, valores, pagamento) seguem pelo canal *Comercial*:\n👉 https://wa.me/5521998496289\n\nConte Comigo! Bora pra cima.`;

        const r = silentMode
          ? { sent: false }
          : await sendMessage(blockMsg, 'nutri_block_redirect');

        await admin.from('crm_conversations').update({
          status: 'closed',
          flow_state: null,
          flow_context: { ...(conv.flow_context || {}), blocked_at: new Date().toISOString(), reason: 'inactive_on_nutri_channel' },
          session_started_at: null,
          session_expires_at: null,
        }).eq('id', conv.id);

        await admin.from('automation_logs').insert({
          contact_phone: phone,
          event_type: 'nutri_block_redirect',
          queue_type: 'nutri',
          action_taken: silentMode ? 'blocked_silent' : 'blocked_and_redirected',
          idempotency_key: blockKey,
          severity: 'info',
          metadata: { identified_as: identifiedAs, original_message: String(body).slice(0, 500), silent: silentMode },
        });

        autoReply = { sent: r.sent, engine: silentMode ? 'nutri_block_silent' : 'nutri_block_redirect' };
      } else {
        autoReply = { sent: false, reason: 'nutri_block_already_sent' };
      }
    } else if (!conv.flow_state) {
      if (provider === 'wapi') {
        if (identifiedAs === 'lead') {
          const r = await sendMessage(String(getFlowStep('nutri_ident_lead')?.message || 'Identificamos que você ainda não possui uma consultoria ativa...'), 'nutri_ident_lead', null, undefined, {}, getFlowStep('nutri_ident_lead'));
          autoReply = { sent: r.sent, engine: 'flow' };
        } else if (identifiedAs === 'aluno_vencido' || identifiedAs === 'ex_aluno') {
          const stepKey = identifiedAs === 'aluno_vencido' ? 'nutri_ident_inativo' : 'nutri_ident_exaluno';
          const flowStep = getFlowStep(stepKey);
          const r = await sendMessage(String(flowStep?.message || 'Localizamos seu cadastro, porém sua consultoria encontra-se inativa...'), stepKey, null, undefined, {}, flowStep);
          autoReply = { sent: r.sent, engine: 'flow' };
        } else {
          // ALUNO ATIVO - Menu de Recepção do Nutri
          const flowStep = getFlowStep('nutri_reception');
          
          // Idempotência por contato e ciclo de conversa (sessão)
          const idempotencyKey = `nutri_reception_${conv.session_count || 1}`;
          const { data: existingLog } = await admin
            .from('automation_logs')
            .select('id')
            .eq('contact_phone', phone)
            .eq('idempotency_key', idempotencyKey)
            .eq('event_type', 'menu_sent')
            .maybeSingle();

          if (!existingLog) {
            const r = await sendMessage(String(flowStep?.message || 'Olá! Você está no canal Fale com o Nutri...'), 'nutri_reception', null, undefined, {}, flowStep);
            
            await admin.from('automation_logs').insert({
              contact_phone: phone,
              event_type: 'menu_sent',
              queue_type: 'nutri',
              flow_state: 'nutri_main',
              action_taken: 'sent',
              idempotency_key: idempotencyKey,
              severity: 'info',
              metadata: { message: r.sent ? 'Success' : 'Failed', session_count: conv.session_count }
            });

            await admin.from('crm_conversations').update({ flow_state: 'nutri_main' }).eq('id', conv.id);
            autoReply = { sent: r.sent, engine: 'flow' };
          } else {
            autoReply = { sent: false, reason: 'idempotency_blocked' };
          }
        }

      } else if (provider === 'wapi_sucesso') {
        const flowStep = getFlowStep('sucesso_main_menu');
        // Prevenir duplicação no início da sessão (dedup 30s)
        const thirtySecsAgo = new Date(Date.now() - 30 * 1000).toISOString();
        const { data: recentMsg } = await admin.from('crm_messages')
          .select('id')
          .eq('conversation_id', conv.id)
          .eq('direction', 'out')
          .gt('created_at', thirtySecsAgo)
          .eq('metadata->>tag', 'sucesso_main_menu')
          .maybeSingle();

        if (!recentMsg) {
          const r = await sendMessage(String(flowStep?.message || 'Bem-vindo ao Sucesso do Aluno...'), 'sucesso_main_menu', null, undefined, {}, flowStep);
          await admin.from('crm_conversations').update({ flow_state: 'sucesso_main_menu', queue_type: 'sucesso' }).eq('id', conv.id);
          autoReply = { sent: r.sent, engine: 'flow' };
        } else {
          autoReply = { sent: false, reason: 'duplicate_prevented' };
        }
      } else {
        if (identifiedAs !== 'lead') {
          const step = identifiedAs === 'aluno_ativo' ? 'comercial_ident_ativo' : (identifiedAs === 'aluno_vencido' ? 'comercial_ident_inativo' : 'comercial_ident_exaluno');
          const flowStepIdent = getFlowStep(step);
          
          // Prevenir duplicação no início da sessão (dedup 30s)
          const thirtySecsAgo = new Date(Date.now() - 30 * 1000).toISOString();
          const { data: recentMsg } = await admin.from('crm_messages')
            .select('id')
            .eq('conversation_id', conv.id)
            .eq('direction', 'out')
            .gt('created_at', thirtySecsAgo)
            .eq('metadata->>tag', step)
            .maybeSingle();

          if (!recentMsg) {
            if (identifiedAs === 'aluno_ativo') {
              // Regra: aluno ATIVO que chega no canal Comercial deve ser
              // transferido DIRETAMENTE para o canal "Fale com o Nutri" (W-API).
              // 1) Saudação + aviso de transferência respondidos PELO próprio canal Comercial (Z-API).
              const transferMsg = String(
                flowStepIdent?.message ||
                `Olá${FIRST_NAME ? ' ' + FIRST_NAME : ''}! 👋\n\nIdentificamos que você já é aluno ativo da STH METHOD.\n\nO canal *Comercial* atende apenas novos interessados. Estamos te transferindo agora para o canal exclusivo *Fale com o Nutri*, onde nossa equipe técnica vai te atender. ✅\n\nNenhuma ação necessária — sua mensagem já foi encaminhada.`
              );
              await sendMessage(transferMsg, 'comercial_ident_ativo', null, undefined, {}, flowStepIdent);

              // 2) Atualiza a conversa para o canal Nutri e zera o estado de fluxo.
              await admin.from('crm_conversations').update({
                queue_type: 'nutri',
                flow_state: 'nutri_main',
                flow_context: { ...(conv.flow_context || {}), transferred_from: 'comercial', transferred_at: new Date().toISOString() },
              }).eq('id', conv.id);

              // 3) Saudação de recepção do Nutri enviada pelo canal W-API, já com a mensagem original do aluno encaminhada.
              const flowStepReception = getFlowStep('nutri_reception');
              const receptionBase = String(flowStepReception?.message || `Olá${FIRST_NAME ? ' ' + FIRST_NAME : ''}! Você está no canal *Fale com o Nutri* — atendimento técnico exclusivo para alunos ativos. 👨‍⚕️\n\nComo posso te ajudar?\n\n1️⃣ Dieta\n2️⃣ Treino\n3️⃣ Exames\n4️⃣ Protocolo\n5️⃣ Urgência`);
              const receptionMsg = `${receptionBase}\n\n———\n📩 *Mensagem recebida via Comercial:*\n"${String(body).trim().slice(0, 500)}"`;
              const r = await sendMessage(receptionMsg, 'nutri_reception', null, 'wapi', {}, flowStepReception);

              await admin.from('automation_logs').insert({
                contact_phone: phone,
                event_type: 'comercial_to_nutri_transfer',
                queue_type: 'nutri',
                flow_state: 'nutri_main',
                action_taken: 'transferred',
                severity: 'info',
                metadata: { identified_as: 'aluno_ativo', original_message: String(body).slice(0, 500) },
              });
              autoReply = { sent: r.sent, engine: 'flow', transfer: 'comercial->nutri' };
            } else {
              // Vencido / Ex-aluno continuam encaminhados para Sucesso do Aluno.
              await sendMessage(String(flowStepIdent?.message || 'Redirecionando para Sucesso...'), step, null, undefined, {}, flowStepIdent);
              const flowStepMain = getFlowStep('sucesso_main_menu');
              const r = await sendMessage(String(flowStepMain?.message || 'Bem-vindo ao Sucesso do Aluno...'), 'sucesso_main_menu', null, undefined, {}, flowStepMain);
              await admin.from('crm_conversations').update({ flow_state: 'sucesso_main_menu', queue_type: 'sucesso' }).eq('id', conv.id);
              autoReply = { sent: r.sent, engine: 'flow' };
            }
          } else {
            autoReply = { sent: false, reason: 'duplicate_prevented' };
          }
        } else {
          const flowStep = getFlowStep('comercial_saudacao_lead');
          const menuTemplate = 'Olá! Seja bem-vindo(a) à STH METHOD. 👋\n\nComo posso ajudar?\n\n1️⃣ Conhecer planos e valores\n2️⃣ Como funciona a metodologia\n3️⃣ Falar com um consultor\n4️⃣ Já sou aluno';
          const finalMenu = String(flowStep?.message || menuTemplate);
          const currentHash = await hashTemplate(finalMenu);

          // Idempotência por contato e ciclo de conversa (sessão)
          const idempotencyKey = `menu_lead_${conv.session_count || 1}`;
          
          const { data: existingLog } = await admin
            .from('automation_logs')
            .select('id')
            .eq('contact_phone', phone)
            .eq('idempotency_key', idempotencyKey)
            .eq('event_type', 'menu_sent')
            .maybeSingle();

          if (!existingLog) {
            const r = await sendMessage(finalMenu, 'comercial_saudacao_lead', null, undefined, {}, flowStep);
            
            await admin.from('automation_logs').insert({
              contact_phone: phone,
              event_type: 'menu_sent',
              queue_type: 'comercial',
              flow_state: 'lead_main_menu',
              action_taken: 'sent',
              idempotency_key: idempotencyKey,
              template_hash: currentHash,
              severity: 'info',
              metadata: { message: r.sent ? 'Success' : 'Failed', session_count: conv.session_count }
            });

            await admin.from('crm_conversations').update({ flow_state: 'lead_main_menu' }).eq('id', conv.id);
            autoReply = { sent: r.sent, engine: 'flow' };
          } else {
            await admin.from('automation_logs').insert({
              contact_phone: phone,
              event_type: 'menu_blocked',
              queue_type: 'comercial',
              flow_state: 'lead_main_menu',
              action_taken: 'blocked',
              idempotency_key: idempotencyKey,
              severity: 'warning',
              reason: 'Idempotency blocked (menu already sent in this session)'
            });
            autoReply = { sent: false, reason: 'idempotency_blocked' };
          }
        }
      }
    } else if (conv.flow_state === 'nutri_main') {
      const trimmed = body.trim();
      const has = (...kw: string[]) => kw.some(k => body.toLowerCase().includes(k));
      
      if (trimmed === '1') {
        const flowStep = getFlowStep('nutri_dieta');
        const r = await sendMessage(String(flowStep?.message || 'Sobre sua Dieta...'), 'nutri_dieta', null, undefined, {}, flowStep);
        autoReply = { sent: r.sent, engine: 'flow' };
      } else if (trimmed === '2') {
        const flowStep = getFlowStep('nutri_treino');
        const r = await sendMessage(String(flowStep?.message || 'Sobre seu Treino...'), 'nutri_treino', null, undefined, {}, flowStep);
        autoReply = { sent: r.sent, engine: 'flow' };
      } else if (trimmed === '3') {
        const flowStep = getFlowStep('nutri_exames');
        const r = await sendMessage(String(flowStep?.message || 'Sobre seus Exames...'), 'nutri_exames', null, undefined, {}, flowStep);
        autoReply = { sent: r.sent, engine: 'flow' };
      } else if (trimmed === '4') {
        const flowStep = getFlowStep('nutri_protocolo');
        const r = await sendMessage(String(flowStep?.message || 'Sobre seu Protocolo...'), 'nutri_protocolo', null, undefined, {}, flowStep);
        autoReply = { sent: r.sent, engine: 'flow' };
      } else if (trimmed === '5') {
        const flowStep = getFlowStep('nutri_urgencia');
        const r = await sendMessage(String(flowStep?.message || 'Sobre sua Urgência...'), 'nutri_urgencia', null, undefined, {}, flowStep);
        autoReply = { sent: r.sent, engine: 'flow' };
      } else if (has('renov', 'pagamento', 'pagar', 'cobran', 'segunda via', 'cadastro', 'senha', 'acesso', 'contrato', 'reativar')) {
        const flowStepTransfer = getFlowStep('nutri_transfer_sucesso');
        const r = await sendMessage(String(flowStepTransfer?.message || 'Sua solicitação é administrativa. Redirecionando para Sucesso...'), 'nutri_transfer_sucesso', null, undefined, {}, flowStepTransfer);
        await admin.from('crm_conversations').update({ flow_state: 'sucesso_main_menu', queue_type: 'sucesso' }).eq('id', conv.id);
        const flowStepSucesso = getFlowStep('sucesso_main_menu');
        await sendMessage(String(flowStepSucesso?.message || 'Bem-vindo ao Sucesso do Aluno...'), 'sucesso_main_menu', null, 'wapi_sucesso', {}, flowStepSucesso);
        autoReply = { sent: r.sent, engine: 'flow' };
      }

    } else if (conv.flow_state === 'sucesso_main_menu') {
      const trimmed = body.trim();
      const lower = trimmed.toLowerCase();
      const isBack = trimmed === '0' || ['menu','voltar','inicio','início','start'].includes(lower);
      const menuHint = '\n\n_Digite *0* para voltar ao menu ou *#SAIR* para encerrar._';

      if (isBack || trimmed === '1' || trimmed === '2' || trimmed === '3' || trimmed === '4' || trimmed === '5' || (trimmed === '6' && !(conv.flow_context as any)?.human_requested) || trimmed === '7') {
        await admin.from('crm_conversations').update({ flow_context: { ...(conv.flow_context || {}), error_count: 0 } }).eq('id', conv.id);
      }

      if (isBack) {
        const flowStepBack = getFlowStep('sucesso_main_menu');
        await sendMessage(String(flowStepBack?.message || 'Menu principal.'), 'sucesso_back_menu', null, undefined, {}, flowStepBack);
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
          await admin.from('crm_conversations').update({ flow_context: { ...(conv.flow_context || {}), error_count: 0 } }).eq('id', conv.id);
          await handoffConsultor();
        } else {
          await admin.from('crm_conversations').update({ flow_context: { ...(conv.flow_context || {}), human_requested: true } }).eq('id', conv.id);
          await sendMessage(selfHelp, 'sucesso_human_confirm');
        }
      } else if (trimmed === '7') {
        // Transferência automática para o Nutri — NÃO marcar human_handoff (deixar o bot do Nutri assumir).
        const flowStepNutri = getFlowStep('sucesso_nutri_handoff');
        await sendMessage(String(flowStepNutri?.message || 'Transferindo para o Nutri...'), 'sucesso_nutri', null, undefined, {}, flowStepNutri);
        await admin.from('crm_conversations').update({
          flow_state: null,
          flow_context: {},
          human_handoff: false,
          queue_type: 'nutri',
        }).eq('id', conv.id);
        const flowStepReception = getFlowStep('nutri_reception');
        await sendMessage(String(flowStepReception?.message || 'Olá! Você está no canal Fale com o Nutri...'), 'nutri_reception', null, 'wapi', {}, flowStepReception);
      } else {
        // Increment error count to prevent infinite loops
        const errorCount = ((conv.flow_context as any)?.error_count || 0) + 1;
        if (errorCount >= 3) {
          const stopMsg = "Ops, parece que não estou conseguindo te entender. Para não te atrapalhar, vou aguardar você digitar uma opção válida ou aguardar um atendente humano.\n\n_Dica: Digite apenas o número da opção desejada._";
          await sendMessage(stopMsg, 'sucesso_error_limit');
          await admin.from('crm_conversations').update({ flow_context: { ...(conv.flow_context || {}), error_count: 0 } }).eq('id', conv.id);
        } else {
          await admin.from('crm_conversations').update({ flow_context: { ...(conv.flow_context || {}), error_count: errorCount } }).eq('id', conv.id);
          await sendMessage(String(getFlowStep('sucesso_main_menu')?.message || 'Escolha uma opção válida.') + menuHint, 'sucesso_repeat');
        }
      }
      autoReply = { sent: true, engine: 'flow' };
    } else if (conv.flow_state === 'lead_main_menu') {
      const trimmed = body.trim();
      const lower = trimmed.toLowerCase();
      const isBack = trimmed === '0' || ['menu','voltar','inicio','início','start'].includes(lower);

      if (isBack) {
        const flowStep = getFlowStep('comercial_saudacao_lead');
        await sendMessage(String(flowStep?.message || 'Como posso ajudar?\n1️⃣ Conhecer planos\n2️⃣ Como funciona\n3️⃣ Falar com consultor\n4️⃣ Já sou aluno'), 'com_repeat', null, undefined, {}, flowStep);
      } else if (trimmed === '1') { 
        await admin.from('crm_conversations').update({ flow_context: { ...(conv.flow_context || {}), error_count: 0 } }).eq('id', conv.id);
        const plans = await getPlansFormatted(admin);
        const flowStep = getFlowStep('comercial_lista_planos');
        await sendMessage(String(flowStep?.message || '{planos}').replace('{planos}', plans), 'com_planos', null, undefined, { planos: plans }, flowStep);
      }
      else if (trimmed === '2') {
        await admin.from('crm_conversations').update({ flow_context: { ...(conv.flow_context || {}), error_count: 0 } }).eq('id', conv.id);
        const flowStep = getFlowStep('comercial_menu_2_como_funciona');
        await sendMessage(String(flowStep?.message || 'A STH METHOD é uma consultoria científica...'), 'com_como_funciona', null, undefined, {}, flowStep);
      }
      else if (trimmed === '3') {
        await admin.from('crm_conversations').update({ flow_context: { ...(conv.flow_context || {}), error_count: 0 } }).eq('id', conv.id);
        await handoffConsultor(); 
      }
      else if (trimmed === '4') {
        await admin.from('crm_conversations').update({ flow_context: { ...(conv.flow_context || {}), error_count: 0 } }).eq('id', conv.id);
        const flowStep = getFlowStep('comercial_sucesso_handoff');
        await sendMessage(String(flowStep?.message || 'Redirecionando para o Sucesso do Aluno...'), 'com_sucesso_redirect', null, undefined, {}, flowStep);
        
        // Transferência real de fila
        await admin.from('crm_conversations').update({
          queue_type: 'sucesso',
          flow_state: 'sucesso_main_menu'
        }).eq('id', conv.id);
        
        const flowStepSucesso = getFlowStep('sucesso_main_menu');
        await sendMessage(String(flowStepSucesso?.message || 'Bem-vindo ao Sucesso do Aluno...'), 'sucesso_main_menu', null, 'wapi_sucesso', {}, flowStepSucesso);
      }
      else { 
        // Fallback inteligente: em vez de repetir o menu, deixar a AI responder
        // de forma humanizada quando o lead escreve texto livre.
        const ai = await generateAiReply({ admin, conversationId: conv.id, phone, waId: conv.wa_id, queue: conv.queue_type });
        if (ai?.response) {
          await sendMessage(ai.response, 'ai_smart_fallback');
          await admin.from('crm_conversations').update({
            flow_context: { ...(conv.flow_context || {}), error_count: 0 },
          }).eq('id', conv.id);
          await admin.from('automation_logs').insert({
            contact_phone: phone,
            event_type: 'ai_smart_fallback',
            queue_type: 'comercial',
            flow_state: 'lead_main_menu',
            action_taken: 'ai_reply',
            severity: 'info',
            metadata: { engine: ai.engine || 'ai' },
          });
        } else {
          // Se a AI não respondeu, cai no menu padrão (sem loop crítico)
          const flowStep = getFlowStep('comercial_saudacao_lead');
          const menuTemplate = 'Olá! Seja bem-vindo(a) à STH METHOD. 👋\n\nComo posso ajudar?\n\n1️⃣ Conhecer planos e valores\n2️⃣ Como funciona a metodologia\n3️⃣ Falar com um consultor\n4️⃣ Já sou aluno';
          await sendMessage(String(flowStep?.message || menuTemplate), 'com_repeat', null, undefined, {}, flowStep);
          await admin.from('automation_logs').insert({
            contact_phone: phone,
            event_type: 'menu_repeat',
            queue_type: 'comercial',
            flow_state: 'lead_main_menu',
            action_taken: 'sent',
            severity: 'warning',
            metadata: { reason: 'ai_no_response' },
          });
        }
      }
      autoReply = { sent: true, engine: 'flow' };
    }

    if (!autoReply && (aiMode === 'auto' || aiMode === 'ai_only')) {
      const ai = await generateAiReply({ admin, conversationId: conv.id, phone, waId: conv.wa_id, queue: conv.queue_type });
      if (ai.response) { const r = await sendMessage(ai.response, 'ai'); autoReply = { sent: r.sent, engine: ai.engine }; }
    }

    return await finish({ ok: true, autoReply });
  } catch (err) {
    console.error(err);
    if (lockAcquired && releaseLock) {
      await releaseLock().catch((releaseErr) => console.error('Failed to release crm_message_lock', releaseErr));
    }
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
