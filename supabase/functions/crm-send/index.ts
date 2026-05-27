import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Envia mensagem outbound vinculada a um ticket do CRM.
// Escolhe o provider conforme o canal do ticket (fale_nutri => W-API, sth_one => Z-API).

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { ticket_id, message, image_url, document_url, document_name } = await req.json();
    if (!ticket_id || (!message && !image_url && !document_url)) {
      return new Response(JSON.stringify({ ok: false, error: 'ticket_id and message required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Valida usuário autenticado
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: ticket } = await supabase
      .from('crm_tickets')
      .select('id, channel, contact_id, status')
      .eq('id', ticket_id)
      .maybeSingle();
    if (!ticket) {
      return new Response(JSON.stringify({ ok: false, error: 'ticket not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: contact } = await supabase
      .from('crm_contacts').select('phone').eq('id', ticket.contact_id).maybeSingle();
    if (!contact?.phone) {
      return new Response(JSON.stringify({ ok: false, error: 'contact has no phone' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fnName = ticket.channel === 'fale_nutri' ? 'send-wapi' : 'send-whatsapp';
    const provider = ticket.channel === 'fale_nutri' ? 'wapi' : 'zapi';

    const sendResp = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/${fnName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({ phone: contact.phone, message, image_url, document_url, document_name }),
      },
    );
    const sendData = await sendResp.json().catch(() => ({}));

    await supabase.from('crm_ticket_messages').insert({
      ticket_id,
      direction: 'out',
      body: message || '',
      media_url: image_url || document_url || null,
      message_id: (sendData as any)?.messageId || null,
      phone: contact.phone,
      status: sendResp.ok ? 'sent' : 'failed',
      provider,
    });

    await supabase.from('crm_tickets')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', ticket_id);

    return new Response(JSON.stringify({ ok: sendResp.ok, data: sendData }), {
      status: sendResp.ok ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('crm-send error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});