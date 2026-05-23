import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const STAGE_TEMPLATE_KEYS: Record<number, string> = {
  1: 'renewal_soft',
  2: 'renewal_objective',
  3: 'renewal_recovery',
  4: 'renewal_last_contact',
  5: 'renewal_reactivation',
};

const AUTO_FOOTER =
  '\n\n———\n🔔 Comunicação automática STH METHOD\nMensagem enviada automaticamente pelo sistema.\nNão é necessário responder.';

const renderTemplate = (content: string, ctx: Record<string, any>): string => {
  const firstName = (ctx.full_name as string | undefined)?.split(' ')[0] || 'Aluno';
  const fullName = (ctx.full_name as string | undefined) || 'Aluno';
  let msg = content;
  msg = msg.replace(/\{nome\}/g, firstName);
  msg = msg.replace(/\{nome_completo\}/g, fullName);
  msg = msg.replace(/\{email\}/g, ctx.email || '');
  msg = msg.replace(/\{telefone\}/g, ctx.phone || '');
  msg = msg.replace(/\{plano\}/g, ctx.plan_name || '—');
  msg = msg.replace(/\{valor\}/g, ctx.amount || '—');
  const link = ctx.user_id ? `${ctx.origin}/dashboard/renew?uid=${ctx.user_id}` : '';
  msg = msg.replace(/\{link\}/g, link);
  msg = msg.replace(/\{link_renovacao\}/g, link);
  msg = msg.replace(/\{cupom\}/g, ctx.cupom || 'VOLTASTH');
  if (ctx.end_date) {
    const d = new Date(ctx.end_date);
    msg = msg.replace(/\{vencimento\}/g, d.toLocaleDateString('pt-BR'));
    msg = msg.replace(/\{data_vencimento\}/g, d.toLocaleDateString('pt-BR'));
    const overdue = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
    msg = msg.replace(/\{dias_vencido\}/g, String(overdue));
    msg = msg.replace(/\{dias_restantes\}/g, '0');
  } else {
    msg = msg.replace(/\{vencimento\}/g, '—');
    msg = msg.replace(/\{data_vencimento\}/g, '—');
    msg = msg.replace(/\{dias_vencido\}/g, '—');
    msg = msg.replace(/\{dias_restantes\}/g, '—');
  }
  return msg;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    // Check global automation flag
    const { data: autoRow } = await admin
      .from('billing_automation').select('enabled').eq('id', 1).maybeSingle();
    if (!autoRow?.enabled) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'automation disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const nowIso = new Date().toISOString();
    const { data: campaigns, error: cErr } = await admin
      .from('billing_campaigns')
      .select('id, user_id, stage, next_due_at, status, auto_send')
      .eq('status', 'active')
      .eq('auto_send', true)
      .lte('next_due_at', nowIso)
      .limit(100);
    if (cErr) throw cErr;

    if (!campaigns?.length) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userIds = campaigns.map((c) => c.user_id);
    const { data: profiles } = await admin
      .from('profiles').select('user_id, full_name, phone, email').in('user_id', userIds);
    const profMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    const { data: subs } = await admin
      .from('subscriptions').select('user_id, end_date, plan_id').in('user_id', userIds);
    const subMap = new Map((subs || []).map((s) => [s.user_id, s]));

    const origin = SUPABASE_URL.replace(/^https:\/\/([^.]+)\.supabase\.co/, 'https://$1.lovable.app');

    let processed = 0, ok = 0, failed = 0, skipped = 0;
    for (const camp of campaigns) {
      processed++;
      const prof = profMap.get(camp.user_id);
      const sub = subMap.get(camp.user_id);
      if (!prof?.phone) { skipped++; continue; }

      const stage = camp.stage || 1;
      const tplKey = STAGE_TEMPLATE_KEYS[stage] || STAGE_TEMPLATE_KEYS[1];
      const { data: tpl } = await admin
        .from('message_templates').select('id, content, image_url').eq('system_key', tplKey).maybeSingle();
      if (!tpl) { skipped++; continue; }

      const rendered = renderTemplate(tpl.content, {
        full_name: prof.full_name, phone: prof.phone, email: prof.email,
        user_id: camp.user_id, end_date: sub?.end_date, origin,
      });
      const finalMessage = rendered.includes('Comunicação automática STH METHOD')
        ? rendered : `${rendered}${AUTO_FOOTER}`;

      let autoOk = false; let deliveryError: string | null = null;
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE}`,
            'apikey': SERVICE_ROLE,
          },
          body: JSON.stringify({ phone: prof.phone, message: finalMessage, image_url: tpl.image_url || null }),
        });
        const j = await res.json();
        if (j?.ok) autoOk = true; else deliveryError = j?.error || 'falha no envio';
      } catch (err: any) {
        deliveryError = err?.message || String(err);
      }

      await admin.from('billing_charges').insert({
        campaign_id: camp.id, user_id: camp.user_id, stage,
        template_key: tplKey, responsible_user_id: null, phone: prof.phone,
        message: finalMessage, image_url: tpl.image_url || null,
        document_url: null, document_name: null,
        delivery_status: autoOk ? 'sent' : 'failed', delivery_error: deliveryError,
      });
      await admin.rpc('advance_billing_campaign', { _campaign_id: camp.id });

      if (autoOk) ok++; else failed++;
    }

    return new Response(JSON.stringify({ ok: true, processed, sent: ok, failed, skipped }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('billing-auto-dispatch error', err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});