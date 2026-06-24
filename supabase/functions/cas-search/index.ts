import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

export const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
export const CHAT_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash'];
export const LOVABLE_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
export const LOVABLE_MODELS = ['google/gemini-3-flash-preview', 'google/gemini-2.5-flash-lite'];
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Part = { text?: string; inline_data?: { mime_type: string; data: string } };
type AiStatus = 'ok' | 'quota_exhausted' | 'rate_limited' | 'upstream_error' | 'no_response' | 'config_error';
type RequestType = 'search' | 'attachment_extract';

type AiAnswer = {
  text: string | null;
  error: string | null;
  status: AiStatus;
  fallbackUsed: boolean;
  fallbackProvider: string | null;
  model: string | null;
  externalStatus: number | null;
};

type SearchMetrics = {
  cacheKey: string;
  query: string;
  discipline: string | null;
  intent: string | null;
  language: string;
  matchCount: number;
  requestType: RequestType;
  startedAt: number;
  status: AiStatus;
  httpStatus: number;
  cacheHit: boolean;
  fallbackUsed: boolean;
  fallbackProvider: string | null;
  model: string | null;
  externalStatus: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  matchesCount: number;
};

export function normalizeQuery(q: string) {
  return q.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
}

export async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function makeCacheKey(params: {
  query: string;
  discipline?: string | null;
  intent?: string | null;
  language?: string;
  matchCount?: number;
  requestType?: RequestType;
  attachmentSignature?: string | null;
}) {
  return sha256Hex(JSON.stringify({
    v: 2,
    query: normalizeQuery(params.query),
    discipline: params.discipline || null,
    intent: params.intent || null,
    language: params.language || 'pt-BR',
    matchCount: params.matchCount ?? 10,
    requestType: params.requestType || 'search',
    attachmentSignature: params.attachmentSignature || null,
  }));
}

async function safeJson(req: Request) {
  try { return await req.json(); } catch { return {}; }
}

function isRetryable(status: number) {
  return status === 0 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function statusFromExternal(status: number): AiStatus {
  if (status === 402) return 'quota_exhausted';
  if (status === 429) return 'rate_limited';
  if (status >= 500 || status === 0) return 'upstream_error';
  return 'no_response';
}

function userMessageForStatus(status: AiStatus, externalStatus?: number | null) {
  if (status === 'quota_exhausted') return 'Quota de IA esgotada. Recarregue os créditos do workspace para continuar.';
  if (status === 'rate_limited') return 'Limite temporário de IA atingido. Tente novamente em alguns minutos.';
  if (status === 'upstream_error') return 'Serviço de IA instável no momento. Tente novamente em instantes.';
  if (status === 'config_error') return 'Configuração de IA indisponível no backend.';
  return `Consulta sem resposta do modelo${externalStatus ? ` (${externalStatus})` : ''}.`;
}

export async function tryOnce(model: string, systemPrompt: string, parts: Part[], apiKey: string, jsonMode: boolean, timeoutMs = 22000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 4096,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    });
  } finally {
    clearTimeout(t);
  }
}

function partsToGatewayContent(partsArr: Part[]) {
  const userContent = partsArr.map((p) => {
    if (p.text) return { type: 'text', text: p.text };
    if (p.inline_data) return { type: 'image_url', image_url: { url: `data:${p.inline_data.mime_type};base64,${p.inline_data.data}` } };
    return null;
  }).filter(Boolean);
  return userContent.length === 1 && (userContent[0] as any).type === 'text' ? (userContent[0] as any).text : userContent;
}

