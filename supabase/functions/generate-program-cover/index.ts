// Gera (ou regenera) a capa oficial STH METHOD para um programa de treino.
// Faixa rosa (feminino) / azul (masculino). Upload em ai-training-media.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: auth } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    const userId = auth?.claims?.sub as string | undefined;
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', userId);
    const isAdmin = (roles || []).some((r: any) => ['admin', 'consultor'].includes(r.role));
    if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { programId, gender: genderIn, studentId } = await req.json().catch(() => ({}));
    if (!programId) return new Response(JSON.stringify({ error: 'programId obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: prog, error: progErr } = await admin.from('training_programs').select('id, title').eq('id', programId).maybeSingle();
    if (progErr || !prog) return new Response(JSON.stringify({ error: 'Programa não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Definir gênero: input explícito > gênero do aluno > masculino
    let gender: 'F' | 'M' = 'M';
    if (genderIn === 'F' || genderIn === 'M') gender = genderIn;
    else if (studentId) {
      const { data: prof } = await admin.from('profiles').select('gender').eq('id', studentId).maybeSingle();
      const g = String(prof?.gender || '').toLowerCase();
      if (g.startsWith('f') || g.includes('fem') || g.includes('mulher')) gender = 'F';
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY ausente' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const bandHex = gender === 'F' ? '#ff2d87' : '#0a84ff';
    const bandColor = gender === 'F' ? 'vibrant pink magenta (#ff2d87)' : 'electric royal blue (#0a84ff)';
    const styling = gender === 'F'
      ? 'subtle feminine styling: soft rose glow accents, elegant curves, refined ornamental details'
      : 'strong masculine styling: sharp geometric edges, metallic steel accents, powerful athletic energy';
    const prompt = [
      'Vertical fitness program cover art, premium Apple-style dark aesthetic on pure black background (#000000).',
      'At the top center: the wordmark "STH METHOD" in bold clean modern sans-serif, glowing neon green (#39ff14), high legibility, generous letter-spacing.',
      `In the middle-lower third: a solid ${bandColor} horizontal band spanning full width, with the exact workout name "${prog.title}" written INSIDE the band in bold uppercase white sans-serif, perfectly centered, high contrast, no typos, no extra words.`,
      `Overall vibe: cinematic minimal fitness poster, subtle particle/light-ray texture, ${styling}.`,
      'No people, no photos of bodies, no other logos, no additional text anywhere. Only the STH METHOD wordmark on top and the workout name in the colored band.',
      `Color band exact hex: ${bandHex}. Neon green exact hex: #39ff14. Background pure black.`,
    ].join(' ');

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'openai/gpt-image-2', prompt, size: '1024x1024', quality: 'low', n: 1 }),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      console.error('image gen failed', resp.status, t);
      return new Response(JSON.stringify({ error: 'Falha na geração da imagem', details: t.slice(0, 300) }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = await resp.json().catch(() => ({} as any));
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return new Response(JSON.stringify({ error: 'Resposta vazia da IA' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

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
    const base = pub?.publicUrl || `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/ai-training-media/${path}`;
    const posterUrl = `${base}?v=${Date.now()}`;
    await admin.from('training_programs').update({ poster_url: posterUrl }).eq('id', programId);

    return new Response(JSON.stringify({ ok: true, posterUrl, gender }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('generate-program-cover error', e);
    return new Response(JSON.stringify({ error: e?.message || 'erro' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});