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

function buildTitleTspans(title: string) {
  const words = (title || 'STH METHOD TRAINING').toUpperCase().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 24 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2).map((line, index) => (
    `<tspan x="204" dy="${index === 0 ? 0 : 42}">${escapeXml(line)}</tspan>`
  )).join('');
}

function buildSafeCoverSvg(title: string, gender: 'F' | 'M') {
  const isF = gender === 'F';
  const accent = isF ? '#ff5fa2' : '#2388ff';
  const secondary = isF ? '#ffb7d6' : '#5eead4';
  const skin = isF ? '#f0b08f' : '#c98558';
  const apparel = isF ? '#ff5fa2' : '#1b72ff';
  const muscle = isF ? '#f7c3a8' : '#d99a6d';
  const safeTitle = buildTitleTspans(title);
  const athlete = isF
    ? `
  <g transform="translate(0 6)">
    <ellipse cx="512" cy="612" rx="245" ry="46" fill="#000000" opacity="0.42" filter="url(#soft)"/>
    <path d="M271 625 C356 528 476 492 594 518 C681 538 744 585 795 662" fill="none" stroke="${secondary}" stroke-width="20" stroke-linecap="round" opacity="0.28"/>
    <path d="M326 657 L421 574 L543 620 L493 684 L377 710 Z" fill="${apparel}" opacity="0.98" stroke="#ffffff" stroke-opacity="0.18" stroke-width="4"/>
    <path d="M420 574 C454 520 514 492 577 508 C630 522 661 558 670 602" fill="none" stroke="${muscle}" stroke-width="62" stroke-linecap="round"/>
    <path d="M566 507 C635 481 698 505 736 560" fill="none" stroke="${skin}" stroke-width="44" stroke-linecap="round"/>
    <path d="M329 657 C270 682 220 674 174 631" fill="none" stroke="${skin}" stroke-width="46" stroke-linecap="round"/>
    <path d="M493 684 C572 742 638 762 731 735" fill="none" stroke="${skin}" stroke-width="52" stroke-linecap="round"/>
    <path d="M731 735 L831 774" fill="none" stroke="${skin}" stroke-width="42" stroke-linecap="round"/>
    <path d="M176 631 L116 603" fill="none" stroke="${skin}" stroke-width="38" stroke-linecap="round"/>
    <circle cx="756" cy="569" r="55" fill="${skin}" stroke="${secondary}" stroke-width="7"/>
    <path d="M726 526 C767 486 832 511 828 574 C807 547 781 537 743 545 Z" fill="#151515"/>
    <path d="M309 669 L515 572 L806 690" fill="none" stroke="${accent}" stroke-width="11" stroke-linecap="round" opacity="0.9"/>
    <circle cx="111" cy="603" r="20" fill="#101010" stroke="${accent}" stroke-width="8"/>
    <circle cx="838" cy="777" r="20" fill="#101010" stroke="${accent}" stroke-width="8"/>
  </g>`
    : `
  <g transform="translate(0 -4)">
    <ellipse cx="512" cy="662" rx="238" ry="50" fill="#000000" opacity="0.44" filter="url(#soft)"/>
    <path d="M262 506 L371 556 M762 506 L653 556" stroke="${secondary}" stroke-width="36" stroke-linecap="round" opacity="0.9"/>
    <circle cx="244" cy="498" r="34" fill="#0b0b0b" stroke="${accent}" stroke-width="11"/>
    <circle cx="780" cy="498" r="34" fill="#0b0b0b" stroke="${accent}" stroke-width="11"/>
    <circle cx="512" cy="260" r="70" fill="${skin}" stroke="${secondary}" stroke-width="8"/>
    <path d="M455 220 C490 171 564 179 588 236 C550 222 505 225 459 251 Z" fill="#161616"/>
    <path d="M409 350 C459 313 566 313 616 350 L664 577 C602 632 423 632 360 577 Z" fill="${apparel}" stroke="#ffffff" stroke-opacity="0.16" stroke-width="5"/>
    <path d="M401 370 C326 394 283 443 262 506" fill="none" stroke="${muscle}" stroke-width="58" stroke-linecap="round"/>
    <path d="M623 370 C698 394 741 443 762 506" fill="none" stroke="${muscle}" stroke-width="58" stroke-linecap="round"/>
    <path d="M430 594 L374 756" stroke="${skin}" stroke-width="56" stroke-linecap="round"/>
    <path d="M594 594 L650 756" stroke="${skin}" stroke-width="56" stroke-linecap="round"/>
    <path d="M374 756 L313 790" stroke="${accent}" stroke-width="36" stroke-linecap="round"/>
    <path d="M650 756 L711 790" stroke="${accent}" stroke-width="36" stroke-linecap="round"/>
    <path d="M349 468 C427 417 597 417 675 468" fill="none" stroke="${secondary}" stroke-width="10" stroke-linecap="round" opacity="0.74"/>
  </g>`;

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
    <filter id="hardGlow"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <rect width="1024" height="1024" fill="#000000"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <ellipse cx="512" cy="444" rx="285" ry="335" fill="${accent}" opacity="0.14" filter="url(#soft)"/>
  <path d="M176 232 C294 136 725 128 854 252" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round" opacity="0.3" filter="url(#hardGlow)"/>
  <text x="512" y="116" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900" fill="${secondary}" letter-spacing="6">${isF ? 'FEMALE PERFORMANCE' : 'MALE PERFORMANCE'}</text>
  ${athlete}
  <rect y="852" width="1024" height="172" fill="url(#band)"/>
  <rect y="852" width="1024" height="8" fill="${accent}" opacity="0.88"/>
  <path d="M80 886 L126 868 L172 886 L164 948 L126 970 L88 948 Z" fill="#050505" stroke="#22c26a" stroke-width="8"/>
  <text x="126" y="930" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="900" fill="#22c26a">STH</text>
  <text x="204" y="912" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="900" fill="#ffffff" letter-spacing="3">METHOD</text>
  <text x="204" y="954" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" fill="#ffffff">${safeTitle}</text>
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