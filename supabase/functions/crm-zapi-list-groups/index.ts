import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: cfgRow } = await admin.from('crm_settings').select('value').eq('key', 'zapi').maybeSingle();
    const cfg: any = cfgRow?.value || {};
    const INSTANCE_ID = (cfg.instance_id || '').trim() || Deno.env.get('ZAPI_INSTANCE_ID');
    const INSTANCE_TOKEN = (cfg.instance_token || '').trim() || Deno.env.get('ZAPI_INSTANCE_TOKEN');
    const CLIENT_TOKEN = (cfg.client_token || '').trim() || Deno.env.get('ZAPI_CLIENT_TOKEN');
    if (!INSTANCE_ID || !INSTANCE_TOKEN || !CLIENT_TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'Z-API credentials missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const base = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}`;
    const headers = { 'Client-Token': CLIENT_TOKEN };

    // Pagina /chats até encontrar todos os grupos.
    const groups: { id: string; name: string; image?: string | null }[] = [];
    const seen = new Set<string>();
    for (let page = 1; page <= 20; page++) {
      const url = `${base}/chats?page=${page}&pageSize=100`;
      const resp = await fetch(url, { headers });
      if (!resp.ok) {
        const text = await resp.text();
        return new Response(JSON.stringify({ ok: false, error: 'Z-API error', status: resp.status, body: text }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const data = await resp.json().catch(() => []);
      if (!Array.isArray(data) || data.length === 0) break;
      for (const c of data) {
        const isGroup = c?.isGroup === true || String(c?.phone || '').includes('-') || String(c?.id || '').endsWith('@g.us');
        if (!isGroup) continue;
        const id = String(c?.phone || c?.id || '').replace(/@g\.us$/i, '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        groups.push({ id, name: c?.name || c?.unreadName || '(sem nome)', image: c?.imageUrl ?? null });
      }
      if (data.length < 100) break;
    }

    groups.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return new Response(JSON.stringify({ ok: true, count: groups.length, groups }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});