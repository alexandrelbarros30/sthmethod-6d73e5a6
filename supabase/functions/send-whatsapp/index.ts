import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, message, image_url, document_url, document_name } = await req.json();
    if (!phone || !message) {
      return new Response(JSON.stringify({ ok: false, error: 'phone and message required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Kill-switch global: respeita o toggle "Ativo/Inativo" em CRM → Configurações.
    // Sem isso, automações legadas (notify-student-update, lembretes, fila, etc.)
    // disparam para múltiplos alunos assim que a Z-API fica conectada.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    // Opt-out: bloqueia se o aluno respondeu "CANCELAR ENVIO" ou foi marcado manualmente.
    try {
      const { data: optOut } = await admin.rpc('is_phone_opted_out', { _phone: String(phone) });
      if (optOut === true) {
        return new Response(JSON.stringify({
          ok: false, blocked: true, opt_out: true,
          error: 'Aluno optou por não receber mensagens (CANCELAR ENVIO). Envio bloqueado.',
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } catch (_) { /* não bloqueia em caso de falha do RPC */ }
    // Canal Comercial (linha 21998496289) migrado de Z-API para W-API.
    // Credenciais oficiais: crm_settings.key = 'wapi_comercial'.
    // Fallback legado: crm_settings.key = 'zapi' (para não quebrar deploys em transição).
    const { data: cfgRow } = await admin
      .from('crm_settings').select('value').eq('key', 'wapi_comercial').maybeSingle();
    let cfg: any = cfgRow?.value || {};
    if (!cfg?.instance_id && !cfg?.enabled) {
      const { data: legacy } = await admin
        .from('crm_settings').select('value').eq('key', 'zapi').maybeSingle();
      if (legacy?.value) cfg = legacy.value;
    }
    if (cfg.enabled !== true) {
      return new Response(JSON.stringify({
        ok: false,
        blocked: true,
        error: 'Canal Comercial (W-API) está INATIVO em CRM → Configurações. Envio bloqueado.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const SERVER_URL = ((cfg.server_url || '').trim() || 'https://api.w-api.app').replace(/\/$/, '');
    const INSTANCE_ID = (cfg.instance_id || '').trim() || Deno.env.get('WAPI_COMERCIAL_INSTANCE_ID');
    const TOKEN = (cfg.token || cfg.instance_token || '').trim() || Deno.env.get('WAPI_COMERCIAL_TOKEN');
    const CLIENT_TOKEN = (cfg.client_token || '').trim() || Deno.env.get('WAPI_COMERCIAL_CLIENT_TOKEN') || '';
    if (!INSTANCE_ID || !TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'Credenciais W-API Comercial ausentes.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizeWhatsappPhone = (value: unknown) => {
      const raw = String(value || '').trim();
      const digits = raw.replace(/\D/g, '');
      if (!digits) return '';
      if (raw.startsWith('+')) return digits;
      if (digits.startsWith('00') && digits.length > 11) return digits.slice(2);
      if (digits.startsWith('55')) return digits;
      if (digits.length > 11 && !digits.startsWith('0')) return digits;
      return `55${digits}`;
    };

    const fullPhone = normalizeWhatsappPhone(phone);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    };
    if (CLIENT_TOKEN) headers['Client-Token'] = CLIENT_TOKEN;

    let endpoint = `${SERVER_URL}/v1/message/send-text?instanceId=${INSTANCE_ID}`;
    let body: Record<string, unknown> = { phone: fullPhone, message };

    if (image_url) {
      endpoint = `${SERVER_URL}/v1/message/send-image?instanceId=${INSTANCE_ID}`;
      body = { phone: fullPhone, image: image_url, caption: message };
    } else if (document_url) {
      endpoint = `${SERVER_URL}/v1/message/send-document?instanceId=${INSTANCE_ID}`;
      const ext = (document_url.split('?')[0].split('.').pop() || 'pdf').toLowerCase();
      body = {
        phone: fullPhone,
        document: document_url,
        fileName: document_name || `documento.${ext}`,
        caption: message,
      };
    }

    const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || (data as any)?.error) {
      console.error('W-API Comercial error', resp.status, data);
      return new Response(JSON.stringify({ ok: false, status: resp.status, data, error: (data as any)?.error }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messageId = (data as any)?.messageId || (data as any)?.id || (data as any)?.idMessage || null;
    return new Response(JSON.stringify({ ok: true, data, messageId, phone: fullPhone }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-whatsapp error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});