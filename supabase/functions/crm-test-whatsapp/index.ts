import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Testa a conexão com Z-API ou W-API usando os secrets atuais.
// Body: { provider: "zapi" | "wapi" }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: auth } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (!auth?.claims) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { provider } = await req.json();
    if (provider === 'zapi') {
      const id = Deno.env.get('ZAPI_INSTANCE_ID');
      const tok = Deno.env.get('ZAPI_INSTANCE_TOKEN');
      const client = Deno.env.get('ZAPI_CLIENT_TOKEN');
      if (!id || !tok || !client) {
        return new Response(JSON.stringify({ ok: false, error: 'Z-API credentials missing', missing: { id: !id, token: !tok, client: !client } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const r = await fetch(`https://api.z-api.io/instances/${id}/token/${tok}/status`, { headers: { 'Client-Token': client } });
      const d = await r.json().catch(() => ({}));
      return new Response(JSON.stringify({ ok: r.ok, status: r.status, data: d }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (provider === 'wapi') {
      const id = Deno.env.get('WAPI_INSTANCE_ID');
      const tok = Deno.env.get('WAPI_TOKEN');
      const client = Deno.env.get('WAPI_CLIENT_TOKEN');
      if (!id || !tok) {
        return new Response(JSON.stringify({ ok: false, error: 'W-API credentials missing', missing: { id: !id, token: !tok } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const headers: Record<string,string> = { Authorization: `Bearer ${tok}` };
      if (client) headers['Client-Token'] = client;
      const r = await fetch(`https://api.w-api.app/v1/instance/status-instance?instanceId=${id}`, { headers });
      const d = await r.json().catch(() => ({}));
      return new Response(JSON.stringify({ ok: r.ok, status: r.status, data: d }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ ok: false, error: 'unknown provider' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});