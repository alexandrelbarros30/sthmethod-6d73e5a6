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

interface Body { templateId: string; programId?: string }

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
    const { data: roles, error: roleErr } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userRes.user.id)
      .in('role', ['admin', 'consultor']);
    if (roleErr) throw roleErr;
    if (!roles?.length) throw new Error('Apenas admin/consultor podem espelhar no ST Coach');
    const adminUserId = userRes.user.id;

    const body = (await req.json().catch(() => ({}))) as Body;
    const templateId = body.templateId;
    if (!templateId) throw new Error('templateId obrigatório');

    // Carrega template + programa + exercícios
    const { data: tpl, error: tErr } = await admin
      .from('workout_templates')
      .select('id, title, subtitle, image_url, program_id, supercoach_training_id, supercoach_program_id, weeks, days_per_week, minutes_per_day')
      .eq('id', templateId)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!tpl) throw new Error('Template não encontrado');

    const programSelect = 'id, title, subtitle, poster_url, supercoach_program_id, difficulty, objective';
    let prog: any = null;
    const candidateProgramIds = Array.from(new Set([tpl.program_id, body.programId].filter(Boolean)));
    for (const pid of candidateProgramIds) {
      const { data, error } = await admin
        .from('training_programs')
        .select(programSelect)
        .eq('id', pid)
        .maybeSingle();
      if (error) throw error;
      if (data) { prog = data; break; }
    }
    if (!prog && body.programId) {
      const { error: relinkErr } = await admin
        .from('workout_templates')
        .update({ program_id: body.programId })
        .eq('id', templateId);
      if (relinkErr) throw relinkErr;
      const { data, error } = await admin
        .from('training_programs')
        .select(programSelect)
        .eq('id', body.programId)
        .maybeSingle();
      if (error) throw error;
      if (data) prog = data;
    }
    if (!prog) {
      prog = {
        id: null,
        title: tpl.title || 'Programa STH METHOD',
        subtitle: tpl.subtitle || '',
        poster_url: tpl.image_url || null,
        supercoach_program_id: tpl.supercoach_program_id || null,
        difficulty: 'intermediario',
        objective: 'hipertrofia',
        weeks: tpl.weeks || '',
        days_per_week: tpl.days_per_week || '',
        minutes_per_day: tpl.minutes_per_day || '',
      };
    }
    if (prog.id && tpl.program_id !== prog.id) {
      const { error: relinkErr } = await admin
        .from('workout_templates')
        .update({ program_id: prog.id })
        .eq('id', templateId);
      if (relinkErr) throw relinkErr;
    }

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
        weeks: tpl.weeks || '',
        days_per_week: tpl.days_per_week || '',
        minutes_per_day: tpl.minutes_per_day || '',
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
      if (prog.id) await admin.from('training_programs').update({ supercoach_program_id: scProgramId }).eq('id', prog.id);
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

    // 6) Limpa duplicados no ST Coach: qualquer workout do training que
    //    não esteja rastreado localmente é removido para evitar excesso de
    //    exercícios em relação ao STH METHOD.
    let removed = 0;
    try {
      const currentIds = new Set(
        ((refreshedExs || []) as any[])
          .map((e) => Number(e.supercoach_workout_id))
          .filter((n) => Number.isFinite(n) && n > 0),
      );
      const remote = await scFetch(token, `/workouts?tid=${scTrainingId}`);
      const remoteList: any[] = Array.isArray(remote?.workouts) ? remote.workouts
        : Array.isArray(remote) ? remote : (remote?.data || []);
      for (const w of remoteList) {
        const rid = Number(w?.id);
        if (!Number.isFinite(rid) || rid <= 0) continue;
        if (currentIds.has(rid)) continue;
        try {
          await scFetch(token, `/workouts/${rid}`, { method: 'DELETE' });
          removed++;
        } catch (e) {
          console.warn('delete extra workout falhou', rid, (e as any)?.message);
        }
      }
    } catch (e) {
      console.warn('cleanup workouts falhou', (e as any)?.message);
    }

    // 7) Re-espelha atribuições: garante que todo aluno com atribuição ativa
    //    a algum template deste programa também esteja com o programa
    //    atribuído no ST Coach.
    let assignmentsSynced = 0;
    try {
      const progIdLocal = prog?.id || tpl.program_id;
      if (progIdLocal) {
        const { data: tplsProg } = await admin
          .from('workout_templates').select('id').eq('program_id', progIdLocal);
        const tplIds = (tplsProg || []).map((t: any) => t.id);
        if (tplIds.length) {
          const { data: rows } = await admin
            .from('student_workout_assignments')
            .select('user_id')
            .in('template_id', tplIds)
            .eq('active', true);
          const userIds = Array.from(new Set((rows || []).map((r: any) => r.user_id).filter(Boolean)));
          for (const uid of userIds) {
            try {
              const r = await fetch(`${url}/functions/v1/supercoach-assign-program`, {
                method: 'POST',
                headers: { 'content-type': 'application/json', Authorization: auth },
                body: JSON.stringify({ userId: uid, programId: progIdLocal, action: 'assign' }),
              });
              const j = await r.json().catch(() => ({}));
              if (j?.ok !== false) assignmentsSynced++;
            } catch (e) {
              console.warn('assign sync falhou', uid, (e as any)?.message);
            }
          }
        }
      }
    } catch (e) {
      console.warn('assignments sync falhou', (e as any)?.message);
    }

    return new Response(JSON.stringify({
      ok: true, scProgramId, scTrainingId, copied, patched, removed, assignmentsSynced, exercises: exercises.length,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    const msg = (err as any)?.message || String(err);
    console.error('[supercoach-push-template]', msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});