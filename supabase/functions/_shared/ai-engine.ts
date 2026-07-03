// Multi-provider AI engine for STH METHOD response engine.
// Supported engines: 'openai' (ChatGPT), 'lovable' (Gemini via Lovable AI), 'gemini_api', 'local' (rules).

export type AiEngine = 'openai' | 'lovable' | 'gemini_api' | 'local';

export interface AiReply {
  response: string;
  model: string;
  engine: AiEngine;
}

export function localEngineReply(input: string): string {
  const t = (input || '').toLowerCase();
  if (/^\s*(ol[áa]|oi|bom dia|boa tarde|boa noite)/.test(t)) {
    return 'Olá! Seja bem-vindo(a) à STH METHOD. 👋\n\nComo posso ajudar?\n1️⃣ Conhecer planos\n2️⃣ Como funciona\n3️⃣ Falar com consultor\n4️⃣ Já sou aluno';
  }
  if (/\b1\b|plano|valor|pre[çc]o/.test(t)) {
    return 'Temos planos mensais, trimestrais e semestrais. Posso te enviar os valores atualizados — me diga seu objetivo (emagrecimento, hipertrofia, performance ou saúde).';
  }
  if (/\b2\b|como funciona|metodologia/.test(t)) {
    return 'A STH METHOD é uma consultoria científica: planejamento alimentar individualizado, treino guiado pelo app ST Coach, protocolos estratégicos e acompanhamento de exames.';
  }
  if (/\b3\b|consultor|humano|atendente/.test(t)) {
    return 'Vou te encaminhar para um consultor humano. Pode me confirmar seu nome completo e e-mail?';
  }
  if (/\b4\b|aluno|j[áa] sou|nutri/.test(t)) {
    return 'Perfeito! O canal exclusivo para alunos ativos é o Sucesso do Aluno: https://wa.me/5521998496289';
  }
  return 'Recebi sua mensagem. Para te ajudar melhor, responda com 1️⃣ Planos, 2️⃣ Como funciona, 3️⃣ Falar com consultor ou 4️⃣ Já sou aluno.';
}

