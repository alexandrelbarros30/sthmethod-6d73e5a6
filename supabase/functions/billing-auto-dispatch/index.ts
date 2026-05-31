import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// LEGADO: encaminha para o serviço único `sth-automation-engine` (action: billing_tick).
// Mantido vivo para o botão "Disparar agora" do AdminBilling e crons antigos não quebrarem.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/sth-automation-engine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ action: 'billing_tick' }),
    });
    const data = await r.json().catch(() => ({}));
    return new Response(JSON.stringify({ ok: true, forwarded: true, engine: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
