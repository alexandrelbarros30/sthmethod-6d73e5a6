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
    const { data: cfgRow } = await admin
      .from('crm_settings').select('value').eq('key', 'zapi').maybeSingle();
    const cfg: any = cfgRow?.value || {};
    if (cfg.enabled !== true) {
      return new Response(JSON.stringify({
        ok: false,
        blocked: true,
        error: 'Canal Z-API está INATIVO em CRM → Configurações. Envio bloqueado.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const INSTANCE_ID = (cfg.instance_id || '').trim() || Deno.env.get('ZAPI_INSTANCE_ID');
    const INSTANCE_TOKEN = (cfg.instance_token || '').trim() || Deno.env.get('ZAPI_INSTANCE_TOKEN');
    const CLIENT_TOKEN = (cfg.client_token || '').trim() || Deno.env.get('ZAPI_CLIENT_TOKEN');
    if (!INSTANCE_ID || !INSTANCE_TOKEN || !CLIENT_TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'Z-API credentials missing' }), {
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

    const base = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}`;
    const statusResp = await fetch(`${base}/status`, { headers: { 'Client-Token': CLIENT_TOKEN } });
    const statusData = await statusResp.json().catch(() => ({}));
    const statusErr = typeof (statusData as any)?.error === 'string' ? (statusData as any).error.toLowerCase() : '';
    const statusOk = statusResp.ok && (((statusData as any)?.connected === true) || statusErr.includes('you are already connected'));
    if (!statusOk) {
      return new Response(JSON.stringify({ ok: false, error: 'Instância Z-API não conectada', status: statusData }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const headers = {
      'Content-Type': 'application/json',
      'Client-Token': CLIENT_TOKEN,
    };

    let endpoint = `${base}/send-text`;
    let body: Record<string, unknown> = { phone: fullPhone, message };

    if (image_url) {
      endpoint = `${base}/send-image`;
      body = { phone: fullPhone, image: image_url, caption: message };
    } else if (document_url) {
      // Z-API: /send-document/{extension}
      const ext = (document_url.split('?')[0].split('.').pop() || 'pdf').toLowerCase();
      endpoint = `${base}/send-document/${ext}`;
      body = {
        phone: fullPhone,
        document: document_url,
        fileName: document_name || `documento.${ext}`,
        caption: message,
      };
    }

    const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error('Z-API error', resp.status, data);
      return new Response(JSON.stringify({ ok: false, status: resp.status, data }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Z-API returns: { zaapId, messageId, id } depending on endpoint
    const messageId = (data as any)?.messageId || (data as any)?.id || (data as any)?.zaapId || null;
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