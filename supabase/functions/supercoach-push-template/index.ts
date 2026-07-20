// Espelha um workout_template do STH METHOD dentro do ST Coach.
// Fluxo:
//  1) Garante que training_programs.supercoach_program_id exista (POST /programs/)
//  2) Cria um training no ST Coach (POST /trainings/) e salva supercoach_training_id
//  3) POST /library/copy — clona itens da biblioteca do ST Coach para o training,
//     usando match por nome (normalizado) entre workout_template_exercises e a lib
//  4) GET /workouts?tid=<training_id> — captura os ids gerados
//  5) POST /workouts/{id} com _method=PATCH — grava series_repetitions, intervals, load
//
// Idempotência: se supercoach_training_id já existe, apenas re-sincroniza séries/reps
// nos workouts existentes (não recria a estrutura).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSuperCoachToken, getSuperCoachLibraryRaw, SC_COMMON_HEADERS, normalizeExName } from '../_shared/supercoach-library.ts';

interface Body { templateId: string }

const SC = 'https://supertreinosapp.com/api/v2';

async function scFetch(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${SC}${path}`, {
    ...init,
    headers: {
      ...SC_COMMON_HEADERS,
      authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* keep text */ }
  if (!res.ok) throw new Error(`ST Coach ${init.method || 'GET'} ${path} (${res.status}): ${text.slice(0, 220)}`);
  return json ?? {};
}

function combineSetsReps(sets?: string | null, reps?: string | null): string {
  const s = (sets || '').trim();
  const r = (reps || '').trim();
  if (s && r) return `${s}X${r}`.replace(/\s+/g, '');
  return s || r || '';
}

function parseInterval(rest?: string | null): string {
  if (!rest) return '';
  const m = String(rest).match(/(\d+)/);
  return m ? m[1] : '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) throw new Error('Não autenticado');

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const asUser = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: userRes, error: userErr } = await asUser.auth.getUser();
    if (userErr || !userRes?.user) throw new Error('Não autenticado');
    const admin = createClient(url, service);
    const { data: role } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userRes.user.id)
      .in('role', ['admin', 'consultor'])
      .maybeSingle();
    if (!role) throw new Error('Apenas admin/consultor podem espelhar no ST Coach');
    const adminUserId = userRes.user.id;

    const body = (await req.json().catch(() => ({}))) as Body;
    const templateId = body.templateId;
    if (!templateId) throw new Error('templateId obrigatório');

    // Carrega template + programa + exercícios
    const { data: tpl, error: tErr } = await admin
      .from('workout_templates')
      .select('id, title, subtitle, image_url, program_id, supercoach_training_id, supercoach_program_id')
      .eq('id', templateId)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!tpl) throw new Error('Template não encontrado');

    const { data: prog } = await admin
      .from('training_programs')
      .select('id, title, subtitle, poster_url, supercoach_program_id, difficulty, objective, weeks, days_per_week, minutes_per_day')
      .eq('id', tpl.program_id)
      .maybeSingle();
    if (!prog) throw new Error('Programa base não encontrado');

    const { data: exs } = await admin
      .from('workout_template_exercises')
      .select('id, custom_name, exercise_id, sets, reps, rest_interval, load_suggestion, sort_order, supercoach_workout_id, exercise_library:exercise_id(name)')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true });
    const exercises = (exs || []) as any[];
    if (!exercises.length) throw new Error('Template sem exercícios para espelhar');

    const token = await getSuperCoachToken();

    // 1) Garante programa no ST Coach
    let scProgramId: number | null = prog.supercoach_program_id ? Number(prog.supercoach_program_id) : null;
    if (!scProgramId) {
      const payload = {
        id: 0,
        cover_path: true,
        name: prog.title || 'Programa STH METHOD',
        user_id: 0,
        subtitle: prog.subtitle || '',
        category: 1,
        goal: 1,
        gender: 'ambos',
        location: 'qualquer',
        focus: 'completo',
        difficulty_level: prog.difficulty === 'avancado' ? 'Avançado' : prog.difficulty === 'iniciante' ? 'Iniciante' : 'Intermediário',
        video_url: 'https://player.vimeo.com/video/',
        description: '',
        weeks: prog.weeks || '',
        days_per_week: prog.days_per_week || '',
        minutes_per_day: prog.minutes_per_day || '',
        sort: 0, pay: 0, published: 1, premium: 0,
        cover_url: prog.poster_url || 'https://supertreinosapp.com/img/PROGRAMA-BANNER-PADRAO.jpg',
        translations: '',
        clone: 'original',
      };
      const created = await scFetch(token, '/programs/', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      scProgramId = Number(created?.program?.id);
      if (!scProgramId) throw new Error('Falha ao criar programa no ST Coach');
      await admin.from('training_programs').update({ supercoach_program_id: scProgramId }).eq('id', prog.id);
      // Também marca o template
      await admin.from('workout_templates').update({ supercoach_program_id: scProgramId }).eq('id', templateId);
    }

    // 2) Garante training
    let scTrainingId: number | null = tpl.supercoach_training_id ? Number(tpl.supercoach_training_id) : null;
    if (!scTrainingId) {
      const trPayload = {
        name: tpl.title || 'Treino',
        subtitle: tpl.subtitle || '',
        video_url: '', description: '',
        week_cycle: 0, weeks: '', days_per_week: '', minutes_per_day: '',
        program_id: scProgramId,
        sort: 0, pay: 0, published: 1, premium: 0,
        goal: 0, points: 2, translations: '',
        cover_url: tpl.image_url || 'https://www.api.homolog.supertreinosapp.com/img/TREINO-BANNER-PADRAO.jpg',
        cover_path: true,
      };
      const trCreated = await scFetch(token, '/trainings/', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(trPayload),
      });
      scTrainingId = Number(trCreated?.training?.id);
      if (!scTrainingId) throw new Error('Falha ao criar treino no ST Coach');
      await admin.from('workout_templates').update({ supercoach_training_id: scTrainingId }).eq('id', templateId);
    }

    // 3) Se ainda não copiou os exercícios (nenhum tem supercoach_workout_id), faz /library/copy
    const anyMirrored = exercises.some((e) => e.supercoach_workout_id);
    let copied = 0;
    if (!anyMirrored) {
      const rawLib = await getSuperCoachLibraryRaw();
      const libByName = new Map<string, any>();
      for (const item of rawLib) {
        const nm = normalizeExName(String(item?.name || ''));
        if (nm) libByName.set(nm, item);
      }
      const workoutsToCopy: any[] = [];
      const orderMap: { exId: string; libId: any; name: string }[] = [];
      for (const ex of exercises) {
        const name = ex.custom_name || ex.exercise_library?.name || '';
        const key = normalizeExName(String(name));
        const libItem = key ? libByName.get(key) : null;
        if (!libItem) continue;
        workoutsToCopy.push({ ...libItem, checked: true });
        orderMap.push({ exId: ex.id, libId: libItem.id, name });
      }
      if (workoutsToCopy.length) {
        const training = {
          id: scTrainingId, program_id: scProgramId,
          name: tpl.title || 'Treino', subtitle: tpl.subtitle || '',
          published: 1, pay: 0, premium: 0,
        };
        await scFetch(token, '/library/copy', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ training, workouts: workoutsToCopy, lang: 'br' }),
        });
        copied = workoutsToCopy.length;
      }

      // 4) Buscar workouts criados e mapear pelos library_workout_id (na ordem)
      const created = await scFetch(token, `/workouts?tid=${scTrainingId}`);
      const createdList: any[] = Array.isArray(created?.workouts) ? created.workouts
        : Array.isArray(created) ? created : (created?.data || []);
      // Map libId -> lista de workouts (podem existir duplicados de execuções anteriores)
      const byLib = new Map<string, any[]>();
      for (const w of createdList) {
        const k = String(w?.library_workout_id ?? w?.library_id ?? '');
        if (!k) continue;
        if (!byLib.has(k)) byLib.set(k, []);
        byLib.get(k)!.push(w);
      }
      // Consome do fim (mais recentes) para cada exercício local
      for (const m of orderMap) {
        const bucket = byLib.get(String(m.libId));
        const picked = bucket && bucket.length ? bucket.shift() : null;
        if (picked?.id) {
          await admin.from('workout_template_exercises')
            .update({ supercoach_workout_id: Number(picked.id) })
            .eq('id', m.exId);
        }
      }
    }

    // 5) Atualiza séries/reps/intervalo em todos os workouts espelhados
    const { data: refreshedExs } = await admin
      .from('workout_template_exercises')
      .select('id, custom_name, sets, reps, rest_interval, load_suggestion, supercoach_workout_id, exercise_library:exercise_id(name)')
      .eq('template_id', templateId);
    let patched = 0;
    for (const ex of (refreshedExs || []) as any[]) {
      const wid = ex.supercoach_workout_id;
      if (!wid) continue;
      const patch = {
        id: Number(wid),
        series_repetitions: combineSetsReps(ex.sets, ex.reps),
        intervals: parseInterval(ex.rest_interval),
        weight_suggestion: ex.load_suggestion || null,
        training_id: scTrainingId,
        _method: 'PATCH',
      };
      try {
        await scFetch(token, `/workouts/${wid}`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify(patch),
        });
        patched++;
      } catch (e) {
        console.error('patch workout failed', wid, (e as any)?.message);
      }
    }

    return new Response(JSON.stringify({
      ok: true, scProgramId, scTrainingId, copied, patched, exercises: exercises.length,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    const msg = (err as any)?.message || String(err);
    console.error('[supercoach-push-template]', msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});