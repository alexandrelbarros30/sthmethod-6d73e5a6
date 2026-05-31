import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// LEGADO: este webhook agora apenas encaminha para o serviço único `sth-automation-engine`.
// Mantido vivo para compatibilidade com configurações antigas na W-API.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const payload: any = await req.json().catch(() => ({}));
    const r = await fetch(`${SUPABASE_URL}/functions/v1/crm-inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
      body: JSON.stringify({ ...payload, provider: payload?.provider || payload?.source || 'zapi' }),
    });
    const data = await r.json().catch(() => ({}));
    return new Response(JSON.stringify({ ok: r.ok, forwarded: true, engine: data }), {
      status: r.ok ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
