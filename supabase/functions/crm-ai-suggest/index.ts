import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { callAiEngine, loadEngineAndPrompt } from '../_shared/ai-engine.ts';
import { buildStudentContext, findStudentByPhone } from '../_shared/student-context.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: auth } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (!auth?.claims) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { conversation_id, phone, prompt: customPrompt } = await req.json();

    const { engine, systemPrompt } = await loadEngineAndPrompt(supabase, 'ai_prompt_comercial');

    // Build context: rich student dossier + last 10 messages
    let context = '';
    if (conversation_id) {
      const { data: msgs } = await supabase
        .from('crm_messages')
        .select('direction, body, created_at')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: false })
        .limit(10);
      const conv = (msgs || []).reverse().map((m: any) => `${m.direction === 'in' ? 'Aluno' : 'Atendente'}: ${m.body}`).join('\n');
      context += `Histórico recente da conversa:\n${conv}\n\n`;
    }
    if (phone) {
      const studentId = await findStudentByPhone(supabase, phone);
      if (studentId) {
        const dossier = await buildStudentContext(supabase, studentId);
        if (dossier) context = dossier + '\n' + context;
      }
    }

    const userPrompt = customPrompt
      ? `${context}\nInstrução do atendente: ${customPrompt}`
      : `${context}\nCom base no contexto acima, sugira uma resposta curta, cordial e profissional (tom STH METHOD, neutro e técnico, em português do Brasil). Não use emojis em excesso. Máximo 4 frases.`;

    const reply = await callAiEngine({ engine, systemPrompt, userPrompt });

    return new Response(JSON.stringify({ response: reply.response, model: reply.model, engine: reply.engine }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('crm-ai-suggest', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});