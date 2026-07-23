// Importa para o STH METHOD os programas que o aluno já possui atribuídos no ST Coach.
// - Se `userId` for informado, sincroniza apenas esse aluno.
// - Sem `userId`, itera todos os profiles com email/full_name e sincroniza em lote.
// Regras: casa training_programs pelo supercoach_program_id e cria/reativa
// student_workout_assignments para todos os workout_templates do programa,
// preservando janelas existentes (não sobrescreve start/end quando já definidos).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const LOGIN_URL = 'https://supertreinosapp.com/api/v2/user/login'
const INDEX_URL = 'https://supertreinosapp.com/api/v2/adm/customer/index'

const COMMON_HEADERS = {
  accept: 'application/json, text/plain, */*',
  'content-type': 'application/json',
  'custom-origin': 'adm-site',
  origin: 'https://adm.appsupercoach.com',
  referer: 'https://adm.appsupercoach.com/',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
}

function normalize(s: string) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ')
}

async function scLogin(): Promise<string> {
  const email = Deno.env.get('SUPERCOACH_EMAIL')
  const password = Deno.env.get('SUPERCOACH_PASSWORD')
  if (!email || !password) throw new Error('SUPERCOACH_EMAIL / SUPERCOACH_PASSWORD não configurados')
  const res = await fetch(LOGIN_URL, { method: 'POST', headers: COMMON_HEADERS, body: JSON.stringify({ email, password }) })
  if (!res.ok) throw new Error(`Login ST Coach falhou (${res.status})`)
  const j = JSON.parse(await res.text())
  const tok = j?.access_token || j?.token || j?.data?.access_token
  if (!tok) throw new Error('Token ST Coach ausente')
  return tok
}

function findCustomer(list: any[], email?: string | null, name?: string | null) {
  const em = (email || '').toLowerCase().trim()
  if (em) {
    const byEmail = list.find((c) => (c?.email || '').toLowerCase().trim() === em)
    if (byEmail) return byEmail
  }
  const nm = normalize(name || '')
  if (!nm) return null
  const byName = list.find((c) => normalize(c?.name || '') === nm)
  if (byName) return byName
  const parts = nm.split(' ')
  if (parts.length >= 2) {
    const key = `${parts[0]} ${parts[1]}`
    return list.find((c) => normalize(c?.name || '').startsWith(key)) || null
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = req.headers.get('Authorization') || ''
    if (!auth.startsWith('Bearer ')) throw new Error('Não autenticado')

    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const asUser = createClient(url, anon, { global: { headers: { Authorization: auth } } })
    const { data: userRes, error: userErr } = await asUser.auth.getUser()
    if (userErr || !userRes?.user) throw new Error('Não autenticado')

    const admin = createClient(url, service)
    const { data: roles } = await admin.from('user_roles').select('role')
      .eq('user_id', userRes.user.id).in('role', ['admin', 'consultor'])
    if (!roles?.length) throw new Error('Apenas admin/consultor')

    const body = await req.json().catch(() => ({})) as { userId?: string }
    const actor = userRes.user.id

    // Login ST Coach e carrega índice de customers
    const token = await scLogin()
    const scHdr = { ...COMMON_HEADERS, authorization: `Bearer ${token}` }
    const listRes = await fetch(INDEX_URL, { headers: scHdr })
    if (!listRes.ok) throw new Error(`Listagem ST Coach falhou (${listRes.status})`)
    const listJson = JSON.parse(await listRes.text())
    const customers: any[] = Array.isArray(listJson) ? listJson : (listJson?.data || listJson?.customers || [])

    // Mapa supercoach_program_id -> training_program_id
    const { data: progs } = await admin
      .from('training_programs').select('id, supercoach_program_id')
      .not('supercoach_program_id', 'is', null)
    const scProgToLocal = new Map<number, string>()
    for (const p of (progs || [])) scProgToLocal.set(Number(p.supercoach_program_id), p.id as string)

    // Mapa training_program_id -> [template_id]
    const localProgIds = Array.from(new Set(Array.from(scProgToLocal.values())))
    const { data: tpls } = await admin
      .from('workout_templates').select('id, program_id')
      .in('program_id', localProgIds.length ? localProgIds : ['00000000-0000-0000-0000-000000000000'])
    const tplsByProg = new Map<string, string[]>()
    for (const t of (tpls || [])) {
      const arr = tplsByProg.get(t.program_id as string) || []
      arr.push(t.id as string)
      tplsByProg.set(t.program_id as string, arr)
    }

    // Alvo: 1 aluno ou todos
    let targets: { user_id: string; email: string | null; full_name: string | null }[] = []
    if (body.userId) {
      const { data } = await admin.from('profiles').select('user_id,email,full_name').eq('user_id', body.userId).maybeSingle()
      if (!data) throw new Error('Aluno não encontrado')
      targets = [data as any]
    } else {
      const { data } = await admin.from('profiles').select('user_id,email,full_name')
      targets = (data || []) as any
    }

    const summary = {
      totalStudents: targets.length,
      matched: 0,
      notFound: 0,
      programsAssigned: 0,
      programsSkippedNoLocal: 0,
      templatesUpserted: 0,
      details: [] as any[],
    }

    for (const prof of targets) {
      const customer = findCustomer(customers, prof.email, prof.full_name)
      if (!customer) { summary.notFound++; continue }
      summary.matched++
      const assigned: any[] = Array.isArray(customer.programs) ? customer.programs : []
      const scIds = Array.from(new Set(assigned.map((a: any) => Number(a?.program_id ?? a?.id)).filter(Number.isFinite)))
      if (!scIds.length) continue

      const perStudent = { userId: prof.user_id, name: prof.full_name, programs: 0, missing: [] as number[] }
      const rows: any[] = []
      for (const scId of scIds) {
        const localProg = scProgToLocal.get(scId)
        if (!localProg) { summary.programsSkippedNoLocal++; perStudent.missing.push(scId); continue }
        const tIds = tplsByProg.get(localProg) || []
        if (!tIds.length) continue
        perStudent.programs++
        summary.programsAssigned++
        for (const tId of tIds) {
          rows.push({
            user_id: prof.user_id, template_id: tId, assigned_by: actor,
            active: true, visible: true, seen_by_student: false,
          })
        }
      }
      if (rows.length) {
        // Upsert preservando janelas existentes: usa onConflict e ignora atualização de start/end
        const { error } = await admin.from('student_workout_assignments')
          .upsert(rows, { onConflict: 'user_id,template_id', ignoreDuplicates: false })
        if (!error) summary.templatesUpserted += rows.length
        else perStudent.missing.push(-1)
      }
      summary.details.push(perStudent)
    }

    return new Response(JSON.stringify({ ok: true, ...summary }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const msg = (err as any)?.message || String(err)
    console.error('[supercoach-import-student-assignments]', msg)
    return new Response(JSON.stringify({ ok: false, error: msg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})