import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const LOGIN_URL = 'https://supertreinosapp.com/api/v2/user/login'
const PROGRAMS_URL = 'https://supertreinosapp.com/api/v2/programs?pid='
const TRAININGS_URL = (pid: number | string) => `https://supertreinosapp.com/api/v2/trainings?pid=${pid}`
const WORKOUT_URL = (wid: number | string) => `https://supertreinosapp.com/api/v2/workouts/${wid}`

const COMMON_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'content-type': 'application/json',
  'custom-origin': 'adm-site',
  'origin': 'https://adm.appsupercoach.com',
  'referer': 'https://adm.appsupercoach.com/',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
}

let cachedToken: { token: string; expiresAt: number } | null = null

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json().catch(() => ({}))
    const { action, programId } = body as { action: 'list-programs' | 'list-trainings'; programId?: number | string }
    if (!action) throw new Error('action é obrigatório')

    const token = await getToken()
    const auth = { ...COMMON_HEADERS, authorization: `Bearer ${token}` }

    if (action === 'list-programs') {
      const r = await fetch(PROGRAMS_URL, { headers: auth })
      const text = await r.text()
      if (!r.ok) throw new Error(`programs (${r.status}): ${text.slice(0, 200)}`)
      const j = JSON.parse(text)
      const list = j?.programs || j?.data || j || []
      const programs = (Array.isArray(list) ? list : []).map((p: any) => ({
        id: p.id, name: p.name, subtitle: p.subtitle || null,
        weeks: p.weeks || null, days_per_week: p.days_per_week || null,
        minutes_per_day: p.minutes_per_day || null,
        cover_url: p.cover_url || null,
      }))
      return new Response(JSON.stringify({ programs }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    if (action === 'list-trainings') {
      if (!programId) throw new Error('programId obrigatório')
      const r = await fetch(TRAININGS_URL(programId), { headers: auth })
      const text = await r.text()
      if (!r.ok) throw new Error(`trainings (${r.status}): ${text.slice(0, 200)}`)
      const j = JSON.parse(text)
      const list = j?.trainings || j?.data || []
      const trainings = (Array.isArray(list) ? list : []).map((t: any) => ({
        id: t.id, name: t.name, subtitle: t.subtitle || null,
        description: t.description || null,
        weeks: t.weeks || null, days_per_week: t.days_per_week || null,
        minutes_per_day: t.minutes_per_day || null,
        cover_url: t.cover_url || null,
        exercises: (t.workouts_lite || []).map((w: any) => ({
          id: w.id, name: w.name || '',
          series_repetitions: w.series_repetitions || '',
          cover_url: w.cover_url || null,
          video_url_thumb: w.video_url_thumb || null,
        })),
      }))
      return new Response(JSON.stringify({ trainings }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    if (action === 'get-training-details') {
      const { trainingId } = body as { trainingId?: number | string }
      if (!trainingId) throw new Error('trainingId obrigatório')
      // Descobre lista de workouts do training via listing do program
      const { programId: pid } = body as { programId?: number | string }
      if (!pid) throw new Error('programId obrigatório')
      const rl = await fetch(TRAININGS_URL(pid), { headers: auth })
      const jl = JSON.parse(await rl.text())
      const list = jl?.trainings || jl?.data || []
      const t = (Array.isArray(list) ? list : []).find((x: any) => String(x.id) === String(trainingId))
      if (!t) throw new Error('training não encontrado')
      const lite = (t.workouts_lite || []) as any[]
      // Busca detalhes de cada workout em paralelo para obter video_url real
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
      return new Response(JSON.stringify({
        training: {
          id: t.id, name: t.name, subtitle: t.subtitle || null,
          description: t.description || null,
          weeks: t.weeks || null, days_per_week: t.days_per_week || null,
          minutes_per_day: t.minutes_per_day || null,
        },
        exercises,
      }), { headers: { ...corsHeaders, 'content-type': 'application/json' } })
    }

    throw new Error(`action desconhecida: ${action}`)
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' },
    })
  }
})