import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateText } from 'npm:ai@4';
import { createOpenAICompatible } from 'npm:@ai-sdk/openai-compatible@0.2';

export const CHAT_MODELS = ['google/gemini-3-flash-preview', 'google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite'];
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
    v: 4,
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
  if (status === 'quota_exhausted') return 'Créditos da Lovable AI esgotados ou limite do workspace atingido. A resposta local continuará usando os trechos da apostila.';
  if (status === 'rate_limited') return 'Limite temporário de IA atingido. Tente novamente em alguns minutos.';
  if (status === 'upstream_error') return 'Serviço de IA instável no momento. Tente novamente em instantes.';
  if (status === 'config_error') return 'LOVABLE_API_KEY ausente no backend.';
  return `Consulta sem resposta do modelo${externalStatus ? ` (${externalStatus})` : ''}.`;
}

function partsToUserContent(parts: Part[]): any[] {
  return parts.map((p) => {
    if (p.text !== undefined) return { type: 'text', text: p.text };
    if (p.inline_data) {
      const { mime_type, data } = p.inline_data;
      if (mime_type.startsWith('image/')) {
        return { type: 'image', image: `data:${mime_type};base64,${data}` };
      }
      return { type: 'file', data, mediaType: mime_type };
    }
    return { type: 'text', text: '' };
  });
}

function classifyAiError(err: unknown): { status: AiStatus; externalStatus: number | null; message: string } {
  const anyErr = err as any;
  const msg = String(anyErr?.message || err || '');
  const status: number | undefined = anyErr?.statusCode || anyErr?.status || anyErr?.responseHeaders?.status;
  const ext = typeof status === 'number' ? status : (/\b(\d{3})\b/.exec(msg)?.[1] ? Number(/\b(\d{3})\b/.exec(msg)![1]) : null);
  if (ext === 403) return { status: 'quota_exhausted', externalStatus: 403, message: msg };
  if (ext === 429) return { status: 'rate_limited', externalStatus: 429, message: msg };
  if (ext === 402) return { status: 'quota_exhausted', externalStatus: 402, message: msg };
  if (ext && ext >= 500) return { status: 'upstream_error', externalStatus: ext, message: msg };
  return { status: 'no_response', externalStatus: ext, message: msg };
}

export async function geminiAnswer(
  systemPrompt: string,
  parts: Part[] | string,
  apiKey: string,
  jsonMode = false,
  _fetchImpl: typeof fetch = fetch,
): Promise<AiAnswer> {
  const partsArr: Part[] = typeof parts === 'string' ? [{ text: parts }] : parts;
  if (!apiKey) {
    return { text: null, error: userMessageForStatus('config_error'), status: 'config_error', fallbackUsed: false, fallbackProvider: null, model: null, externalStatus: null };
  }
  const provider = createOpenAICompatible({
    name: 'lovable',
    baseURL: 'https://ai.gateway.lovable.dev/v1',
    headers: {
      'Lovable-API-Key': apiKey,
      'X-Lovable-AIG-SDK': 'vercel-ai-sdk',
    },
  });

  const userContent = partsToUserContent(partsArr);
  let lastError: { status: AiStatus; externalStatus: number | null; message: string } | null = null;

  for (let modelIdx = 0; modelIdx < CHAT_MODELS.length; modelIdx++) {
    const modelId = CHAT_MODELS[modelIdx];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { text } = await generateText({
          model: provider(modelId),
          system: systemPrompt + (jsonMode ? '\n\nIMPORTANTE: responda APENAS com JSON válido, sem cercas de código nem texto fora do objeto JSON.' : ''),
          messages: [{ role: 'user', content: userContent as any }],
          temperature: 0.25,
          maxTokens: 4096,
          abortSignal: AbortSignal.timeout(28000),
        });
        const trimmed = (text ?? '').trim();
        if (trimmed) {
          return { text: trimmed, error: null, status: 'ok', fallbackUsed: modelIdx > 0, fallbackProvider: modelIdx > 0 ? `lovable-${modelId}` : null, model: modelId, externalStatus: 200 };
        }
        lastError = { status: 'no_response', externalStatus: 200, message: 'empty_response' };
        console.error(JSON.stringify({ event: 'cas_search_ai_empty', model: modelId, attempt: attempt + 1 }));
        break;
      } catch (e) {
        const info = classifyAiError(e);
        lastError = info;
        console.error(JSON.stringify({ event: 'cas_search_ai_failed', model: modelId, attempt: attempt + 1, status: info.externalStatus, error: info.message.slice(0, 300) }));
        if (info.status === 'quota_exhausted') {
          return { text: null, error: userMessageForStatus('quota_exhausted'), status: 'quota_exhausted', fallbackUsed: false, fallbackProvider: null, model: modelId, externalStatus: 402 };
        }
        if (info.status === 'rate_limited') {
          await sleep(600 * (attempt + 1));
          continue;
        }
        if (info.externalStatus && info.externalStatus < 500 && info.externalStatus !== 429) break;
        await sleep(400 * (attempt + 1));
      }
    }
  }

  const status = lastError?.status ?? 'no_response';
  return { text: null, error: userMessageForStatus(status, lastError?.externalStatus ?? null), status, fallbackUsed: false, fallbackProvider: null, model: null, externalStatus: lastError?.externalStatus ?? null };
}

