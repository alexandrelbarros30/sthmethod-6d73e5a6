import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// W-API integration — linha secundária "Fale com o Nutri" (5521998984153)
// Docs: https://w-api.app/ — endpoints em https://api.w-api.app/v1

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, message, image_url, document_url, document_name } = await req.json();
    if (!phone || (!message && !image_url && !document_url)) {
      return new Response(JSON.stringify({ ok: false, error: 'phone and message (or media) required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Kill-switch global: respeita o toggle "Ativo/Inativo" em CRM → Configurações.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: cfgRow } = await admin
      .from('crm_settings').select('value').eq('key', 'wapi').maybeSingle();
    const cfg: any = cfgRow?.value || {};
    if (cfg.enabled !== true) {
      return new Response(JSON.stringify({
        ok: false,
        blocked: true,
        error: 'Canal W-API está INATIVO em CRM → Configurações. Envio bloqueado.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const INSTANCE_ID = (cfg.instance_id || '').trim() || Deno.env.get('WAPI_INSTANCE_ID');
    const TOKEN = (cfg.token || '').trim() || Deno.env.get('WAPI_TOKEN');
    const CLIENT_TOKEN = (cfg.client_token || '').trim() || Deno.env.get('WAPI_CLIENT_TOKEN');
    if (!INSTANCE_ID || !TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'W-API credentials missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const digits = String(phone).replace(/\D/g, '');
    const fullPhone = digits.startsWith('55') ? digits : `55${digits}`;

    const base = `https://api.w-api.app/v1/message`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    };
    if (CLIENT_TOKEN) headers['Client-Token'] = CLIENT_TOKEN;

    let endpoint = `${base}/send-text?instanceId=${INSTANCE_ID}`;
    let body: Record<string, unknown> = { phone: fullPhone, message };

    if (image_url) {
      endpoint = `${base}/send-image?instanceId=${INSTANCE_ID}`;
      body = { phone: fullPhone, image: image_url, caption: message ?? '' };
    } else if (document_url) {
      const ext = (document_url.split('?')[0].split('.').pop() || 'pdf').toLowerCase();
      endpoint = `${base}/send-document?instanceId=${INSTANCE_ID}`;
      body = {
        phone: fullPhone,
        document: document_url,
        fileName: document_name || `documento.${ext}`,
        caption: message ?? '',
      };
    }

    const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error('W-API error', resp.status, data);
      return new Response(JSON.stringify({ ok: false, status: resp.status, data, channel: 'wapi' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messageId = (data as any)?.messageId || (data as any)?.id || (data as any)?.zaapId || null;
    return new Response(JSON.stringify({ ok: true, data, messageId, phone: fullPhone, channel: 'wapi' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-wapi error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});