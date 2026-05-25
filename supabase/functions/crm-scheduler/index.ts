import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Respect the global CRM automation toggle (shared with billing automation).
    // When paused, no scheduled/recurring CRM campaign should be auto-dispatched.
    const { data: automation } = await supabase
      .from('billing_automation')
      .select('enabled')
      .eq('id', 1)
      .maybeSingle();
    if (!automation?.enabled) {
      return new Response(
        JSON.stringify({ ok: true, paused: true, processed: 0, results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const nowIso = new Date().toISOString();
    const { data: due } = await supabase
      .from('crm_campaigns')
      .select('id, recurrence')
      .eq('status', 'scheduled')
      .or(`scheduled_at.lte.${nowIso},next_run_at.lte.${nowIso}`)
      .limit(20);

    const results: any[] = [];
    for (const camp of due || []) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/crm-dispatch-campaign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
          body: JSON.stringify({ campaign_id: camp.id, trigger_type: camp.recurrence?.enabled ? 'recurring' : 'scheduled' }),
        });
        results.push({ id: camp.id, status: res.status });
      } catch (e) {
        results.push({ id: camp.id, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});