export function detectIntent(q: string): { intent: string; instruction: string } {
  const s = stripAccents(q).toLowerCase().trim();
  const has = (re: RegExp) => re.test(s);
  if (has(/(^|\s)(o que e|o que sao|defina|definicao de|significado de|conceito de|o que significa)(\s|$)/))
    return { intent: 'definicao', instruction: 'Forneça definição objetiva (1 frase) seguida de classificação/elementos.' };
  if (has(/\b(por\s*que|porque|qual a (razao|causa|motivo)|finalidade de|para que serve)\b/))
    return { intent: 'causa_finalidade', instruction: 'Explique a razão/finalidade com fundamento normativo citado.' };
  if (has(/\b(como|de que forma|procedimento|passo a passo|etapas)\b/))
    return { intent: 'procedimento', instruction: 'Liste o passo a passo numerado conforme a apostila.' };
  if (has(/\b(qual a diferença|diferença entre|distinção entre|comparar|comparação)\b/))
    return { intent: 'comparacao', instruction: 'Use uma tabela markdown comparando os itens lado a lado.' };
  if (has(/\b(quando|em que (caso|hipotese)|hipoteses de|prazo)\b/))
    return { intent: 'hipoteses', instruction: 'Liste hipóteses/prazos citando dispositivo legal.' };
  if (has(/\b(quem|competencia de|atribuicao|responsavel por)\b/))
    return { intent: 'competencia', instruction: 'Indique autoridade competente com base legal.' };
  if (has(/\b(cite|liste|elenc[ao]|enumere|exemplos de|tipos de|especies de|classificacao)\b/))
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
  ferias: ['férias', 'controle de férias', 'calendário de férias', 'afastamentos temporários'],
  férias: ['ferias', 'controle de férias', 'calendário de férias', 'afastamentos temporários'],
};

