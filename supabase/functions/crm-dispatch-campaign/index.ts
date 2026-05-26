import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface Filters {
  status?: string;
  gender?: string;
  objective?: string;
}

function classify(profile: any, sub: any): string {
  if (sub) {
    const days = Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000);
    if (days < 0) return 'expired';
    if (days <= 7) return 'expiring';
    return 'active';
  }
  return profile?.onboarding_complete ? 'lead' : 'tool_user';
}

function render(content: string, vars: Record<string, string>) {
  return content.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

async function sendWhatsApp(phone: string, message: string, image_url?: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
    body: JSON.stringify({ phone, message, image_url }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data?.ok, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { campaign_id, trigger_type = 'manual', triggered_by = null } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ ok: false, error: 'campaign_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: campaign, error: cErr } = await supabase
      .from('crm_campaigns').select('*').eq('id', campaign_id).single();
    if (cErr || !campaign) {
      return new Response(JSON.stringify({ ok: false, error: 'Campaign not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (campaign.status === 'sending') {
      // Allow re-running if the previous dispatch is stale (>4 minutes without progress)
      const last = campaign.last_run_at ? new Date(campaign.last_run_at).getTime() : 0;
      if (Date.now() - last < 4 * 60 * 1000) {
        return new Response(JSON.stringify({ ok: false, error: 'already sending' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Resolve segment
    let filters: Filters = {};
    if (campaign.segment_id) {
      const { data: seg } = await supabase.from('crm_segments').select('filters').eq('id', campaign.segment_id).single();
      filters = (seg?.filters as Filters) || {};
    } else if (campaign.segment_snapshot) {
      filters = (campaign.segment_snapshot.filters as Filters) || {};
    }

    // Load template
    let template: any = null;
    if (campaign.template_id) {
      const { data: t } = await supabase.from('crm_templates').select('*').eq('id', campaign.template_id).single();
      template = t;
    } else if (campaign.template_snapshot) {
      template = campaign.template_snapshot;
    }
    if (!template?.content) {
      return new Response(JSON.stringify({ ok: false, error: 'Template not found or empty' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve media url (first one)
    let image_url: string | undefined;
    if (campaign.media_ids?.length) {
      const { data: media } = await supabase.from('crm_media').select('url').eq('id', campaign.media_ids[0]).single();
      image_url = media?.url || undefined;
    }

    // Load contacts (profiles + latest subscription)
    const { data: profiles } = await supabase
      .from('profiles').select('user_id, full_name, email, phone, gender, objective, onboarding_complete, notify_on_updates').limit(5000);
    const userIds = (profiles || []).map((p: any) => p.user_id);
    const { data: subs } = await supabase
      .from('subscriptions').select('user_id, plan_id, end_date, status').in('user_id', userIds);
    const { data: plans } = await supabase.from('plans').select('id, name');
    const plansMap = new Map((plans || []).map((p: any) => [p.id, p.name]));
    const latestSub = new Map<string, any>();
    (subs || []).forEach((s: any) => {
      const ex = latestSub.get(s.user_id);
      if (!ex || new Date(s.end_date) > new Date(ex.end_date)) latestSub.set(s.user_id, s);
    });

    const recipients = (profiles || [])
      .map((p: any) => {
        const sub = latestSub.get(p.user_id);
        const status = classify(p, sub);
        const end = sub?.end_date ? new Date(sub.end_date) : null;
        const days = end ? Math.floor((end.getTime() - Date.now()) / 86400000) : null;
        return {
          user_id: p.user_id,
          name: p.full_name || '',
          phone: (p.phone || '').replace(/\D/g, ''),
          gender: (p.gender || '').toLowerCase(),
          objective: p.objective || '',
          status,
          plan_name: sub ? plansMap.get(sub.plan_id) : '',
          days,
          notify_on_updates: p.notify_on_updates,
        };
      })
      .filter((c) => {
        if (!c.phone) return false;
        if ((c as any).notify_on_updates === false) return false;
        if (filters.status && filters.status !== 'all') {
          if (filters.status === 'inactive') {
            // inativo = vencido há mais de 30 dias
            if (c.status !== 'expired') return false;
            if (c.days == null || c.days > -30) return false;
          } else if (c.status !== filters.status) return false;
        }
        if (filters.gender && filters.gender !== 'all' && c.gender !== filters.gender) return false;
        if (filters.objective && !c.objective.toLowerCase().includes(filters.objective.toLowerCase())) return false;
        return true;
      });

    // Mark sending + create run
    await supabase.from('crm_campaigns').update({ status: 'sending', last_run_at: new Date().toISOString() }).eq('id', campaign_id);
    const { data: run } = await supabase
      .from('crm_campaign_runs')
      .insert({ campaign_id, total_recipients: recipients.length, trigger_type, triggered_by })
      .select('id').single();
    const run_id = run?.id;

    // Run the actual sending in background so the HTTP request can return
    // immediately and we don't hit the edge function 150s wall-clock limit.
    const sendAll = async () => {
      let sent = 0;
      let failed = 0;
      for (const r of recipients) {
      // Check for pause/cancel request between sends
      if ((sent + failed) % 3 === 0) {
        const { data: cur } = await supabase
          .from('crm_campaigns').select('status').eq('id', campaign_id).maybeSingle();
        if (cur?.status === 'paused' || cur?.status === 'cancelled') {
          console.log('[dispatch] interrupted by user — status=', cur.status);
          break;
        }
      }
      const vars = {
        nome: r.name.split(' ')[0] || r.name || 'amigo',
        plano: r.plan_name || '',
        dias_vencido: r.days != null && r.days < 0 ? String(-r.days) : '0',
        cupom: '',
        link: 'https://sthmethod.com.br',
        objetivo: r.objective || '',
      };
      const rendered = render(template.content, vars);
      const { data: msg } = await supabase.from('crm_campaign_messages').insert({
        campaign_id, run_id, recipient_user_id: r.user_id, recipient_phone: r.phone,
        recipient_name: r.name, rendered_content: rendered, media_url: image_url, status: 'sending',
      }).select('id').single();

      try {
        const res = await sendWhatsApp(r.phone, rendered, image_url);
        if (res.ok) {
          sent++;
          await supabase.from('crm_campaign_messages').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            provider_message_id: (res.data as any)?.messageId || null,
          }).eq('id', msg!.id);
        } else {
          failed++;
          await supabase.from('crm_campaign_messages').update({ status: 'failed', error: JSON.stringify(res.data).slice(0, 500) }).eq('id', msg!.id);
        }
      } catch (e) {
        failed++;
        await supabase.from('crm_campaign_messages').update({ status: 'failed', error: String(e).slice(0, 500) }).eq('id', msg!.id);
      }
      // Incremental heartbeat so the UI reflects progress and stale detection works
      if ((sent + failed) % 5 === 0) {
        await supabase.from('crm_campaign_runs').update({ sent_count: sent, failed_count: failed }).eq('id', run_id!);
        await supabase.from('crm_campaigns').update({ last_run_at: new Date().toISOString() }).eq('id', campaign_id);
      }
      // anti-spam pause 1.2-2.2s
      await new Promise((r) => setTimeout(r, 1200 + Math.random() * 1000));
      }

    await supabase.from('crm_campaign_runs').update({
      finished_at: new Date().toISOString(), sent_count: sent, failed_count: failed,
    }).eq('id', run_id!);

    // Re-read status: if user paused mid-send, keep it paused instead of overwriting
    const { data: finalCamp } = await supabase
      .from('crm_campaigns').select('status').eq('id', campaign_id).maybeSingle();
    const wasInterrupted = finalCamp?.status === 'paused' || finalCamp?.status === 'cancelled';

    // Compute next_run for recurrence
    let nextRun: string | null = null;
    let nextStatus = 'sent';
    if (campaign.recurrence?.enabled) {
      const intervalDays = Number(campaign.recurrence.interval_days || 7);
      nextRun = new Date(Date.now() + intervalDays * 86400000).toISOString();
      nextStatus = 'scheduled';
    }

    await supabase.from('crm_campaigns').update({
      status: wasInterrupted ? finalCamp!.status : nextStatus,
      sent_count: (campaign.sent_count || 0) + sent,
      failed_count: (campaign.failed_count || 0) + failed,
      next_run_at: wasInterrupted ? null : nextRun,
      scheduled_at: !wasInterrupted && nextStatus === 'scheduled' ? nextRun : null,
    }).eq('id', campaign_id);
      return { sent, failed };
    };

    // @ts-ignore EdgeRuntime is provided by Supabase Edge Runtime
    if (typeof EdgeRuntime !== 'undefined' && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(sendAll().catch((e) => console.error('sendAll failed', e)));
    } else {
      // Fallback: run synchronously (may hit wall-clock for big lists)
      await sendAll();
    }

    return new Response(JSON.stringify({ ok: true, run_id, total: recipients.length, queued: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('crm-dispatch-campaign error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});