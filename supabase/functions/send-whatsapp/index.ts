import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, message, image_url, document_url, document_name } = await req.json();
    if (!phone || !message) {
      return new Response(JSON.stringify({ ok: false, error: 'phone and message required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Kill-switch global: respeita o toggle "Ativo/Inativo" em CRM → Configurações.
    // Sem isso, automações legadas (notify-student-update, lembretes, fila, etc.)
    // disparam para múltiplos alunos assim que a Z-API fica conectada.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: cfgRow } = await admin
      .from('crm_settings').select('value').eq('key', 'zapi').maybeSingle();
    const cfg: any = cfgRow?.value || {};
    if (cfg.enabled !== true) {
      return new Response(JSON.stringify({
        ok: false,
        blocked: true,
        error: 'Canal Z-API está INATIVO em CRM → Configurações. Envio bloqueado.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const INSTANCE_ID = (cfg.instance_id || '').trim() || Deno.env.get('ZAPI_INSTANCE_ID');
    const INSTANCE_TOKEN = (cfg.instance_token || '').trim() || Deno.env.get('ZAPI_INSTANCE_TOKEN');
    const CLIENT_TOKEN = (cfg.client_token || '').trim() || Deno.env.get('ZAPI_CLIENT_TOKEN');
    if (!INSTANCE_ID || !INSTANCE_TOKEN || !CLIENT_TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'Z-API credentials missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize BR phone: ensure 55 prefix, digits only
    const digits = String(phone).replace(/\D/g, '');
    const fullPhone = digits.startsWith('55') ? digits : `55${digits}`;

    const base = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}`;
    const headers = {
      'Content-Type': 'application/json',
      'Client-Token': CLIENT_TOKEN,
    };

    let endpoint = `${base}/send-text`;
    let body: Record<string, unknown> = { phone: fullPhone, message };

    if (image_url) {
      endpoint = `${base}/send-image`;
      body = { phone: fullPhone, image: image_url, caption: message };
    } else if (document_url) {
      // Z-API: /send-document/{extension}
      const ext = (document_url.split('?')[0].split('.').pop() || 'pdf').toLowerCase();
      endpoint = `${base}/send-document/${ext}`;
      body = {
        phone: fullPhone,
        document: document_url,
        fileName: document_name || `documento.${ext}`,
        caption: message,
      };
    }

    const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error('Z-API error', resp.status, data);
      return new Response(JSON.stringify({ ok: false, status: resp.status, data }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Z-API returns: { zaapId, messageId, id } depending on endpoint
    const messageId = (data as any)?.messageId || (data as any)?.id || (data as any)?.zaapId || null;
    return new Response(JSON.stringify({ ok: true, data, messageId, phone: fullPhone }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-whatsapp error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});