function compactText(text: string, max = 700) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}...`;
}

const QUERY_STOP_WORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas',
  'que', 'qual', 'quais', 'quem', 'quando', 'como', 'onde', 'por', 'para', 'pra', 'sobre', 'explique', 'fale', 'cite', 'liste',
  'defina', 'definicao', 'definição', 'conceito', 'significado', 'significa', 'seria', 'sao', 'são', 'eh', 'é', 'cas', 'apostila',
]);

function normalizeSearchText(s: string) {
  return stripAccents(s).toLowerCase().replace(/\s+/g, ' ').trim();
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractFocusTerms(q: string) {
  const cleaned = normalizeSearchText(q)
    .replace(/\b(o que e|definicao de|defina|conceito de|significado de|o que significa|qual e|explique|fale sobre)\b/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ');
  const terms = cleaned
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !QUERY_STOP_WORDS.has(t));
  return Array.from(new Set(terms)).slice(0, 8);
}

function looksLikeQuestionBank(content: string) {
  const s = normalizeSearchText(content);
  const optionCount = (s.match(/\b[a-e]\s*[).:-]/g) ?? []).length;
  return optionCount >= 3 || /\b(gabarito|assinale|qual alternativa|que tipo de|certo ou errado|verdadeiro ou falso)\b/.test(s);
}

export function definitionScore(row: { content: string; discipline?: string; similarity?: number }, q: string, intent: string | null) {
  const content = normalizeSearchText(row.content);
  const terms = extractFocusTerms(q);
  let score = (Number(row.similarity) || 0) * 100;

  for (const term of terms) {
    const escaped = escapeRegExp(term);
    const occurrences = content.match(new RegExp(`\\b${escaped}\\b`, 'g'))?.length ?? 0;
    score += Math.min(occurrences, 8) * 10;

    if (intent === 'definicao') {
      const patterns = [
        new RegExp(`\\b${escaped}\\b.{0,180}\\b(e|sao|consiste|constitui|caracteriza|significa|trata-se|define-se)\\b`),
        new RegExp(`\\b(e|sao|constitui|consiste|caracteriza|significa|define-se)\\b.{0,180}\\b${escaped}\\b`),
        new RegExp(`\\bconstitui crime de ${escaped}\\b`),
        new RegExp(`\\b${escaped} se caracteriza\\b`),
        new RegExp(`\\btermo ${escaped}\\b`),
        /\bart\.?\s*1[ºo]?\b.{0,140}\bconstitui\b/,
      ];
      if (patterns.some((re) => re.test(content))) score += 140;
      if (new RegExp(`\\b${escaped} se caracteriza como\\b`).test(content)) score += 220;
      if (new RegExp(`\\btermo ${escaped}\\b.{0,100}\\bsignifica\\b`).test(content)) score += 180;
      if (new RegExp(`\\be o sofrimento|\\be produzir sofrimento|\\bsofrimento fisico ou mental\\b`).test(content)) score += 120;
    }
  }

  if (/\b(lei|art\.?|inciso|caput|constitui crime|crime de|caracteriza|significa|conceito|defini)\b/.test(content)) score += 30;
  if (looksLikeQuestionBank(row.content)) score -= 90;
  if (row.discipline === 'LEIS ESPECIAIS') score += 20;
  if (row.discipline === 'DIREITO PENAL MILITAR') score += 8;
  return score;
}

async function definitionLookup(supabase: any, q: string, discipline: string | null, intent: string, limit: number) {
  if (intent !== 'definicao') return [];
  const terms = extractFocusTerms(q);
  if (terms.length === 0) return [];

  const seen = new Map<number, any>();
  for (const term of terms) {
    const like = `%${term.replace(/[%_]/g, ' ')}%`;
    let qb = (supabase as any)
      .from('cas_chunks')
      .select('id, discipline, page_start, page_end, content')
      .ilike('content', like)
      .limit(80);
    if (discipline) qb = qb.eq('discipline', discipline);
    const { data, error } = await qb;
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as any[]) {
      const scored = { ...row, similarity: definitionScore(row, q, intent) / 1000 };
      const prev = seen.get(row.id);
      if (!prev || scored.similarity > (prev.similarity ?? 0)) seen.set(row.id, scored);
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => definitionScore(b, q, intent) - definitionScore(a, q, intent))
    .slice(0, Math.max(limit, 10));
}

function splitDefinitionSentences(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length >= 25);
}

function extractLocalDefinition(q: string, matches: Array<{ discipline: string; page_start: number; page_end: number; content: string }>) {
  const terms = extractFocusTerms(q);
  if (terms.length === 0) return null;

  const candidates: Array<{ text: string; sourceIndex: number; score: number }> = [];
  matches.forEach((m, sourceIdx) => {
    const sentences = splitDefinitionSentences(m.content);
    sentences.forEach((sentence, idx) => {
      const norm = normalizeSearchText(sentence);
      let score = 0;
      for (const term of terms) {
        const escaped = escapeRegExp(term);
        if (!new RegExp(`\\b${escaped}\\b`).test(norm)) continue;
        score += 20;
        if (new RegExp(`\\b${escaped}\\b.{0,120}\\b(e|sao|consiste|constitui|caracteriza|significa|define-se)\\b`).test(norm)) score += 100;
        if (new RegExp(`\\b${escaped} se caracteriza\\b`).test(norm)) score += 160;
        if (new RegExp(`\\btermo ${escaped}\\b.{0,100}\\bsignifica\\b`).test(norm)) score += 130;
        if (/\bsofrimento fisico ou mental\b|\bsofrimento ou a dor\b|\bproduzir sofrimento\b/.test(norm)) score += 80;
        if (/\bart\.?\s*1[ºo]?\b|\bconstitui crime\b|\blei\b/.test(norm)) score += 35;
      }
      if (looksLikeQuestionBank(sentence)) score -= 80;
      if (score <= 0) return;

      const continuation = sentences
        .slice(idx + 1, idx + 3)
        .filter((next) => {
          const n = normalizeSearchText(next);
          return /^(o termo|e o|e a|sao|consiste|trata-se|art\.?|i\.|i -)/.test(n) || /\b(sofrimento|dor|maus-tratos|constitui crime|violencia|grave ameaca)\b/.test(n);
        });
      const text = [sentence, ...continuation].join(' ').replace(/\s+/g, ' ').trim();
      candidates.push({ text, sourceIndex: sourceIdx + 1, score });
    });
  });

  return candidates.sort((a, b) => b.score - a.score)[0] ?? null;
}

function buildSourceFallbackAnswer(q: string, matches: Array<{ source?: string; discipline: string; page_start: number; page_end: number; content: string }>, answerError: string | null, intent = 'aberta') {
  const top = matches.slice(0, 3);
  const localDefinition = intent === 'definicao' ? extractLocalDefinition(q, top) : null;
  if (localDefinition) {
    const src = top[localDefinition.sourceIndex - 1];
    const term = extractFocusTerms(q)[0] ?? q.replace(/\s+/g, ' ').trim();
    const respostaCurta = `${localDefinition.text} [Fonte ${localDefinition.sourceIndex}]`;
    const respostaCompleta = [
      '**Definição localizada na apostila**',
      '',
      `${localDefinition.text} [Fonte ${localDefinition.sourceIndex}]`,
      '',
      `### Fonte ${localDefinition.sourceIndex} — APOSTILA · ${src.discipline} · p.${src.page_start}-${src.page_end}`,
      compactText(src.content, 900),
    ].join('\n');
    return {
      resposta_curta: respostaCurta,
      resposta_completa: respostaCompleta,
      pontos_chave: [
        `Definição direta encontrada em ${src.discipline}, páginas ${src.page_start}-${src.page_end}.`,
        'A resposta foi montada diretamente do trecho da apostila, sem conteúdo externo.',
      ],
      conceitos: [{ termo: term, definicao: respostaCurta }],
      analise_por_fonte: top.map((m, i) => ({
        fonte_index: i + 1,
        tipo: m.source === 'questoes' ? 'questoes' : 'apostila',
        resumo: i + 1 === localDefinition.sourceIndex ? 'Fonte principal: contém a definição literal solicitada.' : compactText(m.content, 220),
      })),
      questoes_relacionadas: [
        `Quais são as espécies de ${term}?`,
        `Qual é a previsão legal de ${term}?`,
        `Qual a diferença entre ${term} e maus-tratos?`,
      ],
      confianca: 'alta',
      encontrado: true,
    };
  }
  const respostaCurta = `Localizei conteúdo sobre "${q.replace(/\s+/g, ' ').trim()}" na apostila. A síntese automática pelo Gemini não foi concluída${answerError ? ` (${answerError})` : ''}, então estou exibindo a resposta técnica baseada diretamente nas fontes encontradas.`;
  const respostaCompleta = [
    `**Resultado localizado na apostila para:** ${q.replace(/\s+/g, ' ').trim()}`,
    '',
    answerError ? `> Gemini não concluiu a síntese agora: ${answerError}` : '> A resposta abaixo usa apenas os trechos localizados na base do CAS.',
    '',
    ...top.flatMap((m, i) => [
      `### Fonte ${i + 1} — ${(m.source === 'questoes' ? 'QUESTÕES' : 'APOSTILA')} · ${m.discipline} · ${m.source === 'questoes' ? 'prova oficial' : `p.${m.page_start}-${m.page_end}`}`,
      compactText(m.content),
      '',
    ]),
    '**Como estudar:** use essas fontes como base, revise o tópico na disciplina indicada e refaça a pergunta de forma mais específica se precisar de prazo, conceito, procedimento ou hipótese.',
  ].join('\n');

  return {
    resposta_curta: respostaCurta,
    resposta_completa: respostaCompleta,
    pontos_chave: top.map((m, i) => `Fonte ${i + 1} (${m.source === 'questoes' ? 'questões' : 'apostila'}): ${m.discipline}${m.source === 'questoes' ? '' : `, páginas ${m.page_start}-${m.page_end}`}.`),
    conceitos: [{ termo: q.replace(/\s+/g, ' ').trim(), definicao: compactText(top[0]?.content ?? 'Conteúdo localizado na apostila.', 260) }],
    analise_por_fonte: top.map((m, i) => ({
      fonte_index: i + 1,
      tipo: m.source === 'questoes' ? 'questoes' : 'apostila',
      resumo: compactText(m.content, 220),
    })),
    questoes_relacionadas: [
      `O que a apostila diz sobre ${q}?`,
      `Quais são os pontos principais de ${q}?`,
      `Em qual disciplina o tema ${q} aparece?`,
    ],
    confianca: 'media',
    encontrado: true,
  };
}

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

