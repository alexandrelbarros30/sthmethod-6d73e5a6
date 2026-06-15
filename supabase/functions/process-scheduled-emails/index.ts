import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: due, error } = await supabase
    .from('email_scheduled_sends')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(50)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let processed = 0
  let failed = 0

  for (const row of due || []) {
    // Mark as processing to avoid double-dispatch (best-effort lock via attempts)
    const { error: lockErr } = await supabase
      .from('email_scheduled_sends')
      .update({ status: 'processing', attempts: (row.attempts || 0) + 1 })
      .eq('id', row.id)
      .eq('status', 'pending')

    if (lockErr) continue

    try {
      const { error: invokeErr } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: row.template_key,
          recipientEmail: row.recipient_email,
          manual: true,
          idempotencyKey: `scheduled-${row.id}`,
          templateData: {
            name: row.recipient_name || undefined,
            siteName: 'STH METHOD',
            siteUrl: 'https://sthmethod.com',
            ...((row.template_data as Record<string, unknown>) || {}),
          },
        },
      })
      if (invokeErr) throw invokeErr

      await supabase
        .from('email_scheduled_sends')
        .update({ status: 'sent', processed_at: new Date().toISOString(), error_message: null })
        .eq('id', row.id)
      processed++
    } catch (e: any) {
      failed++
      const errMsg = e?.message || String(e)
      const giveUp = (row.attempts || 0) + 1 >= 3
      await supabase
        .from('email_scheduled_sends')
        .update({
          status: giveUp ? 'failed' : 'pending',
          error_message: errMsg.slice(0, 500),
          processed_at: giveUp ? new Date().toISOString() : null,
        })
        .eq('id', row.id)
    }
  }

  return new Response(
    JSON.stringify({ processed, failed, total: due?.length || 0 }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})