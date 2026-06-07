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
    const targets: { phone: string; name: string | null; user_id: string | null; plan: string | null; plan_id: string | null; end_date: string | null; price: number | null }[] = [];

    if (filter.type === 'all_active' || filter.type === 'expiring' || filter.type === 'expired') {
      const today = new Date();
      const in7 = new Date(today.getTime() + 7 * 86400000);
      let q = admin.from('subscriptions').select('user_id, end_date, status, plan_id');
      if (filter.type === 'expired') q = q.lt('end_date', today.toISOString().slice(0, 10));
      else if (filter.type === 'expiring') q = q.gte('end_date', today.toISOString().slice(0, 10)).lte('end_date', in7.toISOString().slice(0, 10));
      else q = q.gte('end_date', today.toISOString().slice(0, 10));
      const { data: subs } = await q.limit(5000);
      const uids = (subs || []).map((s: any) => s.user_id);
      if (uids.length) {
        const { data: profs } = await admin.from('profiles').select('user_id, full_name, phone').in('user_id', uids);
        const planIds = Array.from(new Set((subs || []).map((s: any) => s.plan_id).filter(Boolean)));
        const { data: plans } = planIds.length
          ? await admin.from('plans').select('id, name, price').in('id', planIds)
          : { data: [] as any[] };
        const planMap = new Map((plans || []).map((p: any) => [p.id, p]));
        const subMap = new Map((subs || []).map((s: any) => [s.user_id, s]));
        (profs || []).forEach((p: any) => {
          if (!p.phone) return;
          const s = subMap.get(p.user_id);
          const plan = s ? planMap.get(s.plan_id) : null;
          targets.push({
            phone: String(p.phone).replace(/\D/g, ''),
            name: p.full_name,
            user_id: p.user_id,
            plan: plan?.name || null,
            end_date: s?.end_date || null,
            price: plan?.price ?? null,
          });
        });
      }
    } else if (filter.type === 'all_leads') {
      const { data: allProfs } = await admin.from('profiles').select('user_id, full_name, phone').not('phone', 'is', null).limit(5000);
      const { data: subs } = await admin.from('subscriptions').select('user_id');
      const withSub = new Set((subs || []).map((s: any) => s.user_id));
      (allProfs || []).forEach((p: any) => {
        if (!withSub.has(p.user_id) && p.phone) targets.push({
          phone: String(p.phone).replace(/\D/g, ''),
          name: p.full_name,
          user_id: p.user_id,
          plan: null,
          end_date: null,
          price: null,
        });
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
    const sendApiUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-send-whatsapp`;
    const provider = camp.channel || 'zapi';
    function fmtDate(d: string | null) {
      if (!d) return '';
      try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
    }
    function fmtBRL(v: number | null) {
      if (v == null) return '';
      return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    function renderVars(body: string, t: typeof unique[number]): string {
      const renewLink = `https://sthmethod.com.br/dashboard/renew?uid=${t.user_id}${t.plan_id ? `&pid=${t.plan_id}` : ''}`;
      const ctx: Record<string, string> = {
        nome: (t.name || '').split(' ')[0] || (t.name || ''),
        plano: t.plan || '',
        vencimento: fmtDate(t.end_date),
        valor: fmtBRL(t.price),
        dias_restantes: t.end_date ? String(Math.ceil((new Date(t.end_date).getTime() - Date.now()) / 86400000)) : '',
        link_renovacao: renewLink,
        telefone: t.phone || '',
      };
      return String(body).replace(/\{([a-z0-9_]+)\}/gi, (_m, k) => ctx[String(k).toLowerCase()] ?? '');
    }
    for (const t of unique) {
      const personalized = renderVars(camp.message_template, t);
      try {
        // Encontrar ou criar conversa para logar no CRM
        let conversation_id = '';
        const { data: conv } = await admin.from('crm_conversations')
          .select('id')
          .eq('phone', t.phone)
          .eq('queue_type', provider === 'zapi' ? 'comercial' : (provider === 'wapi_sucesso' ? 'sucesso' : 'nutri'))
          .maybeSingle();
        
        if (conv) {
          conversation_id = conv.id;
        } else {
          const { data: newConv } = await admin.from('crm_conversations').insert({
            phone: t.phone,
            display_name: t.name,
            channel: 'whatsapp',
            status: 'open',
            provider: provider,
            queue_type: provider === 'zapi' ? 'comercial' : (provider === 'wapi_sucesso' ? 'sucesso' : 'nutri')
          }).select('id').single();
          conversation_id = newConv?.id || '';
        }

        const r = await fetch(sendApiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` 
          },
          body: JSON.stringify({ 
            conversation_id,
            phone: t.phone, 
            body: personalized, 
            image_url: camp.media_url || undefined,
            provider
          }),
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