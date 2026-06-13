// Student-facing AI chat: authenticated student talks to ChatGPT (or selected engine)
// with full context of their own profile/diet/training/protocol.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { callAiEngine, loadEngineAndPrompt } from '../_shared/ai-engine.ts';
import { buildStudentContext } from '../_shared/student-context.ts';

interface ChatMessage { role: 'user' | 'assistant'; content: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: auth } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    const userId = auth?.claims?.sub as string | undefined;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages.slice(-12) : [];
    const lastUser = messages.filter((m) => m.role === 'user').pop()?.content?.trim();
    if (!lastUser) {
      return new Response(JSON.stringify({ error: 'message required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { engine, systemPrompt } = await loadEngineAndPrompt(supabase, 'ai_prompt_aluno' as any);
    const dossier = await buildStudentContext(supabase, userId);

    const conv = messages
      .map((m) => `${m.role === 'user' ? 'Aluno' : 'Assistente'}: ${m.content}`)
      .join('\n');

    const userPrompt = `${dossier}\nHistórico recente da conversa:\n${conv}\n\nResponda a última mensagem do aluno usando o dossiê acima. Seja claro, técnico, neutro e cordial. Máximo 6 frases. Nunca prometa resultados milagrosos. Para alterações em dieta/treino/protocolo, oriente a falar com o consultor humano.`;

    const reply = await callAiEngine({ engine, systemPrompt, userPrompt });

    return new Response(
      JSON.stringify({ response: reply.response, model: reply.model, engine: reply.engine }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('student-ai-chat', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});