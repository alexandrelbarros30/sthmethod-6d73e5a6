// STHIA — Materializar programa: converte a última resposta do chat (markdown)
// em programa real (training_programs + workout_templates + exercícios) e,
// opcionalmente, atribui ao aluno.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface Body {
  markdown: string;
  studentId?: string;
  assign?: boolean;
  titleHint?: string;
}

function norm(s: string) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
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
- Não crie exercícios que não estejam no texto.`;

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

    // 1) Cria programa
    const { data: prog, error: progErr } = await admin.from('training_programs').insert({
      title, subtitle, objective, difficulty, details,
      status: 'draft', created_by: userId,
    }).select('id').single();
    if (progErr) throw progErr;
    const programId = prog!.id as string;

    // 2) Carrega biblioteca para tentar matchear exercícios pelo nome
    const { data: lib } = await admin.from('exercise_library').select('id, name, image_url, video_url');
    const libIndex = new Map<string, any>();
    for (const e of (lib || [])) libIndex.set(norm(e.name), e);

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
        const match = libIndex.get(norm(ex?.name || ''));
        return {
          template_id: templateId,
          exercise_id: match?.id || null,
          custom_name: match ? null : String(ex?.name || '').slice(0, 200),
          image_url: match?.image_url || null,
          video_url: match?.video_url || null,
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