import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { localRespond, LocalContext } from '../_shared/sth-local-responder.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

/**
 * Webhook Z-API "On message received".
 * Quando auto_reply_enabled = true, responde automaticamente usando o
 * Super Prompt da STH METHOD via Lovable AI Gateway.
 * URL para configurar na Z-API:
 *   https://<project>.functions.supabase.co/whatsapp-inbound-ai
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Health check — abrir URL no navegador retorna ok (útil para validar webhook Z-API)
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ ok: true, service: 'whatsapp-inbound-ai', ts: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const raw = await req.text();
    let payload: any = {};
    try { payload = JSON.parse(raw); } catch { payload = {}; }
    console.log('[inbound] payload', raw.slice(0, 2000));

    // Z-API formats vary; tolerate the common shapes.
    const fromMe = payload.fromMe === true || payload.isFromMe === true || payload?.message?.fromMe === true;
    if (fromMe) {
      console.log('[inbound] skip fromMe');
      return new Response(JSON.stringify({ ok: true, skipped: 'fromMe' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ignora eventos que não são mensagens (status, presence, etc.)
    const evtType = (payload.type || payload.event || '').toString().toLowerCase();
    if (evtType && !evtType.includes('message') && !evtType.includes('received') && evtType !== 'receivedcallback') {
      console.log('[inbound] skip event type', evtType);
      return new Response(JSON.stringify({ ok: true, skipped: 'event ' + evtType }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const phone: string =
      payload.phone || payload.from || payload?.sender?.phone || payload?.participantPhone ||
      payload?.message?.phone || '';
    const text: string =
      (typeof payload?.text === 'string' ? payload.text : payload?.text?.message) ||
      payload?.message?.text ||
      (typeof payload?.message === 'string' ? payload.message : '') ||
      payload?.body ||
      payload?.messageText ||
      payload?.image?.caption ||
      payload?.audio?.caption ||
      '';

    if (!phone || !text) {
      console.log('[inbound] missing phone/text', { phone, hasText: !!text });
      return new Response(JSON.stringify({ ok: true, skipped: 'no phone/text', phone, hasText: !!text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: cfg } = await supabase
      .from('ai_assistant_config')
      .select('system_prompt, model, auto_reply_enabled, engine')
      .eq('id', 1)
      .maybeSingle();

    if (!cfg?.auto_reply_enabled) {
      console.log('[inbound] auto_reply disabled');
      return new Response(JSON.stringify({ ok: true, paused: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const engine = (cfg as any)?.engine || 'local';

    // CRM memory lookup
    const norm = phone.replace(/\D/g, '');
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, objective')
      .ilike('phone', `%${norm.slice(-8)}%`)
      .maybeSingle();

    let memory = '';
    let localCtx: LocalContext = { phone };
    if (profile) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('end_date, status, plans(name)')
        .eq('user_id', profile.user_id)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      memory = `\n\n# CONTATO\nNome: ${profile.full_name || '—'}\nObjetivo: ${profile.objective || '—'}\nPlano: ${(sub as any)?.plans?.name || '—'}\nStatus: ${sub?.status || 'lead'}\nVencimento: ${sub?.end_date || '—'}`;
      localCtx = {
        name: profile.full_name,
        status: sub?.status || 'lead',
        planName: (sub as any)?.plans?.name || null,
        endDate: sub?.end_date || null,
        phone,
      };
    } else {
      memory = `\n\n# CONTATO\nLead novo (sem cadastro). Telefone: ${phone}`;
    }

    // MOTOR LOCAL — gratuito, sem créditos.
    let reply = '';
    if (engine === 'local') {
      const { data: rules } = await supabase
        .from('ai_assistant_training')
        .select('id, label, keywords, reply, priority')
        .eq('enabled', true)
        .order('priority', { ascending: true });
      const r = localRespond(text, localCtx, (rules as any) || []);
      reply = r.reply;
      console.log('[inbound] local intent', r.intent);
      if (r.ruleId) {
        await supabase.rpc('increment_training_hit' as any, { _id: r.ruleId }).then(() => {}, () => {});
      }
    } else {
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cfg.model || 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: (cfg.system_prompt || '') + memory },
          { role: 'user', content: text },
        ],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error('ai gateway error', aiResp.status, t);
      return new Response(JSON.stringify({ ok: false, error: 'ai_error' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const data = await aiResp.json();
    reply = data.choices?.[0]?.message?.content || '';
    }
    if (!reply) {
      console.log('[inbound] empty AI reply');
      return new Response(JSON.stringify({ ok: true, empty: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('[inbound] reply len', reply.length, 'to', phone);

    // Send via existing send-whatsapp (uses Z-API + wa.me fallback)
    const sendResp = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ phone: norm, message: reply }),
    });
    const sendBody = await sendResp.text();
    console.log('[inbound] send-whatsapp', sendResp.status, sendBody.slice(0, 500));

    return new Response(JSON.stringify({ ok: true, replied: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('whatsapp-inbound-ai error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});