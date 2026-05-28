import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { localRespond, matchCustomRule, renderTemplate, LocalContext } from '../_shared/sth-local-responder.ts';
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

    // ===== CRM: alimenta tickets unificados (não-bloqueante) =====
    try {
      const digits = String(phone).replace(/\D/g, '');
      if (digits.length >= 8) {
        await supabase.rpc('crm_route_inbound', {
          _phone: digits,
          _body: text || '',
          _provider: 'zapi',
          _message_id: payload?.messageId || payload?.id || null,
          _instance_id: payload?.instanceId || null,
          _media_url: payload?.image?.url || payload?.document?.url || null,
        });
      }
    } catch (crmErr) {
      console.error('crm_route_inbound (zapi) error', crmErr);
    }

    const { data: cfg } = await supabase
      .from('ai_assistant_config')
      .select('system_prompt, model, auto_reply_enabled, engine, assistant_name, local_prompt, gemini_model, gemini_fallback_model, gemini_temperature, gemini_max_tokens, business_hours, out_of_hours_message, enforce_business_hours, fallback_enabled, fallback_message')
      .eq('id', 1)
      .maybeSingle();

    if (!cfg?.auto_reply_enabled) {
      console.log('[inbound] auto_reply disabled');
      return new Response(JSON.stringify({ ok: true, paused: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // BUSINESS HOURS — pausa fora do expediente e envia mensagem padrão
    if ((cfg as any)?.enforce_business_hours && (cfg as any)?.business_hours) {
      const bh = (cfg as any).business_hours as Record<string, any>;
      const tz = bh.timezone || 'America/Sao_Paulo';
      const now = new Date();
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(now);
      const wd = fmt.find((p) => p.type === 'weekday')?.value.toLowerCase().slice(0, 3) || 'mon';
      const hh = fmt.find((p) => p.type === 'hour')?.value || '00';
      const mm = fmt.find((p) => p.type === 'minute')?.value || '00';
      const cur = parseInt(hh, 10) * 60 + parseInt(mm, 10);
      const day = bh[wd];
      const toMin = (s: string) => {
        const [h, m] = String(s || '00:00').split(':').map((x) => parseInt(x, 10) || 0);
        return h * 60 + m;
      };
      const inHours = !!(day?.enabled && cur >= toMin(day.open) && cur < toMin(day.close));
      if (!inHours) {
        const msg = (cfg as any)?.out_of_hours_message ||
          'Estamos fora do horário de atendimento. Retornamos no próximo expediente.';
        const normPhone = phone.replace(/\D/g, '');
        // dedup off_hours — não repete se a última resposta já foi off_hours
        const { data: lastOff } = await supabase
          .from('ai_assistant_conversation')
          .select('intent')
          .eq('phone', normPhone)
          .eq('role', 'assistant')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if ((lastOff as any)?.intent === 'off_hours') {
          await supabase.from('ai_assistant_conversation').insert({ phone: normPhone, role: 'user', content: text });
          return new Response(JSON.stringify({ ok: true, deduped: 'off_hours' }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
          body: JSON.stringify({ phone: normPhone, message: msg }),
        });
        await supabase.from('ai_assistant_conversation').insert({ phone: normPhone, role: 'assistant', content: msg, intent: 'off_hours' });
        return new Response(JSON.stringify({ ok: true, off_hours: true }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const engine = (cfg as any)?.engine || 'local';
    const assistantName = (cfg as any)?.assistant_name || 'STH One';

    // ===== Templates operacionais do CRM (crm_op_templates) =====
    // Indexa por `${channel}:${category}` para uso pelo motor e overrides.
    const opTemplates: Record<string, string> = {};
    try {
      const { data: opRows } = await supabase
        .from('crm_op_templates')
        .select('channel, category, body, active')
        .eq('active', true);
      for (const r of (opRows as any[] | null) || []) {
        if (r?.channel && r?.category && r?.body) {
          opTemplates[`${r.channel}:${r.category}`] = String(r.body);
        }
      }
    } catch (e) {
      console.error('[inbound] load crm_op_templates failed', e);
    }
    const pickOp = (category: string, prefer: 'sth_one' | 'fale_nutri' = 'sth_one'): string | null =>
      opTemplates[`${prefer}:${category}`] || opTemplates[`both:${category}`] || null;

    // CRM memory lookup
    const norm = phone.replace(/\D/g, '');
    // Busca robusta via RPC server-side: normaliza dígitos no Postgres
    // (resolve máscaras tipo "(65) 81017-611" e códigos de país variados).
    const { data: matches } = await supabase.rpc('find_profile_by_phone', { _phone: norm });
    const profile = (matches && matches[0]) || null;

    let memory = '';
    let localCtx: LocalContext = { phone, assistantName };
    let contactType: 'aluno_ativo' | 'aluno_inativo' | 'novo_cliente' = 'novo_cliente';
    let contactTypeLabel = 'Novo cliente / lead (sem cadastro)';
    let daysSinceExpiry: number | null = null;
    let isRecentInactive = false;
    let renewUrl = `https://sthmethod.com.br/student/renew`;
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
          daysSinceExpiry = Math.floor((Date.now() - new Date(sub.end_date).getTime()) / 86400000);
          isRecentInactive = daysSinceExpiry >= 0 && daysSinceExpiry <= 15;
          contactTypeLabel = isRecentInactive
            ? `Aluno INATIVO RECENTE (venceu há ${daysSinceExpiry} dia(s) — JANELA DE OURO para renovação)`
            : 'Aluno INATIVO (plano vencido — candidato a renovação)';
          renewUrl = `https://sthmethod.com.br/student/renew?uid=${profile.user_id}`;
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
    // Injeta templates do CRM no contexto local (usado pelo motor `local`)
    localCtx.opTemplates = opTemplates;

    // Carrega histórico recente da conversa (memória conversacional)
    const { data: history } = await supabase
      .from('ai_assistant_conversation')
      .select('role, content, intent, created_at')
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
      const lastA = [...recent].reverse().find((m: any) => m.role === 'assistant');
      const lastAt = (lastA as any)?.created_at ? new Date((lastA as any).created_at).getTime() : 0;
      // Re-saudação após 12h: se o último handoff foi há mais de 12h, envia de novo.
      const HANDOFF_WINDOW_MS = 12 * 60 * 60 * 1000;
      if (lastA?.intent === 'handoff_nutri' && (Date.now() - lastAt) < HANDOFF_WINDOW_MS) {
        console.log('[inbound] skip duplicate handoff');
        return new Response(JSON.stringify({ ok: true, deduped: 'handoff' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const first = (profile?.full_name || '').split(/\s+/)[0];
      // Template CRM 'boas_vindas' do canal fale_nutri tem prioridade
      const tplHandoff = pickOp('boas_vindas', 'fale_nutri');
      const shortLink = `https://sthmethod.com.br/n${first ? `?n=${encodeURIComponent(first)}` : ''}`;
      const handoff = tplHandoff
        ? `${renderTemplate(tplHandoff, { ...localCtx, site: shortLink } as any)}`
        : `Olá! 👋🌿\n\n${first ? `${first}, ` : ''}Sr. (a) será direcionado (a) ao canal *Fale com o Nutri* da STH METHOD.\n\n${shortLink}\n\nSeu atendimento é individualizado e todo o histórico fica registrado para mantermos a continuidade da sua evolução. 👊`;
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

    // ABORDAGEM AUTOMÁTICA — aluno INATIVO RECENTE (≤15 dias do vencimento)
    // Envia pitch de renovação UMA VEZ; depois disso, deixa o motor de IA
    // responder normalmente as perguntas seguintes (dúvidas de saúde, dieta,
    // treino, etc.) mantendo o contexto de "aluno em janela de renovação".
    if (contactType === 'aluno_inativo' && isRecentInactive) {
      // Dedup robusto: considera pitch já enviado se existir QUALQUER mensagem
      // de assistant com intent 'renewal_recent_inactive' nas últimas 72h
      // (cobre invocações concorrentes do webhook e respostas tardias).
      const cutoff = Date.now() - 72 * 60 * 60 * 1000;
      const pitchAlreadySent = (recent || []).some((m: any) =>
        m.role === 'assistant' &&
        m.intent === 'renewal_recent_inactive' &&
        (m.created_at ? new Date(m.created_at).getTime() >= cutoff : true)
      );
      if (!pitchAlreadySent) {
      const first = (profile?.full_name || '').split(/\s+/)[0];
      const dias = daysSinceExpiry ?? 0;
      const tempo = dias <= 1 ? 'há pouquíssimo tempo' : `há ${dias} dias`;
      const pitch = [
        `${first ? `Olá, ${first}!` : 'Olá!'} 👋`,
        ``,
        `Notei que seu plano *${localCtx.planName || ''}* venceu ${tempo}.`,
        `Você ainda está dentro da *janela de continuidade* — conseguimos retomar exatamente de onde parou, sem perder histórico, dieta e protocolo. 💪`,
        ``,
        `Renove agora pelo seu link seguro:`,
        `${renewUrl}`,
        ``,
        `Se quiser, posso te enviar as condições atuais e cupons ativos.`,
      ].join('\n');
      await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
        body: JSON.stringify({ phone: norm, message: pitch }),
      });
      await supabase.from('ai_assistant_conversation').insert({
        phone: norm, role: 'assistant', content: pitch, intent: 'renewal_recent_inactive',
      });
      return new Response(JSON.stringify({ ok: true, renewal_pitch: true, days_since_expiry: dias }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      }
      // Pitch já enviado → segue fluxo normal de IA para responder a pergunta
      console.log('[inbound] renewal pitch already sent — proceeding to AI reply');
      memory += `\n\n# AÇÃO\nO pitch de renovação JÁ FOI ENVIADO. Responda a pergunta atual do aluno com utilidade real (dúvida de saúde, dieta, treino, protocolo, espinhas, sono, etc.). Ao final, em 1 linha curta, lembre amigavelmente da renovação com o link ${renewUrl} — sem repetir o pitch inteiro.`;
    }

    // MOTOR LOCAL — gratuito, sem créditos.
    let reply = '';
    let replyIntent: string | null = null;

    // ============================================================
    // INTENT: "FIZ O CADASTRO" — verifica status real e responde
    // ============================================================
    // Detecta variações: "fiz cadastro", "cadastrei", "realizei cadastro",
    // "acabei de me cadastrar", "cadastro feito", "ja fiz cadastro", etc.
    const tnorm = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const saidRegistered =
      /\b(fiz|realizei|acabei de fazer|ja fiz|acabo de fazer|completei|conclui|finalizei|terminei)\b[^.]{0,30}\bcadastr/.test(tnorm) ||
      /\bcadastr(ei|o feito|o pronto|o concluido|o realizado|o ok)\b/.test(tnorm) ||
      /\bme cadastrei\b/.test(tnorm) ||
      /\bja sou cadastrad/.test(tnorm);

    if (saidRegistered) {
      const lastA = [...recent].reverse().find((m: any) => m.role === 'assistant');
      const lastAtCv = (lastA as any)?.created_at ? new Date((lastA as any).created_at).getTime() : 0;
      const CADASTRO_WINDOW_MS = 12 * 60 * 60 * 1000;
      if (lastA?.intent === 'cadastro_verificado' && (Date.now() - lastAtCv) < CADASTRO_WINDOW_MS) {
        console.log('[inbound] skip duplicate cadastro_verificado');
        return new Response(JSON.stringify({ ok: true, deduped: 'cadastro_verificado' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const first = (profile?.full_name || '').split(/\s+/)[0];
      let confirm = '';
      let intentLabel = 'cadastro_verificado';

      if (profile && contactType === 'aluno_ativo') {
        // Já cadastrado E pago — ativo
        confirm = [
          `${first ? `Boa, ${first}!` : 'Boa!'} ✅`,
          ``,
          `Confirmado: seu cadastro está *ativo* no plano *${localCtx.planName || ''}*${localCtx.endDate ? ` (válido até ${localCtx.endDate})` : ''}.`,
          ``,
          `Você já pode acessar tudo em: https://sthmethod.com.br/student`,
          ``,
          `Para falar direto com o *Nutri Alexandre*: https://wa.me/5521998984153`,
        ].join('\n');
      } else if (profile && contactType === 'aluno_inativo') {
        // Cadastro existe mas plano vencido
        confirm = [
          `${first ? `Olá, ${first}!` : 'Olá!'} 👀`,
          ``,
          `Localizei seu cadastro, mas o plano *${localCtx.planName || ''}* está *vencido*${daysSinceExpiry != null ? ` há ${daysSinceExpiry} dia(s)` : ''}.`,
          ``,
          `Para reativar seu acesso, basta renovar pelo link seguro:`,
          `${renewUrl}`,
        ].join('\n');
      } else if (profile) {
        // Cadastro existe mas SEM pagamento (lead qualificado)
        confirm = [
          `${first ? `Boa, ${first}!` : 'Boa!'} 👍`,
          ``,
          `Confirmei aqui: seu *cadastro foi recebido* com sucesso. ✅`,
          ``,
          `Para *ativar seu acesso*, falta apenas a confirmação do pagamento. Você pode finalizar agora:`,
          ``,
          `https://sthmethod.com.br/student/subscription`,
          ``,
          `Aceitamos *Pix* (aprovação imediata) e *cartão* (até 12x em planos elegíveis). Se já pagou, me envie o comprovante por aqui que validamos na hora.`,
        ].join('\n');
      } else {
        // Não localizado por telefone — pode ter cadastrado com número diferente
        confirm = [
          `Obrigado por avisar! 🙏`,
          ``,
          `Não localizei nenhum cadastro vinculado a este número *${phone}*. Isso costuma acontecer quando o cadastro foi feito com *outro telefone* ou ainda está em processamento.`,
          ``,
          `Para eu confirmar, me envie por favor:`,
          `• *Nome completo* usado no cadastro`,
          `• *E-mail* informado`,
          ``,
          `Se ainda não finalizou todas as etapas (dados → rotina → objetivos → fotos → exames → pagamento), conclua em: https://sthmethod.com.br/cadastro`,
        ].join('\n');
        intentLabel = 'cadastro_nao_localizado';
      }

      await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
        body: JSON.stringify({ phone: norm, message: confirm }),
      });
      await supabase.from('ai_assistant_conversation').insert({
        phone: norm, role: 'assistant', content: confirm, intent: intentLabel,
      });
      return new Response(JSON.stringify({ ok: true, cadastro_check: true, intent: intentLabel }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (engine === 'local') {
      const { data: rules } = await supabase
        .from('ai_assistant_training')
        .select('id, label, keywords, reply, priority, attachments')
        .eq('enabled', true)
        .order('priority', { ascending: true });
      (localCtx as any).fallbackEnabled = (cfg as any)?.fallback_enabled !== false;
      (localCtx as any).fallbackMessage = (cfg as any)?.fallback_message || null;
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

    // DEDUP — evita reenviar a mesma mensagem (ex.: fallback) repetidamente
    {
      const lastA = [...recent].reverse().find((m: any) => m.role === 'assistant');
      const sameContent = lastA && String(lastA.content || '').trim() === reply.trim();
      const repeatedFallback = lastA && replyIntent && lastA.intent === replyIntent &&
        /^(fallback|gemini_offline|off_hours)/.test(String(replyIntent));
      if (sameContent || repeatedFallback) {
        console.log('[inbound] skip duplicate reply', { sameContent, repeatedFallback, replyIntent });
        return new Response(JSON.stringify({ ok: true, deduped: true }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

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