async function hybridSearch(supabase: any, q: string, discipline: string | null, matchCount: number, intent: string) {
  const queries = new Set<string>([q]);
  for (const t of expandTokens(q)) if (t.length >= 4) queries.add(t);
  const seen = new Map<number, any>();
  const perQueryCap = Math.max(matchCount, 20);
  for (const qq of queries) {
    const { data, error } = await (supabase as any).rpc('search_cas_chunks_fts', {
      q: qq,
      match_count: perQueryCap,
      filter_discipline: discipline || null,
    });
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as any[]) {
      const prev = seen.get(row.id);
      if (!prev || (row.similarity ?? 0) > (prev.similarity ?? 0)) seen.set(row.id, row);
    }
  }
  // Em perguntas de definição, injeta e prioriza trechos literais que contenham
  // padrões como "X é", "X se caracteriza", "constitui crime de X" etc.
  try {
    const definitionRows = await definitionLookup(supabase, q, discipline, intent, matchCount);
    for (const row of definitionRows) {
      const prev = seen.get(row.id);
      if (!prev || definitionScore(row, q, intent) > definitionScore(prev, q, intent)) seen.set(row.id, row);
    }
  } catch (e) {
    console.error(JSON.stringify({ event: 'cas_definition_lookup_failed', error: String((e as Error)?.message || e) }));
  }
  // TOC lookup: inject chunks de seções cujo título do sumário casa com a query
  try {
    const tocRows = await tocLookup(supabase, q, discipline, matchCount);
    for (const row of tocRows) {
      const prev = seen.get(row.id);
      if (!prev || (row.similarity ?? 0) > (prev.similarity ?? 0)) seen.set(row.id, row);
    }
  } catch (e) {
    console.error(JSON.stringify({ event: 'cas_toc_lookup_failed', error: String((e as Error)?.message || e) }));
  }
  // Dedup por página/disciplina para evitar que múltiplos chunks da mesma página dominem
  const sorted = Array.from(seen.values()).sort((a, b) => {
    if (intent === 'definicao') return definitionScore(b, q, intent) - definitionScore(a, q, intent);
    return (b.similarity ?? 0) - (a.similarity ?? 0);
  });
  const pageSeen = new Set<string>();
  const deduped: any[] = [];
  for (const m of sorted) {
    const key = `${m.discipline}::${m.page_start}`;
    if (pageSeen.has(key)) continue;
    pageSeen.add(key);
    deduped.push(m);
    if (deduped.length >= matchCount) break;
  }
  const apostila = deduped
    .map((m) => ({
      id: m.id,
      source: 'apostila' as const,
      discipline: m.discipline,
      page_start: m.page_start,
      page_end: m.page_end,
      content: m.content,
      similarity: m.similarity ?? 0,
    }));
  // Tela Pesquisar consulta APENAS a apostila (PDF). Questões ficam em outra aba.
  return apostila;
}

