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

    // Localiza perfil pelo número
    const { data: matches } = await supabase.rpc('find_profile_by_phone', { _phone: digits });
    const profile = (matches || [])[0];
    if (!profile?.user_id) {
      console.log('No matching profile for', digits);
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