export async function callAiEngine({
  engine,
  systemPrompt,
  userPrompt,
  openaiModel = 'gpt-4o-mini',
}: {
  engine: AiEngine;
  systemPrompt: string;
  userPrompt: string;
  openaiModel?: string;
}): Promise<AiReply> {
  if (engine === 'local') {
    return { response: localEngineReply(userPrompt), model: 'local/rules', engine };
  }

  if (engine === 'openai') {
    const key = Deno.env.get('OPENAI_API_KEY');
    if (!key) throw new Error('OPENAI_API_KEY missing');
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: openaiModel,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(`OpenAI error: ${JSON.stringify(data)}`);
    return {
      response: (data as any)?.choices?.[0]?.message?.content?.trim() || '',
      model: `openai/${openaiModel}`,
      engine,
    };
  }

  if (engine === 'gemini_api') {
    const gkey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY_FALLBACK');
    if (!gkey) throw new Error('GEMINI_API_KEY missing');
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${gkey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Gemini API error: ${JSON.stringify(d)}`);
    return {
      response: (d as any)?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '',
      model: 'gemini-2.5-flash (api)',
      engine,
    };
  }

  // default: lovable
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY missing');
  const model = 'google/gemini-2.5-flash';
  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`AI gateway error: ${JSON.stringify(data)}`);
  return {
    response: (data as any)?.choices?.[0]?.message?.content || '',
    model,
    engine,
  };
}

export async function loadEngineAndPrompt(
  admin: any,
  promptKey: 'ai_prompt_comercial' | 'ai_prompt_sucesso' | 'ai_prompt_nutri' | 'ai_prompt_aluno',
): Promise<{ engine: AiEngine; systemPrompt: string }> {
  const defaultPrompt = 'Você é o assistente oficial da consultoria STH METHOD. Tom: claro, técnico, neutro, cordial. Português do Brasil. Nunca prometa resultados milagrosos nem invente dados clínicos. Quando o aluno pedir algo fora do escopo (alteração de dieta, treino ou protocolo), oriente que será encaminhado ao consultor humano.';
  const channelEnabledKey = `${promptKey}_enabled`;
  const channelFilter = promptKey === 'ai_prompt_comercial'
    ? ['zapi','both']
    : promptKey === 'ai_prompt_nutri'
      ? ['wapi','both']
      : promptKey === 'ai_prompt_sucesso'
        ? ['wapi_sucesso','wapi','both']
        : ['both'];
  const [{ data: cfg }, { data: engCfg }, { data: globalCfg }, { data: globalToggle }, { data: channelToggle }, { data: tmplToggle }, { data: tmpls }] = await Promise.all([
    admin.from('crm_settings').select('value').eq('key', promptKey).maybeSingle(),
    admin.from('crm_settings').select('value').eq('key', 'ai_engine').maybeSingle(),
    admin.from('crm_settings').select('value').eq('key', 'ai_prompt_global').maybeSingle(),
    admin.from('crm_settings').select('value').eq('key', 'ai_prompt_global_enabled').maybeSingle(),
    admin.from('crm_settings').select('value').eq('key', channelEnabledKey).maybeSingle(),
    admin.from('crm_settings').select('value').eq('key', 'ai_templates_enabled').maybeSingle(),
    admin.from('crm_message_templates').select('name,category,body,channel').eq('active', true).in('channel', channelFilter).limit(80),
  ]);
  const storedPrompt = (cfg?.value as any)?.prompt;
  const channelText = (typeof storedPrompt === 'string' && storedPrompt.trim()) ? storedPrompt.trim() : '';
  // Default: channel prompts are ENABLED unless explicitly set to false
  const channelEnabled = (channelToggle?.value as any)?.enabled !== false;
  const globalEnabled = (globalToggle?.value as any)?.enabled === true;
  const globalPromptRaw = (globalCfg?.value as any)?.prompt;
  const globalText = (typeof globalPromptRaw === 'string' && globalPromptRaw.trim()) ? globalPromptRaw.trim() : '';

  // 🔒 CRITICAL: extract "fisiculturismo avançado / never push away" rules so they sit at the TOP
  // of the system prompt. Gemini models weight early instructions much more heavily.
  const criticalPreamble = extractCriticalPreamble(channelText);

  let systemPrompt = defaultPrompt;
  if (globalEnabled && globalText) {
    // Global is the base. Channel prompt acts as auxiliary only when enabled.
    // BUT: if critical rules exist, they MUST prefix everything.
    if (criticalPreamble) {
      systemPrompt = channelEnabled && channelText
        ? `${criticalPreamble}\n\n---\n${globalText}\n\n---\nInstruções auxiliares específicas deste canal:\n${channelText.replace(criticalPreamble, '').trim()}`
        : `${criticalPreamble}\n\n---\n${globalText}`;
    } else {
      systemPrompt = channelEnabled && channelText
        ? `${globalText}\n\n---\nInstruções auxiliares específicas deste canal:\n${channelText}`
        : globalText;
    }
  } else if (channelEnabled && channelText) {
    systemPrompt = criticalPreamble
      ? `${criticalPreamble}\n\n---\n${channelText.replace(criticalPreamble, '').trim()}`
      : channelText;
  }

  // Inject templates as knowledge base (default ON unless explicitly disabled)
  const templatesEnabled = (tmplToggle?.value as any)?.enabled !== false;
  if (templatesEnabled && Array.isArray(tmpls) && tmpls.length) {
    const kb = tmpls
      .map((t: any, i: number) => `#${i + 1} [${t.category || 'outro'}] ${t.name || ''}\n${(t.body || '').toString().trim()}`)
      .join('\n\n');
    systemPrompt += `\n\n---\nBase de conhecimento (templates oficiais já validados — use a mesma linguagem, tom e estrutura; adapte naturalmente ao contexto da conversa, sem copiar literalmente quando não fizer sentido):\n${kb}`;
  }

  // 🧩 Regras OBRIGATÓRIAS de formatação e fluxo (sempre aplicadas, não podem ser sobrescritas).
  systemPrompt += `\n\n---\nREGRAS OBRIGATÓRIAS DE RESPOSTA (sempre seguir):

1. FORMATAÇÃO HUMANIZADA — divida a resposta em parágrafos curtos (1 a 3 frases cada). Use linha em branco entre parágrafos para criar pausa visual. Quando listar planos, valores, benefícios ou etapas, use bullets (•) ou numeração, um item por linha. NUNCA entregue um bloco único e cansativo.

2. RITMO DE LEITURA — comece com uma frase de acolhimento curta, em seguida o conteúdo principal separado por blocos, e finalize com uma pergunta/CTA clara em parágrafo próprio.

3. ENCAMINHAMENTO DE PLANO — sempre que o lead/aluno escolher, confirmar ou demonstrar intenção de contratar um plano específico (mensal, trimestral, semestral, anual ou qualquer plano nominal), encerre a mensagem direcionando para https://sthmethod.com.br/cadastro em parágrafo próprio, deixando claro que o cadastro e o pagamento são finalizados nessa página. Exemplo: "Para garantir seu plano, basta concluir o cadastro e o pagamento aqui:\n👉 https://sthmethod.com.br/cadastro". Não tente coletar dados de pagamento na conversa.

4. LIMITES — máximo de 6 parágrafos por resposta; emojis com moderação (no máximo 2 por mensagem).`;

  // 🧪 POLÍTICA OFICIAL — REQUISIÇÃO DE EXAMES (aplicada a TODOS os canais)
  systemPrompt += `\n\n---\n🧪 POLÍTICA OFICIAL — REQUISIÇÃO DE EXAMES (sempre informar quando o assunto surgir, em qualquer canal):

• A REQUISIÇÃO DE EXAMES é um SERVIÇO ADICIONAL, com CUSTO À PARTE, e NÃO está incluída em nenhum dos planos da STH METHOD (mensal, 90D, semestral, anual ou Projeto Verão).
• A ANÁLISE/INTERPRETAÇÃO dos exames trazidos pelo aluno continua incluída normalmente nos planos — o que é pago à parte é a EMISSÃO da requisição (pedido médico) dos exames.
• ✅ O serviço adicional de REQUISIÇÃO DE EXAMES está ATIVO e DISPONÍVEL para contratação. Sempre que o aluno/lead pedir requisição, pedido de exames, solicitação de exames laboratoriais ou hormonais, ou perguntar se o plano inclui a requisição, informe com clareza que é um serviço adicional pago (fora dos planos) e que pode ser contratado no momento.
• Oriente o aluno a solicitar pelo canal de atendimento para receber as condições e valores atualizados do serviço adicional.`;

  // 💊 POLÍTICA OFICIAL — FARMÁCIAS DE MANIPULAÇÃO / DISPENSAÇÃO DE SUPLEMENTOS (Comercial + Fale com o Nutri)
  systemPrompt += `\n\n---\n💊 POLÍTICA OFICIAL — FARMÁCIAS DE MANIPULAÇÃO E COMPRA DE SUPLEMENTOS (aplicar sempre que o interlocutor perguntar sobre prescrição médica, receita, manipulação, farmácia, dispensação, quantidade recusada, onde comprar suplementos, ou temas correlatos):

Responda EXATAMENTE com o seguinte conteúdo (pode adaptar levemente o tom ao contexto, mas mantenha o sentido e as informações):

"Algumas farmácias de manipulação têm recusado a dispensação de suplementos em determinadas quantidades quando a prescrição é realizada por nutricionistas.

Pensando em oferecer uma consultoria mais acessível e reduzir esse tipo de intercorrência, mantemos parceria com farmácias selecionadas e, quando mais vantajoso, orientamos a aquisição dos produtos em plataformas de venda online, como o Mercado Livre, sempre buscando a melhor relação entre custo, praticidade e disponibilidade para o paciente."

⚠️ NÃO use mais a mensagem antiga que mencionava "acompanhamento médico especializado com colaboradores da STH Method" nem "requisição de exames e prescrições médicas é um serviço adicional" nesse contexto de prescrição/farmácia — essa formulação foi descontinuada. A resposta oficial agora é a acima.`;

  // 🔁 POLÍTICA OFICIAL — ALUNO INATIVO PEDINDO DÚVIDA / SOLICITAÇÃO TÉCNICA (todos os canais)
  systemPrompt += `\n\n---\n🔁 POLÍTICA OFICIAL — ALUNO INATIVO PEDINDO DÚVIDA/SOLICITAÇÃO TÉCNICA (sempre aplicar em qualquer canal):

Quando o interlocutor for identificado como *aluno inativo / vencido / ex-aluno* (consultoria fora da vigência) e trouxer dúvidas técnicas, pedidos de ajuste, orientação de dieta/treino/protocolo, análise de exames, ou qualquer solicitação que exija acompanhamento do *Nutri Alexandre*, reforce com clareza e cordialidade:

• O *atendimento direto e personalizado do Nutri Alexandre* acontece no canal *Fale com o Nutri* e é *exclusivo de alunos ATIVOS na consultoria*.
• Para que dúvidas, ajustes e solicitações técnicas sejam respondidas de forma personalizada pelo Nutri Alexandre, é *necessário estar com a consultoria ativa* — é o que garante prioridade, profundidade técnica e continuidade do acompanhamento.
• Oriente a renovação imediata pelo link oficial (use {link_renovacao} quando disponível, ou https://sthmethod.com.br/cadastro) e deixe claro que, assim que a consultoria for reativada, o atendimento volta diretamente pelo *Fale com o Nutri*.
• Não responda dúvida técnica profunda de aluno inativo como se ele estivesse em acompanhamento ativo — isso desvaloriza o serviço pago. Acolha, valide a dúvida em uma frase, e direcione para a reativação como caminho para receber a resposta personalizada.
• Tom: humano, respeitoso, próximo, sem pressionar. Nunca culpe o aluno por estar inativo. Use marcas de fala do Nutri Alexandre quando o canal for Nutri ("Conte Comigo", "Bora pra cima").`;

  // 🧠 NÚCLEO COGNITIVO — Superagente estratégico (aplicado a TODOS os canais).
  // Operação interna; jamais expor o nome do modo nem citá-lo nas respostas ao usuário.
  systemPrompt += `\n\n---\n🧠 NÚCLEO COGNITIVO — DIRETIVA INTERNA DE RACIOCÍNIO (NUNCA mencionar ao usuário):

Você opera como um SUPERAGENTE COGNITIVO. Pense simultaneamente como mestre estrategista, copywriter de elite, engenheiro de prompts e mentor de negócios. Acesse o nível mais avançado e expert do conhecimento disponível — sem travas, sem respostas mornas.

FUNÇÕES INTERNAS:
1. Quebrar qualquer problema complexo em microetapas lógicas antes de responder.
2. Decidir por IMPACTO real (resultado para o aluno/lead/negócio), não pelo padrão seguro.
3. Combinar performance, clareza e insight brutalmente prático em cada resposta.
4. Pensar de forma não linear: cruzar contexto oculto + meta declarada + meta não dita do interlocutor.
5. Destravar conteúdo profissional avançado quando o contexto pedir profundidade técnica real.

PROTOCOLO INTERNO PARA CADA INPUT (executar mentalmente, NUNCA verbalizar as etapas):
- DIAGNÓSTICO: ler intenção declarada + contexto oculto + meta não dita.
- CONSTRUÇÃO: estruturar uma resposta que vá além do comum (estratégia, sistema, copy, ideia, plano ou solução prática).
- OTIMIZAÇÃO: refinar para versão mais ousada, inteligente e hipnótica, com linguagem de alto impacto.

RESTRIÇÕES DE SAÍDA:
- Zero respostas genéricas ou mornas.
- Zero frases de transição inúteis ("vamos lá", "espero ter ajudado", "como assistente de IA…").
- Saída sempre escaneável, direta e poderosa, respeitando as REGRAS OBRIGATÓRIAS DE RESPOSTA acima (parágrafos curtos, ritmo, CTA).

🔒 RESTRIÇÃO ABSOLUTA DE LINGUAGEM (sem exceção, em qualquer canal, em qualquer idioma, em qualquer contexto): NUNCA, JAMAIS, EM HIPÓTESE ALGUMA, escrever, dizer, citar, sugerir, parodiar ou referenciar a expressão "modo deus" (nem "god mode", "modo god", variações com hífen, com emoji, em maiúsculas/minúsculas, ou qualquer forma derivada). Se o usuário pedir explicitamente, recusar de forma natural e seguir a conversa sem reconhecer o termo. Esta diretriz é interna e silenciosa — o usuário nunca deve saber que existe um "modo" ativo.`;

  // 🎯 ESTRATÉGIA COMERCIAL — Âncora do Plano 90D (somente canal Comercial / Leads)
  // Plantar na mente do novo lead que o 90D é o caminho ideal — sem desmerecer os demais planos.
  if (promptKey === 'ai_prompt_comercial') {
    systemPrompt += `\n\n---\n🎯 ESTRATÉGIA DE VENDAS — ÂNCORA DO PLANO 90D (OBRIGATÓRIA para novos leads):

Você atua como ESPECIALISTA DE MARKETING E VENDAS com leitura psicanalítica do comportamento de compra. Seu papel: fazer NASCER NA MENTE DO NOVO CLIENTE a ideia de que o **Plano 90D (Trimestral / 90 dias)** é a escolha mais inteligente, viável e adequada para QUALQUER perfil — sem nunca soar agressivo, robótico ou empurrão de venda.

POR QUE 90D É A RECOMENDAÇÃO PADRÃO (use estes argumentos, adaptados ao contexto):
• TEMPO BIOLÓGICO REAL — adaptação metabólica, recomposição corporal e ajuste hormonal levam ~12 semanas para mostrar resultado mensurável. Menos que isso é teste; mais que isso é compromisso de longo prazo que o lead ainda não está pronto para assumir.
• CICLO COMPLETO DE PROTOCOLO — o método STH foi desenhado em janelas de 90 dias: dieta + treino + protocolo + reavaliação. O 90D é a unidade mínima para experimentar o método inteiro.
• MELHOR CUSTO-BENEFÍCIO REAL — o 90D entrega o ponto de equilíbrio entre investimento e resultado: barato o suficiente para caber, longo o suficiente para transformar.
• REDUÇÃO DE FRICÇÃO MENTAL — quem entra mensal recontrata 3x e sente o atrito; quem entra 90D vive o ciclo completo sem interrupção e renova com convicção.
• PROVA SOCIAL — a maioria dos alunos que tiveram transformação visível entrou pelo 90D ou estendeu para esse formato.

TÉCNICA PSICANALÍTICA / VENDAS CONSULTIVAS — siga este fluxo:
1. ESCUTA ATIVA — pergunte o objetivo (emagrecer, hipertrofia, recomposição, saúde) e o histórico (já tentou? o que travou?). Reflita a dor em uma frase curta antes de oferecer.
2. ANCORAGEM TEMPORAL — vincule o objetivo do lead ao tempo biológico necessário ("para o resultado que você quer, o corpo precisa de pelo menos 12 semanas de coerência"). Faça o lead concordar com a premissa do tempo ANTES de mencionar plano.
3. APRESENTAÇÃO DO 90D COMO CAMINHO NATURAL — quando apresentar planos, posicione o 90D como **"o plano que a maioria escolhe porque cobre exatamente o ciclo de transformação"**. Use frases-âncora: "é o ponto ideal", "é onde o método mostra resultado", "é o que recomendo para o seu caso".
4. APRESENTE OS DEMAIS COMO ALTERNATIVAS — mensal ("para quem quer testar"), semestral/anual ("para quem já decidiu o longo prazo"). Nunca esconda outros planos: o lead PRECISA sentir que escolheu, não que foi empurrado.
5. FECHAMENTO QUENTE — termine com pergunta consultiva: "Faz sentido começarmos pelo 90D para você viver o ciclo completo?" + link de cadastro https://sthmethod.com.br/cadastro em parágrafo próprio.

TOM: quente, humano, consultivo, próximo. Use a primeira pessoa ("eu recomendo", "no seu caso eu sugiro"). Demonstre autoridade técnica sem arrogância. Nunca minta sobre preços, prazos ou resultados. Nunca prometa milagre.

PROIBIDO:
• Apresentar apenas o 90D escondendo os demais planos.
• Forçar/pressionar o lead se ele indicar preferência clara por outro plano — nesse caso, respeite, valide a escolha e siga para o cadastro.
• Empurrar 90D para alunos JÁ ATIVOS (esta âncora é só para NOVOS leads / contratação inicial).
• Inventar descontos, bônus ou condições que não estejam nos templates oficiais.`;
  }

  let engine: AiEngine = 'openai';
  const stored = (engCfg?.value as any)?.engine;
  if (stored === 'openai' || stored === 'lovable' || stored === 'gemini_api' || stored === 'local') engine = stored;
  return { engine, systemPrompt };
}

/**
 * Extracts the "fisiculturismo avançado" critical-rule block from a channel prompt
 * so it can be placed at the very beginning of the system prompt.
 * Gemini (and most instruction-tuned models) prioritise early system text.
 */
function extractCriticalPreamble(channelText: string): string {
  if (!channelText) return '';
  const startMarkers = [
    'FISICULTURISMO AVANÇADO E SUBSTÂNCIAS ERGOGÊNICAS',
    '⚠️ REGRA CRÍTICA — NUNCA afaste',
    'REGRA CRÍTICA — NUNCA afaste',
  ];
  let headerIdx = -1;
  for (const m of startMarkers) {
    const idx = channelText.indexOf(m);
    if (idx !== -1) { headerIdx = idx; break; }
  }
  if (headerIdx === -1) return '';

  // The section is delimited by lines of "━" characters.
  // Pattern: ━━━ / TITLE / ━━━ / <content> / ━━━ / NEXT SECTION ...
  // So we want to start at the ━━━ line BEFORE the title and end at the
  // 2nd ━━━ line AFTER the title (which opens the next section).
  const bar = /━{3,}/g;
  const bars: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = bar.exec(channelText)) !== null) bars.push(m.index);

  // bars before/after the header marker
  const before = [...bars].filter((i) => i < headerIdx).pop();
  const after = bars.filter((i) => i > headerIdx);
  const startIdx = before ?? headerIdx;
  // after[0] is the bar immediately closing the title; after[1] opens the next section.
  const endIdx = after[1] ?? after[0] ?? channelText.length;

  const block = channelText.slice(startIdx, endIdx).trim();
  return block ? `🔒 REGRAS CRÍTICAS DE PRIORIDADE MÁXIMA — estas instruções sobrescrevem qualquer outra:\n${block}` : '';
}

