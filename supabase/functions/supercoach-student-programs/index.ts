import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const LOGIN_URL = 'https://supertreinosapp.com/api/v2/user/login'
const INDEX_URL = 'https://supertreinosapp.com/api/v2/adm/customer/index'

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
  if (!res.ok) throw new Error(`Login SuperCoach falhou (${res.status})`)
  const json = JSON.parse(text)
  const token = json?.access_token || json?.token || json?.data?.access_token
  if (!token) throw new Error('Token ausente')
  cachedToken = { token, expiresAt: Date.now() + 30 * 60_000 }
  return token
}

function normalize(s: string): string {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ')
}

function findCustomer(list: any[], email?: string, name?: string) {
  if (!Array.isArray(list)) return null
  const em = (email || '').toLowerCase().trim()
  if (em) {
    const byEmail = list.find((c) => (c?.email || '').toLowerCase().trim() === em)
    if (byEmail) return byEmail
  }
  const nm = normalize(name || '')
  if (nm) {
    const byName = list.find((c) => normalize(c?.name || '') === nm)
    if (byName) return byName
    const parts = nm.split(' ')
    if (parts.length >= 2) {
      const key = `${parts[0]} ${parts[1]}`
      const partial = list.find((c) => normalize(c?.name || '').startsWith(key))
      if (partial) return partial
    }
  }
  return null
}

function normalizeProgram(p: any) {
  if (!p || typeof p !== 'object') return null
  const id = p.id ?? p.program_id ?? p.pid ?? null
  const name = p.name ?? p.title ?? p.program_name ?? null
  if (!id || !name) return null
  return {
    id,
    name,
    subtitle: p.subtitle ?? p.description ?? null,
    cover_url: p.cover_url ?? p.image_url ?? p.thumb_url ?? p.image ?? null,
    weeks: p.weeks ?? null,
    days_per_week: p.days_per_week ?? null,
    minutes_per_day: p.minutes_per_day ?? null,
  }
}

function extractPrograms(container: any): any[] {
  if (!container) return []
  const candidates: any[] = []
  const arr = Array.isArray(container) ? container
    : container.programs || container.data || container.items || container.results || []
  for (const p of Array.isArray(arr) ? arr : []) {
    const n = normalizeProgram(p)
    if (n) candidates.push(n)
  }
  // Deduplicate by id
  const seen = new Set()
  return candidates.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json().catch(() => ({}))
    let { email, name, userId } = body as { email?: string; name?: string; userId?: string }

    // Resolve email/name from portal profile when only userId is given
    if ((!email || !name) && userId) {
      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      const { data: profile } = await admin
        .from('profiles').select('email, full_name').eq('user_id', userId).maybeSingle()
      email = email || profile?.email || undefined
      name = name || profile?.full_name || undefined
    }

    if (!email && !name) throw new Error('Informe email, name ou userId')

    const token = await getToken()
    const auth = { ...COMMON_HEADERS, authorization: `Bearer ${token}` }

    const listRes = await fetch(INDEX_URL, { headers: auth })
    const listText = await listRes.text()
    if (!listRes.ok) throw new Error(`Listagem SuperCoach falhou (${listRes.status})`)
    const listJson = JSON.parse(listText)
    const arr: any[] = Array.isArray(listJson) ? listJson : (listJson?.data || listJson?.customers || [])

    const customer = findCustomer(arr, email, name)
    if (!customer) {
      return new Response(JSON.stringify({ ok: false, status: 'not_found', programs: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Try programs already embedded in the customer object first
    let programs = extractPrograms(customer.programs || customer.trainings || customer)

    // Then try likely endpoints
    const cid = customer.id || customer.user_id
    const attempts = [
      `https://supertreinosapp.com/api/v2/adm/customer/show/${cid}`,
      `https://supertreinosapp.com/api/v2/adm/customer/edit/${cid}`,
      `https://supertreinosapp.com/api/v2/adm/customer/${cid}`,
      `https://supertreinosapp.com/api/v2/adm/program/customer/${cid}`,
      `https://supertreinosapp.com/api/v2/adm/program?user_id=${cid}`,
      `https://supertreinosapp.com/api/v2/adm/program?customer_id=${cid}`,
      `https://supertreinosapp.com/api/v2/adm/program/index?user_id=${cid}`,
      `https://supertreinosapp.com/api/v2/adm/program/list?user_id=${cid}`,
      `https://supertreinosapp.com/api/v2/adm/customer/plans/${cid}`,
      `https://supertreinosapp.com/api/v2/adm/customer/trainings/${cid}`,
      `https://supertreinosapp.com/api/v2/programs?user_id=${cid}`,
      `https://supertreinosapp.com/api/v2/programs?user_id=0`,
    ]
    const debug: Array<{ url: string; status: number; keys?: string[]; count?: number; sample?: any }> = []
    for (const url of attempts) {
      try {
        const r = await fetch(url, { headers: auth })
        const t = await r.text()
        let j: any = null
        try { j = JSON.parse(t) } catch { /* ignore */ }
        const p = r.ok && j ? extractPrograms(j) : []
        debug.push({
          url, status: r.status,
          keys: j && typeof j === 'object' ? Object.keys(j).slice(0, 12) : undefined,
          count: p.length,
          sample: p[0]?.id,
        })
      } catch (e) {
        debug.push({ url, status: -1 })
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      status: programs.length ? 'ok' : 'empty',
      customer: { id: customer.id, name: customer.name, email: customer.email },
      programs,
      debug,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[supercoach-student-programs]', msg)
    return new Response(JSON.stringify({ ok: false, status: 'error', message: msg, programs: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})