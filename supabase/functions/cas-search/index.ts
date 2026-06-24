import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
// Cascata de modelos: tenta o mais capaz primeiro, cai para alternativas se sobrecarregado.
const CHAT_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Part = { text?: string; inline_data?: { mime_type: string; data: string } };

async function tryOnce(model: string, systemPrompt: string, parts: Part[], apiKey: string, jsonMode: boolean) {
  return await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
}

async function geminiAnswer(systemPrompt: string, parts: Part[] | string, apiKey: string, jsonMode = false): Promise<{ text: string | null; error: string | null }> {
  const partsArr: Part[] = typeof parts === 'string' ? [{ text: parts }] : parts;
  let lastStatus = 0;
  let lastBody = '';
  for (const model of CHAT_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await tryOnce(model, systemPrompt, partsArr, apiKey, jsonMode);
      if (r.ok) {
        const j = await r.json();
        const parts = j?.candidates?.[0]?.content?.parts ?? [];
        const text = parts.map((p: { text?: string }) => p.text ?? '').join('').trim() || null;
        return { text, error: null };
      }
      lastStatus = r.status;
      lastBody = await r.text();
      console.error(`gemini ${model} failed (attempt ${attempt + 1})`, r.status, lastBody.slice(0, 200));
      // retry só vale a pena em 503/429/500
      if (![429, 500, 503].includes(r.status)) break;
      await sleep(400 * (attempt + 1));
    }
  }
  let msg = `Consulta indisponível (${lastStatus}).`;
  if (lastStatus === 429) msg = 'Limite de uso atingido. Tente novamente em alguns minutos.';
  else if (lastStatus === 503) msg = 'Servidor de consulta sobrecarregado. Tente novamente em instantes.';
  return { text: null, error: msg };
}

// Detecta a intenção/tipo da pergunta a partir das "variáveis" linguísticas comuns.
function detectIntent(q: string): { intent: string; instruction: string } {
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

// Sinônimos/variáveis para expansão de recall na busca FTS.
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

// Expand query: original + per-token (>3 chars) to broaden recall, then dedup by id.
async function hybridSearch(
  supabase: ReturnType<typeof createClient>,
  q: string,
  discipline: string | null,
  matchCount: number,
) {
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
  return Array.from(seen.values())
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
    .slice(0, matchCount);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { query, discipline, withAnswer = true, matchCount = 10, attachment } = await req.json();
    let q = String(query ?? '').trim();

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GEMINI_API_KEY_FALLBACK');
    if (!geminiKey) throw new Error('GEMINI_API_KEY ausente');

    // Se veio um anexo (imagem/PDF), extrai a pergunta dele primeiro.
    let extractedFromFile: string | null = null;
    if (attachment?.data && attachment?.mime) {
      const sys = 'Você extrai o ENUNCIADO da questão presente na imagem/PDF. Devolva APENAS o texto da pergunta, sem alternativas, sem prefácio, sem comentários. Se houver alternativas A/B/C/D/E, inclua-as ao final como "Alternativas: A) ... B) ...". Português.';
      const r = await geminiAnswer(sys, [
        { text: 'Transcreva o enunciado da questão:' },
        { inline_data: { mime_type: attachment.mime, data: attachment.data } },
      ], geminiKey, false);
      extractedFromFile = (r.text ?? '').trim() || null;
      if (extractedFromFile) q = q ? `${q}\n\n${extractedFromFile}` : extractedFromFile;
    }

    if (!q) {
      return new Response(JSON.stringify({ error: 'query ou anexo obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const matches = await hybridSearch(supabase, q, discipline || null, matchCount);

    const intent = detectIntent(q);

    let answer: string | null = null;
    let structured: any = null;
    let answerError: string | null = null;
    if (withAnswer && matches && matches.length > 0) {
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
      const usr = `PERGUNTA DO ALUNO:\n${q}\n\nTRECHOS DA APOSTILA CAS:\n${context}\n\nResponda em português técnico-didático. Use markdown na resposta_completa (negrito, listas, parágrafos curtos). Cite [Fonte N] inline. Se nada nos trechos responder, devolva "encontrado": false e explique em resposta_curta.`;
      const result = await geminiAnswer(sys, usr, geminiKey, true);
      answerError = result.error;
      if (result.text) {
        try {
          structured = JSON.parse(result.text);
          answer = structured?.resposta_completa ?? null;
        } catch {
          answer = result.text; // fallback raw
        }
      }
    }

    return new Response(JSON.stringify({ answer, structured, answerError, matches, extractedQuery: extractedFromFile, intent: intent.intent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('cas-search', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});