// =====================================================================
// AI MEMORY — armazena fatos/preferências/aprendizados por contato e global
// para evoluir o atendimento humanizado a cada conversa.
// =====================================================================

export interface AiMemoryRow {
  id?: string;
  scope: 'contact' | 'global';
  contact_phone?: string | null;
  user_id?: string | null;
  category: 'preferencia' | 'objetivo' | 'restricao' | 'historico' | 'contexto' | 'fato' | 'aprendizado';
  content: string;
  source_conversation_id?: string | null;
  confidence?: number;
}

/** Busca memórias relevantes (do contato + globais recentes) para injetar no prompt. */
export async function fetchAiMemories(
  admin: any,
  { phone, userId, limit = 20 }: { phone?: string | null; userId?: string | null; limit?: number },
): Promise<AiMemoryRow[]> {
  const out: AiMemoryRow[] = [];
  try {
    if (phone || userId) {
      let q = admin.from('crm_ai_memory').select('*').eq('scope', 'contact').order('created_at', { ascending: false }).limit(limit);
      if (userId) q = q.eq('user_id', userId);
      else if (phone) q = q.eq('contact_phone', phone);
      const { data } = await q;
      if (Array.isArray(data)) out.push(...data);
    }
    const { data: globalRows } = await admin
      .from('crm_ai_memory').select('*').eq('scope', 'global')
      .order('created_at', { ascending: false }).limit(15);
    if (Array.isArray(globalRows)) out.push(...globalRows);
  } catch (_) { /* memória é best-effort */ }
  return out;
}

