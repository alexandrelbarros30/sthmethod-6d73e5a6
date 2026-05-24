import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INSTANCE_ID = Deno.env.get('ZAPI_INSTANCE_ID')!;
const INSTANCE_TOKEN = Deno.env.get('ZAPI_INSTANCE_TOKEN')!;
const CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN')!;

async function zapiDelete(phone: string, messageId: string): Promise<{ ok: boolean; status: number; data: any }> {
  const digits = String(phone).replace(/\D/g, '');
  const full = digits.startsWith('55') ? digits : `55${digits}`;
  const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}/messages`
    + `?phone=${encodeURIComponent(full)}&messageId=${encodeURIComponent(messageId)}&owner=true`;
  const resp = await fetch(url, { method: 'DELETE', headers: { 'Client-Token': CLIENT_TOKEN } });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Auth: only admin can trigger
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: userData } = await supabase.auth.getUser(auth);
    const userId = userData?.user?.id;
    if (!userId) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json().catch(() => ({}));
    const { campaign_id, run_id, message_ids } = body || {};

    let query = supabase.from('crm_campaign_messages')
      .select('id, recipient_phone, provider_message_id, status, deleted_at')
      .eq('status', 'sent')
      .is('deleted_at', null)
      .not('provider_message_id', 'is', null)
      .limit(2000);
    if (Array.isArray(message_ids) && message_ids.length) query = query.in('id', message_ids);
    else if (run_id) query = query.eq('run_id', run_id);
    else if (campaign_id) query = query.eq('campaign_id', campaign_id);
    else return new Response(JSON.stringify({ ok: false, error: 'campaign_id, run_id or message_ids required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: msgs, error } = await query;
    if (error) throw error;

    let deleted = 0, failed = 0;
    for (const m of msgs || []) {
      try {
        const res = await zapiDelete(m.recipient_phone, m.provider_message_id!);
        if (res.ok) {
          deleted++;
          await supabase.from('crm_campaign_messages').update({ deleted_at: new Date().toISOString() }).eq('id', m.id);
        } else {
          failed++;
          await supabase.from('crm_campaign_messages').update({ error: `delete_failed: ${JSON.stringify(res.data).slice(0, 300)}` }).eq('id', m.id);
        }
      } catch (e) {
        failed++;
        console.error('zapi delete error', e);
      }
      await new Promise((r) => setTimeout(r, 350));
    }

    return new Response(JSON.stringify({ ok: true, total: (msgs || []).length, deleted, failed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('whatsapp-delete-messages error', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});