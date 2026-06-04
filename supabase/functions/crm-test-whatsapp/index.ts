import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Testa a conexão com Z-API ou W-API.
// Fonte de credenciais: tabela public.crm_settings (configurada pelo Admin na UI).
// Body: { provider: "zapi" | "wapi" | "wapi_sucesso" }

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

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { provider } = await req.json();
    if (provider === 'zapi') {
      const { data: row } = await admin.from('crm_settings').select('value').eq('key', 'zapi').maybeSingle();
      const cfg: any = row?.value || {};
      const id = (cfg.instance_id || '').trim() || Deno.env.get('ZAPI_INSTANCE_ID');
      const tok = (cfg.instance_token || '').trim() || Deno.env.get('ZAPI_INSTANCE_TOKEN');
      const client = (cfg.client_token || '').trim() || Deno.env.get('ZAPI_CLIENT_TOKEN');
      if (!id || !tok || !client) {
        return new Response(JSON.stringify({ ok: false, error: 'Credenciais Z-API ausentes. Preencha Instance ID, Instance Token e Client Token e clique em Salvar.', missing: { instance_id: !id, instance_token: !tok, client_token: !client } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const r = await fetch(`https://api.z-api.io/instances/${id}/token/${tok}/status`, { headers: { 'Client-Token': client } });
      const d = await r.json().catch(() => ({}));
      const dd: any = d || {};
      const benignErrors = ['you are already connected'];
      const errStr = typeof dd.error === 'string' ? dd.error.toLowerCase() : '';
      const isBenign = benignErrors.some((e: string) => errStr.includes(e));
      const ok = r.ok && (dd.connected === true || isBenign) && !(errStr && !isBenign);
      return new Response(JSON.stringify({
        ok,
        status: r.status,
        data: d,
        error: ok ? null : (dd.error || null),
        message: ok ? (dd.smartphoneConnected ? 'Instância conectada e celular pareado.' : 'Instância conectada.') : null,
        source: cfg.client_token ? 'crm_settings' : 'env',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (provider === 'wapi' || provider === 'wapi_sucesso') {
      const { data: row } = await admin.from('crm_settings').select('value').eq('key', provider).maybeSingle();
      const cfg: any = row?.value || {};
      const serverUrl = (cfg.server_url || '').trim() || 'https://api.w-api.app';
      const id = (cfg.instance_id || '').trim() || (provider === 'wapi' ? Deno.env.get('WAPI_INSTANCE_ID') : '');
      const tok = (cfg.token || '').trim() || (provider === 'wapi' ? Deno.env.get('WAPI_TOKEN') : '');
      const client = (cfg.client_token || '').trim() || (provider === 'wapi' ? Deno.env.get('WAPI_CLIENT_TOKEN') : '');
      if (!id || !tok) {
        return new Response(JSON.stringify({ ok: false, error: `Credenciais ${provider.toUpperCase()} ausentes. Preencha Instance ID e Token e clique em Salvar.`, missing: { instance_id: !id, token: !tok } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const headers: Record<string, string> = { Authorization: `Bearer ${tok}` };
      if (client) headers['Client-Token'] = client;
      const r = await fetch(`${serverUrl.replace(/\/$/, '')}/v1/instance/status-instance?instanceId=${id}`, { headers });
      const d = await r.json().catch(() => ({}));
      const dd: any = d || {};
      const ok = r.ok && (dd.connected === true) && !dd.error;
      return new Response(JSON.stringify({
        ok,
        status: r.status,
        data: d,
        error: ok ? null : (dd.error || null),
        message: ok ? `Instância ${provider.toUpperCase()} conectada.` : null,
        source: cfg.token ? 'crm_settings' : 'env',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    return new Response(JSON.stringify({ ok: false, error: 'unknown provider' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
