import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Roda a cada 1 min via pg_cron.
// Para todos os canais (Z-API e W-API):
//  - 5 min após a última msg do bot sem resposta → envia 1º aviso.
//  - 5 min depois (10 min total) → envia encerramento e fecha sessão.
// Suspenso quando human_handoff = true.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const sendViaCrm = async (phone: string, body: string, conversation_id: string, provider: string) => {
    try {
      const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-send-whatsapp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({ phone, body, conversation_id, provider }),
      });
      const data = await r.json().catch(() => ({}));
      return { ok: r.ok && data?.ok, error: data?.error };
    } catch (e) {
      console.error('inactivity send failed', provider, e);
      return { ok: false, error: String(e) };
    }
  };

  const now = Date.now();
  const FIVE_MIN = 5 * 60 * 1000;

  // Conversas elegíveis: bot já respondeu, está ativo, sem handoff
  const { data: convs } = await admin
    .from('crm_conversations')
    .select('id, phone, display_name, last_bot_message_at, inactivity_warned_at, flow_state, status, provider')
    .eq('status', 'open')
    .eq('human_handoff', false)
    .is('assigned_to', null)
    .not('last_bot_message_at', 'is', null)
    .limit(500);

  let warned = 0;
  let closed = 0;

  for (const c of convs || []) {
    if (!c.last_bot_message_at) continue;
    const lastBot = new Date(c.last_bot_message_at).getTime();
    const sinceBot = now - lastBot;

    // Confere se houve mensagem do cliente após a última do bot
    const { data: latestIn } = await admin
      .from('crm_messages')
      .select('created_at')
      .eq('conversation_id', c.id)
      .eq('direction', 'in')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastIn = latestIn?.created_at ? new Date(latestIn.created_at).getTime() : 0;
    if (lastIn > lastBot) continue; // cliente já respondeu

    const firstName = String(c.display_name || '').split(' ')[0] || '';
    const nomeSep = firstName ? ' ' : '';

    if (!c.inactivity_warned_at && sinceBot >= FIVE_MIN) {
      const msg = `Olá${nomeSep}${firstName}.\n\nPercebi que você não respondeu à nossa última mensagem.\n\nSe ainda precisar de ajuda, basta responder esta conversa. 🙂`;
      const { ok } = await sendViaCrm(c.phone, msg, c.id, c.provider || 'zapi');
      
      if (ok) {
        await admin.from('crm_conversations').update({
          inactivity_warned_at: new Date().toISOString(),
          last_bot_message_at: new Date().toISOString(),
        }).eq('id', c.id);
        warned++;
      }
    } else if (c.inactivity_warned_at) {
      const sinceWarn = now - new Date(c.inactivity_warned_at).getTime();
      if (sinceWarn >= FIVE_MIN) {
        // Encerramento silencioso: o fluxo de atendimento já cuida da comunicação.
        await admin.from('crm_conversations').update({
          status: 'closed',
          flow_state: null,
          flow_context: {},
          inactivity_warned_at: null,
          last_bot_message_at: null,
          session_started_at: null,
          session_expires_at: null,
        }).eq('id', c.id);
        closed++;
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, warned, closed, checked: convs?.length || 0 }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
