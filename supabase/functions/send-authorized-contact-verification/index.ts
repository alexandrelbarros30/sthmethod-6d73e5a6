import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SITE_URL = 'https://sthmethod.com'

function maskPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '')
  if (digits.length < 4) return digits
  return '•'.repeat(Math.max(digits.length - 4, 0)) + digits.slice(-4)
}

function genToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'invalid_session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    // Verifica se caller é staff CRM
    const { data: staffCheck, error: staffErr } = await admin.rpc('is_crm_staff', { _user_id: userData.user.id })
    if (staffErr || !staffCheck) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const contactId = body.authorized_contact_id || body.id
    if (!contactId || typeof contactId !== 'string') {
      return new Response(JSON.stringify({ error: 'authorized_contact_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Carrega solicitação e perfil do aluno
    const { data: contact, error: cErr } = await admin
      .from('authorized_contacts')
      .select('id, user_id, holder_name, phone, relationship, status, student_confirmed_at')
      .eq('id', contactId).maybeSingle()
    if (cErr || !contact) {
      return new Response(JSON.stringify({ error: 'contact_not_found', details: cErr?.message }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (contact.student_confirmed_at) {
      return new Response(JSON.stringify({ error: 'already_answered' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await admin
      .from('profiles').select('email, full_name').eq('user_id', contact.user_id).maybeSingle()
    if (!profile?.email) {
      return new Response(JSON.stringify({ error: 'student_has_no_email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Gera token e atualiza registro
    const token = genToken()
    const now = new Date()
    const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const { error: uErr } = await admin.from('authorized_contacts').update({
      verification_token: token,
      verification_sent_at: now.toISOString(),
      verification_expires_at: expires.toISOString(),
      status: 'awaiting_student',
    }).eq('id', contact.id)
    if (uErr) {
      return new Response(JSON.stringify({ error: 'update_failed', details: uErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Dispara e-mail via send-transactional-email
    const confirmUrl = `${SITE_URL}/autorizar-telefone?token=${token}`
    const { error: mailErr } = await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'authorized-contact-verification',
        recipientEmail: profile.email,
        idempotencyKey: `authcontact-verify-${contact.id}-${now.getTime()}`,
        templateData: {
          studentName: profile.full_name || '',
          holderName: contact.holder_name,
          relationship: contact.relationship,
          phoneMasked: maskPhone(contact.phone),
          confirmationUrl: confirmUrl,
          expiresInHours: 48,
          supportUrl: 'https://wa.me/5521998496289',
        },
      },
    })
    if (mailErr) {
      console.error('mail error', mailErr)
      return new Response(JSON.stringify({ error: 'mail_failed', details: String(mailErr) }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, expires_at: expires.toISOString() }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'server_error', details: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})