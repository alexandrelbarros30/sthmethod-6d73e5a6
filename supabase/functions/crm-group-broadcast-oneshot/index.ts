import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Envio único (ad-hoc) para uma lista de grupos via Z-API.
// Body: { message: string, image_url?: string, group_ids: string[], text_first?: boolean }
// Retorna resultado por grupo. Não altera crm_group_broadcasts nem crm_settings.

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function normalizeGroupId(raw: string) {
  return String(raw || '').trim().replace(/@g\.us$/i, '').replace(/^[+]/, '');
}
async function sendZapi(base: string, clientToken: string, path: 'send-text' | 'send-image', body: Record<string, unknown>) {
  const resp = await fetch(`${base}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Token': clientToken },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok && !(data as any)?.error, status: resp.status, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { message, image_url, group_ids, text_first } = await req.json();
    const groups: string[] = Array.isArray(group_ids) ? group_ids.filter(Boolean) : [];
    if ((!message || String(message).trim().length === 0) && !image_url) {
      return new Response(JSON.stringify({ ok: false, error: 'message ou image_url obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (groups.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'group_ids vazio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: cfgRow } = await admin.from('crm_settings').select('value').eq('key', 'zapi').maybeSingle();
    const cfg: any = cfgRow?.value || {};
    if (cfg.enabled !== true) {
      return new Response(JSON.stringify({ ok: false, error: 'Z-API está INATIVO em CRM → Configurações.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const INSTANCE_ID = (cfg.instance_id || '').trim() || Deno.env.get('ZAPI_INSTANCE_ID');
    const INSTANCE_TOKEN = (cfg.instance_token || '').trim() || Deno.env.get('ZAPI_INSTANCE_TOKEN');
    const CLIENT_TOKEN = (cfg.client_token || '').trim() || Deno.env.get('ZAPI_CLIENT_TOKEN');
    if (!INSTANCE_ID || !INSTANCE_TOKEN || !CLIENT_TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'Credenciais Z-API ausentes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const base = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}`;

    const results: any[] = [];
    for (const raw of groups) {
      const phone = normalizeGroupId(raw);
      if (!phone) continue;
      const steps: any[] = [];
      try {
        if (image_url && !text_first) {
          // 1 envio: imagem com legenda (mais limpo no WhatsApp)
          steps.push({ kind: 'image+caption', ...(await sendZapi(base, CLIENT_TOKEN, 'send-image', { phone, image: image_url, caption: message || '' })) });
        } else {
          // texto primeiro, imagem depois (ou só texto se não tiver imagem)
          if (message && String(message).trim().length > 0) {
            steps.push({ kind: 'text', ...(await sendZapi(base, CLIENT_TOKEN, 'send-text', { phone, message })) });
          }
          if (image_url) {
            await sleep(700);
            steps.push({ kind: 'image', ...(await sendZapi(base, CLIENT_TOKEN, 'send-image', { phone, image: image_url, caption: '' })) });
          }
        }
      } catch (e: any) {
        steps.push({ kind: 'error', error: String(e?.message || e) });
      }
      results.push({ group: phone, steps });
      await sleep(1500);
    }

    // Auditoria simples
    try {
      await admin.from('automation_logs').insert({
        event_type: 'group_broadcast_oneshot',
        queue_type: 'comercial',
        action_taken: 'dispatched',
        severity: 'info',
        reason: 'Envio único em massa para grupos',
        metadata: { total_groups: groups.length, has_image: !!image_url, text_first: !!text_first, message_preview: String(message || '').slice(0, 120) },
      });
    } catch (_) { /* noop */ }

    return new Response(JSON.stringify({ ok: true, total: groups.length, results }, null, 2),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('crm-group-broadcast-oneshot error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});