function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseTocEntries(content: string): Array<{ title: string; page: number }> {
  const out: Array<{ title: string; page: number }> = [];
  const re = /([A-Za-zÁÉÍÓÚÂÊÔÃÕÇÜáéíóúâêôãõçü0-9][^\n]*?)\s*\.{3,}\s*(\d{1,4})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const title = m[1].replace(/\s+/g, ' ').trim();
    const page = Number(m[2]);
    if (title.length >= 3 && title.length <= 120 && Number.isFinite(page)) {
      out.push({ title, page });
    }
  }
  return out;
}

async function tocLookup(supabase: any, q: string, discipline: string | null, matchCount: number) {
  const tokens = expandTokens(q).filter((t) => t.length >= 4);
  if (tokens.length === 0) return [];
  const normTokens = tokens.map((t) => stripAccents(t).toLowerCase());
  let qb = (supabase as any)
    .from('cas_chunks')
    .select('id, discipline, page_start, page_end, content')
    .lte('page_start', 12)
    .ilike('content', '%SUM%RIO%')
    .limit(40);
  if (discipline) qb = qb.eq('discipline', discipline);
  const { data, error } = await qb;
  if (error) throw new Error(error.message);

  const targetRanges: Array<{ discipline: string; from: number; to: number }> = [];
  for (const row of (data ?? []) as any[]) {
    const entries = parseTocEntries(row.content as string);
    if (entries.length === 0) continue;
    entries.sort((a, b) => a.page - b.page);
    for (let i = 0; i < entries.length; i++) {
      const titleNorm = stripAccents(entries[i].title).toLowerCase();
      const hits = normTokens.some((tok) => new RegExp(`\\b${tok}\\b`).test(titleNorm));
      if (!hits) continue;
      const from = Math.max(1, entries[i].page - 2);
      const next = entries.slice(i + 1).find((e) => e.page > entries[i].page);
      const to = next ? Math.max(from, next.page - 1) : entries[i].page + 6;
      targetRanges.push({ discipline: row.discipline, from, to });
    }
  }
  if (targetRanges.length === 0) return [];

  const results: any[] = [];
  for (const range of targetRanges.slice(0, 4)) {
    const { data: chunks } = await (supabase as any)
      .from('cas_chunks')
      .select('id, discipline, page_start, page_end, content')
      .eq('discipline', range.discipline)
      .gte('page_start', range.from)
      .lte('page_start', range.to)
      .order('page_start', { ascending: true })
      .limit(Math.max(4, matchCount));
    for (const c of (chunks ?? []) as any[]) {
      results.push({ ...c, similarity: 0.95 });
    }
  }
  return results;
}