export async function geminiAnswer(
  systemPrompt: string,
  parts: Part[] | string,
  apiKey: string,
  jsonMode = false,
  fetchImpl: typeof fetch = fetch,
): Promise<AiAnswer> {
  const partsArr: Part[] = typeof parts === 'string' ? [{ text: parts }] : parts;
  let lastStatus = 0;
  let lastBody = '';

  for (const model of CHAT_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const oldFetch = globalThis.fetch;
        if (fetchImpl !== fetch) (globalThis as any).fetch = fetchImpl;
        const r = await tryOnce(model, systemPrompt, partsArr, apiKey, jsonMode);
        if (fetchImpl !== fetch) (globalThis as any).fetch = oldFetch;
        if (r.ok) {
          const j = await r.json();
          const parts = j?.candidates?.[0]?.content?.parts ?? [];
          const text = parts.map((p: { text?: string }) => p.text ?? '').join('').trim() || null;
          return { text, error: text ? null : 'Modelo retornou vazio.', status: text ? 'ok' : 'no_response', fallbackUsed: false, fallbackProvider: null, model, externalStatus: r.status };
        }
        lastStatus = r.status;
        lastBody = await r.text();
        console.error(JSON.stringify({ event: 'cas_search_gemini_failed', model, attempt: attempt + 1, status: r.status, body: lastBody.slice(0, 300) }));
        if (!isRetryable(r.status)) break;
        await sleep(400 * (attempt + 1));
      } catch (e) {
        lastStatus = 0;
        lastBody = String((e as Error)?.message || e);
        console.error(JSON.stringify({ event: 'cas_search_gemini_exception', model, attempt: attempt + 1, error: lastBody.slice(0, 300) }));
        await sleep(400 * (attempt + 1));
      }
    }
  }

  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  if (lovableKey) {
    const userContent = partsToGatewayContent(partsArr);
    for (const model of LOVABLE_MODELS) {
      try {
        const r = await fetchImpl(LOVABLE_GATEWAY, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Lovable-API-Key': lovableKey,
            'X-Lovable-AIG-SDK': 'manual-edge-function',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userContent },
            ],
            ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
          }),
        });
        if (r.ok) {
          const j = await r.json();
          const text = j?.choices?.[0]?.message?.content?.trim() || null;
          if (text) return { text, error: null, status: 'ok', fallbackUsed: true, fallbackProvider: 'lovable-gateway', model, externalStatus: lastStatus || r.status };
        } else {
          const body = await r.text();
          console.error(JSON.stringify({ event: 'cas_search_lovable_failed', model, status: r.status, body: body.slice(0, 300) }));
          lastStatus = r.status;
          lastBody = body;
          if (r.status === 402) {
            const status = 'quota_exhausted';
            return { text: null, error: userMessageForStatus(status), status, fallbackUsed: true, fallbackProvider: 'lovable-gateway', model, externalStatus: r.status };
          }
          if (!isRetryable(r.status)) break;
        }
      } catch (e) {
        lastStatus = 0;
        lastBody = String((e as Error)?.message || e);
        console.error(JSON.stringify({ event: 'cas_search_lovable_exception', model, error: lastBody.slice(0, 300) }));
      }
    }
  }

  const status = statusFromExternal(lastStatus);
  return { text: null, error: userMessageForStatus(status, lastStatus), status, fallbackUsed: Boolean(lovableKey), fallbackProvider: lovableKey ? 'lovable-gateway' : null, model: null, externalStatus: lastStatus || null };
}

export function detectIntent(q: string): { intent: string; instruction: string } {
  const s = q.toLowerCase().trim();
  const has = (re: RegExp) => re.test(s);
  if (has(/\b(o que (é|e|sao|são)|defina|definição de|significad[oa] de|conceito de|o que significa)\b/))
    return { intent: 'definicao', instruction: 'Forneça definição objetiva (1 frase) seguida de classificação/elementos.' };
  if (has(/\b(por\s*qu[eê]|porqu[eê]|qual a (razão|causa|motivo)|finalidade de|para que serve)\b/))
    return { intent: 'causa_finalidade', instruction: 'Explique a razão/finalidade com fundamento normativo citado.' };
  if (has(/\b(como|de que forma|procedimento|passo a passo|etapas)\b/))
    return { intent: 'procedimento', instruction: 'Liste o passo a passo numerado conforme a apostila.' };
  if (has(/\b(qual a diferença|diferença entre|distinção entre|comparar|comparação)\b/))
    return { intent: 'comparacao', instruction: 'Use uma tabela markdown comparando os itens lado a lado.' };
  if (has(/\b(quando|em que (caso|hipótese)|hipóteses de|prazo)\b/))
    return { intent: 'hipoteses', instruction: 'Liste hipóteses/prazos citando dispositivo legal.' };
  if (has(/\b(quem|competência de|atribuição|responsável por)\b/))
    return { intent: 'competencia', instruction: 'Indique autoridade competente com base legal.' };
  if (has(/\b(cite|liste|elenc[ao]|enumere|exemplos de|tipos de|espécies de|classificação)\b/))
    return { intent: 'enumeracao', instruction: 'Use lista enumerada, sem omitir itens.' };
  if (has(/\b(verdadeiro ou falso|certo ou errado|é correto|é verdadeiro|assinale)\b/))
    return { intent: 'julgamento', instruction: 'Responda CERTO/ERRADO já na primeira frase e justifique citando [Fonte N].' };
  return { intent: 'aberta', instruction: 'Responda de forma objetiva e didática.' };
}

