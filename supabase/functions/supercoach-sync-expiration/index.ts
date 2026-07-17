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
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token
  const email = Deno.env.get('SUPERCOACH_EMAIL')
  const password = Deno.env.get('SUPERCOACH_PASSWORD')
  if (!email || !password) throw new Error('SUPERCOACH_EMAIL / SUPERCOACH_PASSWORD não configurados')

  const res = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: COMMON_HEADERS,
    body: JSON.stringify({ email, password }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Login SuperCoach falhou (${res.status}): ${text.slice(0, 200)}`)
  let json: any
  try { json = JSON.parse(text) } catch { throw new Error('Login SuperCoach: resposta inválida') }
  const token = json?.access_token || json?.token || json?.data?.access_token
  if (!token) throw new Error('Login SuperCoach: token ausente na resposta')
  cachedToken = { token, expiresAt: Date.now() + 30 * 60_000 }
  return token
}

function normalize(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function findCustomer(list: any[], email?: string, name?: string) {
  if (!Array.isArray(list)) return null
  const em = (email || '').toLowerCase().trim()
  if (em) {
    const byEmail = list.find((c) => (c?.email || '').toLowerCase().trim() === em)
    if (byEmail) return { match: byEmail, matchedBy: 'email' as const }
  }
  const nm = normalize(name || '')
  if (nm) {
    const byName = list.find((c) => normalize(c?.name || '') === nm)
    if (byName) return { match: byName, matchedBy: 'name_exact' as const }
    // partial: primeiro + segundo nome
    const parts = nm.split(' ')
    if (parts.length >= 2) {
      const key = `${parts[0]} ${parts[1]}`
      const partial = list.find((c) => normalize(c?.name || '').startsWith(key))
      if (partial) return { match: partial, matchedBy: 'name_partial' as const }
    }
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const { action, email, name, expiresDate, userId, password } = body as {
      action: 'search' | 'update' | 'create'
      email?: string
      name?: string
      expiresDate?: string // YYYY-MM-DD
      userId?: string      // for action=create
      password?: string    // for action=create (fallback '123456')
    }

    if (!action) throw new Error('action é obrigatório (search | update | create)')

    const token = await getToken()
    const auth = { ...COMMON_HEADERS, authorization: `Bearer ${token}` }

    // ====== CREATE ======
    if (action === 'create') {
      if (!userId) throw new Error('userId é obrigatório para criar aluno')

      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )

      const { data: profile, error: profErr } = await admin
        .from('profiles')
        .select('full_name, email, phone, gender, birth_date, height, weight, objective')
        .eq('user_id', userId)
        .maybeSingle()
      if (profErr || !profile) throw new Error('Aluno não encontrado no portal')

      const { data: sub } = await admin
        .from('subscriptions')
        .select('end_date')
        .eq('user_id', userId)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      const expires = expiresDate || (sub?.end_date ? String(sub.end_date).slice(0, 10) : null)
        || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

      // Ensure the student is not already there
      const listRes = await fetch(INDEX_URL, { method: 'GET', headers: auth })
      const listText = await listRes.text()
      if (!listRes.ok) throw new Error(`Listagem SuperCoach falhou (${listRes.status})`)
      const list = JSON.parse(listText)
      const arr: any[] = Array.isArray(list) ? list : (list?.data || list?.customers || [])
      const existing = findCustomer(arr, profile.email, profile.full_name)
      if (existing) {
        return new Response(JSON.stringify({
          ok: false, status: 'already_exists',
          message: `Aluno já existe no SuperCoach: ${existing.match.name} (${existing.match.email})`,
          customer: existing.match,
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Build payload matching observed shape
      const digits = String(profile.phone || '').replace(/\D+/g, '')
      const ddi = digits.startsWith('55') ? '0055' : (digits.length >= 12 ? '00' + digits.slice(0, 2) : '0055')
      const phone = digits.startsWith('55') ? digits.slice(2) : (digits.length >= 12 ? digits.slice(2) : digits)
      const gender = (profile.gender || '').toLowerCase().startsWith('f') ? 'f' : 'm'
      // Senha segue a escolha do admin/consultor/aluno; regra padrão = '123456'
      const tempPassword = (password && password.length >= 4) ? password : '123456'

      const payloadObj = {
        name: profile.full_name,
        email: profile.email,
        password: tempPassword,
        goal_id: 1,
        status: 2,
        premium_expires_date: expires,
        details: {
          gender,
          birthdate: profile.birth_date || null,
          height: profile.height ? String(profile.height) : null,
          weight: profile.weight ? String(profile.weight) : null,
          phone_activation: 0,
          ddi,
          phone,
        },
      }

      // POST expects a single object (server reads $data['email']).
      // PUT expects an array of existing customers (needs 'id').
      let created = await fetch(ACCOUNT_URL, { method: 'POST', headers: auth, body: JSON.stringify(payloadObj) })
      let createdText = await created.text()
      if (!created.ok) {
        // Fallback: some tenants accept an array on POST
        const retry = await fetch(ACCOUNT_URL, { method: 'POST', headers: auth, body: JSON.stringify([payloadObj]) })
        const retryText = await retry.text()
        if (!retry.ok) {
          throw new Error(`Criação SuperCoach falhou (POST obj ${created.status} / POST arr ${retry.status}): ${createdText.slice(0, 200)} | ${retryText.slice(0, 200)}`)
        }
        created = retry; createdText = retryText
      }

      let createdJson: any = null
      try { createdJson = JSON.parse(createdText) } catch { /* ignore */ }

      return new Response(JSON.stringify({
        ok: true,
        status: 'created',
        customer: {
          name: profile.full_name,
          email: profile.email,
          premium_expires_date: expires,
          temporary_password: tempPassword,
        },
        raw: createdJson,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const listRes = await fetch(INDEX_URL, { method: 'GET', headers: auth })
    const listText = await listRes.text()
    if (!listRes.ok) throw new Error(`Listagem SuperCoach falhou (${listRes.status}): ${listText.slice(0, 200)}`)
    let list: any
    try { list = JSON.parse(listText) } catch { throw new Error('Listagem SuperCoach: resposta inválida') }
    const arr: any[] = Array.isArray(list) ? list : (list?.data || list?.customers || [])

    const found = findCustomer(arr, email, name)
    if (!found) {
      return new Response(
        JSON.stringify({ ok: false, status: 'not_found', message: 'Aluno não encontrado no SuperCoach' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (action === 'search') {
      return new Response(
        JSON.stringify({
          ok: true,
          status: 'found',
          matchedBy: found.matchedBy,
          customer: {
            id: found.match.id,
            user_id: found.match.user_id,
            name: found.match.name,
            email: found.match.email,
            premium_expires_date: found.match.premium_expires_date,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // action === 'update'
    if (!expiresDate || !/^\d{4}-\d{2}-\d{2}$/.test(expiresDate)) {
      throw new Error('expiresDate obrigatório no formato YYYY-MM-DD')
    }

    const previous = found.match.premium_expires_date
    const payload = [{ ...found.match, premium_expires_date: expiresDate }]
    const upd = await fetch(ACCOUNT_URL, { method: 'PUT', headers: auth, body: JSON.stringify(payload) })
    const updText = await upd.text()
    if (!upd.ok) {
      throw new Error(`Atualização SuperCoach falhou (${upd.status}): ${updText.slice(0, 300)}`)
    }

    return new Response(
      JSON.stringify({
        ok: true,
        status: 'updated',
        matchedBy: found.matchedBy,
        customer: {
          id: found.match.id,
          name: found.match.name,
          email: found.match.email,
          previous_expires_date: previous,
          new_expires_date: expiresDate,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[supercoach-sync-expiration]', msg)
    return new Response(
      JSON.stringify({ ok: false, status: 'error', message: msg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})