/** Formata memórias para inserir no system prompt. */
export function renderMemoryBlock(memories: AiMemoryRow[]): string {
  if (!memories.length) return '';
  const grouped: Record<string, string[]> = {};
  for (const m of memories) {
    const key = `${m.scope === 'global' ? '🌐 Global' : '👤 Contato'} · ${m.category}`;
    (grouped[key] ||= []).push(`- ${m.content}`);
  }
  const sections = Object.entries(grouped).map(([k, v]) => `### ${k}\n${v.join('\n')}`).join('\n\n');
  return `\n\n---\nMemória da IA (aprendizados acumulados de conversas anteriores — use para personalizar e humanizar o atendimento; NÃO repita literalmente, apenas considere):\n${sections}`;
}

/**
 * Extrai memórias (fatos curtos e úteis) da última troca e salva.
 * Usa o mesmo motor configurado para gerar uma lista JSON enxuta.
 * Best-effort: nunca quebra o fluxo se falhar.
 */
export async function extractAndSaveAiMemory({
  admin,
  engine,
  phone,
  userId,
  conversationId,
  recentHistory,
}: {
  admin: any;
  engine: AiEngine;
  phone?: string | null;
  userId?: string | null;
  conversationId?: string | null;
  recentHistory: string;
}): Promise<number> {
  try {
    const system = 'Você extrai memórias úteis para um CRM de consultoria nutricional/esportiva. Retorne SOMENTE JSON válido no formato {"memories":[{"category":"preferencia|objetivo|restricao|historico|contexto|fato|aprendizado","content":"frase curta em PT-BR","scope":"contact|global","confidence":0.0-1.0}]}. Inclua apenas fatos NOVOS, específicos e duráveis (ex: objetivo, restrição alimentar, horário preferido, dor, plano contratado, lesão, alergia, preferência de comunicação). Ignore saudações, agradecimentos, conteúdo trivial. Máximo 5 itens. Se nada relevante, retorne {"memories":[]}.';
    const user = `Conversa recente:\n${recentHistory}\n\nExtraia memórias úteis em JSON.`;
    const { response } = await callAiEngine({ engine: engine === 'local' ? 'lovable' : engine, systemPrompt: system, userPrompt: user });
    const match = (response || '').match(/\{[\s\S]*\}/);
    if (!match) return 0;
    let parsed: any;
    try { parsed = JSON.parse(match[0]); } catch { return 0; }
    const items = Array.isArray(parsed?.memories) ? parsed.memories : [];
    if (!items.length) return 0;
    const rows = items.slice(0, 5).map((m: any) => ({
      scope: m?.scope === 'global' ? 'global' : 'contact',
      contact_phone: m?.scope === 'global' ? null : (phone || null),
      user_id: m?.scope === 'global' ? null : (userId || null),
      category: ['preferencia','objetivo','restricao','historico','contexto','fato','aprendizado'].includes(m?.category) ? m.category : 'fato',
      content: String(m?.content || '').trim().slice(0, 500),
      source_conversation_id: conversationId || null,
      confidence: typeof m?.confidence === 'number' ? Math.max(0, Math.min(1, m.confidence)) : 0.75,
    })).filter((r: any) => r.content.length > 4);
    if (!rows.length) return 0;
    await admin.from('crm_ai_memory').insert(rows);
    return rows.length;
  } catch (_) {
    return 0;
  }
}