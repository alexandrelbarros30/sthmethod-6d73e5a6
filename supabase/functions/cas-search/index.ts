import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const EMBED_MODEL = 'gemini-embedding-001';
const CHAT_MODEL = 'gemini-2.5-pro';
const EMBED_DIM = 1536;

async function geminiEmbed(text: string, apiKey: string): Promise<number[]> {
  const r = await fetch(`${GEMINI_BASE}/models/${EMBED_MODEL}:embedContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: EMBED_DIM,
    }),
  });
  if (!r.ok) throw new Error(`gemini embed ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.embedding.values as number[];
}

async function geminiAnswer(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string | null> {
  const r = await fetch(`${GEMINI_BASE}/models/${CHAT_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    }),
  });
  if (!r.ok) {
    console.error('gemini chat failed', r.status, await r.text());
    return null;
  }
  const j = await r.json();
  const parts = j?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: { text?: string }) => p.text ?? '').join('').trim() || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { query, discipline, withAnswer = true, matchCount = 6 } = await req.json();
    const q = String(query ?? '').trim();
    if (!q) {
      return new Response(JSON.stringify({ error: 'query obrigatória' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GEMINI_API_KEY_FALLBACK');
    if (!geminiKey) throw new Error('GEMINI_API_KEY ausente');

    const queryEmbedding = await geminiEmbed(q, geminiKey);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: matches, error } = await supabase.rpc('match_cas_chunks', {
      query_embedding: queryEmbedding as unknown as string,
      match_count: matchCount,
      filter_discipline: discipline || null,
    });
    if (error) throw new Error(error.message);

    let answer: string | null = null;
    if (withAnswer && matches && matches.length > 0) {
      const context = (matches as Array<{ discipline: string; page_start: number; page_end: number; content: string }>)
        .map((m, i) => `[Fonte ${i + 1} • ${m.discipline} • p.${m.page_start}-${m.page_end}]\n${m.content}`)
        .join('\n\n---\n\n');
      const sys = `Você é um tutor especializado nas apostilas do Curso de Aperfeiçoamento de Sargentos (CAS) da PMERJ. Responda APENAS com base nos trechos fornecidos. Cite as fontes no formato [Fonte N]. Seja didático, objetivo e estruturado (use tópicos quando ajudar). Se a resposta não estiver nos trechos, diga "Não encontrei esse conteúdo na apostila".`;
      const usr = `Pergunta do aluno:\n${q}\n\nTrechos da apostila:\n${context}\n\nResponda em português, com citações [Fonte N].`;
      answer = await geminiAnswer(sys, usr, geminiKey);
    }

    return new Response(JSON.stringify({ answer, matches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('cas-search', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});