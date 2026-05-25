import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { localRespond, matchCustomRule, LocalContext } from '../_shared/sth-local-responder.ts';
import { callGeminiWithFallback, GeminiMsg } from '../_shared/gemini-client.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

type Msg = { role: 'user' | 'assistant' | 'system'; content: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { messages, contextPhone, forceEngine } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: cfg } = await supabase
      .from('ai_assistant_config')
      .select('system_prompt, model, engine, assistant_name, local_prompt, gemini_model, gemini_fallback_model, gemini_temperature, gemini_max_tokens, fallback_enabled, fallback_message')
      .eq('id', 1)
      .maybeSingle();

    const systemPrompt = cfg?.system_prompt || 'Você é o assistente da STH METHOD.';
    const model = cfg?.model || 'google/gemini-2.5-flash';
    const engine: 'local' | 'ai' | 'gemini' =
      (forceEngine === 'local' || forceEngine === 'ai' || forceEngine === 'gemini')
        ? forceEngine
        : ((cfg as any)?.engine || 'local');
    const assistantName = (cfg as any)?.assistant_name || 'STH One';

    // Optional memory: enrich with student context by phone
    let memoryBlock = '';
    let localCtx: LocalContext = {};
    let contactType: 'aluno_ativo' | 'aluno_inativo' | 'novo_cliente' = 'novo_cliente';
    let contactTypeLabel = 'Novo cliente / lead (ainda sem cadastro ou sem plano)';
    if (contextPhone) {
      const phone = String(contextPhone).replace(/\D/g, '');
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, objective, weight, height')
        .ilike('phone', `%${phone.slice(-8)}%`)
        .maybeSingle();
      if (profile) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('end_date, status, plans(name, duration_days)')
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
            contactTypeLabel = 'Aluno INATIVO (plano vencido ou cancelado — candidato a renovação)';
          }
        } else {
          contactType = 'novo_cliente';
          contactTypeLabel = 'Cadastrado SEM plano (lead qualificado — candidato a 1ª compra)';
        }
        memoryBlock = `\n\n# MEMÓRIA DO CRM (contato atual)\nTipo de contato: ${contactTypeLabel}\nNome: ${profile.full_name || '—'}\nObjetivo: ${profile.objective || '—'}\nPlano: ${(sub as any)?.plans?.name || '—'}\nStatus: ${sub?.status || 'sem assinatura'}\nVencimento: ${sub?.end_date || '—'}`;
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
        memoryBlock = `\n\n# MEMÓRIA DO CRM (contato atual)\nTipo de contato: ${contactTypeLabel}\nTelefone: ${phone}`;
        localCtx = { phone, assistantName, contactType };
      }
    }

    // MOTOR LOCAL (gratuito, sem créditos)
    if (engine === 'local') {
      if (contactType === 'aluno_ativo') {
        const first = (localCtx.name || '').split(/\s+/)[0];
        const reply = `${first ? `Olá, ${first}!` : 'Olá!'} Vi aqui que seu plano *${localCtx.planName || ''}* está ativo. Para suporte direto com o *Nutri Alexandre*, fale pelo canal *Fale com o Nutri*:\n\nhttps://wa.me/5521998984153?text=${encodeURIComponent('Olá! Sou aluno ativo da STH METHOD e gostaria de falar com o Nutri.')}`;
        return new Response(JSON.stringify({ reply, engine: 'local', intent: 'handoff_nutri', contactType }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!localCtx.assistantName) localCtx.assistantName = assistantName;
      const { data: rules } = await supabase
        .from('ai_assistant_training')
        .select('id, label, keywords, reply, priority, attachments')
        .eq('enabled', true)
        .order('priority', { ascending: true });
      const last = [...messages].reverse().find((m: Msg) => m.role === 'user');
      // Constrói memória conversacional a partir das mensagens do chat de teste
      localCtx.recentHistory = (messages as Msg[])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      localCtx.fallbackEnabled = (cfg as any)?.fallback_enabled !== false;
      localCtx.fallbackMessage = (cfg as any)?.fallback_message || null;
      const { reply, intent, attachments } = localRespond(last?.content || '', localCtx, (rules as any) || []);
      const finalReply = intent === 'silent'
        ? '⚠️ Nenhuma regra correspondeu e o fallback automático está desligado. (Em produção, o assistente ficaria em silêncio aguardando atendimento humano.)'
        : reply;
      return new Response(JSON.stringify({ reply: finalReply, engine: 'local', intent, attachments }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // MOTOR GEMINI (chave própria do Google AI Studio com fallback)
    if (engine === 'gemini') {
      if (contactType === 'aluno_ativo') {
        const first = (localCtx.name || '').split(/\s+/)[0];
        const reply = `${first ? `Olá, ${first}!` : 'Olá!'} Vi aqui que seu plano *${localCtx.planName || ''}* está ativo. Para atendimento direto com o *Nutri Alexandre*, use o canal *Fale com o Nutri*:\n\nhttps://wa.me/5521998984153?text=${encodeURIComponent('Olá! Sou aluno ativo da STH METHOD e gostaria de falar com o Nutri.')}`;
        return new Response(JSON.stringify({ reply, engine: 'gemini', intent: 'handoff_nutri', contactType }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const last = [...messages].reverse().find((m: Msg) => m.role === 'user');

      // 1) HÍBRIDO: regras customizadas primeiro (respostas fixas + anexos)
      const { data: rules } = await supabase
        .from('ai_assistant_training')
        .select('id, label, keywords, reply, priority, attachments')
        .eq('enabled', true)
        .order('priority', { ascending: true });
      if (!localCtx.assistantName) localCtx.assistantName = assistantName;
      const ruleHit = matchCustomRule(last?.content || '', localCtx, (rules as any) || []);
      if (ruleHit) {
        return new Response(JSON.stringify({
          reply: ruleHit.reply,
          engine: 'gemini',
          matchedRule: ruleHit.intent,
          attachments: ruleHit.attachments || [],
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 2) Sem regra → Gemini livre com cérebro
      const history: GeminiMsg[] = (messages as Msg[])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10, -1)
        .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', text: m.content }));
      const brain = (cfg as any)?.local_prompt || '';
      const toneRule = `\n\n# REGRA DE TOM POR TIPO DE CONTATO\n- Aluno ATIVO: tom de suporte/acompanhamento. NÃO oferecer plano novo. Foque em dúvidas, dieta, treino, exames, protocolo.\n- Aluno INATIVO: tom acolhedor + convite à renovação (${`https://sthmethod.com.br/student/renew`}). Não trate como novato.\n- Novo cliente / lead: apresentação + valores + cadastro (https://sthmethod.com.br/cadastro).`;
      const sysFull = `${systemPrompt}\n\n${brain}${toneRule}${memoryBlock}`.trim();
      const result = await callGeminiWithFallback({
        systemPrompt: sysFull,
        history,
        userText: last?.content || '',
        model: (cfg as any)?.gemini_model || 'gemini-flash-latest',
        fallbackModel: (cfg as any)?.gemini_fallback_model || 'gemini-flash-lite-latest',
        temperature: Number((cfg as any)?.gemini_temperature ?? 0.4),
        maxTokens: Number((cfg as any)?.gemini_max_tokens ?? 600),
      });
      // Atualiza status do Gemini (sem expor segredos)
      await supabase.from('ai_assistant_config').update({
        gemini_last_status: result.status,
        gemini_last_error: result.error || null,
        gemini_last_used_at: new Date().toISOString(),
      } as any).eq('id', 1);
      return new Response(JSON.stringify({
        reply: result.reply,
        engine: 'gemini',
        status: result.status,
        usedFallback: result.usedFallback,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt + memoryBlock },
          ...messages.map((m: Msg) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições atingido, tente novamente em instantes.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos da Lovable AI esgotados. Adicione créditos em Configurações > Workspace > Uso.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.error('AI gateway error', aiResp.status, t);
      return new Response(JSON.stringify({ error: 'Falha na IA: ' + t }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiResp.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ reply }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-assistant-chat error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});