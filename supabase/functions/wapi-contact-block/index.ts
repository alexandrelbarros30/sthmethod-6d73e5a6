import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// wapi-contact-block — bloqueia/desbloqueia contato no WhatsApp da linha
// "Fale com o Nutri" via W-API. Endpoint documentado:
// POST https://api.w-api.app/v1/contacts/block-contact?instanceId={ID}
// body: { "phoneNumber": "55...", "value": true|false }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, action, reason, metadata } = await req.json();
    if (!phone || !['block', 'unblock'].includes(action)) {
      return new Response(JSON.stringify({ ok: false, error: 'phone and action=block|unblock required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: cfgRow } = await admin
      .from('crm_settings').select('value').eq('key', 'wapi').maybeSingle();
    const cfg: any = cfgRow?.value || {};

    const INSTANCE_ID = (cfg.instance_id || '').trim() || Deno.env.get('WAPI_INSTANCE_ID');
    const TOKEN = (cfg.token || '').trim() || Deno.env.get('WAPI_TOKEN');
    const CLIENT_TOKEN = (cfg.client_token || '').trim() || Deno.env.get('WAPI_CLIENT_TOKEN');
    if (!INSTANCE_ID || !TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'W-API credentials missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizeWhatsappPhone = (value: unknown) => {
      const raw = String(value || '').trim();
      const digits = raw.replace(/\D/g, '');
      if (!digits) return '';
      if (raw.startsWith('+')) return digits;
      if (digits.startsWith('00') && digits.length > 11) return digits.slice(2);
      if (digits.startsWith('55')) return digits;
      if (digits.length > 11 && !digits.startsWith('0')) return digits;
      return `55${digits}`;
    };

    const fullPhone = normalizeWhatsappPhone(phone);
    const serverUrl = ((cfg.server_url || '').trim() || 'https://api.w-api.app').replace(/\/$/, '');
    const value = action === 'block';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    };
    if (CLIENT_TOKEN) headers['Client-Token'] = CLIENT_TOKEN;

    const endpoint = `${serverUrl}/v1/contacts/block-contact?instanceId=${INSTANCE_ID}`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phoneNumber: fullPhone, value }),
    });
    const data = await resp.json().catch(() => ({}));
    const ok = resp.ok && !(data as any)?.error;

    // Auditoria detalhada
    try {
      await admin.from('automation_logs').insert({
        contact_phone: fullPhone,
        event_type: value ? 'wapi_contact_blocked' : 'wapi_contact_unblocked',
        queue_type: 'nutri',
        action_taken: ok ? (value ? 'blocked_wapi' : 'unblocked_wapi') : 'wapi_block_failed',
        severity: ok ? 'info' : 'warning',
        reason: reason || (value ? 'nutri_channel_active_only' : 'contact_reactivated'),
        metadata: {
          ...(metadata || {}),
          wapi_response: data,
          http_status: resp.status,
        },
      });
    } catch (e) {
      console.error('wapi-contact-block: audit log failed', e);
    }

    return new Response(JSON.stringify({ ok, action, phone: fullPhone, data, status: resp.status }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('wapi-contact-block error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
