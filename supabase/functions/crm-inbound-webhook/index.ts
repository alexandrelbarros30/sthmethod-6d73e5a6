import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Public webhook (no JWT). Validates a shared secret in header or query.

function normalizePhone(raw: string): string {
  let d = String(raw || '').replace(/\D+/g, '').replace(/^0+/, '');
  if (d.length >= 12 && d.startsWith('55')) return d;
  if (d.length === 10 || d.length === 11) return '55' + d;
  return d;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const expectedSecret = Deno.env.get('MP_WEBHOOK_SECRET') || '';
    const url = new URL(req.url);
    const provided = req.headers.get('x-webhook-secret') || url.searchParams.get('secret') || '';
    if (expectedSecret && provided !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'invalid secret' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = await req.json().catch(() => ({}));
    // Try common shapes from WhatsApp providers (W-API / Z-API / Evolution)
    const phoneRaw = (payload as any)?.phone || (payload as any)?.from || (payload as any)?.data?.from || (payload as any)?.message?.from || '';
    const body = (payload as any)?.message || (payload as any)?.text || (payload as any)?.body || (payload as any)?.data?.message?.text || '';
    const externalId = (payload as any)?.messageId || (payload as any)?.id || null;
    const name = (payload as any)?.senderName || (payload as any)?.pushName || null;

    const phone = normalizePhone(phoneRaw);
    if (!phone || !body) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // upsert conversation
    let { data: conv } = await admin.from('crm_conversations').select('id').eq('phone', phone).maybeSingle();
    if (!conv) {
      const ins = await admin.from('crm_conversations')
        .insert({ phone, display_name: name, channel: 'whatsapp', status: 'open' })
        .select('id').single();
      conv = ins.data;
    } else if (name) {
      await admin.from('crm_conversations').update({ display_name: name }).eq('id', conv.id);
    }

    await admin.from('crm_messages').insert({
      conversation_id: conv!.id, direction: 'in', body: String(body),
      source: 'whatsapp', external_id: externalId, status: 'received',
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('crm-inbound-webhook', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});