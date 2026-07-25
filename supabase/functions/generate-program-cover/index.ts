// Gera (ou regenera) a capa oficial STH METHOD para um programa de treino.
// Faixa rosa (feminino) / azul (masculino). Upload em ai-training-media.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

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

    console.info('generate-program-cover local render start', { programId, gender, title: prog.title });

    // Caminho estável: gera capa local imediatamente. A chamada de IA estava
    // estourando o tempo da borda antes de responder ao app.
    const svg = buildSafeCoverSvg(prog.title, gender);
    const uploadBytes = new TextEncoder().encode(svg);
    const contentType = 'image/svg+xml; charset=utf-8';
    const fileExtension = 'svg';
    const usedModel = 'safe-svg-fallback';
    const fallbackDetails = {
      code: 'LOCAL_COVER_RENDERED',
      details: 'Capa local aplicada para evitar timeout/falha de rede na geração por IA.',
    };

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

    return jsonResponse({ ok: true, posterUrl, gender, model: usedModel, fallback: true, fallbackDetails });
  } catch (e: any) {
    console.error('generate-program-cover error', e);
    return jsonResponse({ error: e?.message || 'erro', code: 500, model: 'unknown', when: new Date().toISOString() }, 500);
  }
});