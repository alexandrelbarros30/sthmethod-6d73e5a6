import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Runs once a day. Evaluates per-template automation rules and enqueues
// scheduled sends (which then get dispatched by process-scheduled-emails).
//
// Supported rule shapes (stored in email_template_settings.automation_rule):
//   { type: "inactivity_days", days: 14 }    -> for inactivity-reminder
//   { type: "before_expiry_days", days: 5 }  -> for renewal-reminder
//   { type: "after_expiry_days", days: 0 }   -> for subscription-expired

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: rules } = await supabase
    .from('email_template_settings')
    .select('template_key, enabled, auto_send, automation_rule')
    .not('automation_rule', 'is', null)
    .eq('enabled', true)
    .eq('auto_send', true)

  const stats: Record<string, number> = {}

  for (const tpl of rules || []) {
    const rule = tpl.automation_rule as { type?: string; days?: number } | null
    if (!rule?.type) continue
    const days = Number(rule.days ?? 0)

    try {
      let candidates: Array<{ user_id: string; email: string; name: string | null; extra?: Record<string, unknown> }> = []

      if (rule.type === 'inactivity_days' && days > 0) {
        // profiles whose latest access_logs.logged_in_at is older than `days`
        const cutoff = new Date(Date.now() - days * 86400_000).toISOString()
        const { data: rows } = await supabase
          .from('access_logs')
          .select('user_id, logged_in_at')
          .order('logged_in_at', { ascending: false })
          .limit(5000)
        const lastByUser = new Map<string, string>()
        for (const r of rows || []) {
          if (!lastByUser.has(r.user_id)) lastByUser.set(r.user_id, r.logged_in_at)
        }
        const inactiveIds = [...lastByUser.entries()]
          .filter(([_, t]) => t < cutoff)
          .map(([uid]) => uid)
        if (inactiveIds.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('user_id, email, full_name')
            .in('user_id', inactiveIds.slice(0, 500))
          candidates = (profs || [])
            .filter((p) => !!p.email)
            .map((p) => ({
              user_id: p.user_id,
              email: p.email as string,
              name: p.full_name,
              extra: { lastSeenAt: lastByUser.get(p.user_id) || null },
            }))
        }
      } else if (rule.type === 'before_expiry_days') {
        const target = new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10)
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('user_id, end_date, plan_id, status')
          .eq('status', 'active')
          .eq('end_date', target)
        const uids = (subs || []).map((s) => s.user_id)
        if (uids.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('user_id, email, full_name')
            .in('user_id', uids)
          const planIds = [...new Set((subs || []).map((s) => s.plan_id).filter(Boolean))]
          const { data: plans } = planIds.length
            ? await supabase.from('plans').select('id, name').in('id', planIds as string[])
            : { data: [] as Array<{ id: string; name: string }> }
          const planMap = new Map((plans || []).map((p) => [p.id, p.name]))
          const profMap = new Map((profs || []).map((p) => [p.user_id, p]))
          candidates = (subs || [])
            .map((s) => {
              const p = profMap.get(s.user_id)
              if (!p?.email) return null
              return {
                user_id: s.user_id,
                email: p.email as string,
                name: p.full_name,
                extra: {
                  expiresAt: s.end_date,
                  planName: planMap.get(s.plan_id) || '',
                  renewUrl: 'https://sthmethod.com/dashboard/pagar',
                },
              }
            })
            .filter(Boolean) as typeof candidates
        }
      } else if (rule.type === 'after_expiry_days') {
        const target = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('user_id, end_date')
          .eq('end_date', target)
        const uids = (subs || []).map((s) => s.user_id)
        if (uids.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('user_id, email, full_name')
            .in('user_id', uids)
          candidates = (profs || [])
            .filter((p) => !!p.email)
            .map((p) => ({
              user_id: p.user_id,
              email: p.email as string,
              name: p.full_name,
              extra: { renewUrl: 'https://sthmethod.com/dashboard/pagar' },
            }))
        }
      }

      if (!candidates.length) continue

      // dedup: skip if a send for this template+recipient already happened in last 7d
      const since = new Date(Date.now() - 7 * 86400_000).toISOString()
      const { data: recent } = await supabase
        .from('email_scheduled_sends')
        .select('recipient_user_id')
        .eq('template_key', tpl.template_key)
        .in('recipient_user_id', candidates.map((c) => c.user_id))
        .gte('created_at', since)
      const skip = new Set((recent || []).map((r: any) => r.recipient_user_id))

      const toInsert = candidates
        .filter((c) => !skip.has(c.user_id))
        .map((c) => ({
          template_key: tpl.template_key,
          recipient_user_id: c.user_id,
          recipient_email: c.email,
          recipient_name: c.name,
          template_data: c.extra || {},
          scheduled_at: new Date().toISOString(),
          source: 'automation',
        }))

      if (toInsert.length) {
        await supabase.from('email_scheduled_sends').insert(toInsert)
        stats[tpl.template_key] = toInsert.length
      }
    } catch (e: any) {
      console.error('automation rule failed', tpl.template_key, e?.message)
    }
  }

  return new Response(JSON.stringify({ ok: true, stats }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})