const SYNONYMS: Record<string, string[]> = {
  pm: ['pmerj', 'polícia militar'],
  pmerj: ['pm', 'polícia militar'],
  cf: ['constituição', 'constituicao federal'],
  cpm: ['código penal militar'],
  cppm: ['código de processo penal militar'],
  cpp: ['código de processo penal'],
  cp: ['código penal'],
  rdpmerj: ['regulamento disciplinar'],
  oficial: ['oficiais'],
  praça: ['praças', 'praca'],
  flagrante: ['prisão em flagrante'],
  inquerito: ['inquérito policial militar', 'ipm'],
};

function expandTokens(q: string): string[] {
  const out = new Set<string>();
  for (const tok of q.split(/\s+/)) {
    const t = tok.replace(/[^\p{L}\p{N}\-]/gu, '').toLowerCase();
    if (t.length >= 3) {
      out.add(t);
      const syn = SYNONYMS[t];
      if (syn) syn.forEach((s) => out.add(s));
    }
  }
  return Array.from(out);
}

async function hybridSearch(supabase: ReturnType<typeof createClient>, q: string, discipline: string | null, matchCount: number) {
  const queries = new Set<string>([q]);
  for (const t of expandTokens(q)) if (t.length >= 4) queries.add(t);
  const seen = new Map<number, any>();
  for (const qq of queries) {
    const { data, error } = await supabase.rpc('search_cas_chunks_fts', {
      q: qq,
      match_count: matchCount,
      filter_discipline: discipline || null,
    });
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as any[]) {
      const prev = seen.get(row.id);
      if (!prev || (row.similarity ?? 0) > (prev.similarity ?? 0)) seen.set(row.id, row);
    }
  }
  return Array.from(seen.values()).sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0)).slice(0, matchCount);
}

async function logMetrics(supabase: ReturnType<typeof createClient>, m: SearchMetrics) {
  const durationMs = Math.max(0, Math.round(performance.now() - m.startedAt));
  console.info(JSON.stringify({
    event: 'cas_search_metrics',
    duration_ms: durationMs,
    status: m.status,
    cache_hit: m.cacheHit,
    fallback_used: m.fallbackUsed,
    external_status: m.externalStatus,
    matches_count: m.matchesCount,
    intent: m.intent,
  }));
  try {
    await supabase.from('cas_search_logs').insert({
      cache_key: m.cacheKey,
      query: m.query.slice(0, 1000),
      discipline: m.discipline,
      intent: m.intent,
      language: m.language,
      match_count: m.matchCount,
      request_type: m.requestType,
      duration_ms: durationMs,
      status: m.status,
      http_status: m.httpStatus,
      cache_hit: m.cacheHit,
      fallback_used: m.fallbackUsed,
      fallback_provider: m.fallbackProvider,
      model: m.model,
      external_status: m.externalStatus,
      error_code: m.errorCode,
      error_message: m.errorMessage?.slice(0, 1000) ?? null,
      matches_count: m.matchesCount,
    });
  } catch (e) {
    console.error(JSON.stringify({ event: 'cas_search_log_insert_failed', error: String((e as Error)?.message || e) }));
  }
}

async function readCache(supabase: ReturnType<typeof createClient>, cacheKey: string) {
  const { data, error } = await supabase
    .from('cas_search_cache')
    .select('response, hit_count, expires_at')
    .eq('cache_key', cacheKey)
    .maybeSingle();
  if (error) {
    console.error(JSON.stringify({ event: 'cas_search_cache_read_failed', error: error.message }));
    return null;
  }
  if (!data || new Date(data.expires_at).getTime() < Date.now()) return null;
  await supabase.from('cas_search_cache').update({ hit_count: (data.hit_count ?? 0) + 1, updated_at: new Date().toISOString() }).eq('cache_key', cacheKey);
  return data.response;
}