async function searchQuizQuestions(supabase: any, q: string, discipline: string | null, limit: number) {
  const tokens = expandTokens(q).filter((t) => t.length >= 4).slice(0, 6);
  const terms = new Set<string>([q, ...tokens]);
  const seen = new Map<number, any>();
  for (const term of terms) {
    const like = `%${term.replace(/[%_]/g, ' ')}%`;
    let qb = (supabase as any)
      .from('cas_quiz_questions')
      .select('id, exam, discipline, question_num, statement, option_a, option_b, option_c, option_d, correct_answer, page_ref')
      .or(`statement.ilike.${like},option_a.ilike.${like},option_b.ilike.${like},option_c.ilike.${like},option_d.ilike.${like}`)
      .limit(limit);
    if (discipline) qb = qb.eq('discipline', discipline);
    const { data, error } = await qb;
    if (error) {
      console.error(JSON.stringify({ event: 'cas_quiz_questions_search_failed', error: error.message }));
      continue;
    }
    for (const row of (data ?? []) as any[]) {
      if (!seen.has(row.id)) seen.set(row.id, row);
    }
    if (seen.size >= limit) break;
  }
  return Array.from(seen.values()).slice(0, limit).map((row) => ({
    id: row.id,
    source: 'questoes' as const,
    discipline: row.discipline,
    page_start: row.page_ref ?? 0,
    page_end: row.page_ref ?? 0,
    exam: row.exam,
    question_num: row.question_num,
    statement: row.statement,
    options: { A: row.option_a, B: row.option_b, C: row.option_c, D: row.option_d },
    correct_answer: row.correct_answer,
    content: `[${row.exam} • Q${row.question_num}] ${row.statement}\nA) ${row.option_a}\nB) ${row.option_b}\nC) ${row.option_c}\nD) ${row.option_d}\nGabarito: ${row.correct_answer}`,
    similarity: 0.5,
  }));
}

