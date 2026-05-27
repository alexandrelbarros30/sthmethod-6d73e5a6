import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Webhook que recebe mensagens enviadas pelos alunos para a linha "Fale com o Nutri" (W-API).
// Configure essa URL no painel W-API como webhook de mensagens recebidas.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));
    console.log('wapi-inbound-nutri payload:', JSON.stringify(payload).slice(0, 1000));

    // W-API costuma enviar diferentes formatos; tentamos vários campos comuns.
    const fromRaw =
      payload?.phone ||
      payload?.from ||
      payload?.sender?.phone ||
      payload?.data?.from ||
      payload?.message?.from ||
      '';
    const text =
      payload?.message?.text ||
      payload?.text ||
      payload?.body ||
      payload?.data?.message?.text ||
      payload?.data?.body ||
      '';
    const messageId =
      payload?.messageId || payload?.id || payload?.data?.messageId || payload?.message?.id || null;
    const fromMe = Boolean(payload?.fromMe ?? payload?.message?.fromMe ?? payload?.data?.fromMe);

    if (fromMe) {
      return new Response(JSON.stringify({ ok: true, ignored: 'fromMe' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const digits = String(fromRaw).replace(/\D/g, '');
    if (!digits) {
      return new Response(JSON.stringify({ ok: true, ignored: 'no-phone' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ===== CRM: alimenta o sistema de tickets unificado (não-bloqueante) =====
    try {
      await supabase.rpc('crm_route_inbound', {
        _phone: digits,
        _body: text || '',
        _provider: 'wapi',
        _message_id: messageId,
        _instance_id: null,
        _media_url: null,
      });
    } catch (crmErr) {
      console.error('crm_route_inbound (wapi) error', crmErr);
    }

    // ===== Helper: enviar resposta de ausência (mesmo para não identificados) =====
    const sendAwayIfOutsideHours = async (firstName: string | null) => {
      try {
        const { data: bh } = await supabase
          .from('nutri_business_hours')
          .select('*')
          .eq('id', 'main')
          .maybeSingle();
        if (!bh?.enabled || !bh?.away_message) return;

        const tz = bh.timezone || 'America/Sao_Paulo';
        const fmt = new Intl.DateTimeFormat('en-US', {
          timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
        });
        const parts = fmt.formatToParts(new Date());
        const wdMap: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
        const wd = wdMap[parts.find(p => p.type === 'weekday')?.value || 'Sun'] ?? 0;
        const hh = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
        const mm = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
        const nowMin = hh * 60 + mm;

        const schedule = Array.isArray(bh.schedule) ? bh.schedule : [];
        const day = schedule.find((d: any) => Number(d.day) === wd);
        const toMin = (s: string) => {
          const [h, m] = String(s || '00:00').split(':').map(Number);
          return (h || 0) * 60 + (m || 0);
        };
        const withinHours = day?.enabled && nowMin >= toMin(day.start) && nowMin < toMin(day.end);
        if (withinHours) return;

        // throttle por telefone (funciona mesmo sem perfil)
        const { data: th } = await supabase
          .from('nutri_away_throttle')
          .select('last_at')
          .eq('phone', digits)
          .maybeSingle();
        const lastAway = th?.last_at ? new Date(th.last_at).getTime() : 0;
        const sinceMs = Date.now() - lastAway;
        const oncePerDay = bh.send_once_per_day !== false;
        const shouldSend = oncePerDay ? sinceMs > 20 * 60 * 60 * 1000 : sinceMs > 30 * 60 * 1000;
        if (!shouldSend) return;

        // monta a mensagem: substitui {nome} se identificado; remove placeholder/saudação personalizada caso contrário
        let msg = String(bh.away_message);
        if (firstName) {
          msg = msg.replace(/\{nome\}/gi, firstName);
        } else {
          // remove "{nome}" e limpa espaços/vírgulas órfãs ao redor
          msg = msg
            .replace(/[,!\s]*\{nome\}[,!\s]*/gi, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
        }

        const sendResp = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-wapi`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify({ phone: digits, message: msg }),
          },
        );
        const sendData = await sendResp.json().catch(() => ({}));

        await supabase
          .from('nutri_away_throttle')
          .upsert({ phone: digits, last_at: new Date().toISOString() }, { onConflict: 'phone' });

        return { sent: sendResp.ok, messageId: sendData?.messageId || null };
      } catch (awayErr) {
        console.error('away-message error', awayErr);
      }
    };

    // Localiza perfil pelo número
    const { data: matches } = await supabase.rpc('find_profile_by_phone', { _phone: digits });
    const profile = (matches || [])[0];
    if (!profile?.user_id) {
      console.log('No matching profile for', digits);
      await sendAwayIfOutsideHours(null);
      return new Response(JSON.stringify({ ok: true, ignored: 'no-profile' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Confere se é aluno ativo (assinatura vigente)
    const today = new Date().toISOString().slice(0, 10);
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, end_date')
      .eq('user_id', profile.user_id)
      .gte('end_date', today)
      .limit(1)
      .maybeSingle();

    if (!sub) {
      console.log('Inbound from non-active user', profile.user_id);
      const first = (profile.full_name || '').split(' ')[0] || null;
      await sendAwayIfOutsideHours(first);
      return new Response(JSON.stringify({ ok: true, ignored: 'not-active' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('nutri_messages').insert({
      user_id: profile.user_id,
      phone: digits,
      direction: 'in',
      body: text || '',
      status: 'received',
      wapi_message_id: messageId,
    });

    // Resposta automática fora do horário (com nome do aluno ativo)
    const first = (profile.full_name || '').split(' ')[0] || null;
    const awayRes = await sendAwayIfOutsideHours(first);
    if (awayRes?.sent) {
      const { data: bh } = await supabase
        .from('nutri_business_hours')
        .select('away_message')
        .eq('id', 'main')
        .maybeSingle();
      const msg = String(bh?.away_message || '').replace(/\{nome\}/gi, first || '');
      await supabase.from('nutri_messages').insert({
        user_id: profile.user_id,
        phone: digits,
        direction: 'out',
        body: msg,
        status: 'sent',
        wapi_message_id: awayRes.messageId,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('wapi-inbound-nutri error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});