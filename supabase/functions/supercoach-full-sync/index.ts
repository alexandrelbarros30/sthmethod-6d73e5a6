import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const LOGIN_URL = 'https://supertreinosapp.com/api/v2/user/login'
const INDEX_URL = 'https://supertreinosapp.com/api/v2/adm/customer/index'
const PROGRAMS_URL = 'https://supertreinosapp.com/api/v2/programs?pid='

const COMMON_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'content-type': 'application/json',
  'custom-origin': 'adm-site',
  'origin': 'https://adm.appsupercoach.com',
  'referer': 'https://adm.appsupercoach.com/',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
}

function coverUrl(id: any): string | null {
  if (id == null) return null
  return `https://supertreinosapp.com/api/v2/programs/img/cover/${id}`
}

function normalize(s: string): string {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ')
}

async function scLogin(): Promise<string> {
  const email = Deno.env.get('SUPERCOACH_EMAIL')
  const password = Deno.env.get('SUPERCOACH_PASSWORD')
  if (!email || !password) throw new Error('SUPERCOACH_EMAIL / SUPERCOACH_PASSWORD não configurados')
  const res = await fetch(LOGIN_URL, { method: 'POST', headers: COMMON_HEADERS, body: JSON.stringify({ email, password }) })
  const j = JSON.parse(await res.text())
  const t = j?.access_token || j?.token || j?.data?.access_token
  if (!t) throw new Error('Token ST Coach ausente')
  return t
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    // Auth: require admin
    const auth = req.headers.get('Authorization') || ''
    if (!auth.startsWith('Bearer ')) throw new Error('Não autenticado')
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const asUser = createClient(url, anon, { global: { headers: { Authorization: auth } } })
    const { data: userRes, error: userErr } = await asUser.auth.getUser()
    if (userErr || !userRes?.user) throw new Error('Não autenticado')
    const admin = createClient(url, service)
    const { data: roleRow } = await admin.from('user_roles').select('role').eq('user_id', userRes.user.id).eq('role', 'admin').maybeSingle()
    if (!roleRow) throw new Error('Apenas administradores podem executar essa sincronização')
    const adminUserId = userRes.user.id

    const token = await scLogin()
    const scHdr = { ...COMMON_HEADERS, authorization: `Bearer ${token}` }

    // 1) Library
    const libRes = await fetch(PROGRAMS_URL, { headers: scHdr })
    if (!libRes.ok) throw new Error(`Biblioteca ST Coach falhou (${libRes.status})`)
    const libJson = JSON.parse(await libRes.text())
    const libArr: any[] = libJson?.programs || libJson?.data || (Array.isArray(libJson) ? libJson : [])

    let programsCreated = 0, programsUpdated = 0, templatesCreated = 0

    // Fetch existing training_programs by supercoach_program_id
    const scIds = libArr.map((p) => p?.id).filter((x) => x != null)
    const { data: existingProgs } = await admin.from('training_programs').select('id, supercoach_program_id, title, poster_url').in('supercoach_program_id', scIds)
    const progByScId = new Map<number, any>()
    for (const p of existingProgs || []) progByScId.set(Number(p.supercoach_program_id), p)

    const { data: existingTemplates } = await admin.from('workout_templates').select('id, supercoach_program_id, program_id').in('supercoach_program_id', scIds)
    const tplByScId = new Map<number, any>()
    for (const t of existingTemplates || []) tplByScId.set(Number(t.supercoach_program_id), t)

    // Map scId -> local training_program.id
    const progIdByScId = new Map<number, string>()

    for (const p of libArr) {
      const scId = Number(p?.id)
      if (!scId) continue
      const title = p?.name || p?.title || `Programa ${scId}`
      const subtitle = p?.subtitle || p?.description || ''
      const poster = coverUrl(scId)
      const existing = progByScId.get(scId)
      if (existing) {
        const patch: any = {}
        if (existing.title !== title) patch.title = title
        if (existing.poster_url !== poster) patch.poster_url = poster
        patch.subtitle = subtitle
        await admin.from('training_programs').update(patch).eq('id', existing.id)
        progIdByScId.set(scId, existing.id)
        programsUpdated++
      } else {
        const { data: ins, error } = await admin.from('training_programs').insert({
          title, subtitle, poster_url: poster, created_by: adminUserId,
          status: 'published', objective: '', difficulty: 'intermediate',
          supercoach_program_id: scId,
        }).select('id').single()
        if (error) { console.error('insert program', error); continue }
        progIdByScId.set(scId, ins.id)
        programsCreated++
      }

      // Ensure a workout_template exists so students can be assigned
      const localProgId = progIdByScId.get(scId)!
      const existingTpl = tplByScId.get(scId)
      if (!existingTpl) {
        const { data: tplIns, error: tErr } = await admin.from('workout_templates').insert({
          title, subtitle, image_url: poster || '',
          program_id: localProgId, created_by: adminUserId,
          released: true, supercoach_program_id: scId,
          description: 'Programa importado do ST Coach — treinos e execução no app ST Coach.',
        }).select('id').single()
        if (tErr) { console.error('insert template', tErr); continue }
        tplByScId.set(scId, { id: tplIns.id, supercoach_program_id: scId, program_id: localProgId })
        templatesCreated++
      } else if (existingTpl.program_id !== localProgId) {
        await admin.from('workout_templates').update({ program_id: localProgId, image_url: poster || '', title, subtitle })
          .eq('id', existingTpl.id)
      }
    }

    // 2) Customers → assignments
    const custRes = await fetch(INDEX_URL, { headers: scHdr })
    if (!custRes.ok) throw new Error(`Listagem clientes ST Coach falhou (${custRes.status})`)
    const custJson = JSON.parse(await custRes.text())
    const customers: any[] = Array.isArray(custJson) ? custJson : (custJson?.data || custJson?.customers || [])

    // Local profiles for match by email (primary) or normalized name
    const { data: profiles } = await admin.from('profiles').select('user_id, email, full_name')
    const byEmail = new Map<string, string>()
    const byName = new Map<string, string>()
    for (const p of profiles || []) {
      if (p.email) byEmail.set(String(p.email).toLowerCase().trim(), p.user_id)
      if (p.full_name) byName.set(normalize(p.full_name), p.user_id)
    }

    let assignmentsCreated = 0, matchedCustomers = 0, unmatchedCustomers = 0
    const rowsToInsert: any[] = []
    for (const c of customers) {
      const em = (c?.email || '').toLowerCase().trim()
      const nm = normalize(c?.name || '')
      const userId = (em && byEmail.get(em)) || (nm && byName.get(nm)) || null
      if (!userId) { unmatchedCustomers++; continue }
      matchedCustomers++
      const asg: any[] = Array.isArray(c?.programs) ? c.programs : []
      const ids = Array.from(new Set(asg.map((a: any) => Number(a?.program_id ?? a?.id)).filter((n) => Number.isFinite(n))))
      for (const scId of ids) {
        const tpl = tplByScId.get(scId)
        if (!tpl) continue
        rowsToInsert.push({
          user_id: userId, template_id: tpl.id,
          assigned_by: adminUserId, active: true, seen_by_student: false,
        })
      }
    }
    if (rowsToInsert.length) {
      const { error, count } = await admin.from('student_workout_assignments')
        .upsert(rowsToInsert, { onConflict: 'user_id,template_id', ignoreDuplicates: false, count: 'exact' })
      if (error) throw error
      assignmentsCreated = count ?? rowsToInsert.length
    }

    return new Response(JSON.stringify({
      ok: true,
      programs: { total: libArr.length, created: programsCreated, updated: programsUpdated, templatesCreated },
      customers: { total: customers.length, matched: matchedCustomers, unmatched: unmatchedCustomers },
      assignments: { upserted: assignmentsCreated },
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[supercoach-full-sync]', msg)
    return new Response(JSON.stringify({ ok: false, message: msg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})