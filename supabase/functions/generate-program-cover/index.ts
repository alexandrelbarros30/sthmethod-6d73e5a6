// Gera (ou regenera) a capa oficial STH METHOD para um programa de treino.
// Faixa rosa (feminino) / azul (masculino). Upload em ai-training-media.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildProgramCoverPrompt, inferGenderFromText } from '../_shared/program-cover-prompt.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(JSON.stringify({
        error: 'Configuração do backend ausente para gerar capa.',
        code: 'CONFIG',
        model: 'none',
        when: new Date().toISOString(),
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      supabaseUrl,
      anonKey,
      { global: { headers: { Authorization: authHeader } } },
    );
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: auth } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    const userId = auth?.claims?.sub as string | undefined;
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', userId);
    const isAdmin = (roles || []).some((r: any) => ['admin', 'consultor'].includes(r.role));
    if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { programId, gender: genderIn, studentId } = await req.json().catch(() => ({}));
    if (!programId) return new Response(JSON.stringify({ error: 'programId obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: prog, error: progErr } = await admin.from('training_programs').select('id, title, details').eq('id', programId).maybeSingle();
    if (progErr || !prog) return new Response(JSON.stringify({ error: 'Programa não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Definir gênero: input explícito > gênero do aluno > heurística por título/detalhes
    let gender: 'F' | 'M' = inferGenderFromText(`${prog.title || ''} ${prog.details || ''}`);
    if (genderIn === 'F' || genderIn === 'M') gender = genderIn;
    else if (studentId) {
      const { data: prof } = await admin.from('profiles').select('gender').eq('id', studentId).maybeSingle();
      const g = String(prof?.gender || '').toLowerCase();
      if (g.startsWith('f') || g.includes('fem') || g.includes('mulher')) gender = 'F';
      else if (g.startsWith('m')) gender = 'M';
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY ausente' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const prompt = buildProgramCoverPrompt(prog.title, gender);

    type GenerationResult = {
      ok: boolean;
      b64?: string;
      err?: string;
      status?: number;
      model: string;
    };

    function parseDataUrl(dataUrl: string | undefined): string | null {
      if (!dataUrl || !dataUrl.startsWith('data:')) return null;
      const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
      return match?.[1] || null;
    }

    async function readError(response: Response): Promise<string> {
      const text = await response.text().catch(() => '');
      return text.slice(0, 1200) || `HTTP ${response.status}`;
    }

    async function tryOpenAI(): Promise<GenerationResult> {
      const model = 'openai/gpt-image-2';
      try {
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort(), 45000);
        const r = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': apiKey },
          body: JSON.stringify({
            model,
            prompt,
            size: '1024x1024',
            quality: 'low',
            n: 1,
          }),
        });
        clearTimeout(id);
        if (!r.ok) return { ok: false, err: await readError(r), status: r.status, model };
        const j = await r.json().catch(() => ({} as any));
        const b = j?.data?.[0]?.b64_json;
        return b ? { ok: true, b64: b, model } : { ok: false, err: 'empty image response from OpenAI image endpoint', status: 502, model };
      } catch (e: any) {
        return { ok: false, err: e?.name === 'AbortError' ? 'timeout 45s' : (e?.message || 'network error'), status: 504, model };
      }
    }

    async function tryGemini(): Promise<GenerationResult> {
      const model = 'google/gemini-3.1-flash-image';
      try {
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort(), 45000);
        const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': apiKey },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            modalities: ['image', 'text'],
          }),
        });
        clearTimeout(id);
        if (!r.ok) return { ok: false, err: await readError(r), status: r.status, model };
        const j = await r.json().catch(() => ({} as any));
        const dataUrl = j?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        const b = parseDataUrl(dataUrl);
        return b ? { ok: true, b64: b, model } : { ok: false, err: 'empty image response from Gemini chat endpoint', status: 502, model };
      } catch (e: any) {
        return { ok: false, err: e?.name === 'AbortError' ? 'timeout 45s' : (e?.message || 'network error'), status: 504, model };
      }
    }

    // Ordem estável: endpoint oficial de imagem primeiro → Gemini chat apenas como fallback.
    let openAiErr: { status?: number; err?: string } | null = null;
    let gen = await tryOpenAI();
    if (!gen.ok) {
      openAiErr = { status: gen.status, err: gen.err };
      console.error('openai image gen failed', gen.status, (gen.err || '').slice(0, 400));
      gen = await tryGemini();
    }
    if (!gen.ok || !gen.b64) {
      console.error('gemini fallback failed', gen.status, (gen.err || '').slice(0, 400));
      return new Response(JSON.stringify({
        error: 'Não foi possível gerar a capa agora. Tente novamente em instantes.',
        code: gen.status || 502,
        model: 'openai/gpt-image-2 → google/gemini-3.1-flash-image',
        openai: openAiErr ? { status: openAiErr.status, details: (openAiErr.err || '').slice(0, 700) } : null,
        gemini: { status: gen.status, details: (gen.err || '').slice(0, 700) },
        when: new Date().toISOString(),
      }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const b64 = gen.b64;

    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const path = `program-covers/${programId}.png`;
    const { error: upErr } = await admin.storage.from('ai-training-media').upload(path, bytes, { contentType: 'image/png', upsert: true });
    if (upErr) {
      console.error('storage upload failed', upErr);
      return new Response(JSON.stringify({ error: 'Falha no upload', details: upErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // cache-busting via query string para forçar re-fetch no <img>
    const { data: pub } = admin.storage.from('ai-training-media').getPublicUrl(path);
    const base = pub?.publicUrl || `${supabaseUrl}/storage/v1/object/public/ai-training-media/${path}`;
    const posterUrl = `${base}?v=${Date.now()}`;
    await admin.from('training_programs').update({ poster_url: posterUrl }).eq('id', programId);

    return new Response(JSON.stringify({ ok: true, posterUrl, gender, model: gen.model }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('generate-program-cover error', e);
    return new Response(JSON.stringify({ error: e?.message || 'erro', code: 500, model: 'unknown', when: new Date().toISOString() }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});