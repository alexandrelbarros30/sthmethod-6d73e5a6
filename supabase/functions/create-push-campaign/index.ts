import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

type Audience = 'active' | 'inactive' | 'all' | 'custom';

interface Body {
  title: string;
  body?: string;
  url?: string;
  audience_type: Audience;
  audience_user_ids?: string[];
  use_variables?: boolean;
  scheduled_at?: string | null; // ISO or null for immediate
}

const MAX_TARGETS = 5000;
const RECENT_WINDOW_MIN = 10;
const MAX_CAMPAIGNS_PER_WINDOW = 3;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return json({ ok: false, error: 'unauthorized' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: uErr } = await userClient.auth.getUser();
    if (uErr || !userData?.user) return json({ ok: false, error: 'unauthorized' }, 401);
    const uid = userData.user.id;

    // Role check
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', uid);
    const allowed = (roles || []).some((r: any) => r.role === 'admin' || r.role === 'consultor');
    if (!allowed) return json({ ok: false, error: 'forbidden' }, 403);

    const body = (await req.json()) as Body;
    if (!body?.title?.trim()) return json({ ok: false, error: 'title required' }, 400);
    if (!['active', 'inactive', 'all', 'custom'].includes(body.audience_type))
      return json({ ok: false, error: 'invalid audience' }, 400);

    // Build target list
    let targetIds: string[] = [];
    if (body.audience_type === 'custom') {
      targetIds = Array.from(new Set(body.audience_user_ids || []));
      if (targetIds.length === 0) return json({ ok: false, error: 'no targets' }, 400);
    } else {
      let q = admin.from('profiles').select('user_id, admin_confirmed');
      const { data: profs } = await q;
      const ids = (profs || []).filter((p: any) => p.admin_confirmed !== false).map((p: any) => p.user_id);
      if (body.audience_type === 'all') {
        targetIds = ids;
      } else {
        // fetch latest subscription per user
        const { data: subs } = await admin
          .from('subscriptions')
          .select('user_id, end_date, status')
          .in('user_id', ids)
          .order('end_date', { ascending: false });
        const best: Record<string, any> = {};
        for (const s of subs || []) if (!best[s.user_id]) best[s.user_id] = s;
        const now = Date.now();
        const activeIds = new Set<string>();
        for (const [uid2, s] of Object.entries(best)) {
          const end = s.end_date ? new Date(s.end_date as string).getTime() : 0;
          if (s.status === 'active' && end > now) activeIds.add(uid2);
        }
        if (body.audience_type === 'active') targetIds = Array.from(activeIds);
        else targetIds = ids.filter((x: string) => !activeIds.has(x));
      }
    }

    if (targetIds.length > MAX_TARGETS) {
      return json({ ok: false, error: `too many targets (${targetIds.length} > ${MAX_TARGETS})` }, 400);
    }

    // Rate limit: max N mass campaigns per window per admin
    const sinceIso = new Date(Date.now() - RECENT_WINDOW_MIN * 60 * 1000).toISOString();
    const { count: recentCount } = await admin
      .from('push_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', uid)
      .gte('created_at', sinceIso);
    if ((recentCount || 0) >= MAX_CAMPAIGNS_PER_WINDOW) {
      return json({
        ok: false,
        error: `rate_limited: máximo ${MAX_CAMPAIGNS_PER_WINDOW} campanhas a cada ${RECENT_WINDOW_MIN} min`,
      }, 429);
    }

    // Determine schedule
    const nowMs = Date.now();
    const scheduledMs = body.scheduled_at ? new Date(body.scheduled_at).getTime() : 0;
    const isScheduled = Boolean(body.scheduled_at) && scheduledMs > nowMs + 30_000;

    const { data: creator } = await admin
      .from('profiles')
      .select('full_name')
      .eq('user_id', uid)
      .maybeSingle();

    const { data: inserted, error: iErr } = await admin
      .from('push_campaigns')
      .insert({
        created_by: uid,
        created_by_name: creator?.full_name || null,
        title: body.title.trim().slice(0, 120),
        body: (body.body || '').slice(0, 500) || null,
        url: (body.url || '/dashboard').slice(0, 500),
        tag: `campaign-${nowMs}`,
        audience_type: body.audience_type,
        audience_user_ids: targetIds,
        target_count: targetIds.length,
        use_variables: !!body.use_variables,
        status: isScheduled ? 'scheduled' : 'sending',
        scheduled_at: isScheduled ? new Date(scheduledMs).toISOString() : null,
        started_at: isScheduled ? null : new Date().toISOString(),
      })
      .select()
      .single();
    if (iErr || !inserted) return json({ ok: false, error: iErr?.message || 'insert failed' }, 500);

    if (isScheduled) {
      return json({ ok: true, campaign_id: inserted.id, scheduled: true });
    }

    // Dispatch immediately
    const result = await dispatchCampaign(admin, inserted);
    return json({ ok: true, campaign_id: inserted.id, ...result });
  } catch (err) {
    console.error('create-push-campaign error', err);
    return json({ ok: false, error: String(err) }, 500);
  }
});

export async function dispatchCampaign(admin: any, camp: any) {
  const CHUNK = 200;
  const ids: string[] = camp.audience_user_ids || [];
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
          use_variables: camp.use_variables,
          campaign_id: camp.id,
          payload: {
            title: camp.title,
            body: camp.body || undefined,
            url: camp.url || '/dashboard',
            tag: camp.tag,
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
    .eq('id', camp.id);
  return { sent, failed, total, error: errorMsg };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}