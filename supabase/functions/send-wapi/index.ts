import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// W-API integration — linha secundária "Fale com o Nutri" (5521998984153)
// Docs: https://w-api.app/ — endpoints em https://api.w-api.app/v1

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, message, image_url, document_url, document_name, buttons, list } = await req.json();
    if (!phone || (!message && !image_url && !document_url)) {
      return new Response(JSON.stringify({ ok: false, error: 'phone and message (or media) required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Kill-switch global: respeita o toggle "Ativo/Inativo" em CRM → Configurações.
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
    const { data: cfgRow } = await admin
      .from('crm_settings').select('value').eq('key', 'wapi').maybeSingle();
    const cfg: any = cfgRow?.value || {};
    if (cfg.enabled !== true) {
      return new Response(JSON.stringify({
        ok: false,
        blocked: true,
        error: 'Canal W-API está INATIVO em CRM → Configurações. Envio bloqueado.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const INSTANCE_ID = (cfg.instance_id || '').trim() || Deno.env.get('WAPI_INSTANCE_ID');
    const TOKEN = (cfg.token || '').trim() || Deno.env.get('WAPI_TOKEN');
    const CLIENT_TOKEN = (cfg.client_token || '').trim() || Deno.env.get('WAPI_CLIENT_TOKEN');
    if (!INSTANCE_ID || !TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'W-API credentials missing' }), {
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

    const serverUrl = ((cfg.server_url || '').trim() || 'https://api.w-api.app').replace(/\/$/, '');
    const statusHeaders: Record<string, string> = {
      Authorization: `Bearer ${TOKEN}`,
    };
    if (CLIENT_TOKEN) statusHeaders['Client-Token'] = CLIENT_TOKEN;
    const statusResp = await fetch(`${serverUrl}/v1/instance/status-instance?instanceId=${INSTANCE_ID}`, { headers: statusHeaders });
    const statusData = await statusResp.json().catch(() => ({}));
    const statusOk = statusResp.ok && (statusData as any)?.connected === true && !(statusData as any)?.error;
    if (!statusOk) {
      return new Response(JSON.stringify({ ok: false, error: 'Instância W-API não conectada', status: statusData }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const base = `${serverUrl}/v1/message`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    };
    if (CLIENT_TOKEN) headers['Client-Token'] = CLIENT_TOKEN;

    let endpoint = `${base}/send-text?instanceId=${INSTANCE_ID}`;
    let body: Record<string, unknown> = { phone: fullPhone, message };

    if (buttons) {
      endpoint = `${base}/send-button-list?instanceId=${INSTANCE_ID}`;
      body = {
        phone: fullPhone,
        message: message || '',
        buttons: buttons, // [{id: '1', label: 'Opção'}]
      };
    } else if (list) {
      endpoint = `${base}/send-option-list?instanceId=${INSTANCE_ID}`;
      body = {
        phone: fullPhone,
        title: list.title || 'Selecione uma opção',
        message: message || '',
        buttonLabel: list.buttonLabel || 'Ver Opções',
        sections: list.sections, // [{title: 'Opções', rows: [{id: '1', title: 'Opção'}]}]
      };
    } else if (image_url) {
      endpoint = `${base}/send-image?instanceId=${INSTANCE_ID}`;
      body = { phone: fullPhone, image: image_url, caption: message ?? '' };
    } else if (document_url) {
      const ext = (document_url.split('?')[0].split('.').pop() || 'pdf').toLowerCase();
      endpoint = `${base}/send-document?instanceId=${INSTANCE_ID}`;
      body = {
        phone: fullPhone,
        document: document_url,
        fileName: document_name || `documento.${ext}`,
        caption: message ?? '',
      };
    }

    const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error('W-API error', resp.status, data);
      return new Response(JSON.stringify({ ok: false, status: resp.status, data, channel: 'wapi' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messageId = (data as any)?.messageId || (data as any)?.id || (data as any)?.zaapId || null;
    return new Response(JSON.stringify({ ok: true, data, messageId, phone: fullPhone, channel: 'wapi' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-wapi error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});