import { createClient } from 'npm:@supabase/supabase-js@2'
import bcrypt from 'npm:bcryptjs@2.4.3'
import { SignJWT, jwtVerify } from 'npm:jose@5.9.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const JWT_SECRET = Deno.env.get('CAS_JWT_SECRET')!
const SESSION_DAYS = 30

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const enc = new TextEncoder()
const secretKey = enc.encode(JWT_SECRET)

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function randomToken(bytes = 32): string {
  const a = new Uint8Array(bytes)
  crypto.getRandomValues(a)
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('')
}

function ok(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function err(message: string, status = 400, extra: Record<string, any> = {}) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s))
}

async function issueSession(userId: string, ua?: string, ip?: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000)
  const jti = crypto.randomUUID()
  const jwt = await new SignJWT({ sub: userId, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('cas')
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey)

  const tokenHash = await sha256hex(jwt)
  await supabase.from('cas_sessions').insert({
    user_id: userId,
    token_hash: tokenHash,
    user_agent: ua ?? null,
    ip_address: ip ?? null,
    expires_at: expiresAt.toISOString(),
  })
  return { token: jwt, expiresAt: expiresAt.toISOString() }
}

async function authenticate(token: string) {
  if (!token) throw new Error('missing token')
  const { payload } = await jwtVerify(token, secretKey, { issuer: 'cas' })
  const userId = payload.sub as string
  const tokenHash = await sha256hex(token)
  const { data: session } = await supabase
    .from('cas_sessions')
    .select('id, revoked_at, expires_at, user_id')
    .eq('token_hash', tokenHash)
    .maybeSingle()
  if (!session || session.revoked_at || new Date(session.expires_at) < new Date()) {
    throw new Error('invalid session')
  }
  return { userId, sessionId: session.id }
}

function getBearer(req: Request): string | null {
  const h = req.headers.get('authorization') || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}

function publicUser(u: any) {
  if (!u) return null
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    birth_date: u.birth_date,
    phone: u.phone,
    rg: u.rg,
    last_login_at: u.last_login_at,
    created_at: u.created_at,
    is_admin: !!u.is_admin,
    is_active: u.is_active !== false,
  }
}

