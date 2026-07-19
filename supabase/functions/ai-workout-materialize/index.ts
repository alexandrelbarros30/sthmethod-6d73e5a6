// STHIA — Materializar programa: converte a última resposta do chat (markdown)
// em programa real (training_programs + workout_templates + exercícios) e,
// opcionalmente, atribui ao aluno.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSuperCoachLibrary, normalizeExName } from '../_shared/supercoach-library.ts';

interface Body {
  markdown: string;
  studentId?: string;
  assign?: boolean;
  titleHint?: string;
}

function norm(s: string) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

// Gera capa oficial STH METHOD para o programa (faixa rosa=feminino, azul=masculino)
// e faz upload no bucket público 'ai-training-media'. Retorna URL pública ou null.
async function generateProgramCover(opts: {
  apiKey: string;
  title: string;
  gender: 'F' | 'M';
  supabaseUrl: string;
  admin: any;
  programId: string;
}): Promise<string | null> {
  const { apiKey, title, gender, supabaseUrl, admin, programId } = opts;
  const bandHex = gender === 'F' ? '#ff2d87' : '#0a84ff';
  const bandColor = gender === 'F' ? 'vibrant pink magenta (#ff2d87)' : 'electric royal blue (#0a84ff)';
  const feminineTraits = gender === 'F'
    ? 'subtle feminine styling: soft rose glow accents, elegant curves, refined ornamental details'
    : 'strong masculine styling: sharp geometric edges, metallic steel accents, powerful athletic energy';

  const prompt = [
    'Vertical fitness program cover art, premium Apple-style dark aesthetic on pure black background (#000000).',
    'At the top center: the wordmark "STH METHOD" in bold clean modern sans-serif, glowing neon green (#39ff14), high legibility, generous letter-spacing.',
    `In the middle-lower third: a solid ${bandColor} horizontal band spanning full width, with the exact workout name "${title}" written INSIDE the band in bold uppercase white sans-serif, perfectly centered, high contrast, no typos, no extra words.`,
    `Overall vibe: cinematic minimal fitness poster, subtle particle/light-ray texture, ${feminineTraits}.`,
    'No people, no photos of bodies, no other logos, no additional text anywhere. Only the STH METHOD wordmark on top and the workout name in the colored band.',
    `Color band exact hex: ${bandHex}. Neon green exact hex: #39ff14. Background pure black.`,
  ].join(' ');

  const resp = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'openai/gpt-image-2',
      prompt,
      size: '1024x1024',
      quality: 'low',
      n: 1,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    console.error('image gen failed', resp.status, t);
    return null;
  }
  const data = await resp.json().catch(() => ({} as any));
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) return null;

  // decode base64 → bytes
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

  const path = `program-covers/${programId}.png`;
  const { error: upErr } = await admin.storage
    .from('ai-training-media')
    .upload(path, bytes, { contentType: 'image/png', upsert: true });
  if (upErr) { console.error('storage upload failed', upErr); return null; }
  const { data: pub } = admin.storage.from('ai-training-media').getPublicUrl(path);
  return pub?.publicUrl || `${supabaseUrl}/storage/v1/object/public/ai-training-media/${path}`;
}

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

    const { data: rolesData } = await admin.from('user_roles').select('role').eq('user_id', userId);
    const roles = (rolesData || []).map((r: any) => r.role);
    if (!roles.includes('admin') && !roles.includes('consultant')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const markdown = (body.markdown || '').trim();
    if (markdown.length < 40) {
      return new Response(JSON.stringify({ error: 'Conteúdo insuficiente para gerar programa.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY missing');

    const structurePrompt = `Você recebe o TEXTO de um programa de treino já elaborado. Extraia a estrutura em JSON estrito seguindo EXATAMENTE este schema, sem inventar dados não presentes:

{
  "title": string,                       // título do programa (ex.: "Hipertrofia Ombros 12sem")
  "subtitle": string,                    // subtítulo curto
  "objective": "hipertrofia" | "forca" | "resistencia" | "emagrecimento" | "condicionamento" | "reabilitacao" | "outro",
  "difficulty": "iniciante" | "intermediario" | "avancado",
  "weeks": number|null,
  "days_per_week": number|null,
  "minutes_per_day": number|null,
  "details": string,                     // resumo em markdown (estratégia/periodização/observações). Pode ser longo.
  "workouts": [
    {
      "title": string,                   // ex.: "Treino A — Peito e Tríceps"
      "subtitle": string,                // opcional
      "sort_order": number,              // 1..n
      "exercises": [
        {
          "name": string,                // nome do exercício
          "sc_id": string|null,          // id oficial do ST Coach quando o texto trouxer o tag [SC:<id>] — copie exatamente o número
          "sets": string,                // ex.: "4"
          "reps": string,                // ex.: "8-12"
          "rest_interval": string,       // ex.: "90s"
          "load_suggestion": string,     // opcional
          "group_name": string|null,     // se biset/triset, ex.: "Biset A"
          "sort_order": number
        }
      ]
    }
  ]
}

Regras:
- Sempre retorne JSON válido, apenas o objeto (sem markdown, sem comentários).
- Se o texto tiver mais de um treino (A/B/C), gere um workout por treino.
- Se não houver campo, use null (para números) ou string vazia.
- Não crie exercícios que não estejam no texto.
- Se o nome vier com sufixo tipo "[SC:1234]", REMOVA esse sufixo do campo "name" e coloque o número em "sc_id".`;

    const model = 'google/gemini-3-flash-preview';
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: structurePrompt },
          { role: 'user', content: markdown },
        ],
      }),
    });
    const aiData = await resp.json().catch(() => ({}));
    if (resp.status === 429) return new Response(JSON.stringify({ error: 'Limite de uso da IA atingido.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: 'Créditos de IA esgotados.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!resp.ok) throw new Error(`AI gateway error: ${JSON.stringify(aiData)}`);

    const raw = (aiData as any)?.choices?.[0]?.message?.content || '{}';
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }
    if (!parsed || !Array.isArray(parsed.workouts) || parsed.workouts.length === 0) {
      return new Response(JSON.stringify({ error: 'Não foi possível extrair estrutura do programa.' }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const title = String(body.titleHint || parsed.title || 'Programa STHIA').slice(0, 160);
    const subtitle = String(parsed.subtitle || '').slice(0, 200);
    const objective = String(parsed.objective || 'hipertrofia');
    const difficulty = String(parsed.difficulty || 'intermediario');
    const details = String(parsed.details || '');
    const weeks = Number.isFinite(parsed.weeks) ? parsed.weeks : null;
    const dpw = Number.isFinite(parsed.days_per_week) ? parsed.days_per_week : parsed.workouts.length;
    const mpd = Number.isFinite(parsed.minutes_per_day) ? parsed.minutes_per_day : null;

    // 0) Detecta gênero do aluno (se houver) para escolher faixa rosa/azul
    let studentGender: 'F' | 'M' = 'M';
    if (body.studentId) {
      try {
        const { data: prof } = await admin
          .from('profiles')
          .select('gender')
          .eq('id', body.studentId)
          .maybeSingle();
        const g = String(prof?.gender || '').toLowerCase();
        if (g.startsWith('f') || g.includes('mulher') || g.includes('fem')) studentGender = 'F';
      } catch (_) { /* ignore */ }
    }

    // 1) Cria programa
    const { data: prog, error: progErr } = await admin.from('training_programs').insert({
      title, subtitle, objective, difficulty, details,
      status: 'draft', created_by: userId,
    }).select('id').single();
    if (progErr) throw progErr;
    const programId = prog!.id as string;

    // 1b) Geração da capa oficial STH METHOD (assíncrona ao fluxo — falha silenciosa)
    try {
      const posterUrl = await generateProgramCover({
        apiKey,
        title,
        gender: studentGender,
        supabaseUrl: Deno.env.get('SUPABASE_URL')!,
        admin,
        programId,
      });
      if (posterUrl) {
        await admin.from('training_programs').update({ poster_url: posterUrl }).eq('id', programId);
      }
    } catch (e) {
      console.error('cover generation failed', e);
    }

    // 2) Carrega biblioteca para tentar matchear exercícios pelo nome
    const { data: lib } = await admin.from('exercise_library').select('id, name, image_url, video_url');
    const libIndex = new Map<string, any>();
    for (const e of (lib || [])) libIndex.set(norm(e.name), e);

    // 2b) Índice do catálogo ST Coach (fonte oficial de vídeos/capas)
    const scByName = new Map<string, { id: string | number; name: string; video_url?: string; cover_url?: string | null }>();
    const scById = new Map<string, { id: string | number; name: string; video_url?: string; cover_url?: string | null }>();
    try {
      const sc = await getSuperCoachLibrary();
      for (const e of sc) {
        const entry = { id: e.id, name: e.name, video_url: e.video_url, cover_url: e.cover_url };
        scByName.set(normalizeExName(e.name), entry);
        scById.set(String(e.id), entry);
      }
    } catch (e) {
      console.error('materialize: sc library fetch failed', e);
    }

    // 3) Cria templates + exercícios
    const templateIds: string[] = [];
    for (let wi = 0; wi < parsed.workouts.length; wi++) {
      const w = parsed.workouts[wi] || {};
      const { data: tmpl, error: tErr } = await admin.from('workout_templates').insert({
        program_id: programId,
        title: String(w.title || `Treino ${wi + 1}`).slice(0, 160),
        subtitle: String(w.subtitle || '').slice(0, 200),
        sort_order: Number.isFinite(w.sort_order) ? w.sort_order : wi + 1,
        weeks, days_per_week: dpw, minutes_per_day: mpd,
        released: false,
        created_by: userId,
      }).select('id').single();
      if (tErr) throw tErr;
      const templateId = tmpl!.id as string;
      templateIds.push(templateId);

      const exs = Array.isArray(w.exercises) ? w.exercises : [];
      const rows = exs.map((ex: any, i: number) => {
        // 1º prioridade: sc_id explícito devolvido pela IA (tag [SC:xxx])
        let rawName = String(ex?.name || '');
        let scIdHint = ex?.sc_id ? String(ex.sc_id) : '';
        const tagMatch = rawName.match(/\[SC:(\d+)\]/i);
        if (tagMatch) { scIdHint = scIdHint || tagMatch[1]; rawName = rawName.replace(/\s*\[SC:\d+\]\s*/i, '').trim(); }
        const sc = (scIdHint && scById.get(scIdHint)) || scByName.get(normalizeExName(rawName));
        const key = norm(sc?.name || rawName);
        const match = libIndex.get(key);
        return {
          template_id: templateId,
          exercise_id: match?.id || null,
          custom_name: match ? null : String(sc?.name || rawName).slice(0, 200),
          image_url: match?.image_url || sc?.cover_url || null,
          video_url: match?.video_url || sc?.video_url || null,
          sets: String(ex?.sets ?? '').slice(0, 60) || null,
          reps: String(ex?.reps ?? '').slice(0, 60) || null,
          rest_interval: String(ex?.rest_interval ?? '').slice(0, 60) || null,
          load_suggestion: String(ex?.load_suggestion ?? '').slice(0, 120) || null,
          group_name: ex?.group_name ? String(ex.group_name).slice(0, 60) : null,
          sort_order: Number.isFinite(ex?.sort_order) ? ex.sort_order : i + 1,
        };
      });
      if (rows.length) {
        const { error: exErr } = await admin.from('workout_template_exercises').insert(rows);
        if (exErr) throw exErr;
      }
    }

    // 4) Atribuir ao aluno se solicitado
    let assigned = 0;
    if (body.assign && body.studentId && templateIds.length) {
      const asRows = templateIds.map((tid) => ({
        user_id: body.studentId!, template_id: tid, assigned_by: userId, active: true, seen_by_student: false,
      }));
      const { error: aErr, count } = await admin.from('student_workout_assignments')
        .upsert(asRows as any, { onConflict: 'user_id,template_id', count: 'exact' });
      if (aErr) throw aErr;
      assigned = count || asRows.length;
    }

    return new Response(JSON.stringify({
      ok: true, programId, templateIds, workouts: templateIds.length, assigned,
      title,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('ai-workout-materialize', err);
    return new Response(JSON.stringify({ error: String((err as any)?.message || err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});