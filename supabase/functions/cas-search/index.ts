import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const EMBED_MODEL = 'openai/text-embedding-3-small';
const CHAT_MODEL = 'google/gemini-3-flash-preview';

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

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY ausente');

    // 1) embed query
    const embResp = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, input: q, dimensions: 1536 }),
    });
    if (!embResp.ok) {
      const t = await embResp.text();
      return new Response(JSON.stringify({ error: `embed: ${embResp.status} ${t}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const embJson = await embResp.json();
    const queryEmbedding = embJson.data[0].embedding as number[];

    // 2) match
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
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
      const sys = `Você é um tutor especializado nas apostilas do Curso de Aperfeiçoamento de Sargentos (CAS) da PMERJ. Responda APENAS com base nos trechos fornecidos. Cite as fontes no formato [Fonte N] ao final de cada afirmação. Seja didático, objetivo e estruturado (use tópicos quando ajudar). Se a resposta não estiver nos trechos, diga "Não encontrei esse conteúdo na apostila".`;
      const usr = `Pergunta do aluno:\n${q}\n\nTrechos da apostila:\n${context}\n\nResponda em português, com citações [Fonte N].`;
      const chat = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CHAT_MODEL,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: usr },
          ],
        }),
      });
      if (chat.ok) {
        const cj = await chat.json();
        answer = cj.choices?.[0]?.message?.content ?? null;
      } else {
        console.error('chat failed', chat.status, await chat.text());
      }
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