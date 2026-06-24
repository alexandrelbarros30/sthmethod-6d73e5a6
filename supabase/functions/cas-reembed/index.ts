import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_DIM = 1536;

async function embedBatch(texts: string[], apiKey: string): Promise<number[][]> {
  const r = await fetch(`${GEMINI_BASE}/models/${EMBED_MODEL}:batchEmbedContents?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: texts.map((t) => ({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text: t }] },
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: EMBED_DIM,
      })),
    }),
  });
  if (!r.ok) throw new Error(`batchEmbed ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.embeddings.map((e: { values: number[] }) => e.values);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GEMINI_API_KEY_FALLBACK');
    if (!geminiKey) throw new Error('GEMINI_API_KEY ausente');

    const url = new URL(req.url);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
    const limit = parseInt(url.searchParams.get('limit') ?? '200', 10);

    const { data: rows, error } = await supabase
      .from('cas_chunks')
      .select('id, content')
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ done: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const BATCH = 20;
    let processed = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH);
      const embeddings = await embedBatch(slice.map((r) => r.content.slice(0, 8000)), geminiKey);
      // update each row individually (vector type)
      await Promise.all(
        slice.map((row, idx) =>
          supabase.from('cas_chunks').update({ embedding: embeddings[idx] as unknown as string }).eq('id', row.id),
        ),
      );
      processed += slice.length;
    }

    return new Response(JSON.stringify({ processed, next_offset: offset + rows.length, done: rows.length < limit }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('cas-reembed', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});