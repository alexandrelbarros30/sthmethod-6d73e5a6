import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: auth } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (!auth?.claims) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: 'campaign_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: camp, error: campErr } = await admin.from('crm_campaigns').select('*').eq('id', campaign_id).maybeSingle();
    if (campErr || !camp) {
      return new Response(JSON.stringify({ error: 'campaign not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build recipient list from target filter
    const filter = (camp.target_filter || {}) as { type?: string };
    const targets: { phone: string; name: string | null }[] = [];

    if (filter.type === 'all_active' || filter.type === 'expiring' || filter.type === 'expired') {
      const today = new Date();
      const in7 = new Date(today.getTime() + 7 * 86400000);
      let q = admin.from('subscriptions').select('user_id, end_date, status');
      if (filter.type === 'expired') q = q.lt('end_date', today.toISOString().slice(0, 10));
      else if (filter.type === 'expiring') q = q.gte('end_date', today.toISOString().slice(0, 10)).lte('end_date', in7.toISOString().slice(0, 10));
      else q = q.gte('end_date', today.toISOString().slice(0, 10));
      const { data: subs } = await q.limit(5000);
      const uids = (subs || []).map((s: any) => s.user_id);
      if (uids.length) {
        const { data: profs } = await admin.from('profiles').select('user_id, full_name, phone').in('user_id', uids);
        (profs || []).forEach((p: any) => { if (p.phone) targets.push({ phone: String(p.phone).replace(/\D/g, ''), name: p.full_name }); });
      }
    } else if (filter.type === 'all_leads') {
      const { data: allProfs } = await admin.from('profiles').select('user_id, full_name, phone').not('phone', 'is', null).limit(5000);
      const { data: subs } = await admin.from('subscriptions').select('user_id');
      const withSub = new Set((subs || []).map((s: any) => s.user_id));
      (allProfs || []).forEach((p: any) => {
        if (!withSub.has(p.user_id) && p.phone) targets.push({ phone: String(p.phone).replace(/\D/g, ''), name: p.full_name });
      });
    }

    // de-dup
    const seen = new Set<string>();
    const unique = targets.filter((t) => (seen.has(t.phone) ? false : (seen.add(t.phone), true)));

    // Insert recipients
    if (unique.length) {
      await admin.from('crm_campaign_recipients').insert(unique.map((t) => ({
        campaign_id, phone: t.phone, display_name: t.name, status: 'pending',
      })));
    }
    await admin.from('crm_campaigns').update({ status: 'sending', total_count: unique.length }).eq('id', campaign_id);

    // Dispatch (best-effort, throttled)
    let sent = 0, failed = 0;
    const wapiUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-wapi`;
    for (const t of unique) {
      const personalized = String(camp.message_template).replace(/\{nome\}/gi, t.name || '');
      try {
        const r = await fetch(wapiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
          body: JSON.stringify({ phone: t.phone, message: personalized, image_url: camp.media_url || undefined }),
        });
        if (r.ok) {
          sent++;
          await admin.from('crm_campaign_recipients').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('campaign_id', campaign_id).eq('phone', t.phone);
        } else {
          failed++;
          await admin.from('crm_campaign_recipients').update({ status: 'failed', error: `HTTP ${r.status}` }).eq('campaign_id', campaign_id).eq('phone', t.phone);
        }
      } catch (e) {
        failed++;
        await admin.from('crm_campaign_recipients').update({ status: 'failed', error: String(e) }).eq('campaign_id', campaign_id).eq('phone', t.phone);
      }
      // tiny throttle
      await new Promise((r) => setTimeout(r, 250));
    }

    await admin.from('crm_campaigns').update({ status: 'done', sent_count: sent, failed_count: failed }).eq('id', campaign_id);

    return new Response(JSON.stringify({ ok: true, total: unique.length, sent, failed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('crm-campaign-dispatch', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});