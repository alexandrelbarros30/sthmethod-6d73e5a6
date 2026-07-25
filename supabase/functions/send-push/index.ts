import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contato@sthmethod.com.br';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

interface Body {
  user_id?: string;
  user_ids?: string[];
  payload: PushPayload;
  use_variables?: boolean;
  campaign_id?: string;
}

function applyVars(template: string | undefined, vars: Record<string, string>): string | undefined {
  if (!template) return template;
  return template
    .replace(/\{\{\s*nome\s*\}\}/gi, vars.nome || 'aluno(a)')
    .replace(/\{\{\s*plano\s*\}\}/gi, vars.plano || 'seu plano')
    .replace(/\{\{\s*vencimento\s*\}\}/gi, vars.vencimento || 'em breve');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return json({ ok: false, error: 'VAPID keys not configured' }, 500);
    }

    const body = (await req.json()) as Body;
    if (!body?.payload?.title) return json({ ok: false, error: 'payload.title required' }, 400);

    const targetIds = body.user_ids ?? (body.user_id ? [body.user_id] : []);
    if (targetIds.length === 0) return json({ ok: false, error: 'user_id or user_ids required' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: subs, error } = await admin
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', targetIds)
      .eq('enabled', true);
    if (error) return json({ ok: false, error: error.message }, 500);
    if (!subs || subs.length === 0) return json({ ok: true, sent: 0, note: 'no active subscriptions' });

    // Resolve per-user variables when requested
    let userVars: Record<string, { nome: string; plano: string; vencimento: string }> = {};
    if (body.use_variables) {
      const uniqIds = Array.from(new Set(subs.map((s: any) => s.user_id)));
      const [{ data: profs }, { data: subsRows }] = await Promise.all([
        admin.from('profiles').select('user_id, full_name').in('user_id', uniqIds),
        admin
          .from('subscriptions')
          .select('user_id, end_date, status, plans:plan_id(name)')
          .in('user_id', uniqIds)
          .order('end_date', { ascending: false }),
      ]);
      const bestSub: Record<string, any> = {};
      for (const r of subsRows || []) {
        if (!bestSub[r.user_id]) bestSub[r.user_id] = r;
      }
      for (const p of profs || []) {
        const s = bestSub[p.user_id];
        const first = String(p.full_name || '').trim().split(/\s+/)[0] || 'aluno(a)';
        const planName = s?.plans?.name || 'seu plano';
        const venc = s?.end_date ? new Date(s.end_date).toLocaleDateString('pt-BR') : 'em breve';
        userVars[p.user_id] = { nome: first, plano: planName, vencimento: venc };
      }
    }

    let sent = 0;
    let failed = 0;

    await Promise.all(
      subs.map(async (s: any) => {
        try {
          const vars = userVars[s.user_id] || { nome: 'aluno(a)', plano: 'seu plano', vencimento: 'em breve' };
          const perPayload = body.use_variables
            ? {
                ...body.payload,
                title: applyVars(body.payload.title, vars)!,
                body: applyVars(body.payload.body, vars),
                url: applyVars(body.payload.url, vars),
              }
            : body.payload;
          const payloadStr = JSON.stringify(perPayload);
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payloadStr,
            { TTL: 60 * 60 * 24 },
          );
          sent++;
          await admin
            .from('push_subscriptions')
            .update({ last_success_at: new Date().toISOString(), failure_count: 0 })
            .eq('id', s.id);
        } catch (err: any) {
          failed++;
          const status = err?.statusCode ?? 0;
          // 404/410 = assinatura expirou/foi cancelada — desativar.
          if (status === 404 || status === 410) {
            await admin.from('push_subscriptions').update({ enabled: false }).eq('id', s.id);
          }
          console.warn('send-push failed', { endpoint: s.endpoint, status, msg: err?.message });
        }
      }),
    );

    return json({ ok: true, sent, failed, total: subs.length });
  } catch (err) {
    console.error('send-push error', err);
    return json({ ok: false, error: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}