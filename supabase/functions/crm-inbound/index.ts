import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Webhook unificado: recebe payload de qualquer provider (W-API, Z-API, Cloud API)
// e roteia para o ticket apropriado via crm_route_inbound().

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let payload: any = {};
  try {
    payload = await req.json().catch(() => ({}));

    const provider = (payload?.provider || payload?.source || 'wapi').toString();

    await supabase.from('crm_webhook_logs').insert({ provider, payload });

    const fromRaw =
      payload?.phone || payload?.from || payload?.sender?.phone ||
      payload?.data?.from || payload?.message?.from || '';
    const text =
      payload?.message?.text || payload?.text || payload?.body ||
      payload?.data?.message?.text || payload?.data?.body || '';
    const messageId =
      payload?.messageId || payload?.id ||
      payload?.data?.messageId || payload?.message?.id || null;
    const instanceId = payload?.instanceId || payload?.instance_id || null;
    const mediaUrl =
      payload?.image?.url || payload?.media?.url || payload?.document?.url || null;
    const fromMe = Boolean(payload?.fromMe ?? payload?.message?.fromMe ?? payload?.data?.fromMe);

    if (fromMe) {
      return new Response(JSON.stringify({ ok: true, ignored: 'fromMe' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const digits = String(fromRaw).replace(/\D/g, '');
    if (digits.length < 8) {
      return new Response(JSON.stringify({ ok: true, ignored: 'no-phone' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: ticketId, error } = await supabase.rpc('crm_route_inbound', {
      _phone: digits,
      _body: text || '',
      _provider: provider,
      _message_id: messageId,
      _instance_id: instanceId,
      _media_url: mediaUrl,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, ticket_id: ticketId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('crm-inbound error', err);
    try {
      await supabase.from('crm_webhook_logs').insert({
        provider: 'unknown', payload, error: String(err),
      });
    } catch {}
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});