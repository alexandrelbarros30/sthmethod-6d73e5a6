import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: auth } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (!auth?.claims) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const userId = auth.claims.sub;

    const { conversation_id, phone, body, image_url } = await req.json();
    if (!conversation_id || !phone || (!body && !image_url)) {
      return new Response(JSON.stringify({ error: 'conversation_id, phone and body required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // call existing send-wapi function
    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-wapi`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({ phone, message: body, image_url }),
    });
    const sendData = await resp.json().catch(() => ({}));
    const status = resp.ok ? 'sent' : 'failed';
    const externalId = (sendData as any)?.messageId || null;

    // Use service role for DB write to bypass RLS-safe insert (already authenticated)
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await admin.from('crm_messages').insert({
      conversation_id, direction: 'out', body, media_url: image_url || null,
      sent_by: userId, source: 'manual', status, external_id: externalId,
    });

    return new Response(JSON.stringify({ ok: resp.ok, status, data: sendData }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('crm-send-whatsapp', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});