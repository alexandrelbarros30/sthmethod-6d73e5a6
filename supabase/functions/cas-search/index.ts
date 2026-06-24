import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const CHAT_MODEL = 'gemini-2.5-flash';

async function geminiAnswer(systemPrompt: string, userPrompt: string, apiKey: string, jsonMode = false): Promise<{ text: string | null; error: string | null }> {
  const r = await fetch(`${GEMINI_BASE}/models/${CHAT_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 4096,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    console.error('gemini chat failed', r.status, body);
    let msg = `Gemini ${r.status}`;
    if (r.status === 429) msg = 'Limite de uso da IA atingido. Tente novamente em alguns minutos ou contate o admin para aumentar a cota.';
    return { text: null, error: msg };
  }
  const j = await r.json();
  const parts = j?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p: { text?: string }) => p.text ?? '').join('').trim() || null;
  return { text, error: null };
}

// Expand query: original + per-token (>3 chars) to broaden recall, then dedup by id.
async function hybridSearch(
  supabase: ReturnType<typeof createClient>,
  q: string,
  discipline: string | null,
  matchCount: number,
) {
  const queries = new Set<string>([q]);
  for (const tok of q.split(/\s+/)) {
    const t = tok.replace(/[^\p{L}\p{N}\-]/gu, '').trim();
    if (t.length >= 4) queries.add(t);
  }
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
    const { query, discipline, withAnswer = true, matchCount = 10 } = await req.json();
    const q = String(query ?? '').trim();
    if (!q) {
      return new Response(JSON.stringify({ error: 'query obrigatória' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GEMINI_API_KEY_FALLBACK');
    if (!geminiKey) throw new Error('GEMINI_API_KEY ausente');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const matches = await hybridSearch(supabase, q, discipline || null, matchCount);

    let answer: string | null = null;
    let structured: any = null;
    let answerError: string | null = null;
    if (withAnswer && matches && matches.length > 0) {
      const context = (matches as Array<{ discipline: string; page_start: number; page_end: number; content: string }>)
        .map((m, i) => `[Fonte ${i + 1} • ${m.discipline} • p.${m.page_start}-${m.page_end}]\n${m.content}`)
        .join('\n\n---\n\n');
      const sys = `Você é o cérebro de estudo do CAS-PMERJ — um pesquisador preciso, no estilo Brainly/Passei Direto. Sua única base de conhecimento são os trechos fornecidos da apostila oficial. Nunca invente fora deles. Cite fontes como [Fonte N] sempre que afirmar algo. Se a resposta não está nos trechos, declare honestamente que o conteúdo não foi localizado e sugira reformular.

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

    return new Response(JSON.stringify({ answer, structured, answerError, matches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('cas-search', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});