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

async function loadTemplateExercises(admin: any, templateId: string): Promise<any[]> {
  const { data: rows, error } = await admin
    .from('workout_template_exercises')
    .select('id, custom_name, custom_description, exercise_id, sets, reps, rest_interval, load_suggestion, sort_order, video_url, image_url, group_id, group_name, supercoach_workout_id')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`Falha ao carregar exercícios do treino: ${error.message}`);

  const exercises = rows || [];
  const libraryIds = Array.from(new Set(
    exercises.map((e: any) => e.exercise_id).filter(Boolean),
  ));

  if (!libraryIds.length) return exercises;

  const { data: libraryRows, error: libError } = await admin
    .from('exercise_library')
    .select('id, name, video_url, image_url')
    .in('id', libraryIds);
  if (libError) throw new Error(`Falha ao carregar biblioteca de exercícios: ${libError.message}`);

  const libraryById = new Map((libraryRows || []).map((item: any) => [String(item.id), item]));
  return exercises.map((exercise: any) => ({
    ...exercise,
    exercise_library: exercise.exercise_id ? libraryById.get(String(exercise.exercise_id)) || null : null,
  }));
}

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

function extractWorkoutList(payload: any): any[] {
  return Array.isArray(payload?.workouts) ? payload.workouts
    : Array.isArray(payload) ? payload
      : Array.isArray(payload?.data) ? payload.data
        : [];
}

function combineSetsReps(sets?: string | null, reps?: string | null): string {
  const s = (sets || '').trim();
  const r = (reps || '').trim();
  if (s && r) return `${s}X${r}`.replace(/\s+/g, '');
  return s || r || '';
}

function parseInterval(rest?: string | null): string {
  if (!rest) return '';
  const raw = String(rest).trim().toLowerCase().replace(',', '.');
  const min = raw.match(/(\d+(?:\.\d+)?)\s*(min|mins|minuto|minutos|m\b)/);
  if (min) return String(Math.round(Number(min[1]) * 60));
  const sec = raw.match(/(\d+(?:\.\d+)?)\s*(s|seg|segs|segundo|segundos)?/);
  return sec ? String(Math.round(Number(sec[1]))) : '';
}

function getExerciseName(ex: any, fallbackIndex = 0): string {
  return String(ex?.custom_name || ex?.exercise_library?.name || `Exercício ${fallbackIndex + 1}`).trim();
}

function buildWorkoutPayload(ex: any, wid: number | null, scTrainingId: number | null, sort: number, supersetGroup: number, patch = true) {
  const name = getExerciseName(ex, sort);
  const seriesRepetitions = combineSetsReps(ex.sets, ex.reps);
  const intervals = parseInterval(ex.rest_interval);
  const description = ex.custom_description || '';
  const videoUrl = ex.video_url || ex.exercise_library?.video_url || '';
  const coverUrl = ex.image_url || ex.exercise_library?.image_url || '';
  const payload: Record<string, any> = {
    ...(wid ? { id: Number(wid) } : {}),
    name,
    title: name,
    training_id: scTrainingId,
    series_repetitions: seriesRepetitions,
    sets_reps: seriesRepetitions,
    repetitions: seriesRepetitions,
    intervals,
    rest_interval: intervals ? `${intervals}s` : '',
    weight_suggestion: ex.load_suggestion || '',
    load_suggestion: ex.load_suggestion || '',
    sort,
    description,
    published: 1,
    pay: 0,
    premium: 0,
    translations: '',
    // Biset/Triset — ST Coach agrupa por superset_group (valor 0 = sem grupo)
    superset_group: supersetGroup,
    group: supersetGroup,
    group_name: ex.group_name || '',
    ...(videoUrl ? { video_url: videoUrl } : {}),
    ...(coverUrl ? { cover_url: coverUrl, cover_path: true } : {}),
    ...(patch ? { _method: 'PATCH' } : {}),
  };
  return payload;
}

async function createScWorkout(token: string, ex: any, scTrainingId: number | null, sort: number, supersetGroup: number): Promise<number> {
  const created = await scFetch(token, '/workouts/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildWorkoutPayload(ex, null, scTrainingId, sort, supersetGroup, false)),
  });
  const id = Number(created?.workout?.id || created?.data?.id || created?.id);
  if (!Number.isFinite(id) || id <= 0) throw new Error('ST Coach não retornou o ID do exercício criado');
  return id;
}

