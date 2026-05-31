import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// LEGADO: este webhook agora apenas encaminha para o serviço único `sth-automation-engine`.
// Mantido vivo para compatibilidade com configurações antigas na W-API.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const payload: any = await req.json().catch(() => ({}));
    const phone =
      payload?.phone || payload?.from || payload?.sender?.phone ||
      payload?.data?.from || payload?.message?.from || '';
    const text =
      payload?.message?.text || payload?.text || payload?.body ||
      payload?.data?.message?.text || payload?.data?.body || '';
    const fromMe = Boolean(payload?.fromMe ?? payload?.message?.fromMe ?? payload?.data?.fromMe);
    if (fromMe || String(phone).replace(/\D/g, '').length < 8) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // 1) Roteia para CRM (tickets + histórico)
    await fetch(`${SUPABASE_URL}/functions/v1/crm-inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
      body: JSON.stringify({ ...payload, provider: 'wapi' }),
    }).catch(() => {});
    // 2) Encaminha ao cérebro único
    const r = await fetch(`${SUPABASE_URL}/functions/v1/sth-automation-engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
      body: JSON.stringify({ action: 'inbound', phone, text }),
    });
    const data = await r.json().catch(() => ({}));
    return new Response(JSON.stringify({ ok: true, forwarded: true, engine: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
