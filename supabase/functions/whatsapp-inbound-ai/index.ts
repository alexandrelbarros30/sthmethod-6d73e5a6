import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { localRespond, matchCustomRule, LocalContext } from '../_shared/sth-local-responder.ts';
import { callGeminiWithFallback, GeminiMsg } from '../_shared/gemini-client.ts';

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
      .select('system_prompt, model, auto_reply_enabled, engine, assistant_name, local_prompt, gemini_model, gemini_fallback_model, gemini_temperature, gemini_max_tokens')
      .eq('id', 1)
      .maybeSingle();

    if (!cfg?.auto_reply_enabled) {
      console.log('[inbound] auto_reply disabled');
      return new Response(JSON.stringify({ ok: true, paused: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const engine = (cfg as any)?.engine || 'local';
    const assistantName = (cfg as any)?.assistant_name || 'STH One';

    // CRM memory lookup
    const norm = phone.replace(/\D/g, '');
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, objective')
      .ilike('phone', `%${norm.slice(-8)}%`)
      .maybeSingle();

    let memory = '';
    let localCtx: LocalContext = { phone, assistantName };
    let contactType: 'aluno_ativo' | 'aluno_inativo' | 'novo_cliente' = 'novo_cliente';
    let contactTypeLabel = 'Novo cliente / lead (sem cadastro)';
    if (profile) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('end_date, status, plans(name)')
        .eq('user_id', profile.user_id)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sub) {
        const expired = new Date(sub.end_date) < new Date();
        if (sub.status === 'active' && !expired) {
          contactType = 'aluno_ativo';
          contactTypeLabel = 'Aluno ATIVO (plano em dia)';
        } else {
          contactType = 'aluno_inativo';
          contactTypeLabel = 'Aluno INATIVO (plano vencido — candidato a renovação)';
        }
      } else {
        contactType = 'novo_cliente';
        contactTypeLabel = 'Cadastrado SEM plano (lead qualificado — candidato a 1ª compra)';
      }
      memory = `\n\n# CONTATO\nTipo de contato: ${contactTypeLabel}\nNome: ${profile.full_name || '—'}\nObjetivo: ${profile.objective || '—'}\nPlano: ${(sub as any)?.plans?.name || '—'}\nStatus: ${sub?.status || 'lead'}\nVencimento: ${sub?.end_date || '—'}`;
      localCtx = {
        name: profile.full_name,
        status: sub?.status || 'lead',
        planName: (sub as any)?.plans?.name || null,
        endDate: sub?.end_date || null,
        phone,
        assistantName,
        contactType,
      };
    } else {
      memory = `\n\n# CONTATO\nTipo de contato: ${contactTypeLabel}\nTelefone: ${phone}`;
      localCtx.contactType = contactType;
    }

    // Carrega histórico recente da conversa (memória conversacional)
    const { data: history } = await supabase
      .from('ai_assistant_conversation')
      .select('role, content, intent')
      .eq('phone', norm)
      .order('created_at', { ascending: false })
      .limit(6);
    const recent = (history || []).reverse();
    const lastIntent = [...recent].reverse().find((m: any) => m.role === 'assistant')?.intent || null;
    localCtx.recentHistory = recent as any;
    localCtx.lastIntent = lastIntent;

    // Loga mensagem do aluno
    await supabase.from('ai_assistant_conversation').insert({ phone: norm, role: 'user', content: text });

    // HANDOFF — aluno ATIVO vai direto para o canal "Fale com o Nutri"
    if (contactType === 'aluno_ativo') {
      const first = (profile?.full_name || '').split(/\s+/)[0];
      const handoff = `${first ? `Olá, ${first}!` : 'Olá!'} Vi aqui que seu plano *${(localCtx.planName || '')}* está ativo. Para suporte direto com o *Nutri Alexandre*, fale pelo canal *Fale com o Nutri*:\n\nhttps://wa.me/5521998984153?text=${encodeURIComponent('Olá! Sou aluno ativo da STH METHOD e gostaria de falar com o Nutri.')}`;
      await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
        body: JSON.stringify({ phone: norm, message: handoff }),
      });
      await supabase.from('ai_assistant_conversation').insert({ phone: norm, role: 'assistant', content: handoff, intent: 'handoff_nutri' });
      return new Response(JSON.stringify({ ok: true, handoff: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // MOTOR LOCAL — gratuito, sem créditos.
    let reply = '';
    let replyIntent: string | null = null;
    if (engine === 'local') {
      const { data: rules } = await supabase
        .from('ai_assistant_training')
        .select('id, label, keywords, reply, priority, attachments')
        .eq('enabled', true)
        .order('priority', { ascending: true });
      const r = localRespond(text, localCtx, (rules as any) || []);
      reply = r.reply;
      replyIntent = r.intent;
      console.log('[inbound] local intent', r.intent);
      // Envia mídia anexada (se houver) ANTES do texto principal
      const atts = (r as any).attachments as Array<{ url: string; kind: string; name?: string }> | undefined;
      if (atts && atts.length) {
        for (const a of atts) {
          try {
            const payload: any = { phone: norm, message: '' };
            if (a.kind === 'image') payload.image_url = a.url;
            else { payload.document_url = a.url; payload.document_name = a.name || 'documento.pdf'; }
            const res = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
              body: JSON.stringify(payload),
            });
            console.log('[inbound] sent attachment', a.kind, res.status);
          } catch (e) {
            console.error('[inbound] attachment error', e);
          }
        }
      }
    } else if (engine === 'gemini') {
      // 1) HÍBRIDO: regras customizadas primeiro
      const { data: rules } = await supabase
        .from('ai_assistant_training')
        .select('id, label, keywords, reply, priority, attachments')
        .eq('enabled', true)
        .order('priority', { ascending: true });
      const ruleHit = matchCustomRule(text, localCtx, (rules as any) || []);
      if (ruleHit) {
        reply = ruleHit.reply;
        replyIntent = `rule:${ruleHit.intent}`;
        // envia anexos da regra antes do texto
        const atts = ruleHit.attachments || [];
        for (const a of atts) {
          try {
            const p: any = { phone: norm, message: '' };
            if (a.kind === 'image') p.image_url = a.url;
            else { p.document_url = a.url; p.document_name = a.name || 'documento.pdf'; }
            await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
              body: JSON.stringify(p),
            });
          } catch (e) { console.error('[inbound] gemini rule attachment error', e); }
        }
      } else {
      // 2) Sem regra → Gemini livre com cérebro
      const history: GeminiMsg[] = (recent as any[])
        .map((m) => ({ role: m.role === 'assistant' ? 'model' as const : 'user' as const, text: m.content }));
      const brain = (cfg as any)?.local_prompt || '';
      const toneRule = `\n\n# REGRA DE TOM POR TIPO DE CONTATO\n- Aluno ATIVO: tom de suporte/acompanhamento. NUNCA ofereça plano novo. Foque em dúvidas, dieta, treino, exames, protocolo.\n- Aluno INATIVO: acolhimento + convite à renovação (https://sthmethod.com.br/student/renew). Não trate como novato.\n- Novo cliente / lead: apresentação curta + valores + cadastro (https://sthmethod.com.br/cadastro).`;
      const sysFull = `${cfg?.system_prompt || ''}\n\n${brain}${toneRule}${memory}`.trim();
      const r = await callGeminiWithFallback({
        systemPrompt: sysFull,
        history,
        userText: text,
        model: (cfg as any)?.gemini_model || 'gemini-flash-latest',
        fallbackModel: (cfg as any)?.gemini_fallback_model || 'gemini-flash-lite-latest',
        temperature: Number((cfg as any)?.gemini_temperature ?? 0.4),
        maxTokens: Number((cfg as any)?.gemini_max_tokens ?? 600),
      });
      reply = r.reply;
      replyIntent = r.status === 'offline' ? 'gemini_offline' : (r.usedFallback ? 'gemini_fallback' : 'gemini');
      await supabase.from('ai_assistant_config').update({
        gemini_last_status: r.status,
        gemini_last_error: r.error || null,
        gemini_last_used_at: new Date().toISOString(),
      } as any).eq('id', 1);
      // Se ambos falharem, encaminha para humano (não envia mensagem comercial)
      if (r.status === 'offline') {
        console.warn('[inbound] gemini offline — encaminhar humano');
      }
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

    // Loga resposta do assistente
    await supabase.from('ai_assistant_conversation').insert({ phone: norm, role: 'assistant', content: reply, intent: replyIntent });

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