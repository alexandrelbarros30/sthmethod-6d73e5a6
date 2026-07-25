// Importa capas dos programas e treinos do ST Coach para o STH METHOD.
// Atualiza training_programs.poster_url e workout_templates.image_url
// com base em supercoach_program_id / supercoach_training_id.
//
// Body opcional: { programIds?: string[], overwrite?: boolean }
//  - programIds: lista de training_programs.id a sincronizar (default: todos com supercoach_program_id)
//  - overwrite: se false, mantém capas existentes; default true
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { getSuperCoachToken, SC_COMMON_HEADERS } from '../_shared/supercoach-library.ts'

const SC = 'https://supertreinosapp.com/api/v2'
const TRAININGS_URL = (pid: number | string) => `${SC}/trainings?pid=${pid}`
const PROGRAM_URL = (pid: number | string) => `${SC}/programs/${pid}`

function programCoverUrl(id: number | string): string {
  return `${SC}/programs/img/cover/${id}`
}

function extractArray(obj: any, paths: string[]): any[] {
  for (const p of paths) {
    const parts = p.split('.')
    let cur = obj
    for (const k of parts) cur = cur?.[k]
    if (Array.isArray(cur)) return cur
  }
  return []
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
    const admin = createClient(url, service)

    const { data: userData, error: authErr } = await userClient.auth.getUser()
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', userData.user.id)
    const isAdmin = (roles || []).some((r: any) => ['admin', 'consultor'].includes(r.role))
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json().catch(() => ({} as any))
    const programIds: string[] | undefined = Array.isArray(body?.programIds) ? body.programIds : undefined
    const overwrite: boolean = body?.overwrite !== false

    let q = admin
      .from('training_programs')
      .select('id, title, poster_url, supercoach_program_id')
      .not('supercoach_program_id', 'is', null)
    if (programIds?.length) q = q.in('id', programIds)
    const { data: programs, error: pErr } = await q
    if (pErr) throw new Error(pErr.message)

    const token = await getSuperCoachToken()
    const scHdr = { ...SC_COMMON_HEADERS, authorization: `Bearer ${token}` }

    let programsUpdated = 0
    let templatesUpdated = 0
    let templatesSkipped = 0
    const failures: Array<{ type: 'program' | 'training'; id: string | number; error: string }> = []

    for (const prog of programs || []) {
      const scPid = Number(prog.supercoach_program_id)
      if (!scPid) continue

      // 1) capa do programa — tenta pegar cover_url do detalhe; senão usa URL padrão
      let programCover: string | null = null
      try {
        const r = await fetch(PROGRAM_URL(scPid), { headers: scHdr })
        if (r.ok) {
          const j = JSON.parse(await r.text())
          const p = j?.program || j?.data || j
          programCover = p?.cover_url || null
        }
      } catch (_e) { /* ignore, fallback below */ }
      if (!programCover) programCover = programCoverUrl(scPid)

      if (programCover && (overwrite || !prog.poster_url)) {
        const { error: upErr } = await admin
          .from('training_programs')
          .update({ poster_url: programCover })
          .eq('id', prog.id)
        if (upErr) failures.push({ type: 'program', id: prog.id, error: upErr.message })
        else programsUpdated++
      }

      // 2) capas dos treinos do programa
      let trainings: any[] = []
      try {
        const r = await fetch(TRAININGS_URL(scPid), { headers: scHdr })
        const text = await r.text()
        if (!r.ok) throw new Error(`trainings (${r.status}): ${text.slice(0, 160)}`)
        const j = JSON.parse(text)
        trainings = extractArray(j, ['trainings', 'data', 'program.trainings', 'data.trainings'])
      } catch (e: any) {
        failures.push({ type: 'program', id: prog.id, error: `list trainings: ${e?.message || e}` })
      }

      const coverByScTid = new Map<number, string>()
      for (const t of trainings) {
        const tid = Number(t?.id)
        const cov = t?.cover_url || t?.image_url
        if (tid && cov) coverByScTid.set(tid, cov)
      }

      const { data: tpls } = await admin
        .from('workout_templates')
        .select('id, image_url, supercoach_training_id')
        .eq('program_id', prog.id)
        .not('supercoach_training_id', 'is', null)

      for (const tpl of tpls || []) {
        const scTid = Number(tpl.supercoach_training_id)
        const cover = coverByScTid.get(scTid) || programCover
        if (!cover) { templatesSkipped++; continue }
        if (!overwrite && tpl.image_url) { templatesSkipped++; continue }
        const { error: upErr } = await admin
          .from('workout_templates')
          .update({ image_url: cover })
          .eq('id', tpl.id)
        if (upErr) failures.push({ type: 'training', id: tpl.id, error: upErr.message })
        else templatesUpdated++
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      programs_total: programs?.length || 0,
      programs_updated: programsUpdated,
      templates_updated: templatesUpdated,
      templates_skipped: templatesSkipped,
      failures: failures.slice(0, 20),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('supercoach-import-covers error', e)
    return new Response(JSON.stringify({ error: e?.message || 'erro' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})