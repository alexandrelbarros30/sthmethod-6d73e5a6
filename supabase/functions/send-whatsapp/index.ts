import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, message, image_url } = await req.json();
    if (!phone || !message) {
      return new Response(JSON.stringify({ ok: false, error: 'phone and message required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const INSTANCE_ID = Deno.env.get('ZAPI_INSTANCE_ID');
    const INSTANCE_TOKEN = Deno.env.get('ZAPI_INSTANCE_TOKEN');
    const CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN');
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
    }

    const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error('Z-API error', resp.status, data);
      return new Response(JSON.stringify({ ok: false, status: resp.status, data }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-whatsapp error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});