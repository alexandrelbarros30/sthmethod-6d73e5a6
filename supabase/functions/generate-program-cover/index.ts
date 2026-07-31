// Gera (ou regenera) a capa oficial STH METHOD para um programa de treino.
// Faixa rosa (feminino) / azul (masculino). Upload em ai-training-media.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildProgramCoverPrompt } from '../_shared/program-cover-prompt.ts';

type Gender = 'F' | 'M';
type Provider = 'openai' | 'gemini';
type Attempt = { model: string; status: number; error?: string };

function inferGenderFromText(text: string): Gender {
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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id, x-client-session, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function waitUntil(promise: Promise<unknown>) {
  const edgeRuntime = (globalThis as unknown as { EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void } }).EdgeRuntime;
  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(promise);
    return;
  }
  promise.catch((error) => console.error('generate-program-cover background error', error));
}

async function fetchAiImage(params: {
  model: string;
  prompt: string;
  lovableKey: string;
  timeoutMs: number;
  bodyExtras?: Record<string, unknown>;
  attempts: Attempt[];
}): Promise<Uint8Array | null> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(`AI_IMAGE_TIMEOUT_${params.model}_${params.timeoutMs}MS`), params.timeoutMs);
  const isGemini = params.model.startsWith('google/gemini-');
  const body = isGemini
    ? {
        model: params.model,
        messages: [{ role: 'user', content: params.prompt }],
        modalities: ['image', 'text'],
      }
    : {
        model: params.model,
        prompt: params.prompt,
        size: '1024x1536',
        n: 1,
        ...(params.bodyExtras || {}),
      };
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': params.lovableKey,
        'X-Lovable-AIG-SDK': 'vercel-ai-sdk',
      },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      params.attempts.push({ model: params.model, status: response.status, error: text.slice(0, 300) });
      return null;
    }
    const data = JSON.parse(text);
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      params.attempts.push({ model: params.model, status: response.status, error: 'no_image' });
      return null;
    }
    return Uint8Array.from(atob(b64), (char) => char.charCodeAt(0));
  } catch (error) {
    params.attempts.push({
      model: params.model,
      status: 0,
      error: String((error as Error)?.message || error || `AI_IMAGE_TIMEOUT_${params.timeoutMs}MS`),
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateAiCover(params: {
  lovableKey: string;
  prompt: string;
  provider: Provider;
  cascade: boolean;
}): Promise<{ bytes: Uint8Array | null; model: string; attempts: Attempt[] }> {
  const attempts: Attempt[] = [];
  const providers: Provider[] = params.cascade
    ? (params.provider === 'openai' ? ['openai', 'gemini'] : ['gemini', 'openai'])
    : [params.provider];

  for (const provider of providers) {
    const model = provider === 'gemini' ? 'google/gemini-3-pro-image' : 'openai/gpt-image-2';
    const bytes = await fetchAiImage({
      model,
      prompt: params.prompt,
      lovableKey: params.lovableKey,
      timeoutMs: provider === 'gemini' ? 55000 : 55000,
      bodyExtras: provider === 'openai' ? { quality: 'high' } : undefined,
      attempts,
    });
    if (bytes) return { bytes, model, attempts };
  }

  return {
    bytes: null,
    model: attempts.length ? attempts.map((attempt) => attempt.model).join(' → ') : 'none',
    attempts,
  };
}

async function uploadCover(params: {
  admin: ReturnType<typeof createClient>;
  supabaseUrl: string;
  programId: string;
  bytes: Uint8Array;
  model: string;
  gender: Gender;
  attempts: Attempt[];
}) {
  const path = `program-covers/${params.programId}.png`;
  const { error: uploadError } = await params.admin.storage
    .from('ai-training-media')
    .upload(path, params.bytes, { contentType: 'image/png', upsert: true });

  if (uploadError) {
    console.error('storage upload failed', uploadError);
    return {
      error: 'Falha no upload',
      details: uploadError.message,
      code: 'UPLOAD',
      model: params.model,
      when: new Date().toISOString(),
    };
  }

  const { data: publicUrlData } = params.admin.storage.from('ai-training-media').getPublicUrl(path);
  const base = publicUrlData?.publicUrl || `${params.supabaseUrl}/storage/v1/object/public/ai-training-media/${path}`;
  const posterUrl = `${base}?v=${Date.now()}`;
  const { error: updateError } = await params.admin.from('training_programs').update({ poster_url: posterUrl }).eq('id', params.programId);
  if (updateError) {
    console.error('training_programs poster update failed', updateError);
    return {
      error: 'Falha ao aplicar capa no programa',
      details: updateError.message,
      code: 'POSTER_UPDATE',
      model: params.model,
      when: new Date().toISOString(),
    };
  }

  return { ok: true, posterUrl, gender: params.gender, model: params.model, fallback: false, attempts: params.attempts };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders });
  try {
    const contentType = req.headers.get('content-type') || '';
    const rawBody = await req.text().catch(() => '');
    let parsedBody: any = {};
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        if (contentType.includes('application/x-www-form-urlencoded')) {
          parsedBody = Object.fromEntries(new URLSearchParams(rawBody));
        }
      }
    }

    const accessToken = String(parsedBody?.accessToken || '').trim();
    const authHeader = req.headers.get('Authorization') || (accessToken ? `Bearer ${accessToken}` : '');
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

    const { programId, gender: genderIn, studentId, provider: providerIn, async: asyncIn } = parsedBody || {};
    if (!programId) return jsonResponse({ error: 'programId obrigatório' }, 400);

    const { data: prog, error: progErr } = await admin.from('training_programs').select('id, title, details').eq('id', programId).maybeSingle();
    if (progErr || !prog) return jsonResponse({ error: 'Programa não encontrado' }, 404);

    // Definir gênero: input explícito > gênero do aluno > heurística por título/detalhes
    let gender: Gender = inferGenderFromText(`${prog.title || ''} ${prog.details || ''}`);
    if (genderIn === 'F' || genderIn === 'M') gender = genderIn;
    else if (studentId) {
      const { data: prof } = await admin.from('profiles').select('gender').eq('user_id', studentId).maybeSingle();
      const g = String(prof?.gender || '').toLowerCase();
      if (g.startsWith('f') || g.includes('fem') || g.includes('mulher')) gender = 'F';
      else if (g.startsWith('m')) gender = 'M';
    }

    console.info('generate-program-cover request accepted', { programId, gender, title: prog.title, async: Boolean(asyncIn) });

    const lovableKey = Deno.env.get('LOVABLE_API_KEY') || '';
    const prompt = buildProgramCoverPrompt(prog.title, gender);
    const requestedProvider: Provider = providerIn === 'openai' ? 'openai' : 'gemini';

    if (!lovableKey) {
      return jsonResponse({
        error: 'Chave Lovable AI ausente no backend.',
        code: 'AI_KEY_MISSING',
        model: 'none',
        when: new Date().toISOString(),
      }, 500);
    }

    if (asyncIn === true) {
      waitUntil((async () => {
        console.info('generate-program-cover background started', { programId, provider: requestedProvider });
        const generated = await generateAiCover({ lovableKey, prompt, provider: requestedProvider, cascade: true });
        if (!generated.bytes) {
          console.error('generate-program-cover background AI failed', generated.attempts);
          return;
        }
        const uploaded = await uploadCover({ admin, supabaseUrl, programId, bytes: generated.bytes, model: generated.model, gender, attempts: generated.attempts });
        console.info('generate-program-cover background finished', { programId, ok: Boolean((uploaded as any)?.ok), model: generated.model });
      })());

      return jsonResponse({
        ok: true,
        accepted: true,
        status: 'processing',
        programId,
        gender,
        model: requestedProvider === 'openai' ? 'openai/gpt-image-2 → google/gemini-3-pro-image' : 'google/gemini-3-pro-image → openai/gpt-image-2',
        when: new Date().toISOString(),
      }, 202);
    }

    const generated = await generateAiCover({ lovableKey, prompt, provider: requestedProvider, cascade: false });

    if (!generated.bytes) {
      console.error('generate-program-cover AI failed without fallback', generated.attempts);
      return jsonResponse({
        error: 'A IA não retornou uma imagem fotográfica nesta tentativa. Nenhuma capa segura foi aplicada.',
        code: 'AI_IMAGE_ATTEMPT_FAILED',
        model: generated.model,
        fallback: false,
        attempts: generated.attempts,
        when: new Date().toISOString(),
      }, 502);
    }

    console.info('generate-program-cover AI success', { model: generated.model });
    const uploaded = await uploadCover({ admin, supabaseUrl, programId, bytes: generated.bytes, model: generated.model, gender, attempts: generated.attempts });
    return jsonResponse(uploaded, (uploaded as any)?.ok ? 200 : 500);
  } catch (e: any) {
    console.error('generate-program-cover error', e);
    return jsonResponse({ error: e?.message || 'erro', code: 500, model: 'unknown', when: new Date().toISOString() }, 500);
  }
});