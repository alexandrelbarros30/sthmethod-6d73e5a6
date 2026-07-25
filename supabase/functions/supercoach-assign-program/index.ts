// Atribui / desatribui um programa ST Coach a um aluno espelhando via
// PUT /adm/customer/account (mesmo endpoint usado para expiração). O campo
// `programs` do customer é atualizado adicionando/removendo o program_id.
// Body: { userId: string, programId: string, action: 'assign' | 'unassign' }
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const LOGIN_URL = 'https://supertreinosapp.com/api/v2/user/login'
const INDEX_URL = 'https://supertreinosapp.com/api/v2/adm/customer/index'
const ACCOUNT_URL = 'https://supertreinosapp.com/api/v2/adm/customer/account'

const COMMON_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'content-type': 'application/json',
  'custom-origin': 'adm-site',
  'origin': 'https://adm.appsupercoach.com',
  'referer': 'https://adm.appsupercoach.com/',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
}

function normalize(s: string): string {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ')
}

function findCustomer(list: any[], email?: string | null, name?: string | null) {
  const em = (email || '').toLowerCase().trim()
  const nm = normalize(name || '')
  const parts = nm.split(' ')
  const partialName = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : ''
  return (em ? list.find((c) => (c?.email || '').toLowerCase().trim() === em) : null)
    || (nm ? list.find((c) => normalize(c?.name || '') === nm) : null)
    || (partialName ? list.find((c) => normalize(c?.name || '').startsWith(partialName)) : null)
}

async function fetchCustomers(headers: Record<string, string>): Promise<any[]> {
  const listRes = await fetch(INDEX_URL, { headers })
  if (!listRes.ok) throw new Error(`Listagem ST Coach falhou (${listRes.status})`)
  const listJson = JSON.parse(await listRes.text())
  return Array.isArray(listJson) ? listJson : (listJson?.data || listJson?.customers || [])
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function verifyAssignment(params: {
  headers: Record<string, string>
  email?: string | null
  name?: string | null
  scProgramId: number
  shouldHave: boolean
}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await wait(700)
    const verifyList = await fetchCustomers(params.headers)
    const verified = findCustomer(verifyList, params.email, params.name)
    const verifiedPrograms: any[] = Array.isArray(verified?.programs) ? verified.programs : []
    const verifiedIds = new Set(verifiedPrograms.map((p: any) => Number(p?.program_id ?? p?.id)).filter(Number.isFinite))
    const confirmed = verifiedIds.has(params.scProgramId)
    if (confirmed === params.shouldHave) return true
  }
  return false
}

