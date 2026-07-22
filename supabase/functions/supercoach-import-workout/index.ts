import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const LOGIN_URL = 'https://supertreinosapp.com/api/v2/user/login'
const PROGRAMS_URL = 'https://supertreinosapp.com/api/v2/programs?pid='
const TRAININGS_URL = (pid: number | string) => `https://supertreinosapp.com/api/v2/trainings?pid=${pid}`
const WORKOUT_URL = (wid: number | string) => `https://supertreinosapp.com/api/v2/workouts/${wid}`
const PROGRAM_URL = (pid: number | string) => `https://supertreinosapp.com/api/v2/programs/${pid}`

const COMMON_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'content-type': 'application/json',
  'custom-origin': 'adm-site',
  'origin': 'https://adm.appsupercoach.com',
  'referer': 'https://adm.appsupercoach.com/',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
}

let cachedToken: { token: string; expiresAt: number } | null = null

function nullableNumber(value: any): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

function cleanImageUrl(value: any): string {
  const url = String(value || '').trim()
  if (!url || url.includes('no-video-default')) return ''
  return url
}

function parseSetsReps(sr: string): { sets: string; reps: string } {
  const s = String(sr || '').trim()
  const m = s.match(/^\s*(\d+)\s*[xX]\s*(.+)$/)
  if (m) return { sets: m[1], reps: m[2].trim() }
  return { sets: '', reps: s }
}

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token
  const email = Deno.env.get('SUPERCOACH_EMAIL')
  const password = Deno.env.get('SUPERCOACH_PASSWORD')
  if (!email || !password) throw new Error('SUPERCOACH_EMAIL / SUPERCOACH_PASSWORD não configurados')
  const res = await fetch(LOGIN_URL, {
    method: 'POST', headers: COMMON_HEADERS,
    body: JSON.stringify({ email, password }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Login SuperCoach falhou (${res.status}): ${text.slice(0, 200)}`)
  const json = JSON.parse(text)
  const token = json?.access_token || json?.token || json?.data?.access_token
  if (!token) throw new Error('Token ausente na resposta de login')
  cachedToken = { token, expiresAt: Date.now() + 30 * 60_000 }
  return token
}

async function requireWriter(req: Request) {
  const auth = req.headers.get('Authorization') || ''
  if (!auth.startsWith('Bearer ')) throw new Error('Não autenticado')
  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const asUser = createClient(url, anon, { global: { headers: { Authorization: auth } } })
  const { data: userRes, error: userErr } = await asUser.auth.getUser()
  if (userErr || !userRes?.user) throw new Error('Não autenticado')
  const admin = createClient(url, service)
  const { data: roles, error: roleErr } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userRes.user.id)
    .in('role', ['admin', 'consultor'])
  if (roleErr) throw roleErr
  if (!roles?.length) throw new Error('Apenas admin/consultor podem importar treinos')
  return { admin, userId: userRes.user.id }
}

async function fetchPrograms(token: string) {
  const r = await fetch(PROGRAMS_URL, { headers: { ...COMMON_HEADERS, authorization: `Bearer ${token}` } })
  const text = await r.text()
  if (!r.ok) throw new Error(`programs (${r.status}): ${text.slice(0, 200)}`)
  const j = JSON.parse(text)
  const list = j?.programs || j?.data || j || []
  return (Array.isArray(list) ? list : []).map((p: any) => ({
    id: Number(p.id), name: p.name || p.title || `Programa ${p.id}`, subtitle: p.subtitle || null,
    weeks: p.weeks || null, days_per_week: p.days_per_week || null,
    minutes_per_day: p.minutes_per_day || null, cover_url: p.cover_url || null,
  })).filter((p: any) => Number.isFinite(p.id))
}

function extractArray(json: any, keys: string[]) {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => acc?.[part], json)
    if (Array.isArray(value)) return value
  }
  return []
}

function normalizeTraining(raw: any) {
  const workouts = raw?.workouts_lite || raw?.workouts || raw?.exercises || raw?.items || []
  return {
    id: Number(raw.id),
    name: raw.name || raw.title || `Treino ${raw.id}`,
    subtitle: raw.subtitle || null,
    description: raw.description || null,
    weeks: raw.weeks || null,
    days_per_week: raw.days_per_week || null,
    minutes_per_day: raw.minutes_per_day || null,
    cover_url: raw.cover_url || raw.image_url || null,
    exercises: (Array.isArray(workouts) ? workouts : []).map((w: any) => ({
      id: w.id,
      name: w.name || w.title || '',
      series_repetitions: w.series_repetitions || w.sets_reps || '',
      cover_url: w.cover_url || w.image_url || null,
      video_url_thumb: w.video_url_thumb || w.video_url || null,
    })),
  }
}

async function fetchTrainings(token: string, programId: number | string) {
  const auth = { ...COMMON_HEADERS, authorization: `Bearer ${token}` }
  const r = await fetch(TRAININGS_URL(programId), { headers: auth })
  const text = await r.text()
  if (!r.ok) throw new Error(`trainings (${r.status}): ${text.slice(0, 200)}`)
  const j = JSON.parse(text)
  let list = extractArray(j, ['trainings', 'data', 'program.trainings', 'data.trainings'])

  if (list.length <= 1) {
    const detail = await fetch(PROGRAM_URL(programId), { headers: auth }).catch(() => null)
    if (detail?.ok) {
      const detailJson = JSON.parse(await detail.text())
      const detailList = extractArray(detailJson, ['trainings', 'data.trainings', 'program.trainings', 'data.program.trainings'])
      if (detailList.length > list.length) list = detailList
    }
  }

  return (Array.isArray(list) ? list : []).map(normalizeTraining).filter((t: any) => Number.isFinite(t.id))
}

async function fetchTrainingDetails(token: string, programId: number | string, trainingId: number | string) {
  const auth = { ...COMMON_HEADERS, authorization: `Bearer ${token}` }
  const trainings = await fetchTrainings(token, programId)
  const t = trainings.find((x: any) => String(x.id) === String(trainingId))
  if (!t) throw new Error('training não encontrado')
  const lite = (t.exercises || []) as any[]
  const details = await Promise.all(lite.map(async (w) => {
    try {
      const rd = await fetch(WORKOUT_URL(w.id), { headers: auth })
      if (!rd.ok) return null
      const jd = JSON.parse(await rd.text())
      return jd?.workout || jd?.data || null
    } catch { return null }
  }))
  const exercises = lite.map((w, i) => {
    const d = details[i] || {}
    return {
      id: w.id,
      name: d.name || w.name || '',
      series_repetitions: d.series_repetitions || w.series_repetitions || '',
      description: d.description || '',
      video_url: d.video_url || w.video_url_thumb || '',
      cover_url: d.cover_url || w.cover_url || null,
      intervals: d.intervals ?? null,
      weight_suggestion: d.weight_suggestion || null,
    }
  })
  return { training: t, exercises }
}

function uniqueTrainings(trainings: any[]) {
  const seen = new Set<string>()
  return trainings.filter((t) => {
    const key = String(t.id || '')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function ensureLocalProgram(admin: any, p: any, userId: string, localProgramId?: string) {
  const patch = {
    title: p.name || `Programa ${p.id}`,
    subtitle: p.subtitle || null,
    details: p.subtitle || '',
    objective: 'hypertrophy',
    difficulty: 'intermediate',
    status: 'published',
    poster_url: p.cover_url || null,
    updated_at: new Date().toISOString(),
  }

  if (localProgramId) {
    const { error } = await admin.from('training_programs')
      .update({ ...patch, supercoach_program_id: Number(p.id) })
      .eq('id', localProgramId)
    if (error && error.code !== '23505') throw error
    if (error?.code === '23505') {
      const { error: fallbackErr } = await admin.from('training_programs').update(patch).eq('id', localProgramId)
      if (fallbackErr) throw fallbackErr
    }
    return localProgramId
  }

  const { data: existing, error: existingErr } = await admin.from('training_programs')
    .select('id')
    .eq('supercoach_program_id', Number(p.id))
    .maybeSingle()
  if (existingErr) throw existingErr
  if (existing?.id) {
    const { error } = await admin.from('training_programs').update(patch).eq('id', existing.id)
    if (error) throw error
    return existing.id
  }

  const { data: created, error: createErr } = await admin.from('training_programs')
    .insert({ ...patch, supercoach_program_id: Number(p.id), created_by: userId })
    .select('id')
    .single()
  if (createErr) throw createErr
  return created.id
}

async function findReusableTemplate(admin: any, localProgramId: string, p: any, t: any) {
  const { data: byTraining, error: byTrainingErr } = await admin.from('workout_templates')
    .select('id')
    .eq('program_id', localProgramId)
    .eq('supercoach_training_id', Number(t.id))
    .maybeSingle()
  if (byTrainingErr) throw byTrainingErr
  if (byTraining?.id) return byTraining.id

  const { data: placeholder, error: placeholderErr } = await admin.from('workout_templates')
    .select('id')
    .eq('program_id', localProgramId)
    .eq('supercoach_program_id', Number(p.id))
    .is('supercoach_training_id', null)
    .limit(1)
    .maybeSingle()
  if (placeholderErr) throw placeholderErr
  return placeholder?.id || null
}

async function removeEmptyPlaceholders(admin: any, localProgramId: string, sourceProgramId: number | string) {
  const { data: placeholders, error } = await admin.from('workout_templates')
    .select('id')
    .eq('program_id', localProgramId)
    .eq('supercoach_program_id', Number(sourceProgramId))
    .is('supercoach_training_id', null)
  if (error) throw error
  for (const tpl of placeholders || []) {
    const { count, error: countErr } = await admin.from('workout_template_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', tpl.id)
    if (countErr) throw countErr
    if (!count) {
      const { error: delErr } = await admin.from('workout_templates').delete().eq('id', tpl.id)
      if (delErr) throw delErr
    }
  }
}

function buildExerciseRows(templateId: string, source: any[]) {
  return source.map((ex, i) => {
    const { sets, reps } = parseSetsReps(ex.series_repetitions)
    return {
      template_id: templateId,
      exercise_id: null,
      custom_name: ex.name || `Exercício ${i + 1}`,
      custom_description: ex.description || '',
      sets,
      reps,
      rest_interval: ex.intervals != null && Number(ex.intervals) > 0 ? `${ex.intervals}s` : '',
      load_suggestion: ex.weight_suggestion || '',
      video_url: ex.video_url || ex.video_url_thumb || '',
      image_url: cleanImageUrl(ex.cover_url || ex.video_url_thumb),
      supercoach_workout_id: Number.isFinite(Number(ex.id)) ? Number(ex.id) : null,
      sort_order: i,
    }
  })
}

async function importTraining(admin: any, token: string, userId: string, p: any, t: any, localProgramId: string) {
  const details = await fetchTrainingDetails(token, p.id, t.id)
  const source = details.exercises.length ? details.exercises : (t.exercises || [])
  if (!source.length) throw new Error(`Sem exercícios retornados para ${t.name}`)

  let templateId = await findReusableTemplate(admin, localProgramId, p, t)
  const patch = {
    title: t.name || `Treino ${t.id}`,
    subtitle: t.subtitle || null,
    description: [p.name, t.subtitle, t.description].filter(Boolean).join(' • '),
    image_url: t.cover_url || p.cover_url || '',
    weeks: nullableNumber(t.weeks) ?? nullableNumber(p.weeks),
    days_per_week: nullableNumber(t.days_per_week) ?? nullableNumber(p.days_per_week),
    minutes_per_day: nullableNumber(t.minutes_per_day) ?? nullableNumber(p.minutes_per_day),
    program_id: localProgramId,
    released: true,
    supercoach_program_id: null,
    supercoach_training_id: Number(t.id),
    updated_at: new Date().toISOString(),
  }

  if (templateId) {
    const { error: updateErr } = await admin.from('workout_templates').update(patch).eq('id', templateId)
    if (updateErr) throw updateErr
    const { error: deleteErr } = await admin.from('workout_template_exercises').delete().eq('template_id', templateId)
    if (deleteErr) throw deleteErr
  } else {
    const { data: tpl, error: insertErr } = await admin.from('workout_templates')
      .insert({ ...patch, created_by: userId })
      .select('id')
      .single()
    if (insertErr) throw insertErr
    templateId = tpl.id
  }

  const rows = buildExerciseRows(templateId, source)
  if (!rows.length) throw new Error(`Nenhum exercício preparado para ${t.name || t.id}`)
  const { error: exerciseErr } = await admin.from('workout_template_exercises').insert(rows)
  if (exerciseErr) throw exerciseErr
  const { count, error: verifyErr } = await admin.from('workout_template_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', templateId)
  if (verifyErr) throw verifyErr
  if ((count || 0) !== rows.length) throw new Error(`Falha ao confirmar exercícios de ${t.name || t.id}: gravados ${count || 0}/${rows.length}`)
  return { templateId, exercises: rows.length }
}

async function resolveProgram(token: string, programId: number | string, bodyProgram?: any) {
  if (bodyProgram?.id) return bodyProgram
  const programs = await fetchPrograms(token)
  return programs.find((p: any) => String(p.id) === String(programId)) || { id: Number(programId), name: `Programa ${programId}` }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json().catch(() => ({}))
    const { action, programId } = body as { action: 'list-programs' | 'list-trainings'; programId?: number | string }
    if (!action) throw new Error('action é obrigatório')

    const token = await getToken()
    const auth = { ...COMMON_HEADERS, authorization: `Bearer ${token}` }

    if (action === 'list-programs') {
      const programs = await fetchPrograms(token)
      return new Response(JSON.stringify({ programs }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    if (action === 'list-trainings') {
      if (!programId) throw new Error('programId obrigatório')
      const trainings = await fetchTrainings(token, programId)
      return new Response(JSON.stringify({ trainings }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    if (action === 'get-training-details') {
      const { trainingId } = body as { trainingId?: number | string }
      if (!trainingId) throw new Error('trainingId obrigatório')
      const { programId: pid } = body as { programId?: number | string }
      if (!pid) throw new Error('programId obrigatório')
      const { training, exercises } = await fetchTrainingDetails(token, pid, trainingId)
      return new Response(JSON.stringify({
        training: {
          id: training.id, name: training.name, subtitle: training.subtitle || null,
          description: training.description || null,
          weeks: training.weeks || null, days_per_week: training.days_per_week || null,
          minutes_per_day: training.minutes_per_day || null,
        },
        exercises,
      }), { headers: { ...corsHeaders, 'content-type': 'application/json' } })
    }

    if (action === 'import-training') {
      const { admin, userId } = await requireWriter(req)
      const p = await resolveProgram(token, programId!, (body as any).program)
      const t = (body as any).training
      if (!p?.id) throw new Error('programId obrigatório')
      if (!t?.id) throw new Error('training obrigatório')
      const localProgramId = await ensureLocalProgram(admin, p, userId, (body as any).localProgramId)
      const result = await importTraining(admin, token, userId, p, t, localProgramId)
      return new Response(JSON.stringify({ ok: true, programId: localProgramId, trainings: 1, exercises: result.exercises }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    if (action === 'import-program') {
      if (!programId) throw new Error('programId obrigatório')
      const { admin, userId } = await requireWriter(req)
      const p = await resolveProgram(token, programId, (body as any).program)
      const localProgramId = await ensureLocalProgram(admin, p, userId, (body as any).localProgramId)
      await removeEmptyPlaceholders(admin, localProgramId, programId)
      const trainings = uniqueTrainings(await fetchTrainings(token, programId))
      if (!trainings.length) throw new Error('Nenhum treino retornado pelo ST Coach para este programa')
      let imported = 0, exercises = 0
      const failures: { training: string; error: string }[] = []
      for (const t of trainings) {
        try {
          const result = await importTraining(admin, token, userId, p, t, localProgramId)
          imported++
          exercises += result.exercises
        } catch (e: any) {
          failures.push({ training: t.name || String(t.id), error: e?.message || String(e) })
        }
      }
      return new Response(JSON.stringify({ ok: failures.length === 0, programId: localProgramId, trainings: imported, exercises, failures }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    if (action === 'repair-program') {
      if (!programId) throw new Error('programId obrigatório')
      const { admin, userId } = await requireWriter(req)
      const p = await resolveProgram(token, programId, (body as any).program)
      const localProgramId = await ensureLocalProgram(admin, p, userId, (body as any).localProgramId)
      await removeEmptyPlaceholders(admin, localProgramId, programId)
      const trainings = uniqueTrainings(await fetchTrainings(token, programId))
      if (!trainings.length) throw new Error('Nenhum treino retornado pelo ST Coach para reparar')
      let imported = 0, exercises = 0
      const failures: { training: string; error: string }[] = []
      for (const t of trainings) {
        try {
          const result = await importTraining(admin, token, userId, p, t, localProgramId)
          imported++
          exercises += result.exercises
        } catch (e: any) {
          failures.push({ training: t.name || String(t.id), error: e?.message || String(e) })
        }
      }
      return new Response(JSON.stringify({ ok: failures.length === 0, repaired: true, programId: localProgramId, trainings: imported, exercises, failures }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    if (action === 'list-library') {
      const r = await fetch('https://supertreinosapp.com/api/v2/library?pid=', { headers: auth })
      const text = await r.text()
      if (!r.ok) throw new Error(`library (${r.status}): ${text.slice(0, 200)}`)
      const j = JSON.parse(text)
      const list = j?.workouts || j?.data || j?.library || []
      const exercises = (Array.isArray(list) ? list : []).map((w: any) => ({
        id: w.id,
        name: w.name || '',
        description: w.description || '',
        series_repetitions: w.series_repetitions || '',
        video_url: w.video_url || '',
        video_url_thumb: w.video_url_thumb || null,
        cover_url: w.cover_url || null,
        gender: w.gender || null,
        muscle_ids: w.workout_muscle_ids || [],
        equip_ids: w.workout_equip_ids || [],
        type_ids: w.workout_type_ids || [],
        intervals: w.intervals ?? null,
        weight_suggestion: w.weight_suggestion || null,
      }))
      return new Response(JSON.stringify({ exercises }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    throw new Error(`action desconhecida: ${action}`)
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' },
    })
  }
})