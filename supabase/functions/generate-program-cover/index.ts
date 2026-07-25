// Gera (ou regenera) a capa oficial STH METHOD para um programa de treino.
// Faixa rosa (feminino) / azul (masculino). Upload em ai-training-media.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildProgramCoverPrompt, inferGenderFromText } from '../_shared/program-cover-prompt.ts';

const responseHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSafeCoverSvg(title: string, gender: 'F' | 'M') {
  const isF = gender === 'F';
  const accent = isF ? '#ff5fa2' : '#2388ff';
  const secondary = isF ? '#ffb7d6' : '#5eead4';
  const safeTitle = escapeXml((title || 'STH METHOD TRAINING').toUpperCase());

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="glow" cx="50%" cy="35%" r="62%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.48"/>
      <stop offset="42%" stop-color="${secondary}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.96"/>
      <stop offset="72%" stop-color="#050505" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.55"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <rect width="1024" height="1024" fill="#000000"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <ellipse cx="512" cy="420" rx="255" ry="315" fill="${accent}" opacity="0.16" filter="url(#soft)"/>
  <path d="M512 148 C388 150 318 270 330 402 C341 542 420 612 377 742 L647 742 C603 612 684 540 695 402 C706 270 636 150 512 148Z" fill="#111111" stroke="${accent}" stroke-width="10" opacity="0.96"/>
  <circle cx="512" cy="224" r="86" fill="#151515" stroke="${secondary}" stroke-width="8"/>
  <path d="M310 508 C230 546 196 620 180 724" fill="none" stroke="${secondary}" stroke-width="30" stroke-linecap="round" opacity="0.72"/>
  <path d="M714 508 C794 546 828 620 844 724" fill="none" stroke="${secondary}" stroke-width="30" stroke-linecap="round" opacity="0.72"/>
  <path d="M415 738 L345 905" stroke="${accent}" stroke-width="34" stroke-linecap="round" opacity="0.86"/>
  <path d="M609 738 L679 905" stroke="${accent}" stroke-width="34" stroke-linecap="round" opacity="0.86"/>
  <rect y="852" width="1024" height="172" fill="url(#band)"/>
  <path d="M80 886 L126 868 L172 886 L164 948 L126 970 L88 948 Z" fill="#050505" stroke="#22c26a" stroke-width="8"/>
  <text x="126" y="930" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="900" fill="#22c26a">STH</text>
  <text x="204" y="912" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="900" fill="#ffffff" letter-spacing="3">METHOD</text>
  <text x="204" y="964" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900" fill="#ffffff">${safeTitle}</text>
</svg>`;
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

    const { programId, gender: genderIn, studentId } = await req.json().catch(() => ({}));
    if (!programId) return jsonResponse({ error: 'programId obrigatório' }, 400);

    const { data: prog, error: progErr } = await admin.from('training_programs').select('id, title, details').eq('id', programId).maybeSingle();
    if (progErr || !prog) return jsonResponse({ error: 'Programa não encontrado' }, 404);

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
    if (!apiKey) return jsonResponse({ error: 'LOVABLE_API_KEY ausente' }, 500);

    const prompt = buildProgramCoverPrompt(prog.title, gender);
    console.info('generate-program-cover start', { programId, gender, title: prog.title });

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

    async function tryGemini(): Promise<GenerationResult> {
      const model = 'google/gemini-3.1-flash-image';
      try {
        console.info('generate-program-cover model attempt', model);
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort(), 18000);
        const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'edge-function' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            modalities: ['image', 'text'],
          }),
        });
        clearTimeout(id);
        if (!r.ok) return { ok: false, err: await readError(r), status: r.status, model };
        const j = await r.json().catch(() => ({} as any));
        const dataUrl = j?.choices?.[0]?.message?.images?.[0]?.image_url?.url
          || j?.choices?.[0]?.message?.images?.[0]?.url
          || j?.choices?.[0]?.message?.content?.find?.((part: any) => part?.type === 'image_url')?.image_url?.url;
        const b = parseDataUrl(dataUrl);
        return b ? { ok: true, b64: b, model } : { ok: false, err: 'empty image response from Gemini image endpoint', status: 502, model };
      } catch (e: any) {
        return { ok: false, err: e?.name === 'AbortError' ? 'timeout 18s' : (e?.message || 'network error'), status: 504, model };
      }
    }

    async function tryOpenAI(): Promise<GenerationResult> {
      const model = 'openai/gpt-image-2';
      try {
        console.info('generate-program-cover model attempt', model);
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort(), 12000);
        const r = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'edge-function' },
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
        return { ok: false, err: e?.name === 'AbortError' ? 'timeout 12s' : (e?.message || 'network error'), status: 504, model };
      }
    }

    // Evita timeout da borda: tentativa rápida na IA, fallback local seguro e imediato.
    let geminiErr: { status?: number; err?: string } | null = null;
    let gen = await tryGemini();
    if (!gen.ok) {
      geminiErr = { status: gen.status, err: gen.err };
      console.error('gemini image gen failed', gen.status, (gen.err || '').slice(0, 400));
      gen = await tryOpenAI();
    }

    let uploadBytes: Uint8Array;
    let contentType = 'image/png';
    let fileExtension = 'png';
    let usedModel = gen.model;
    let fallbackDetails: Record<string, unknown> | null = null;

    if (!gen.ok || !gen.b64) {
      console.error('openai fallback failed', gen.status, (gen.err || '').slice(0, 400));
      const svg = buildSafeCoverSvg(prog.title, gender);
      uploadBytes = new TextEncoder().encode(svg);
      contentType = 'image/svg+xml; charset=utf-8';
      fileExtension = 'svg';
      usedModel = 'safe-svg-fallback';
      fallbackDetails = {
        code: 'AI_TIMEOUT_OR_PROVIDER_FAILURE',
        gemini: geminiErr ? { status: geminiErr.status, details: (geminiErr.err || '').slice(0, 500) } : null,
        openai: { status: gen.status, details: (gen.err || '').slice(0, 500) },
      };
    } else {
      const bin = atob(gen.b64);
      uploadBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) uploadBytes[i] = bin.charCodeAt(i);
    }

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

    return jsonResponse({ ok: true, posterUrl, gender, model: usedModel, fallback: Boolean(fallbackDetails), fallbackDetails });
  } catch (e: any) {
    console.error('generate-program-cover error', e);
    return jsonResponse({ error: e?.message || 'erro', code: 500, model: 'unknown', when: new Date().toISOString() }, 500);
  }
});