async function scLogin(): Promise<string> {
  const email = Deno.env.get('SUPERCOACH_EMAIL')
  const password = Deno.env.get('SUPERCOACH_PASSWORD')
  if (!email || !password) throw new Error('SUPERCOACH_EMAIL / SUPERCOACH_PASSWORD não configurados')
  const res = await fetch(LOGIN_URL, { method: 'POST', headers: COMMON_HEADERS, body: JSON.stringify({ email, password }) })
  const t = await res.text()
  if (!res.ok) throw new Error(`Login ST Coach falhou (${res.status})`)
  const j = JSON.parse(t)
  const tok = j?.access_token || j?.token || j?.data?.access_token
  if (!tok) throw new Error('Token ST Coach ausente')
  return tok
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json().catch(() => ({})) as {
      userId?: string; programId?: string; action?: 'assign' | 'unassign'; accessToken?: string
    }
    const bodyToken = String(body.accessToken || '').trim()
    const headerAuth = req.headers.get('Authorization') || ''
    const auth = headerAuth.startsWith('Bearer ')
      ? headerAuth
      : bodyToken
        ? `Bearer ${bodyToken}`
        : ''
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

    const { userId, programId } = body
    const action = body.action || 'assign'
    if (!userId || !programId) throw new Error('userId e programId obrigatórios')

    // Carrega perfil do aluno e programa (com supercoach_program_id)
    const [{ data: profile }, { data: program }] = await Promise.all([
      admin.from('profiles').select('full_name, email').eq('user_id', userId).maybeSingle(),
      admin.from('training_programs').select('id, title, supercoach_program_id').eq('id', programId).maybeSingle(),
    ])
    if (!profile) throw new Error('Aluno não encontrado')
    if (!program) throw new Error('Programa não encontrado')
    let scProgramId: number | null = program.supercoach_program_id ? Number(program.supercoach_program_id) : null

    // Se ainda não existe no ST Coach, tenta espelhar primeiro (pega 1º template do programa)
    if (!scProgramId) {
      const { data: tpl } = await admin.from('workout_templates')
        .select('id').eq('program_id', programId).order('created_at').limit(1).maybeSingle()
      if (tpl) {
        try {
          const invokeUrl = `${url}/functions/v1/supercoach-push-template`
          const r = await fetch(invokeUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json', Authorization: auth },
            body: JSON.stringify({ templateId: tpl.id, programId }),
          })
          const j = await r.json().catch(() => ({}))
          if (j?.scProgramId) scProgramId = Number(j.scProgramId)
        } catch (e) { console.warn('auto-mirror falhou', (e as any)?.message) }
      }
      if (!scProgramId) {
        // Re-lê do banco (push-template pode ter salvado)
        const { data: p2 } = await admin.from('training_programs')
          .select('supercoach_program_id').eq('id', programId).maybeSingle()
        if (p2?.supercoach_program_id) scProgramId = Number(p2.supercoach_program_id)
      }
      if (!scProgramId) throw new Error('Programa ainda não espelhado no ST Coach. Espelhe o programa antes.')
    }

    // Login e busca customer
    const token = await scLogin()
    const scHdr = { ...COMMON_HEADERS, authorization: `Bearer ${token}` }
    let list = await fetchCustomers(scHdr)
    let customer = findCustomer(list, profile.email, profile.full_name)

    if (!customer && action === 'assign') {
      const createRes = await fetch(`${url}/functions/v1/supercoach-sync-expiration`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: service, Authorization: `Bearer ${service}` },
        body: JSON.stringify({ action: 'create', userId }),
      })
      const createJson = await createRes.json().catch(() => ({}))
      if (!createRes.ok || (createJson?.ok === false && createJson?.status !== 'already_exists')) {
        throw new Error(createJson?.error || createJson?.message || 'Aluno não encontrado no ST Coach e cadastro automático falhou')
      }
      list = await fetchCustomers(scHdr)
      customer = findCustomer(list, profile.email, profile.full_name)
    }

    if (!customer) throw new Error('Aluno não encontrado no ST Coach. Cadastre o aluno ou sincronize o vencimento primeiro.')

    // Atualiza programs
    const currentPrograms: any[] = Array.isArray(customer.programs) ? customer.programs : []
    const currentIds = new Set(currentPrograms.map((p: any) => Number(p?.program_id ?? p?.id)).filter(Number.isFinite))

    let newPrograms = currentPrograms
    if (action === 'assign') {
      if (currentIds.has(scProgramId)) {
        return new Response(JSON.stringify({ ok: true, status: 'already_assigned', scProgramId }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      newPrograms = [...currentPrograms, { program_id: scProgramId }]
    } else {
      if (!currentIds.has(scProgramId)) {
        return new Response(JSON.stringify({ ok: true, status: 'not_assigned', scProgramId }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      newPrograms = currentPrograms.filter((p: any) => Number(p?.program_id ?? p?.id) !== scProgramId)
    }

    const payload = [{ ...customer, programs: newPrograms }]
    const upd = await fetch(ACCOUNT_URL, { method: 'PUT', headers: scHdr, body: JSON.stringify(payload) })
    const updText = await upd.text()
    if (!upd.ok) throw new Error(`PUT customer falhou (${upd.status}): ${updText.slice(0, 220)}`)

    const confirmed = await verifyAssignment({
      headers: scHdr,
      email: profile.email,
      name: profile.full_name,
      scProgramId,
      shouldHave: action === 'assign',
    })
    if (!confirmed) {
      throw new Error(action === 'assign'
        ? 'ST Coach não confirmou a atribuição do programa'
        : 'ST Coach não confirmou a remoção do programa')
    }

    return new Response(JSON.stringify({
      ok: true, status: action === 'assign' ? 'assigned' : 'unassigned',
      scProgramId, customerId: customer.id,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const msg = (err as any)?.message || String(err)
    console.error('[supercoach-assign-program]', msg)
    return new Response(JSON.stringify({ ok: false, error: msg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})