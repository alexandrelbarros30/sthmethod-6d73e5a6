import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Webhook unificado: recebe payload de qualquer provider (W-API, Z-API, Cloud API)
// e roteia para o ticket apropriado via crm_route_inbound().

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

type AnyRec = Record<string, any>;

function textFromCandidate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = textFromCandidate(item);
      if (text) return text;
    }
    return '';
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const candidates = [
      obj.body,
      obj.message,
      obj.text,
      obj.caption,
      obj.content,
      obj.title,
      obj.description,
      (obj.interactive as AnyRec | undefined)?.button_reply?.title,
      (obj.interactive as AnyRec | undefined)?.list_reply?.title,
    ];
    for (const candidate of candidates) {
      const text = textFromCandidate(candidate);
      if (text) return text;
    }
  }
  return '';
}

function extractInboundText(payload: AnyRec): string {
  const candidates = [
    payload?.text,
    payload?.body,
    payload?.message?.text,
    payload?.message?.body,
    payload?.message?.message,
    payload?.data?.message?.text,
    payload?.data?.message?.body,
    payload?.data?.body,
    payload?.messages?.[0]?.text?.body,
    payload?.messages?.[0]?.text,
    payload?.messages?.[0]?.body,
    payload?.messages?.[0]?.caption,
    payload?.messages?.[0]?.interactive?.button_reply?.title,
    payload?.messages?.[0]?.interactive?.list_reply?.title,
  ];

  for (const candidate of candidates) {
    const text = textFromCandidate(candidate);
    if (text) return text;
  }

  return '';
}

function extractPhone(payload: AnyRec): string {
  const candidates = [
    payload?.participantPhone,
    payload?.sender?.phone,
    payload?.phone,
    payload?.from,
    payload?.data?.from,
    payload?.message?.from,
  ];

  for (const candidate of candidates) {
    const digits = String(candidate || '').replace(/\D/g, '');
    if (digits.length >= 8) return digits;
  }

  return '';
}

function detectIgnoredReason(payload: AnyRec): string | null {
  const fromMe = Boolean(payload?.fromMe ?? payload?.message?.fromMe ?? payload?.data?.fromMe);
  if (fromMe) return 'fromMe';
  if (Boolean(payload?.isGroup ?? payload?.message?.isGroup ?? payload?.data?.isGroup)) return 'group';
  if (Boolean(payload?.isNewsletter)) return 'newsletter';
  if (Boolean(payload?.isStatusReply)) return 'status-reply';
  if (payload?.reaction || /reaction/i.test(String(payload?.type || payload?.message?.type || ''))) return 'reaction';
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    SUPABASE_URL,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let payload: any = {};
  try {
    payload = await req.json().catch(() => ({}));

    const provider = (payload?.provider || payload?.source || 'wapi').toString();

    await supabase.from('crm_webhook_logs').insert({ provider, payload });

    const ignoredReason = detectIgnoredReason(payload);
    if (ignoredReason) {
      return new Response(JSON.stringify({ ok: true, ignored: ignoredReason }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const digits = extractPhone(payload);
    const text = extractInboundText(payload);
    const messageId =
      payload?.messageId || payload?.id ||
      payload?.data?.messageId || payload?.message?.id || null;
    const instanceId = payload?.instanceId || payload?.instance_id || null;
    const mediaUrl =
      payload?.image?.url || payload?.media?.url || payload?.document?.url || null;
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

    let automation: AnyRec | null = null;
    try {
      const automationRes = await fetch(`${SUPABASE_URL}/functions/v1/sth-automation-engine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          action: 'inbound',
          phone: digits,
          text,
          provider,
          messageId,
          instanceId,
          mediaUrl,
        }),
      });
      automation = await automationRes.json().catch(() => ({ ok: automationRes.ok }));
    } catch (automationErr) {
      console.error('crm-inbound automation error', automationErr);
    }

    return new Response(JSON.stringify({ ok: true, ticket_id: ticketId, automation }), {
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