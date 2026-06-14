import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface Broadcast {
  id: string;
  key: string;
  label: string;
  weekday: number;
  hour_brt: number;
  message_body: string;
  image_urls: string[];
  text_first: boolean;
  group_ids: string[];
  active: boolean;
  last_sent_at: string | null;
}

function nowBRT() {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short', hour: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const wdMap: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  const wd = wdMap[parts.find(p => p.type === 'weekday')?.value ?? 'Sun'] ?? 0;
  const hh = Number(parts.find(p => p.type === 'hour')?.value ?? '0');
  return { weekday: wd, hour: hh };
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function normalizeGroupId(raw: string) {
  // Aceita "12036xxx@g.us" ou "12036xxx" — Z-API espera apenas a parte antes do @g.us.
  return raw.trim().replace(/@g\.us$/i, '').replace(/^[+]/, '');
}

async function sendZapi(base: string, clientToken: string, path: 'send-text' | 'send-image', body: Record<string, unknown>) {
  const resp = await fetch(`${base}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Token': clientToken },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  let force_id: string | null = null;
  let dry_run = false;
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (body?.force_id) force_id = String(body.force_id);
      if (body?.dry_run) dry_run = true;
    } catch {}
  }

  // Z-API kill-switch + credenciais.
  const { data: cfgRow } = await admin.from('crm_settings').select('value').eq('key', 'zapi').maybeSingle();
  const cfg: any = cfgRow?.value || {};
  if (cfg.enabled !== true && !dry_run) {
    return new Response(JSON.stringify({ ok: false, skipped: 'zapi disabled' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const INSTANCE_ID = (cfg.instance_id || '').trim() || Deno.env.get('ZAPI_INSTANCE_ID');
  const INSTANCE_TOKEN = (cfg.instance_token || '').trim() || Deno.env.get('ZAPI_INSTANCE_TOKEN');
  const CLIENT_TOKEN = (cfg.client_token || '').trim() || Deno.env.get('ZAPI_CLIENT_TOKEN');
  if (!INSTANCE_ID || !INSTANCE_TOKEN || !CLIENT_TOKEN) {
    return new Response(JSON.stringify({ ok: false, error: 'Z-API credentials missing' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const base = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}`;

  // Carrega broadcasts elegíveis.
  let query = admin.from('crm_group_broadcasts').select('*').eq('active', true);
  if (force_id) query = query.eq('id', force_id);
  const { data: rows, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { weekday, hour } = nowBRT();
  const results: any[] = [];

  for (const b of (rows ?? []) as Broadcast[]) {
    // Janela: weekday e hora batem (a menos que seja force_id).
    const due = force_id ? true : (b.weekday === weekday && b.hour_brt === hour);
    if (!due) { results.push({ key: b.key, skipped: 'not due', now: { weekday, hour } }); continue; }

    // Dedup: nada novo se já disparou nas últimas 23h.
    if (!force_id && b.last_sent_at) {
      const diffMs = Date.now() - new Date(b.last_sent_at).getTime();
      if (diffMs < 23 * 60 * 60 * 1000) {
        results.push({ key: b.key, skipped: 'sent recently', last_sent_at: b.last_sent_at });
        continue;
      }
    }

    if (!b.group_ids || b.group_ids.length === 0) {
      results.push({ key: b.key, skipped: 'no groups configured' });
      continue;
    }

    const perGroup: any[] = [];
    for (const rawGid of b.group_ids) {
      const phone = normalizeGroupId(rawGid);
      if (!phone) continue;
      const steps: any[] = [];
      try {
        if (b.text_first) {
          // 1) texto sozinho, 2) cada imagem sem caption.
          if (dry_run) {
            steps.push({ kind: 'text', dry_run: true });
          } else {
            steps.push({ kind: 'text', ...(await sendZapi(base, CLIENT_TOKEN, 'send-text', { phone, message: b.message_body })) });
          }
          for (const url of b.image_urls) {
            await sleep(800);
            if (dry_run) { steps.push({ kind: 'image', url, dry_run: true }); continue; }
            steps.push({ kind: 'image', url, ...(await sendZapi(base, CLIENT_TOKEN, 'send-image', { phone, image: url, caption: '' })) });
          }
        } else {
          // 1ª imagem leva o texto como caption; demais (se houver) sem caption.
          const [first, ...rest] = b.image_urls.length > 0 ? b.image_urls : [null];
          if (first) {
            if (dry_run) {
              steps.push({ kind: 'image+caption', url: first, dry_run: true });
            } else {
              steps.push({ kind: 'image+caption', url: first, ...(await sendZapi(base, CLIENT_TOKEN, 'send-image', { phone, image: first, caption: b.message_body })) });
            }
          } else {
            if (dry_run) {
              steps.push({ kind: 'text', dry_run: true });
            } else {
              steps.push({ kind: 'text', ...(await sendZapi(base, CLIENT_TOKEN, 'send-text', { phone, message: b.message_body })) });
            }
          }
          for (const url of rest) {
            if (!url) continue;
            await sleep(800);
            if (dry_run) { steps.push({ kind: 'image', url, dry_run: true }); continue; }
            steps.push({ kind: 'image', url, ...(await sendZapi(base, CLIENT_TOKEN, 'send-image', { phone, image: url, caption: '' })) });
          }
        }
      } catch (e: any) {
        steps.push({ kind: 'error', error: String(e?.message || e) });
      }
      perGroup.push({ group: phone, steps });
      await sleep(1500); // delay entre grupos para não estourar rate-limit.
    }

    if (!dry_run) {
      await admin.from('crm_group_broadcasts').update({ last_sent_at: new Date().toISOString() }).eq('id', b.id);
    }
    results.push({ key: b.key, label: b.label, groups: perGroup });
  }

  return new Response(JSON.stringify({ ok: true, now_brt: { weekday, hour }, results }, null, 2),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});