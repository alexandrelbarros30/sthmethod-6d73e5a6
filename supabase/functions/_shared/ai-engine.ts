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
    return 'Perfeito! O canal exclusivo para alunos ativos é o Sucesso do Aluno: https://wa.me/5521972486650';
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
  promptKey: 'ai_prompt_comercial' | 'ai_prompt_sucesso' | 'ai_prompt_aluno',
): Promise<{ engine: AiEngine; systemPrompt: string }> {
  const defaultPrompt = 'Você é o assistente oficial da consultoria STH METHOD. Tom: claro, técnico, neutro, cordial. Português do Brasil. Nunca prometa resultados milagrosos nem invente dados clínicos. Quando o aluno pedir algo fora do escopo (alteração de dieta, treino ou protocolo), oriente que será encaminhado ao consultor humano.';
  const channelEnabledKey = `${promptKey}_enabled`;
  const [{ data: cfg }, { data: engCfg }, { data: globalCfg }, { data: globalToggle }, { data: channelToggle }] = await Promise.all([
    admin.from('crm_settings').select('value').eq('key', promptKey).maybeSingle(),
    admin.from('crm_settings').select('value').eq('key', 'ai_engine').maybeSingle(),
    admin.from('crm_settings').select('value').eq('key', 'ai_prompt_global').maybeSingle(),
    admin.from('crm_settings').select('value').eq('key', 'ai_prompt_global_enabled').maybeSingle(),
    admin.from('crm_settings').select('value').eq('key', channelEnabledKey).maybeSingle(),
  ]);
  const storedPrompt = (cfg?.value as any)?.prompt;
  const channelText = (typeof storedPrompt === 'string' && storedPrompt.trim()) ? storedPrompt.trim() : '';
  // Default: channel prompts are ENABLED unless explicitly set to false
  const channelEnabled = (channelToggle?.value as any)?.enabled !== false;
  const globalEnabled = (globalToggle?.value as any)?.enabled === true;
  const globalPromptRaw = (globalCfg?.value as any)?.prompt;
  const globalText = (typeof globalPromptRaw === 'string' && globalPromptRaw.trim()) ? globalPromptRaw.trim() : '';

  let systemPrompt = defaultPrompt;
  if (globalEnabled && globalText) {
    // Global is the base. Channel prompt acts as auxiliary only when enabled.
    systemPrompt = channelEnabled && channelText
      ? `${globalText}\n\n---\nInstruções auxiliares específicas deste canal:\n${channelText}`
      : globalText;
  } else if (channelEnabled && channelText) {
    systemPrompt = channelText;
  }
  let engine: AiEngine = 'openai';
  const stored = (engCfg?.value as any)?.engine;
  if (stored === 'openai' || stored === 'lovable' || stored === 'gemini_api' || stored === 'local') engine = stored;
  return { engine, systemPrompt };
}