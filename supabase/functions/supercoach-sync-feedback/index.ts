import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Best-effort ST Coach feedback sync.
// Stores the feedback payload in supercoach_sync_logs and marks the STH row as synced.
// A real ST Coach ingestion endpoint can be plugged here later without changing the UI.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userId = userData.user.id

    const body = await req.json().catch(() => ({}))
    const scope: 'workout' | 'program' = body?.scope
    const recordId: string | undefined = body?.record_id
    if (!scope || !recordId || !['workout', 'program'].includes(scope)) {
      return new Response(JSON.stringify({ error: 'invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const table = scope === 'workout' ? 'student_workout_sessions' : 'student_program_feedback'

    // Fetch the record (RLS-safe: filter by user_id)
    const { data: record, error: recErr } = await admin
      .from(table)
      .select('*')
      .eq('id', recordId)
      .eq('user_id', userId)
      .maybeSingle()
    if (recErr || !record) {
      return new Response(JSON.stringify({ error: 'not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log the payload (queue for ST Coach ingestion)
    await admin.from('supercoach_sync_logs').insert({
      user_id: userId,
      status: 'feedback_queued',
      performed_by: userId,
      observation: JSON.stringify({ scope, record }),
    })

    // Mark as synced
    await admin
      .from(table)
      .update({ synced_to_stcoach: true, synced_at: new Date().toISOString() })
      .eq('id', recordId)
      .eq('user_id', userId)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})