async function sendResetEmail(email: string, name: string, resetUrl: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template: 'cas-password-reset',
        to: email,
        data: { name, resetUrl, expiresInMinutes: 30 },
      }),
    })
    if (!res.ok) console.warn('[cas-auth] email send failed', res.status, await res.text())
  } catch (e) {
    console.warn('[cas-auth] email send threw', e)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let body: any
  try { body = await req.json() } catch { return err('invalid_json', 400) }
  const action = String(body?.action || '')
  const ua = req.headers.get('user-agent') ?? undefined
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined

  try {
    if (action === 'register') {
      const full_name = String(body.full_name || '').trim()
      const email = String(body.email || '').trim().toLowerCase()
      const birth_date = String(body.birth_date || '').trim()
      const phone = body.phone ? String(body.phone).trim() : null
      const rg = body.rg ? String(body.rg).trim() : null
      const password = String(body.password || '')
      if (full_name.length < 3) return err('Nome completo inválido.')
      if (!isEmail(email)) return err('E-mail inválido.')
      if (!isValidDate(birth_date)) return err('Data de nascimento inválida.')
      if (password.length < 8) return err('Senha precisa ter ao menos 8 caracteres.')

      const { data: exists } = await supabase
        .from('cas_users').select('id').eq('email', email).maybeSingle()
      if (exists) return err('E-mail já cadastrado.', 409)

      const password_hash = await bcrypt.hash(password, 10)
      const { data: user, error } = await supabase
        .from('cas_users')
        .insert({ full_name, email, birth_date, phone, rg, password_hash })
        .select('*')
        .single()
      if (error) return err(error.message, 500)

      const { token, expiresAt } = await issueSession(user.id, ua, ip)
      return ok({ user: publicUser(user), token, expiresAt })
    }

    if (action === 'login') {
      const email = String(body.email || '').trim().toLowerCase()
      const password = String(body.password || '')
      if (!isEmail(email) || !password) return err('E-mail ou senha inválidos.', 401)
      const { data: user } = await supabase
        .from('cas_users').select('*').eq('email', email).maybeSingle()
      if (!user || !user.is_active) return err('E-mail ou senha inválidos.', 401)
      const okPwd = await bcrypt.compare(password, user.password_hash)
      if (!okPwd) return err('E-mail ou senha inválidos.', 401)
      await supabase.from('cas_users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id)
      const { token, expiresAt } = await issueSession(user.id, ua, ip)
      return ok({ user: publicUser(user), token, expiresAt })
    }

    if (action === 'me') {
      const token = getBearer(req) || String(body.token || '')
      const { userId } = await authenticate(token)
      const { data: user } = await supabase.from('cas_users').select('*').eq('id', userId).maybeSingle()
      return ok({ user: publicUser(user) })
    }

    if (action === 'logout') {
      const token = getBearer(req) || String(body.token || '')
      if (token) {
        const tokenHash = await sha256hex(token)
        await supabase.from('cas_sessions').update({ revoked_at: new Date().toISOString() }).eq('token_hash', tokenHash)
      }
      return ok({ ok: true })
    }

    if (action === 'forgot') {
      const email = String(body.email || '').trim().toLowerCase()
      const birth_date = String(body.birth_date || '').trim()
      const site_url = String(body.site_url || 'https://sthmethod.com.br').replace(/\/$/, '')
      // Always respond success to avoid user enumeration
      const respond = () => ok({ ok: true, message: 'Se os dados conferirem, enviaremos um e-mail com instruções.' })
      if (!isEmail(email) || !isValidDate(birth_date)) return respond()

      const { data: user } = await supabase
        .from('cas_users').select('id, full_name, email, birth_date')
        .eq('email', email).maybeSingle()
      if (!user || String(user.birth_date) !== birth_date) return respond()

      const raw = randomToken(32)
      const token_hash = await sha256hex(raw)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 min
      await supabase.from('cas_password_resets').insert({
        user_id: user.id, token_hash, expires_at: expiresAt.toISOString(), ip_address: ip ?? null,
      })
      const resetUrl = `${site_url}/cas/reset-password?token=${raw}`
      await sendResetEmail(user.email, user.full_name, resetUrl)
      return respond()
    }

    if (action === 'reset') {
      const raw = String(body.token || '')
      const new_password = String(body.new_password || '')
      if (!raw || new_password.length < 8) return err('Token ou senha inválidos.', 400)
      const token_hash = await sha256hex(raw)
      const { data: row } = await supabase
        .from('cas_password_resets').select('*').eq('token_hash', token_hash).maybeSingle()
      if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
        return err('Link inválido ou expirado.', 400)
      }
      const password_hash = await bcrypt.hash(new_password, 10)
      await supabase.from('cas_users').update({ password_hash }).eq('id', row.user_id)
      await supabase.from('cas_password_resets').update({ used_at: new Date().toISOString() }).eq('id', row.id)
      // Revoke all existing sessions
      await supabase.from('cas_sessions').update({ revoked_at: new Date().toISOString() })
        .eq('user_id', row.user_id).is('revoked_at', null)
      return ok({ ok: true })
    }

    if (action === 'update_profile') {
      const token = getBearer(req) || String(body.token || '')
      const { userId } = await authenticate(token)
      const patch: Record<string, any> = {}
      if (typeof body.full_name === 'string') patch.full_name = body.full_name.trim()
      if (typeof body.phone === 'string') patch.phone = body.phone.trim()
      if (typeof body.rg === 'string') patch.rg = body.rg.trim()
      if (typeof body.birth_date === 'string' && isValidDate(body.birth_date)) patch.birth_date = body.birth_date
      if (Object.keys(patch).length === 0) return err('Nada para atualizar.', 400)
      const { data: user, error } = await supabase
        .from('cas_users').update(patch).eq('id', userId).select('*').single()
      if (error) return err(error.message, 500)
      return ok({ user: publicUser(user) })
    }

    if (action === 'change_password') {
      const token = getBearer(req) || String(body.token || '')
      const { userId } = await authenticate(token)
      const current = String(body.current_password || '')
      const next = String(body.new_password || '')
      if (next.length < 8) return err('Nova senha precisa ter ao menos 8 caracteres.', 400)
      const { data: user } = await supabase.from('cas_users').select('*').eq('id', userId).single()
      const okPwd = await bcrypt.compare(current, user.password_hash)
      if (!okPwd) return err('Senha atual incorreta.', 401)
      const password_hash = await bcrypt.hash(next, 10)
      await supabase.from('cas_users').update({ password_hash }).eq('id', userId)
      return ok({ ok: true })
    }

    if (action === 'history_list') {
      const token = getBearer(req) || String(body.token || '')
      const { userId } = await authenticate(token)
      const limit = Math.min(Math.max(Number(body.limit) || 30, 1), 100)
      const { data } = await supabase
        .from('cas_search_history')
        .select('id, query, discipline, has_answer, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      return ok({ items: data ?? [] })
    }

    if (action === 'history_add') {
      const token = getBearer(req) || String(body.token || '')
      const { userId } = await authenticate(token)
      const query = String(body.query || '').trim()
      if (!query) return err('Pergunta vazia.', 400)
      const discipline = body.discipline ? String(body.discipline).trim() : null
      const has_answer = Boolean(body.has_answer)
      await supabase.from('cas_search_history').insert({
        user_id: userId, query: query.slice(0, 500), discipline, has_answer,
      })
      return ok({ ok: true })
    }

    if (action === 'history_clear') {
      const token = getBearer(req) || String(body.token || '')
      const { userId } = await authenticate(token)
      await supabase.from('cas_search_history').delete().eq('user_id', userId)
      return ok({ ok: true })
    }

    // ===================== ADMIN =====================
    async function requireAdmin(): Promise<string> {
      const token = getBearer(req) || String(body.token || '')
      const { userId } = await authenticate(token)
      const { data: u } = await supabase.from('cas_users').select('is_admin, is_active').eq('id', userId).maybeSingle()
      if (!u || !u.is_active || !u.is_admin) throw new Error('forbidden')
      return userId
    }

    if (action === 'admin_metrics') {
      await requireAdmin()
      const since30 = new Date(Date.now() - 30 * 86400_000).toISOString()
      const since7 = new Date(Date.now() - 7 * 86400_000).toISOString()
      const [{ count: total }, { count: actives }, { count: last30 }, { count: searches7 }, { count: searchesTotal }] = await Promise.all([
        supabase.from('cas_users').select('*', { count: 'exact', head: true }),
        supabase.from('cas_users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('cas_users').select('*', { count: 'exact', head: true }).gte('last_login_at', since30),
        supabase.from('cas_search_history').select('*', { count: 'exact', head: true }).gte('created_at', since7),
        supabase.from('cas_search_history').select('*', { count: 'exact', head: true }),
      ])
      return ok({
        users_total: total ?? 0,
        users_active: actives ?? 0,
        users_logged_30d: last30 ?? 0,
        searches_total: searchesTotal ?? 0,
        searches_7d: searches7 ?? 0,
      })
    }

    if (action === 'admin_list_users') {
      await requireAdmin()
      const q = String(body.q || '').trim().toLowerCase()
      const limit = Math.min(Math.max(Number(body.limit) || 100, 1), 500)
      let query = supabase.from('cas_users')
        .select('id, full_name, email, phone, rg, birth_date, is_active, is_admin, last_login_at, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
      const { data, error } = await query
      if (error) return err(error.message, 500)
      // Compute per-user search counts in one query
      const ids = (data ?? []).map((u: any) => u.id)
      const counts: Record<string, number> = {}
      if (ids.length) {
        const { data: rows } = await supabase
          .from('cas_search_history').select('user_id').in('user_id', ids)
        for (const r of rows ?? []) counts[r.user_id] = (counts[r.user_id] || 0) + 1
      }
      return ok({ users: (data ?? []).map((u: any) => ({ ...u, searches_count: counts[u.id] || 0 })) })
    }

    if (action === 'admin_user_detail') {
      await requireAdmin()
      const id = String(body.id || '')
      if (!id) return err('id obrigatório', 400)
      const { data: user } = await supabase.from('cas_users').select('*').eq('id', id).maybeSingle()
      if (!user) return err('Usuário não encontrado', 404)
      const { data: history } = await supabase
        .from('cas_search_history').select('id, query, discipline, has_answer, created_at')
        .eq('user_id', id).order('created_at', { ascending: false }).limit(50)
      const { data: sessions } = await supabase
        .from('cas_sessions').select('id, user_agent, ip_address, created_at, expires_at, revoked_at')
        .eq('user_id', id).order('created_at', { ascending: false }).limit(10)
      return ok({ user: publicUser(user), history: history ?? [], sessions: sessions ?? [] })
    }

    if (action === 'admin_update_user') {
      await requireAdmin()
      const id = String(body.id || '')
      if (!id) return err('id obrigatório', 400)
      const patch: Record<string, any> = {}
      if (typeof body.full_name === 'string') patch.full_name = body.full_name.trim()
      if (typeof body.email === 'string' && isEmail(body.email)) patch.email = body.email.trim().toLowerCase()
      if (typeof body.phone === 'string') patch.phone = body.phone.trim()
      if (typeof body.rg === 'string') patch.rg = body.rg.trim()
      if (typeof body.birth_date === 'string' && isValidDate(body.birth_date)) patch.birth_date = body.birth_date
      if (typeof body.is_active === 'boolean') patch.is_active = body.is_active
      if (typeof body.is_admin === 'boolean') patch.is_admin = body.is_admin
      if (!Object.keys(patch).length) return err('Nada para atualizar.', 400)
      const { data, error } = await supabase.from('cas_users').update(patch).eq('id', id).select('*').single()
      if (error) return err(error.message, 400)
      return ok({ user: publicUser(data) })
    }

    if (action === 'admin_reset_password') {
      await requireAdmin()
      const id = String(body.id || '')
      const new_password = String(body.new_password || '')
      if (!id || new_password.length < 8) return err('Senha precisa ter ao menos 8 caracteres.', 400)
      const password_hash = await bcrypt.hash(new_password, 10)
      await supabase.from('cas_users').update({ password_hash }).eq('id', id)
      await supabase.from('cas_sessions').update({ revoked_at: new Date().toISOString() })
        .eq('user_id', id).is('revoked_at', null)
      return ok({ ok: true })
    }

    if (action === 'admin_delete_user') {
      await requireAdmin()
      const id = String(body.id || '')
      if (!id) return err('id obrigatório', 400)
      const { error } = await supabase.from('cas_users').delete().eq('id', id)
      if (error) return err(error.message, 400)
      return ok({ ok: true })
    }

    return err('Ação desconhecida.', 400)
  } catch (e: any) {
    const msg = e?.message || String(e)
    if (msg === 'missing token' || msg === 'invalid session' || msg.includes('JWT')) {
      return err('Sessão expirada. Faça login novamente.', 401)
    }
    if (msg === 'forbidden') return err('Acesso restrito a administradores.', 403)
    console.error('[cas-auth] error', msg)
    return err('Erro interno.', 500)
  }
})