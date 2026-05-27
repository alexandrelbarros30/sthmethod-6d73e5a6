import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { callGeminiWithFallback } from '../_shared/gemini-client.ts';

// Gera resposta sugerida para o atendimento Fale com o Nutri.
// Recebe { user_id, hint? } e usa contexto do aluno + últimas mensagens.

const SYSTEM_PROMPT = `Você é o assistente do canal *Fale com o Nutri* da STH METHOD.
Sua função é ajudar a equipe a responder alunos ativos da consultoria.

Regras invioláveis:
- Seja claro, respeitoso, humano e estratégico.
- Nunca prometa cura ou resultados milagrosos.
- Nunca prescreva medicação, dose ou conduta clínica.
- Nunca altere protocolo, ciclo ou dose sem validação humana do nutricionista.
- Diante de sintomas, efeitos colaterais, dor, mal-estar ou alteração relevante: encaminhe para avaliação profissional imediata.
- Use linguagem simples, com autoridade técnica. Tom acolhedor, não autoritário.
- Priorize segurança, organização e continuidade do acompanhamento.
- Nunca invente dados clínicos.
- Sempre que possível, direcione para a plataforma para registros (peso, fotos, exames).
- Assine implicitamente como equipe STH METHOD. Não use emojis em excesso.

Responda em português do Brasil, em no máximo 4 parágrafos curtos. Devolva apenas o texto pronto para enviar — sem aspas, sem cabeçalho.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const userId = String(body?.user_id || '');
    const hint = String(body?.hint || '').slice(0, 500);
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: 'user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const [profileRes, subRes, msgsRes, weightRes, convRes] = await Promise.all([
      admin.from('profiles').select('full_name, email, phone, objective').eq('user_id', userId).maybeSingle(),
      admin.from('subscriptions').select('plan_id, end_date, start_date, status').eq('user_id', userId).order('end_date', { ascending: false }).limit(1).maybeSingle(),
      admin.from('nutri_messages').select('direction, body, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      admin.from('weight_logs').select('weight, logged_at').eq('user_id', userId).order('logged_at', { ascending: false }).limit(1).maybeSingle(),
      admin.from('nutri_conversations').select('category, priority, internal_notes').eq('user_id', userId).maybeSingle(),
    ]);

    let planName = '—';
    if (subRes.data?.plan_id) {
      const { data: plan } = await admin.from('plans').select('name').eq('id', subRes.data.plan_id).maybeSingle();
      planName = plan?.name || '—';
    }

    const firstName = (profileRes.data?.full_name || 'Aluno').split(' ')[0];
    const lastWeight = weightRes.data?.weight ? `${weightRes.data.weight} kg em ${new Date(weightRes.data.logged_at).toLocaleDateString('pt-BR')}` : 'sem registro recente';
    const planEnd = subRes.data?.end_date ? new Date(subRes.data.end_date).toLocaleDateString('pt-BR') : '—';
    const lastMsgs = (msgsRes.data || []).slice().reverse();

    const history = lastMsgs.map((m) => ({
      role: m.direction === 'in' ? ('user' as const) : ('model' as const),
      text: m.body || '',
    }));

    const contextBlock = `Contexto do atendimento:
- Aluno: ${firstName} (${profileRes.data?.full_name || ''})
- Plano: ${planName} (vence em ${planEnd})
- Objetivo: ${profileRes.data?.objective || '—'}
- Último peso: ${lastWeight}
- Categoria detectada: ${convRes.data?.category || '—'}
- Prioridade: ${convRes.data?.priority || 'medium'}
- Observação interna: ${convRes.data?.internal_notes || '—'}
${hint ? `- Direcionamento da equipe: ${hint}` : ''}

Considere o histórico anterior e gere a próxima resposta da equipe.`;

    const result = await callGeminiWithFallback({
      systemPrompt: SYSTEM_PROMPT,
      history,
      userText: contextBlock,
      temperature: 0.5,
      maxTokens: 500,
    });

    return new Response(JSON.stringify({ ok: result.ok, reply: result.reply, status: result.status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('nutri-ai-reply error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});