async function logMetrics(supabase: any, m: SearchMetrics) {
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
    await (supabase as any).from('cas_search_logs').insert({
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

async function readCache(supabase: any, cacheKey: string) {
  const { data, error } = await (supabase as any)
    .from('cas_search_cache')
    .select('response, hit_count, expires_at')
    .eq('cache_key', cacheKey)
    .maybeSingle();
  if (error) {
    console.error(JSON.stringify({ event: 'cas_search_cache_read_failed', error: error.message }));
    return null;
  }
  if (!data || new Date(data.expires_at).getTime() < Date.now()) return null;
  await (supabase as any).from('cas_search_cache').update({ hit_count: (data.hit_count ?? 0) + 1, updated_at: new Date().toISOString() }).eq('cache_key', cacheKey);
  return data.response;
}

async function writeCache(supabase: any, payload: {
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
    await (supabase as any).from('cas_search_cache').upsert({
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

export async function handleCasSearch(req: Request) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const startedAt = performance.now();
  let metricsSupabase: any = null;
  let metrics: SearchMetrics | null = null;
  try {
    const body = await safeJson(req);
    const { query, discipline, withAnswer = true, matchCount = 10, attachment, type = 'search', language = 'pt-BR', bypassCache = false } = body;
    let q = String(query ?? '').trim();
    const boundedMatchCount = Math.min(Math.max(Number(matchCount) || 10, 1), 30);
    const requestType: RequestType = type === 'attachment_extract' ? 'attachment_extract' : 'search';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);
    metricsSupabase = supabase;

    const geminiKey = Deno.env.get('LOVABLE_API_KEY') ?? '';
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

    if (!q) {
      return responseJson({ error: 'query ou anexo obrigatório', status: 'no_response', uiState: 'no_response' }, 400);
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

    const matches = await hybridSearch(supabase, q, discipline || null, boundedMatchCount, intent.intent);
    metrics.matchesCount = matches.length;
    let answer: string | null = null;
    let structured: any = null;
    let answerError: string | null = null;
    let aiResult: AiAnswer | null = null;

    if (withAnswer && matches.length > 0) {
      const context = (matches as Array<{ source: string; discipline: string; page_start: number; page_end: number; content: string }>)
        .map((m, i) => {
          const tag = m.source === 'questoes' ? 'QUESTÕES (prova oficial)' : 'APOSTILA';
          const ref = m.source === 'questoes' ? `Q${(m as any).question_num ?? ''} • ${(m as any).exam ?? ''}` : `p.${m.page_start}-${m.page_end}`;
          return `[Fonte ${i + 1} • ${tag} • ${m.discipline} • ${ref}]\n${m.content}`;
        })
        .join('\n\n---\n\n');
      const sys = `Você é o MOTOR DE ESTUDOS INTELIGENTE do CAS-PMERJ — um sistema avançado de organização e recuperação de conhecimento educacional. Sua única base é o material oficial fornecido nos trechos. Nunca invente fora deles. Cite fontes como [Fonte N] sempre que afirmar algo. Se a resposta não está nos trechos, declare honestamente e sugira reformular.

TIPO DA PERGUNTA detectado: ${intent.intent}. ${intent.instruction}

EXPANSÃO AUTOMÁTICA DA CONSULTA (silenciosa): mesmo quando a pergunta vier curta ou genérica (ex.: "tortura", "IPM", "insulina"), trate-a internamente como um conjunto de subperguntas — o que é, características, leis/normas que tratam, conceitos relacionados, como costuma ser cobrado em prova — e responda cobrindo esses ângulos quando os trechos suportarem. Priorize SIGNIFICADO, não ocorrência literal da palavra: considere sinônimos, siglas, expressões equivalentes e termos correlatos. Corrija erros ortográficos da pergunta de forma silenciosa.

PRIORIDADE PEDAGÓGICA: (1) responder a dúvida real do aluno, (2) reduzir tempo de pesquisa, (3) trazer os conteúdos mais relevantes, (4) agrupar conteúdos semelhantes, (5) evitar redundância, (6) facilitar aprendizagem e retenção. O objetivo não é localizar palavras — é entregar CONHECIMENTO ÚTIL.

REGRA DE DEFINIÇÃO EXATA: se a pergunta pedir "o que é", "defina", "conceito" ou "significado", procure primeiro nas fontes frases definidoras literais (padrões como "X é", "X se caracteriza", "constitui crime de X", "consiste em", "significa"). A resposta_curta deve abrir com essa definição literal da apostila, sem trocar por espécies, questões de prova ou comentários laterais quando houver definição direta.

ESTRUTURA PEDAGÓGICA: primeiro entregue resposta objetiva, depois aprofunde. Sempre que possível, relacione o tema com outros conteúdos do material (campo "conceitos_relacionados") e disponibilize automaticamente material de estudo (pontos-chave, pegadinhas comuns, erros frequentes, dicas de memorização) no campo "modo_estudo".

ROTULAGEM DAS FONTES: cada fonte vem como APOSTILA (teórico) ou QUESTÕES (prova oficial com gabarito). Sempre indique o tipo na citação (ex.: "[Fonte 3 — QUESTÕES]"). Quando houver questões, comente brevemente resolução/gabarito.

FORMATAÇÃO OBRIGATÓRIA: nunca cole itens numerados ou alternativas no final do parágrafo anterior. Antes de qualquer item "1.", "2)", "A)", "B)", "C)" ou "D)", pule uma linha. Escreva o marcador em destaque e continue em novo parágrafo curto. Se a fonte vier condensada, reorganize visualmente sem alterar o sentido.

Retorne SEMPRE um JSON válido com este schema exato:
{
  "resposta_curta": "1-2 frases diretas respondendo a pergunta (com [Fonte N])",
  "resposta_completa": "explicação didática em markdown, estruturada, com [Fonte N] inline",
  "pontos_chave": ["bullet 1", "bullet 2", "..."],
  "conceitos": [{"termo":"X","definicao":"... [Fonte N]"}],
  "conceitos_relacionados": ["tema correlato 1", "tema correlato 2"],
  "modo_estudo": {"pegadinhas": ["..."], "erros_frequentes": ["..."], "dicas_memorizacao": ["..."]},
  "analise_por_fonte": [{"fonte_index": 1, "tipo": "apostila|questoes", "resumo": "o que esta fonte específica contribui para a resposta, 1-3 frases"}],
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

    if (!answer && !structured && matches.length > 0) {
      structured = buildSourceFallbackAnswer(q, matches, answerError, intent.intent);
      answer = structured.resposta_completa;
      metrics.fallbackUsed = true;
      metrics.fallbackProvider = 'fonte-local';
      metrics.errorCode = metrics.status !== 'ok' ? metrics.status : 'GEMINI_EMPTY_WITH_MATCHES';
      metrics.errorMessage = answerError || 'Gemini não retornou síntese; resposta montada com fontes locais.';
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
}

if (import.meta.main) {
  Deno.serve(handleCasSearch);
}