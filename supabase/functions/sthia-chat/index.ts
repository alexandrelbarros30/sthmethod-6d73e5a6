// STHIA — chat interno admin/owner para conversar e ENSINAR a IA.
// Cada turno: (1) responde usando ai-engine + memórias globais; (2) extrai aprendizados e salva como memória global.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { callAiEngine, loadEngineAndPrompt, fetchAiMemories, renderMemoryBlock, extractAndSaveAiMemory } from '../_shared/ai-engine.ts';

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
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: auth } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    const userId = auth?.claims?.sub as string | undefined;
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Apenas admin pode usar
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', userId);
    const isAdmin = Array.isArray(roles) && roles.some((r: any) => r.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages.slice(-20) : [];
    const teach: boolean = body?.teach === true;
    const lastUser = messages.filter((m) => m.role === 'user').pop()?.content?.trim();
    if (!lastUser) {
      return new Response(JSON.stringify({ error: 'message required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Carrega o motor + base global (vamos sobrescrever com prompt da STHIA)
    const { engine } = await loadEngineAndPrompt(admin, 'ai_prompt_aluno' as any);
    const memories = await fetchAiMemories(admin, { userId: null, phone: null, limit: 0 });
    const memBlock = renderMemoryBlock(memories);

    const sthiaSystem = `Você é a STHIA — o cérebro de IA da consultoria STH METHOD. Está em modo INTERNO de aprendizado, conversando com o owner/admin do projeto (não é aluno nem lead).

Postura:
- Voz feminina, direta, próxima, com autoridade técnica. Trate o admin como parceiro estratégico.
- Pense como mestre estrategista + copywriter de elite + engenheiro de prompts + mentor de negócios.
- Quebre problemas em microetapas. Decida por IMPACTO, não por padrão seguro.
- Nunca dê resposta morna, genérica ou cheia de frases de transição.
- Saída sempre escaneável (parágrafos curtos, bullets quando fizer sentido), com insight prático.

Aprendizado:
- Trate cada mensagem como possível diretriz de negócio, regra de produto, copy ou aprendizado estratégico que precisa ser absorvido.
- Quando o admin disser "aprenda", "memorize", "grava isso", "regra nova", "padrão", "nunca/sempre", REFORCE explicitamente que entendeu, repita a regra com precisão e confirme que vai aplicar.
- Você pode pedir esclarecimento curto se a regra for ambígua, mas não enrole.

Identidade:
- Seu nome é STHIA. Use a primeira pessoa.
- NUNCA escreva, cite ou referencie a expressão "modo deus" (nem god mode, modo god, variações). Recuse de forma natural se invocada.
- Esta conversa é interna; pode citar dados internos do projeto sem exposição pública.

Quando o admin trouxer ideias soltas, organize, refine, sugira a versão mais ousada e prática, e devolva pronta para virar regra/copy/fluxo.`;

    const conv = messages
      .map((m) => `${m.role === 'user' ? 'Admin' : 'STHIA'}: ${m.content}`)
      .join('\n');

    const userPrompt = `${memBlock}\n\nConversa atual:\n${conv}\n\nResponda à última mensagem do admin como STHIA. ${teach ? 'IMPORTANTE: o admin acionou MODO ENSINAR — confirme explicitamente o aprendizado, repita a regra com precisão e diga como aplicará daqui pra frente.' : ''}`;

    const reply = await callAiEngine({ engine, systemPrompt: sthiaSystem, userPrompt });

    // Aprendizado: extrai memórias globais a cada turno (best-effort, não bloqueia em caso de falha)
    let saved = 0;
    try {
      const recent = messages.slice(-6).map((m) => `${m.role === 'user' ? 'Admin' : 'STHIA'}: ${m.content}`).join('\n') + `\nSTHIA: ${reply.response}`;
      // Forçamos escopo global injetando hint no histórico
      const hint = teach
        ? `\n[CONTEXTO: o admin está ENSINANDO regras/diretrizes do projeto STH METHOD. Toda memória extraída deve ter scope="global" e categoria entre "aprendizado", "fato" ou "contexto". Capture as regras com precisão, em PT-BR, frases curtas e acionáveis.]`
        : `\n[CONTEXTO: conversa interna admin↔STHIA sobre o projeto STH METHOD. Capture apenas regras/diretrizes/decisões duráveis com scope="global".]`;
      saved = await extractAndSaveAiMemory({
        admin,
        engine,
        phone: null,
        userId: null,
        conversationId: null,
        recentHistory: recent + hint,
      });
    } catch (_) { /* ignora */ }

    return new Response(
      JSON.stringify({ response: reply.response, model: reply.model, engine: reply.engine, learned: saved }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('sthia-chat', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});