async function writeCache(supabase: ReturnType<typeof createClient>, payload: {
  cacheKey: string;
  query: string;
  discipline: string | null;
  intent: string;
  language: string;
  matchCount: number;
  requestType: RequestType;
  response: Record<string, unknown>;
}) {
  try {
    await supabase.from('cas_search_cache').upsert({
      cache_key: payload.cacheKey,
      query: payload.query.slice(0, 2000),
      discipline: payload.discipline,
      intent: payload.intent,
      language: payload.language,
      match_count: payload.matchCount,
      request_type: payload.requestType,
      response: payload.response,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    }, { onConflict: 'cache_key' });
  } catch (e) {
    console.error(JSON.stringify({ event: 'cas_search_cache_write_failed', error: String((e as Error)?.message || e) }));
  }
}

function responseJson(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const startedAt = performance.now();
  let metricsSupabase: ReturnType<typeof createClient> | null = null;
  let metrics: SearchMetrics | null = null;
  try {
    const body = await safeJson(req);
    const { query, discipline, withAnswer = true, matchCount = 10, attachment, type = 'search', language = 'pt-BR', bypassCache = false } = body;
    let q = String(query ?? '').trim();
    const boundedMatchCount = Math.min(Math.max(Number(matchCount) || 10, 1), 20);
    const requestType: RequestType = type === 'attachment_extract' ? 'attachment_extract' : 'search';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);
    metricsSupabase = supabase;

    if (!q && !attachment?.data) {
      return responseJson({ error: 'query ou anexo obrigatório', status: 'no_response', uiState: 'no_response' }, 400);
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GEMINI_API_KEY_FALLBACK');
    if (!geminiKey) {
      return responseJson({ error: userMessageForStatus('config_error'), status: 'config_error', uiState: 'no_response' }, 200);
    }

    let extractedFromFile: string | null = null;
    let attachmentSignature: string | null = null;
    if (attachment?.data && attachment?.mime) {
      attachmentSignature = await sha256Hex(`${attachment.mime}:${String(attachment.data).slice(0, 6000)}`);
      const sys = 'Você extrai o ENUNCIADO da questão presente na imagem/PDF. Devolva APENAS o texto da pergunta, sem alternativas, sem prefácio, sem comentários. Se houver alternativas A/B/C/D/E, inclua-as ao final como "Alternativas: A) ... B) ...". Português.';
      const r = await geminiAnswer(sys, [
        { text: 'Transcreva o enunciado da questão:' },
        { inline_data: { mime_type: attachment.mime, data: attachment.data } },
      ], geminiKey, false);
      extractedFromFile = (r.text ?? '').trim() || null;
      if (extractedFromFile) q = q ? `${q}\n\n${extractedFromFile}` : extractedFromFile;
      if (!extractedFromFile && r.status !== 'ok') {
        return responseJson({ error: r.error, answerError: r.error, status: r.status, uiState: r.status === 'quota_exhausted' ? 'quota_exhausted' : 'no_response', fallbackUsed: r.fallbackUsed }, 200);
      }
    }

    const intent = detectIntent(q);
    const cacheKey = await makeCacheKey({ query: q, discipline: discipline || null, intent: intent.intent, language, matchCount: boundedMatchCount, requestType, attachmentSignature });
    metrics = { cacheKey, query: q, discipline: discipline || null, intent: intent.intent, language, matchCount: boundedMatchCount, requestType, startedAt, status: 'ok', httpStatus: 200, cacheHit: false, fallbackUsed: false, fallbackProvider: null, model: null, externalStatus: null, errorCode: null, errorMessage: null, matchesCount: 0 };

    if (!bypassCache && withAnswer) {
      const cached = await readCache(supabase, cacheKey);
      if (cached) {
        metrics.cacheHit = true;
        metrics.matchesCount = Array.isArray((cached as any).matches) ? (cached as any).matches.length : 0;
        await logMetrics(supabase, metrics);
        return responseJson({ ...(cached as Record<string, unknown>), cacheHit: true, metrics: { cacheHit: true, fallbackUsed: false, durationMs: Math.round(performance.now() - startedAt) } });
      }
    }

    const matches = await hybridSearch(supabase, q, discipline || null, boundedMatchCount);
    metrics.matchesCount = matches.length;
    let answer: string | null = null;
    let structured: any = null;
    let answerError: string | null = null;
    let aiResult: AiAnswer | null = null;

    if (withAnswer && matches.length > 0) {
      const context = (matches as Array<{ discipline: string; page_start: number; page_end: number; content: string }>)
        .map((m, i) => `[Fonte ${i + 1} • ${m.discipline} • p.${m.page_start}-${m.page_end}]\n${m.content}`)
        .join('\n\n---\n\n');
      const sys = `Você é o cérebro de estudo do CAS-PMERJ — um pesquisador preciso, no estilo Brainly/Passei Direto. Sua única base de conhecimento são os trechos fornecidos da apostila oficial. Nunca invente fora deles. Cite fontes como [Fonte N] sempre que afirmar algo. Se a resposta não está nos trechos, declare honestamente que o conteúdo não foi localizado e sugira reformular.

TIPO DA PERGUNTA detectado: ${intent.intent}. ${intent.instruction}

Retorne SEMPRE um JSON válido com este schema exato:
{
  "resposta_curta": "1-2 frases diretas respondendo a pergunta (com [Fonte N])",
  "resposta_completa": "explicação didática em markdown, estruturada, com [Fonte N] inline",
  "pontos_chave": ["bullet 1", "bullet 2", "..."],
  "conceitos": [{"termo":"X","definicao":"... [Fonte N]"}],
  "questoes_relacionadas": ["pergunta de estudo 1", "pergunta 2", "pergunta 3"],
  "confianca": "alta" | "media" | "baixa",
  "encontrado": true | false
}`;
      const usr = `PERGUNTA DO ALUNO:\n${q}\n\nTRECHOS DA APOSTILA CAS:\n${context}\n\nResponda em ${language === 'pt-BR' ? 'português técnico-didático' : language}. Use markdown na resposta_completa (negrito, listas, parágrafos curtos). Cite [Fonte N] inline. Se nada nos trechos responder, devolva "encontrado": false e explique em resposta_curta.`;
      aiResult = await geminiAnswer(sys, usr, geminiKey, true);
      answerError = aiResult.error;
      metrics.status = aiResult.status;
      metrics.fallbackUsed = aiResult.fallbackUsed;
      metrics.fallbackProvider = aiResult.fallbackProvider;
      metrics.model = aiResult.model;
      metrics.externalStatus = aiResult.externalStatus;
      metrics.errorCode = aiResult.status !== 'ok' ? aiResult.status : null;
      metrics.errorMessage = aiResult.error;
      if (aiResult.text) {
        try {
          structured = JSON.parse(aiResult.text);
          answer = structured?.resposta_completa ?? null;
        } catch {
          answer = aiResult.text;
        }
      }
    }

    const uiState = metrics.status === 'quota_exhausted'
      ? 'quota_exhausted'
      : metrics.fallbackUsed && answer
        ? 'fallback_active'
        : !answer && !structured && matches.length === 0
          ? 'no_response'
          : !answer && answerError
            ? 'no_response'
            : 'success';

    const responseBody = {
      answer,
      structured,
      answerError,
      matches,
      extractedQuery: extractedFromFile,
      intent: intent.intent,
      status: metrics.status,
      uiState,
      cacheHit: false,
      fallbackUsed: metrics.fallbackUsed,
      fallbackProvider: metrics.fallbackProvider,
      metrics: {
        cacheHit: false,
        fallbackUsed: metrics.fallbackUsed,
        externalStatus: metrics.externalStatus,
        durationMs: Math.round(performance.now() - startedAt),
      },
    };

    if (withAnswer && (answer || structured)) {
      await writeCache(supabase, { cacheKey, query: q, discipline: discipline || null, intent: intent.intent, language, matchCount: boundedMatchCount, requestType, response: responseBody });
    }

    await logMetrics(supabase, metrics);
    return responseJson(responseBody);
  } catch (e) {
    const message = String((e as Error)?.message || e);
    console.error(JSON.stringify({ event: 'cas_search_unhandled', error: message }));
    if (metrics && metricsSupabase) {
      metrics.status = 'upstream_error';
      metrics.httpStatus = 200;
      metrics.errorCode = 'INTERNAL_ERROR';
      metrics.errorMessage = message;
      await logMetrics(metricsSupabase, metrics);
    }
    return responseJson({ error: 'Falha interna na consulta. Tente novamente em instantes.', answerError: message, status: 'upstream_error', uiState: 'no_response', fallbackUsed: false }, 200);
  }
});