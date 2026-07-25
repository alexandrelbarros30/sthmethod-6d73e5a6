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
    if (provider === 'zapi' || provider === 'wapi' || provider === 'wapi_sucesso') {
      // provider='zapi' (canal Comercial) foi migrado para W-API, config em 'wapi_comercial'.
      const cfgKey = provider === 'zapi' ? 'wapi_comercial' : provider;
      const envPrefix = provider === 'zapi' ? 'WAPI_COMERCIAL' : (provider === 'wapi_sucesso' ? 'WAPI_SUCESSO' : 'WAPI');
      let { data: row } = await admin.from('crm_settings').select('value').eq('key', cfgKey).maybeSingle();
      if (provider === 'zapi' && !row?.value) {
        row = (await admin.from('crm_settings').select('value').eq('key', 'zapi').maybeSingle()).data;
      }
      const cfg: any = row?.value || {};
      const serverUrl = (cfg.server_url || '').trim() || 'https://api.w-api.app';
      const id = (cfg.instance_id || '').trim() || Deno.env.get(`${envPrefix}_INSTANCE_ID`) || '';
      const tok = (cfg.token || cfg.instance_token || '').trim() || Deno.env.get(`${envPrefix}_TOKEN`) || '';
      const client = (cfg.client_token || '').trim() || Deno.env.get(`${envPrefix}_CLIENT_TOKEN`) || '';
      if (!id || !tok) {
        return new Response(JSON.stringify({ ok: false, error: `Credenciais W-API (${cfgKey}) ausentes. Preencha Instance ID e Token e clique em Salvar.`, missing: { instance_id: !id, token: !tok } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
        message: ok ? `Instância W-API (${cfgKey}) conectada.` : null,
        source: cfg.token ? 'crm_settings' : 'env',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    return new Response(JSON.stringify({ ok: false, error: 'unknown provider' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
