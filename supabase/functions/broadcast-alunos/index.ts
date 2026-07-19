import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

function firstName(full?: string | null) {
  return String(full || '').trim().split(/\s+/)[0] || '';
}
function render(tpl: string, ctx: Record<string, string>) {
  let out = String(tpl || '').replace(/\{nome\}/gi, ctx.nome || '');
  for (const [k, v] of Object.entries(ctx)) {
    if (k === 'nome') continue;
    out = out.replace(new RegExp(`\\{${k}\\}`, 'gi'), String(v ?? ''));
  }
  return out;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return new Response(JSON.stringify({ ok: false, error: 'missing auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: userData } = await authClient.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const audience: string = body.audience || 'active';
    const message: string = String(body.message || '').trim();
    const image_url: string | null = body.image_url ? String(body.image_url) : null;
    const template_id: string | null = body.template_id || null;
    const dry_run: boolean = !!body.dry_run;
    const delay_ms: number = Math.max(500, Math.min(10000, Number(body.delay_ms || 2000)));
    if (!message && !image_url) {
      return new Response(JSON.stringify({ ok: false, error: 'message ou image_url é obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // audience → user_ids ativos
    let userIds: string[] = [];
    if (audience === 'active') {
      const { data: subs } = await admin
        .from('subscriptions').select('user_id').eq('status', 'active');
      userIds = Array.from(new Set((subs || []).map((s: any) => s.user_id).filter(Boolean)));
    } else if (audience === 'all') {
      const { data: profs } = await admin.from('profiles').select('user_id').limit(5000);
      userIds = (profs || []).map((p: any) => p.user_id).filter(Boolean);
    } else {
      return new Response(JSON.stringify({ ok: false, error: 'audience inválida' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Puxa profiles
    const recipients: { user_id: string; full_name: string | null; phone: string | null }[] = [];
    const CHUNK = 200;
    for (let i = 0; i < userIds.length; i += CHUNK) {
      const slice = userIds.slice(i, i + CHUNK);
      const { data: profs } = await admin
        .from('profiles').select('user_id, full_name, phone, whatsapp_opt_out')
        .in('user_id', slice);
      for (const p of profs || []) {
        if ((p as any).whatsapp_opt_out) continue;
        const phone = String((p as any).phone || '').replace(/\D/g, '');
        if (!phone) continue;
        recipients.push({ user_id: (p as any).user_id, full_name: (p as any).full_name, phone });
      }
    }

    // Cria registro de run
    const { data: runRow } = await admin.from('broadcast_runs').insert({
      template_id, audience, total: recipients.length, dry_run,
      started_by: userId, status: dry_run ? 'preview' : 'running',
    }).select('id').single();
    const runId = (runRow as any)?.id;

    if (dry_run) {
      await admin.from('broadcast_runs').update({
        status: 'finished', finished_at: new Date().toISOString(),
      }).eq('id', runId);
      return new Response(JSON.stringify({
        ok: true, dry_run: true, run_id: runId,
        total: recipients.length,
        preview: recipients.slice(0, 5).map((r) => ({
          name: r.full_name, phone: r.phone,
          rendered: render(message, { nome: firstName(r.full_name) }),
        })),
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Dispara em background para não estourar timeout
    const wapiUrl = `${SUPABASE_URL}/functions/v1/send-wapi`;
    const wapiHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE}`,
      apikey: SERVICE_ROLE,
    };

    const task = (async () => {
      let sent = 0, failed = 0, skipped = 0;
      for (const r of recipients) {
        const rendered = render(message, { nome: firstName(r.full_name) });
        try {
          const resp = await fetch(wapiUrl, {
            method: 'POST', headers: wapiHeaders,
            body: JSON.stringify({ phone: r.phone, message: rendered, image_url }),
          });
          const data = await resp.json().catch(() => ({}));
          const ok = resp.ok && data?.ok === true;
          if (data?.blocked || data?.opt_out) skipped++;
          else if (ok) sent++;
          else failed++;
          await admin.from('message_history').insert({
            user_id: r.user_id, content: rendered,
            recipient_phone: r.phone, recipient_name: r.full_name,
            template_id, image_url, status: ok ? 'sent' : (data?.blocked ? 'skipped' : 'failed'),
            sent_at: new Date().toISOString(),
            error_message: ok ? null : (data?.error || `HTTP ${resp.status}`),
          });
        } catch (e) {
          failed++;
          await admin.from('message_history').insert({
            user_id: r.user_id, content: rendered,
            recipient_phone: r.phone, recipient_name: r.full_name,
            template_id, image_url, status: 'failed',
            sent_at: new Date().toISOString(), error_message: String(e),
          });
        }
        if ((sent + failed + skipped) % 10 === 0) {
          await admin.from('broadcast_runs').update({ sent, failed, skipped }).eq('id', runId);
        }
        await sleep(delay_ms);
      }
      await admin.from('broadcast_runs').update({
        sent, failed, skipped, status: 'finished', finished_at: new Date().toISOString(),
      }).eq('id', runId);
    })();
    // @ts-ignore Deno background task
    if (typeof EdgeRuntime !== 'undefined' && (EdgeRuntime as any).waitUntil) {
      (EdgeRuntime as any).waitUntil(task);
    } else { task.catch(console.error); }

    return new Response(JSON.stringify({
      ok: true, run_id: runId, total: recipients.length, status: 'running',
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('broadcast-alunos error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
