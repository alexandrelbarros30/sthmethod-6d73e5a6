import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const EMBEDDINGS_URL = 'https://sthmethod.lovable.app/__l5e/assets-v1/231276d1-97bb-460b-8e56-06b9735eed75/cas-embeddings.json.gz';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { count } = await supabase
      .from('cas_chunks')
      .select('id', { count: 'exact', head: true });

    const force = new URL(req.url).searchParams.get('force') === '1';
    if ((count ?? 0) >= 1200 && !force) {
      return new Response(JSON.stringify({ ok: true, skipped: true, existing: count }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (force) {
      await supabase.from('cas_chunks').delete().neq('id', 0);
    }

    // Fetch + decompress gzip + parse
    const resp = await fetch(EMBEDDINGS_URL);
    if (!resp.ok || !resp.body) throw new Error(`fetch failed: ${resp.status}`);
    const decompressed = resp.body.pipeThrough(new DecompressionStream('gzip'));
    const buf = await new Response(decompressed).arrayBuffer();
    const rows = JSON.parse(new TextDecoder().decode(buf)) as Array<{
      discipline: string; page_start: number; page_end: number; content: string; embedding: number[];
    }>;

    let inserted = 0;
    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH).map((r, j) => ({
        discipline: r.discipline,
        page_start: r.page_start,
        page_end: r.page_end,
        chunk_index: i + j,
        content: r.content,
        embedding: r.embedding as unknown as string,
      }));
      const { error } = await supabase.from('cas_chunks').insert(batch);
      if (error) throw new Error(`batch ${i}: ${error.message}`);
      inserted += batch.length;
    }

    return new Response(JSON.stringify({ ok: true, inserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('cas-ingest', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});