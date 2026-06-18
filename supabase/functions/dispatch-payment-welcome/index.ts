import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * Dispara as automações de boas-vindas pós-pagamento (WhatsApp Comercial +
 * Nutri + e-mails transacionais) para pagamentos confirmados manualmente
 * pelo admin (espécie, transferência, comprovante etc.), espelhando o
 * comportamento do `mercado-pago-webhook` quando um pagamento é aprovado.
 *
 * Input: { payment_id: string }
 */

function renderTemplate(content: string, ctx: Record<string, any>): string {
  const firstName = (ctx.full_name as string | undefined)?.split(' ')[0] || 'Aluno';
  let msg = content;
  msg = msg.replace(/\{nome\}/g, firstName);
  msg = msg.replace(/\{nome_completo\}/g, ctx.full_name || 'Aluno');
  msg = msg.replace(/\{email\}/g, ctx.email || '');
  msg = msg.replace(/\{telefone\}/g, ctx.phone || '');
  msg = msg.replace(/\{plano\}/g, ctx.plan_name || '—');
  msg = msg.replace(/\{valor\}/g, ctx.amount || ctx.plan_price || '—');
  if (ctx.end_date) {
    const d = new Date(String(ctx.end_date) + 'T00:00:00');
    const venc = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    msg = msg.replace(/\{vencimento\}/g, venc);
    msg = msg.replace(/\{data_vencimento\}/g, venc);
  } else {
    msg = msg.replace(/\{vencimento\}/g, '—');
    msg = msg.replace(/\{data_vencimento\}/g, '—');
  }
  const link = ctx.user_id
    ? `https://sthmethod.com.br/dashboard/renew?uid=${ctx.user_id}${ctx.plan_id ? `&pid=${ctx.plan_id}` : ''}`
    : '';
  msg = msg.replace(/\{link\}/g, link);
  msg = msg.replace(/\{link_renovacao\}/g, link);
  return msg;
}

