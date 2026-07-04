import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Envia mensagens WhatsApp via Z-API (Comercial) ou W-API (Nutri).
// Credenciais vêm de public.crm_settings (configuradas pelo Admin).
// Fallback: secrets de ambiente (ZAPI_*, WAPI_*).
// Detecta provider a partir de conversation.provider/queue_type quando não informado.

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

    const { conversation_id, phone, body, image_url, document_url, document_name, provider: explicitProvider } = await req.json();
    if (!conversation_id || !phone || (!body && !image_url && !document_url)) {
      return new Response(JSON.stringify({ error: 'conversation_id, phone and body required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Política STH Method: WhatsApp NÃO envia imagens nem vídeos por nenhum canal.
    // Apenas texto e documentos (PDF, ex.: treinos) são permitidos. Fotos ficam
    // no sistema (sthmethod.com.br) para preservar prontuário e autorizações.
    const isVideoDoc = /\.(mp4|mov|avi|mkv|webm|m4v|3gp)(\?|$)/i.test(String(document_url || ''));
    if (image_url || isVideoDoc) {
      return new Response(JSON.stringify({
        ok: false,
        blocked: true,
        error: 'Envio de imagens e vídeos pelo WhatsApp está bloqueado. Compartilhe o link do sistema (sthmethod.com.br) com o aluno.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Resolve provider: explicit → conversation.provider → queue_type → default
    let provider = (explicitProvider || '').toLowerCase();
    if (!provider) {
      const { data: conv } = await admin.from('crm_conversations').select('provider, queue_type').eq('id', conversation_id).maybeSingle();
      provider = (conv?.provider as string) || (conv?.queue_type === 'comercial' || conv?.queue_type === 'financeiro' ? 'zapi' : 'wapi');
    }
    const source = provider === 'zapi' ? 'zapi' : (provider === 'wapi_sucesso' ? 'wapi_sucesso' : 'wapi');

    // Normaliza telefone BR
    const digits = String(phone).replace(/\D/g, '');
    const fullPhone = digits.startsWith('55') ? digits : `55${digits}`;

    // Carrega credenciais do banco (fallback para env)
    const cfgKey = provider === 'zapi' ? 'zapi' : (provider === 'wapi_sucesso' ? 'wapi_sucesso' : 'wapi');
    const { data: cfgRow } = await admin.from('crm_settings').select('value').eq('key', cfgKey).maybeSingle();
    const cfg: any = cfgRow?.value || {};
    if (cfg.enabled !== true) {
      return new Response(JSON.stringify({
        ok: false, blocked: true,
        error: `Canal ${provider.toUpperCase()} está INATIVO em CRM → Configurações.`,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let resp: Response;
    let sendData: any = {};
    if (provider === 'zapi') {
      const id = (cfg.instance_id || '').trim() || Deno.env.get('ZAPI_INSTANCE_ID');
      const tok = (cfg.instance_token || '').trim() || Deno.env.get('ZAPI_INSTANCE_TOKEN');
      const client = (cfg.client_token || '').trim() || Deno.env.get('ZAPI_CLIENT_TOKEN');
      if (!id || !tok || !client) {
        return new Response(JSON.stringify({ ok: false, error: 'Credenciais Z-API não configuradas em CRM → Configurações.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const base = `https://api.z-api.io/instances/${id}/token/${tok}`;
      const headers = { 'Content-Type': 'application/json', 'Client-Token': client };
      let endpoint = `${base}/send-text`;
      let payload: Record<string, unknown> = { phone: fullPhone, message: body };
      if (image_url) {
        endpoint = `${base}/send-image`;
        payload = { phone: fullPhone, image: image_url, caption: body || '' };
      } else if (document_url) {
        const ext = (document_url.split('?')[0].split('.').pop() || 'pdf').toLowerCase();
        endpoint = `${base}/send-document/${ext}`;
        payload = { phone: fullPhone, document: document_url, fileName: document_name || `documento.${ext}`, caption: body || '' };
      }
      resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
      sendData = await resp.json().catch(() => ({}));
    } else {
      const serverUrl = ((cfg.server_url || '').trim() || 'https://api.w-api.app').replace(/\/$/, '');
      const id = (cfg.instance_id || '').trim() || Deno.env.get('WAPI_INSTANCE_ID');
      const tok = (cfg.token || '').trim() || Deno.env.get('WAPI_TOKEN');
      const client = (cfg.client_token || '').trim() || Deno.env.get('WAPI_CLIENT_TOKEN');
      if (!id || !tok) {
        return new Response(JSON.stringify({ ok: false, error: 'Credenciais W-API não configuradas em CRM → Configurações.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` };
      if (client) headers['Client-Token'] = client;
      let endpoint = `${serverUrl}/v1/message/send-text?instanceId=${id}`;
      let payload: Record<string, unknown> = { phone: fullPhone, message: body };
      if (image_url) {
        endpoint = `${serverUrl}/v1/message/send-image?instanceId=${id}`;
        payload = { phone: fullPhone, image: image_url, caption: body || '' };
      } else if (document_url) {
        const ext = (document_url.split('?')[0].split('.').pop() || 'pdf').toLowerCase();
        endpoint = `${serverUrl}/v1/message/send-document?instanceId=${id}`;
        payload = { phone: fullPhone, document: document_url, fileName: document_name || `documento.${ext}`, caption: body || '' };
      }
      resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
      sendData = await resp.json().catch(() => ({}));
    }

    const status = resp.ok && !sendData?.error ? 'sent' : 'failed';
    const externalId = sendData?.messageId || sendData?.id || sendData?.zaapId || null;

    await admin.from('crm_messages').insert({
      conversation_id, direction: 'out', body,
      media_url: image_url || document_url || null,
      media_type: image_url ? 'image' : (document_url ? 'document' : null),
      sent_by: userId, source, status, external_id: externalId,
    });

    await admin.from('crm_conversations').update({
      human_handoff: true,
      assigned_to: userId,
      status: 'open',
      updated_at: new Date().toISOString()
    }).eq('id', conversation_id);

    return new Response(JSON.stringify({ ok: status === 'sent', status, provider, data: sendData, error: sendData?.error }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('crm-send-whatsapp', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});