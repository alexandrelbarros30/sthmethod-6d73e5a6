import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

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

  try {
    const payload = await req.json().catch(() => ({} as any));

    // Z-API formats vary; tolerate the common shapes.
    const fromMe = payload.fromMe === true || payload.isFromMe === true;
    if (fromMe) return new Response(JSON.stringify({ ok: true, skipped: 'fromMe' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    const phone: string =
      payload.phone || payload.from || payload?.sender?.phone || payload?.participantPhone || '';
    const text: string =
      payload?.text?.message ||
      payload?.message?.text ||
      payload?.text ||
      payload?.body ||
      payload?.messageText ||
      '';

    if (!phone || !text) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no phone/text' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: cfg } = await supabase
      .from('ai_assistant_config')
      .select('system_prompt, model, auto_reply_enabled')
      .eq('id', 1)
      .maybeSingle();

    if (!cfg?.auto_reply_enabled) {
      return new Response(JSON.stringify({ ok: true, paused: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CRM memory lookup
    const norm = phone.replace(/\D/g, '');
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, objective')
      .ilike('phone', `%${norm.slice(-8)}%`)
      .maybeSingle();

    let memory = '';
    if (profile) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('end_date, status, plans(name)')
        .eq('user_id', profile.user_id)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      memory = `\n\n# CONTATO\nNome: ${profile.full_name || '—'}\nObjetivo: ${profile.objective || '—'}\nPlano: ${(sub as any)?.plans?.name || '—'}\nStatus: ${sub?.status || 'lead'}\nVencimento: ${sub?.end_date || '—'}`;
    } else {
      memory = `\n\n# CONTATO\nLead novo (sem cadastro). Telefone: ${phone}`;
    }

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
    const reply: string = data.choices?.[0]?.message?.content || '';
    if (!reply) return new Response(JSON.stringify({ ok: true, empty: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    // Send via existing send-whatsapp (uses Z-API + wa.me fallback)
    await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ phone: norm, message: reply }),
    });

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