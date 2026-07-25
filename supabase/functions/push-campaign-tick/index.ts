import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const nowIso = new Date().toISOString();
  const { data: due, error } = await admin
    .from('push_campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', nowIso)
    .limit(20);
  if (error) return json({ ok: false, error: error.message }, 500);
  if (!due || due.length === 0) return json({ ok: true, processed: 0 });

  const results: any[] = [];
  for (const camp of due) {
    // Claim
    const { data: claimed } = await admin
      .from('push_campaigns')
      .update({ status: 'sending', started_at: new Date().toISOString() })
      .eq('id', camp.id)
      .eq('status', 'scheduled')
      .select()
      .maybeSingle();
    if (!claimed) continue;
    const CHUNK = 200;
    const ids: string[] = claimed.audience_user_ids || [];
    let sent = 0, failed = 0, total = 0;
    let errorMsg: string | null = null;
    try {
      for (let i = 0; i < ids.length; i += CHUNK) {
        const chunk = ids.slice(i, i + CHUNK);
        const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            user_ids: chunk,
            use_variables: claimed.use_variables,
            campaign_id: claimed.id,
            payload: {
              title: claimed.title,
              body: claimed.body || undefined,
              url: claimed.url || '/dashboard',
              tag: claimed.tag,
            },
          }),
        });
        const data = await resp.json();
        sent += Number(data?.sent || 0);
        failed += Number(data?.failed || 0);
        total += Number(data?.total || 0);
      }
    } catch (e: any) {
      errorMsg = String(e?.message || e);
    }
    await admin
      .from('push_campaigns')
      .update({
        status: errorMsg ? 'failed' : 'completed',
        completed_at: new Date().toISOString(),
        sent_count: sent,
        failed_count: failed,
        subscriptions_reached: total,
        error_message: errorMsg,
      })
      .eq('id', claimed.id);
    results.push({ id: claimed.id, sent, failed, total });
  }
  return json({ ok: true, processed: results.length, results });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}