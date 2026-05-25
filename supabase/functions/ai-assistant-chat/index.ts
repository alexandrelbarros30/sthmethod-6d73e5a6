import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { localRespond, LocalContext } from '../_shared/sth-local-responder.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

type Msg = { role: 'user' | 'assistant' | 'system'; content: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { messages, contextPhone } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: cfg } = await supabase
      .from('ai_assistant_config')
      .select('system_prompt, model, engine')
      .eq('id', 1)
      .maybeSingle();

    const systemPrompt = cfg?.system_prompt || 'Você é o assistente da STH METHOD.';
    const model = cfg?.model || 'google/gemini-2.5-flash';
    const engine = (cfg as any)?.engine || 'local';

    // Optional memory: enrich with student context by phone
    let memoryBlock = '';
    let localCtx: LocalContext = {};
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
        memoryBlock = `\n\n# MEMÓRIA DO CRM (contato atual)\nNome: ${profile.full_name || '—'}\nObjetivo: ${profile.objective || '—'}\nPlano: ${(sub as any)?.plans?.name || '—'}\nStatus: ${sub?.status || 'sem assinatura'}\nVencimento: ${sub?.end_date || '—'}`;
        localCtx = {
          name: profile.full_name,
          status: sub?.status || 'lead',
          planName: (sub as any)?.plans?.name || null,
          endDate: sub?.end_date || null,
          phone,
        };
      }
    }

    // MOTOR LOCAL (gratuito, sem créditos)
    if (engine === 'local') {
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
      const { reply, intent, attachments } = localRespond(last?.content || '', localCtx, (rules as any) || []);
      return new Response(JSON.stringify({ reply, engine: 'local', intent, attachments }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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