function isNotFoundError(error: unknown): boolean {
  return String((error as any)?.message || error || '').includes('(404)');
}

function extractTrainingList(payload: any): any[] {
  return Array.isArray(payload?.trainings) ? payload.trainings
    : Array.isArray(payload) ? payload
      : Array.isArray(payload?.data) ? payload.data
        : Array.isArray(payload?.program?.trainings) ? payload.program.trainings
          : [];
}

function buildProgramPayload(scProgramId: number | null, prog: any, tpl: any) {
  return {
    id: scProgramId || 0,
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
}

async function createScProgram(token: string, prog: any, tpl: any): Promise<number> {
  const created = await scFetch(token, '/programs/', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildProgramPayload(null, prog, tpl)),
  });
  const scProgramId = Number(created?.program?.id);
  if (!scProgramId) throw new Error('Falha ao criar programa no ST Coach');
  return scProgramId;
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

    const exercises = await loadTemplateExercises(admin, templateId);
    if (!exercises.length) {
      throw new Error(`Template sem exercícios para espelhar (${tpl.title || templateId}). Abra o treino e salve ao menos um exercício antes de espelhar.`);
    }

    const token = await getSuperCoachToken();

    // 1) Garante programa no ST Coach
    let scProgramId: number | null = prog.supercoach_program_id ? Number(prog.supercoach_program_id) : null;
    let programRecreated = false;
    if (scProgramId) {
      try {
        await scFetch(token, `/programs/${scProgramId}`);
      } catch (e) {
        if (isNotFoundError(e)) {
          console.warn('programa ST Coach antigo/inexistente; recriando', scProgramId);
          scProgramId = null;
          programRecreated = true;
        } else {
          console.warn('validação do programa ST Coach falhou; seguindo com id salvo', (e as any)?.message);
        }
      }
    }
    if (!scProgramId) {
      scProgramId = await createScProgram(token, prog, tpl);
      programRecreated = true;
    }
    if (prog.id) {
      await admin.from('training_programs').update({ supercoach_program_id: scProgramId }).eq('id', prog.id);
      const tplPatch: Record<string, any> = { supercoach_program_id: scProgramId };
      if (programRecreated) tplPatch.supercoach_training_id = null;
      await admin.from('workout_templates').update(tplPatch).eq('program_id', prog.id);
      if (programRecreated) tpl.supercoach_training_id = null;
    } else {
      await admin.from('workout_templates').update({ supercoach_program_id: scProgramId }).eq('id', templateId);
    }

    // 1.1) Sempre sincroniza a CAPA do programa no ST Coach com a poster_url atual do STH METHOD
    if (scProgramId && prog.poster_url) {
      try {
        await scFetch(token, `/programs/${scProgramId}`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id: scProgramId,
            cover_url: prog.poster_url,
            cover_path: true,
            name: prog.title || 'Programa STH METHOD',
            subtitle: prog.subtitle || '',
            published: 1, pay: 0, premium: 0,
            _method: 'PATCH',
          }),
        });
      } catch (e) {
        if (isNotFoundError(e)) {
          console.warn('programa ST Coach não encontrado ao sincronizar capa; recriando', scProgramId);
          scProgramId = await createScProgram(token, prog, tpl);
          programRecreated = true;
          tpl.supercoach_training_id = null;
          if (prog.id) {
            await admin.from('training_programs').update({ supercoach_program_id: scProgramId }).eq('id', prog.id);
            await admin.from('workout_templates')
              .update({ supercoach_program_id: scProgramId, supercoach_training_id: null })
              .eq('program_id', prog.id);
          } else {
            await admin.from('workout_templates')
              .update({ supercoach_program_id: scProgramId, supercoach_training_id: null })
              .eq('id', templateId);
          }
        } else {
          console.warn('sync program cover falhou', (e as any)?.message);
        }
      }
    }

    // 2) Garante training
    let scTrainingId: number | null = tpl.supercoach_training_id ? Number(tpl.supercoach_training_id) : null;
    if (scTrainingId) {
      try {
        const trainingsPayload = await scFetch(token, `/trainings?pid=${scProgramId}`);
        const validTrainingIds = new Set(
          extractTrainingList(trainingsPayload)
            .map((t: any) => Number(t?.id))
            .filter((n: number) => Number.isFinite(n) && n > 0),
        );
        if (!validTrainingIds.has(scTrainingId)) {
          console.warn('training ST Coach antigo/inexistente neste programa; recriando', scTrainingId);
          await admin.from('workout_templates')
            .update({ supercoach_training_id: null })
            .eq('id', templateId);
          scTrainingId = null;
        }
      } catch (e) {
        console.warn('validação do training ST Coach falhou; seguindo com id salvo', (e as any)?.message);
      }
    }
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

    // 2.1) Sempre sincroniza a CAPA do training no ST Coach com a image_url atual
    if (scTrainingId && tpl.image_url) {
      try {
        await scFetch(token, `/trainings/${scTrainingId}`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id: scTrainingId,
            cover_url: tpl.image_url,
            cover_path: true,
            name: tpl.title || 'Treino',
            subtitle: tpl.subtitle || '',
            program_id: scProgramId,
            published: 1, pay: 0, premium: 0,
            _method: 'PATCH',
          }),
        });
      } catch (e) {
        console.warn('sync training cover falhou', (e as any)?.message);
      }
    }

    // 3) Garante que cada exercício local tenha um workout remoto válido dentro DESTE training.
    //    Isso evita o falso positivo causado por IDs copiados de outro programa/treino.
    let copied = 0;
    const remoteBefore = extractWorkoutList(await scFetch(token, `/workouts?tid=${scTrainingId}`));
    const remoteIds = new Set(
      remoteBefore.map((w: any) => Number(w?.id)).filter((n: number) => Number.isFinite(n) && n > 0),
    );
    for (const ex of exercises) {
      const localRemoteId = Number(ex.supercoach_workout_id);
      if (Number.isFinite(localRemoteId) && localRemoteId > 0 && !remoteIds.has(localRemoteId)) {
        await admin.from('workout_template_exercises')
          .update({ supercoach_workout_id: null })
          .eq('id', ex.id);
        ex.supercoach_workout_id = null;
      }
    }

    const preGroupIndexMap = new Map<string, number>();
    let preGroupCounter = 0;
    for (const ex of exercises as any[]) {
      const g = ex.group_id ? String(ex.group_id) : '';
      if (g && !preGroupIndexMap.has(g)) { preGroupCounter++; preGroupIndexMap.set(g, preGroupCounter); }
    }

    const missingExercises = exercises.filter((e) => !e.supercoach_workout_id);
    let unmatched: string[] = [];
    if (missingExercises.length) {
      const rawLib = await getSuperCoachLibraryRaw();
      const libByName = new Map<string, any>();
      for (const item of rawLib) {
        const nm = normalizeExName(String(item?.name || ''));
        if (nm) libByName.set(nm, item);
      }
      const workoutsToCopy: any[] = [];
      const orderMap: { exId: string; libId: any; name: string }[] = [];
      const copyFailures: string[] = [];
      unmatched = [];
      const directCreateQueue: { ex: any; reason: string }[] = [];
      for (const ex of missingExercises) {
        const name = getExerciseName(ex);
        const key = normalizeExName(String(name));
        const libItem = key ? libByName.get(key) : null;
        if (!libItem) {
          directCreateQueue.push({ ex, reason: `não encontrado na biblioteca ST Coach: ${name}` });
          continue;
        }
        workoutsToCopy.push({ ...libItem, checked: true });
        orderMap.push({ exId: ex.id, libId: libItem.id, name });
      }
      if (workoutsToCopy.length) {
        const training = {
          id: scTrainingId, program_id: scProgramId,
          name: tpl.title || 'Treino', subtitle: tpl.subtitle || '',
          published: 1, pay: 0, premium: 0,
        };
        try {
          await scFetch(token, '/library/copy', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ training, workouts: workoutsToCopy, lang: 'br' }),
          });
          copied = workoutsToCopy.length;
        } catch (bulkError) {
          console.warn('library/copy em lote falhou; tentando exercício por exercício', (bulkError as any)?.message);
          for (let i = 0; i < workoutsToCopy.length; i++) {
            try {
              await scFetch(token, '/library/copy', {
                method: 'POST', headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ training, workouts: [workoutsToCopy[i]], lang: 'br' }),
              });
              copied++;
            } catch (singleError) {
              const name = orderMap[i]?.name || String(workoutsToCopy[i]?.name || workoutsToCopy[i]?.id || 'exercício');
              const msg = (singleError as any)?.message || String(singleError);
              copyFailures.push(`${name}: ${msg}`);
              const failedLocal = missingExercises.find((item: any) => item.id === orderMap[i]?.exId);
              if (failedLocal) directCreateQueue.push({ ex: failedLocal, reason: msg });
              console.error('library/copy individual falhou', name, msg);
            }
          }
        }
      }
      unmatched.push(...copyFailures);
      // 4) Buscar workouts criados e mapear pelos library_workout_id (na ordem)
      const created = await scFetch(token, `/workouts?tid=${scTrainingId}`);
      const usedRemoteIds = new Set(
        exercises.map((e) => Number(e.supercoach_workout_id)).filter((n) => Number.isFinite(n) && n > 0),
      );
      const createdList: any[] = extractWorkoutList(created).filter((w: any) => !usedRemoteIds.has(Number(w?.id)));
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

      const afterCopyExs = await loadTemplateExercises(admin, templateId);
      const stillMissingById = new Map(
        ((afterCopyExs || []) as any[])
          .filter((item) => !item.supercoach_workout_id)
          .map((item) => [String(item.id), item]),
      );
      const directReasonById = new Map(directCreateQueue.map((item) => [String(item.ex.id), item.reason]));
      // ST Coach ordena os workouts do maior para o menor valor de `sort`,
      // então invertemos para preservar a ordem original do STH METHOD.
      const totalForSort = (exercises as any[]).length;
      for (const current of stillMissingById.values()) {
        const localIdx = Number(current.sort_order ?? exercises.findIndex((item: any) => item.id === current.id));
        const invertedSort = Number.isFinite(localIdx) ? Math.max(0, totalForSort - 1 - localIdx) : 0;
        const supersetGroup = current.group_id ? (preGroupIndexMap.get(String(current.group_id)) || 0) : 0;
        const reason = directReasonById.get(String(current.id)) || 'cópia da biblioteca não retornou vínculo rastreável';
        try {
          const wid = await createScWorkout(token, current, scTrainingId, invertedSort, supersetGroup);
          await admin.from('workout_template_exercises')
            .update({ supercoach_workout_id: wid })
            .eq('id', current.id);
          copied++;
          unmatched = unmatched.filter((item) => !item.startsWith(`${getExerciseName(current)}:`) && !item.includes(getExerciseName(current)));
        } catch (createError) {
          const msg = (createError as any)?.message || String(createError);
          unmatched.push(`${getExerciseName(current)}: criação direta falhou após ${reason}: ${msg}`);
          console.error('create workout direct failed', getExerciseName(current), msg);
        }
      }
    }

    // 5) Atualiza séries/reps/intervalo em todos os workouts espelhados
    const refreshedExs = await loadTemplateExercises(admin, templateId);

    // Mapeia group_id (uuid) -> índice numérico 1..N para enviar como superset ao ST Coach.
    const groupIndexMap = new Map<string, number>();
    let groupCounter = 0;
    for (const ex of (refreshedExs || []) as any[]) {
      const g = ex.group_id ? String(ex.group_id) : '';
      if (g && !groupIndexMap.has(g)) { groupCounter++; groupIndexMap.set(g, groupCounter); }
    }
    let patched = 0;
    const orderedExs = (refreshedExs || []) as any[];
    // ST Coach exibe os workouts na ordem DECRESCENTE de `sort`, portanto
    // enviamos (total - 1 - idx) para manter a mesma ordem do STH METHOD.
    const totalOrdered = orderedExs.length;
    for (let idx = 0; idx < orderedExs.length; idx++) {
      const ex = orderedExs[idx];
      const wid = ex.supercoach_workout_id;
      if (!wid) continue;
      const supersetGroup = ex.group_id ? (groupIndexMap.get(String(ex.group_id)) || 0) : 0;
      const scSort = Math.max(0, totalOrdered - 1 - idx);
      const patch = buildWorkoutPayload(ex, Number(wid), scTrainingId, scSort, supersetGroup, true);
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
      ok: true, scProgramId, scTrainingId, copied, patched, removed, assignmentsSynced,
      exercises: exercises.length,
      unmatched,
      groups: groupCounter,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    const msg = (err as any)?.message || String(err);
    console.error('[supercoach-push-template]', msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});