async function sendAutomationWhatsapp(
  supabase: any,
  userId: string,
  trigger: string,
  channel: 'nutri' | 'comercial',
) {
  const { data: profile } = await supabase
    .from('profiles').select('full_name, phone, email').eq('user_id', userId).maybeSingle();
  if (!profile?.phone) return { ok: false, reason: 'no_phone' };

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('end_date, plan_id')
    .eq('user_id', userId)
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  let planName: string | null = null;
  let planPrice: string | null = null;
  if (sub?.plan_id) {
    const { data: plan } = await supabase
      .from('plans').select('name, price').eq('id', sub.plan_id).maybeSingle();
    if (plan) {
      planName = plan.name || null;
      if (plan.price != null) {
        planPrice = Number(plan.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      }
    }
  }

  const legacyKeyMap: Record<string, string> = {
    payment_welcome: 'automacao_pagamento_aprovado',
    payment_welcome_new: 'automacao_pagamento_aprovado',
    payment_welcome_renewal: 'automacao_pagamento_renovacao',
    payment_welcome_reactivation: 'automacao_pagamento_reativacao',
    payment_thanks_comercial: 'automacao_pagamento_comercial',
  };
  const legacyKey = legacyKeyMap[trigger] || trigger;
  const { data: tplData } = await supabase
    .from('crm_message_templates')
    .select('id, body, media_url, active')
    .or(`automation_trigger.eq.${trigger},key.eq.${trigger},key.eq.${legacyKey}`)
    .eq('active', true)
    .limit(1)
    .maybeSingle();
  if (!tplData?.body) return { ok: false, reason: 'template_missing' };

  const message = renderTemplate(tplData.body, {
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    user_id: userId,
    plan_id: sub?.plan_id || null,
    plan_name: planName,
    plan_price: planPrice,
    amount: planPrice,
    end_date: sub?.end_date || null,
  });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const fnName = channel === 'comercial' ? 'send-whatsapp' : 'send-wapi';
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE}`,
      apikey: SERVICE_ROLE,
    },
    body: JSON.stringify({ phone: profile.phone, message, image_url: tplData.media_url || null }),
  });
  const j = await res.json().catch(() => ({}));
  const ok = !!j?.ok;
  try {
    await supabase.from('message_history').insert({
      user_id: userId,
      content: message,
      recipient_phone: profile.phone,
      recipient_name: profile.full_name || null,
      template_id: tplData.id,
      image_url: tplData.media_url || null,
      status: ok ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
    });
  } catch (_) { /* noop */ }
  return { ok, trigger, channel };
}

async function enqueueEmail(
  supabase: any,
  templateKey: string,
  userId: string,
  source: string,
  data: Record<string, unknown>,
) {
  try {
    const { data: prof } = await supabase
      .from('profiles').select('email, full_name').eq('user_id', userId).maybeSingle();
    if (!prof?.email) return;
    const { data: existing } = await supabase
      .from('email_scheduled_sends')
      .select('id')
      .eq('source', source)
      .eq('template_key', templateKey)
      .limit(1);
    if (existing && existing.length > 0) return;
    await supabase.from('email_scheduled_sends').insert({
      template_key: templateKey,
      recipient_user_id: userId,
      recipient_email: prof.email,
      recipient_name: prof.full_name,
      template_data: { name: prof.full_name || '', siteUrl: 'https://sthmethod.com', ...data },
      source,
    });
  } catch (e) {
    console.error('[enqueueEmail] failed', templateKey, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { payment_id } = await req.json();
    if (!payment_id) {
      return new Response(JSON.stringify({ error: 'payment_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('id, user_id, plan_id, amount, method, action_type, automation_sent_at')
      .eq('id', payment_id)
      .maybeSingle();
    if (payErr || !payment) {
      return new Response(JSON.stringify({ error: 'payment_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Lock atômico — só a primeira chamada dispara.
    const { data: claim } = await supabase
      .from('payments')
      .update({ automation_sent_at: new Date().toISOString() })
      .eq('id', payment.id)
      .is('automation_sent_at', null)
      .select('id')
      .maybeSingle();
    if (!claim) {
      return new Response(JSON.stringify({ ok: false, reason: 'already_dispatched' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Classifica novo/renovacao/reativacao
    let kind: 'novo' | 'renovacao' | 'reativacao' = 'novo';
    try {
      const { count } = await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', payment.user_id)
        .eq('status', 'approved')
        .neq('id', payment.id);
      if ((count || 0) > 0) {
        const { data: prevSub } = await supabase
          .from('subscriptions')
          .select('end_date, status')
          .eq('user_id', payment.user_id)
          .order('end_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (prevSub?.end_date) {
          const prevEnd = new Date(String(prevSub.end_date) + 'T23:59:59');
          kind = prevEnd < new Date() ? 'reativacao' : 'renovacao';
        } else {
          kind = 'renovacao';
        }
      }
    } catch (_) { /* default novo */ }

    const nutriTrigger =
      kind === 'novo' ? 'payment_welcome_new'
      : kind === 'reativacao' ? 'payment_welcome_reactivation'
      : 'payment_welcome_renewal';

    const [comRes, nutriRes] = await Promise.allSettled([
      sendAutomationWhatsapp(supabase, payment.user_id, 'payment_thanks_comercial', 'comercial'),
      sendAutomationWhatsapp(supabase, payment.user_id, nutriTrigger, 'nutri'),
    ]);

    // Plano para e-mail
    let planName = '';
    if (payment.plan_id) {
      const { data: plan } = await supabase.from('plans').select('name').eq('id', payment.plan_id).maybeSingle();
      planName = plan?.name || '';
    }
    const amountStr = Number(payment.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const methodStr = String(payment.method || 'cash');
    const paymentDateStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    if (kind === 'novo') {
      await Promise.allSettled([
        enqueueEmail(supabase, 'welcome-post-payment', payment.user_id,
          `manual:${payment.id}:welcome-post-payment`, { planName }),
        enqueueEmail(supabase, 'payment-receipt-first', payment.user_id,
          `manual:${payment.id}:receipt-first`,
          { planName, amount: amountStr, method: methodStr, paymentDate: paymentDateStr }),
      ]);
    } else {
      await enqueueEmail(supabase, 'payment-receipt-renewal', payment.user_id,
        `manual:${payment.id}:receipt-renewal`,
        { planName, amount: amountStr, method: methodStr, paymentDate: paymentDateStr });
    }

    return new Response(JSON.stringify({
      ok: true,
      kind,
      whatsapp: {
        comercial: comRes.status === 'fulfilled' ? comRes.value : { ok: false },
        nutri: nutriRes.status === 'fulfilled' ? nutriRes.value : { ok: false },
      },
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[dispatch-payment-welcome] error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});