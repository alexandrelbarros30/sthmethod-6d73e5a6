// Gera (ou regenera) a capa oficial STH METHOD para um programa de treino.
// Faixa rosa (feminino) / azul (masculino). Upload em ai-training-media.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildProgramCoverPrompt } from '../_shared/program-cover-prompt.ts';

function inferGenderFromText(text: string): 'F' | 'M' {
  const t = (text || '').toLowerCase();
  const female = [
    'femin', 'mulher', 'glute', 'gluteo', 'glúteo', 'posterior', 'lower focus',
    'lower body', 'hip', 'booty', 'butt', 'shape', 'curves', 'lady', 'girl',
  ];
  if (female.some((k) => t.includes(k))) return 'F';
  return 'M';
}

const responseHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return jsonResponse({
        error: 'Configuração do backend ausente para gerar capa.',
        code: 'CONFIG',
        model: 'none',
        when: new Date().toISOString(),
      }, 500);
    }

    const supabase = createClient(
      supabaseUrl,
      anonKey,
      { global: { headers: { Authorization: authHeader } } },
    );
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: auth } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    const userId = auth?.claims?.sub as string | undefined;
    if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', userId);
    const isAdmin = (roles || []).some((r: any) => ['admin', 'consultor'].includes(r.role));
    if (!isAdmin) return jsonResponse({ error: 'Forbidden' }, 403);

    const { programId, gender: genderIn, studentId, provider: providerIn } = await req.json().catch(() => ({}));
    if (!programId) return jsonResponse({ error: 'programId obrigatório' }, 400);

    const { data: prog, error: progErr } = await admin.from('training_programs').select('id, title, details').eq('id', programId).maybeSingle();
    if (progErr || !prog) return jsonResponse({ error: 'Programa não encontrado' }, 404);

    // Definir gênero: input explícito > gênero do aluno > heurística por título/detalhes
    let gender: 'F' | 'M' = inferGenderFromText(`${prog.title || ''} ${prog.details || ''}`);
    if (genderIn === 'F' || genderIn === 'M') gender = genderIn;
    else if (studentId) {
      const { data: prof } = await admin.from('profiles').select('gender').eq('user_id', studentId).maybeSingle();
      const g = String(prof?.gender || '').toLowerCase();
      if (g.startsWith('f') || g.includes('fem') || g.includes('mulher')) gender = 'F';
      else if (g.startsWith('m')) gender = 'M';
    }

    console.info('generate-program-cover AI render start', { programId, gender, title: prog.title });

    // Tenta gerar capa fotográfica via Lovable AI Gateway.
    // Importante: cada invocação tenta somente UM modelo. Encadear GPT + Gemini na
    // mesma chamada pode passar do limite de resposta da função e virar "Failed to send".
    // O painel faz a segunda tentativa em uma nova invocação, mantendo o erro rastreável.
    const lovableKey = Deno.env.get('LOVABLE_API_KEY') || '';
    const prompt = buildProgramCoverPrompt(prog.title, gender);
    let uploadBytes: Uint8Array | null = null;
    const contentType = 'image/png';
    const fileExtension = 'png';
    let usedModel = 'none';
    const attempts: Array<{ model: string; status: number; error?: string }> = [];
    const requestedProvider = providerIn === 'gemini' ? 'gemini' : 'openai';

    async function tryGemini(): Promise<Uint8Array | null> {
      const model = 'google/gemini-3.1-flash-image';
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort('AI_IMAGE_TIMEOUT_GEMINI_38S'), 38000);
      try {
        const r = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
          method: 'POST',
          signal: ctrl.signal,
          headers: {
            'Content-Type': 'application/json',
            'Lovable-API-Key': lovableKey,
            'X-Lovable-AIG-SDK': 'vercel-ai-sdk',
          },
          body: JSON.stringify({
            model,
            prompt,
            size: '1024x1024',
            n: 1,
          }),
        });
        const txt = await r.text();
        if (!r.ok) {
          attempts.push({ model, status: r.status, error: txt.slice(0, 200) });
          return null;
        }
        const data = JSON.parse(txt);
        const b64 = data?.data?.[0]?.b64_json;
        if (!b64) { attempts.push({ model, status: r.status, error: 'no_image' }); return null; }
        usedModel = model;
        return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      } catch (e) {
        attempts.push({ model, status: 0, error: String((e as Error)?.message || e || 'AI_IMAGE_TIMEOUT_GEMINI_38S') });
        return null;
      } finally { clearTimeout(t); }
    }

    async function tryOpenAI(): Promise<Uint8Array | null> {
      const model = 'openai/gpt-image-2';
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort('AI_IMAGE_TIMEOUT_OPENAI_42S'), 42000);
      try {
        const r = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
          method: 'POST',
          signal: ctrl.signal,
          headers: {
            'Content-Type': 'application/json',
            'Lovable-API-Key': lovableKey,
            'X-Lovable-AIG-SDK': 'vercel-ai-sdk',
          },
          body: JSON.stringify({
            model,
            prompt,
            size: '1024x1024',
            quality: 'low',
            n: 1,
          }),
        });
        const txt = await r.text();
        if (!r.ok) {
          attempts.push({ model, status: r.status, error: txt.slice(0, 200) });
          return null;
        }
        const data = JSON.parse(txt);
        const b64 = data?.data?.[0]?.b64_json;
        if (!b64) { attempts.push({ model, status: r.status, error: 'no_image' }); return null; }
        usedModel = model;
        return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      } catch (e) {
        attempts.push({ model, status: 0, error: String((e as Error)?.message || e || 'AI_IMAGE_TIMEOUT_OPENAI_42S') });
        return null;
      } finally { clearTimeout(t); }
    }

    if (!lovableKey) {
      return jsonResponse({
        error: 'Chave Lovable AI ausente no backend.',
        code: 'AI_KEY_MISSING',
        model: 'none',
        when: new Date().toISOString(),
      }, 500);
    }

    uploadBytes = requestedProvider === 'gemini' ? await tryGemini() : await tryOpenAI();

    if (!uploadBytes) {
      const modelChain = attempts.length ? attempts.map((a) => a.model).join(' → ') : 'none';
      console.error('generate-program-cover AI failed without fallback', attempts);
      return jsonResponse({
        error: 'A IA não retornou uma imagem fotográfica nesta tentativa. Nenhuma capa segura foi aplicada.',
        code: 'AI_IMAGE_ATTEMPT_FAILED',
        model: modelChain,
        fallback: false,
        attempts,
        when: new Date().toISOString(),
      }, 502);
    }

    console.info('generate-program-cover AI success', { model: usedModel });

    const path = `program-covers/${programId}.${fileExtension}`;
    const { error: upErr } = await admin.storage.from('ai-training-media').upload(path, uploadBytes, { contentType, upsert: true });
    if (upErr) {
      console.error('storage upload failed', upErr);
      return jsonResponse({ error: 'Falha no upload', details: upErr.message, code: 'UPLOAD', model: usedModel, when: new Date().toISOString() }, 500);
    }
    // cache-busting via query string para forçar re-fetch no <img>
    const { data: pub } = admin.storage.from('ai-training-media').getPublicUrl(path);
    const base = pub?.publicUrl || `${supabaseUrl}/storage/v1/object/public/ai-training-media/${path}`;
    const posterUrl = `${base}?v=${Date.now()}`;
    await admin.from('training_programs').update({ poster_url: posterUrl }).eq('id', programId);

    return jsonResponse({ ok: true, posterUrl, gender, model: usedModel, fallback: false, attempts });
  } catch (e: any) {
    console.error('generate-program-cover error', e);
    return jsonResponse({ error: e?.message || 'erro', code: 500, model: 'unknown', when: new Date().toISOString() }, 500);
  }
});