import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Pausa a IA por N segundos enquanto o atendente humano está digitando.
// Reinicia o cronômetro a cada chamada. Não envia mensagem nenhuma aqui.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims } = await userClient.auth.getClaims(auth.replace('Bearer ', ''));
    const uid = claims?.claims?.sub as string | undefined;
    if (!uid) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Garante que é staff do CRM (admin/consultor/assistente/financeiro)
    const { data: isStaff } = await admin.rpc('is_crm_staff', { _user_id: uid });
    if (!isStaff) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { conversation_id, seconds } = await req.json();
    if (!conversation_id) return new Response(JSON.stringify({ error: 'conversation_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const secs = Math.min(Math.max(Number(seconds) || 300, 30), 1800); // entre 30s e 30min, default 5min
    const until = new Date(Date.now() + secs * 1000).toISOString();

    const { error } = await admin
      .from('crm_conversations')
      .update({ ai_paused_until: until })
      .eq('id', conversation_id);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, ai_paused_until: until }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('crm-typing-lock', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
