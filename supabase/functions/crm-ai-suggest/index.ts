import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

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

    // Load admin-editable Comercial assistant prompt + engine choice
    let systemPrompt = 'Você é um assistente de atendimento ao aluno da consultoria STH METHOD. Seja claro, técnico, neutro e cordial. Responda em português do Brasil.';
    let engine: 'lovable' | 'local' | 'gemini_api' = 'lovable';
    try {
      const [{ data: cfg }, { data: engCfg }] = await Promise.all([
        supabase.from('crm_settings').select('value').eq('key', 'ai_prompt_comercial').maybeSingle(),
        supabase.from('crm_settings').select('value').eq('key', 'ai_engine').maybeSingle(),
      ]);
      const stored = (cfg?.value as any)?.prompt;
      if (stored && typeof stored === 'string' && stored.trim().length > 0) systemPrompt = stored;
      const storedEng = (engCfg?.value as any)?.engine;
      if (storedEng === 'lovable' || storedEng === 'local' || storedEng === 'gemini_api') engine = storedEng;
    } catch (_) { /* fallback default */ }

    // Build context: dossier + last 10 messages
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
      const digits = String(phone).replace(/\D/g, '');
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, objective, weight')
        .or(`phone.eq.${digits},phone.eq.${digits.startsWith('55') ? digits.slice(2) : '55' + digits}`)
        .limit(1);
      if (profile?.[0]) context += `Aluno: ${profile[0].full_name} | Objetivo: ${profile[0].objective || '—'} | Peso: ${profile[0].weight || '—'}kg\n\n`;
    }

    const userPrompt = customPrompt
      ? customPrompt
      : 'Com base no contexto acima, sugira uma resposta curta, cordial e profissional (tom STH METHOD, neutro e técnico, em português do Brasil). Não use emojis em excesso. Máximo 4 frases.';

    let response = '';
    let modelLabel = '';

    if (engine === 'local') {
      response = localEngineReply(customPrompt || context);
      modelLabel = 'local/rules';
    } else if (engine === 'gemini_api') {
      const gkey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY_FALLBACK');
      if (!gkey) return new Response(JSON.stringify({ error: 'GEMINI_API_KEY missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      modelLabel = 'gemini-2.5-flash (api)';
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${gkey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: `${context}\n${userPrompt}` }] }],
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return new Response(JSON.stringify({ error: 'Gemini API error', detail: d }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      response = (d as any)?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
    } else {
      const apiKey = Deno.env.get('LOVABLE_API_KEY');
      if (!apiKey) return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      modelLabel = 'google/gemini-2.5-flash';
      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: modelLabel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${context}\n${userPrompt}` },
          ],
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return new Response(JSON.stringify({ error: 'AI gateway error', detail: data }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      response = (data as any)?.choices?.[0]?.message?.content || '';
    }

    return new Response(JSON.stringify({ response, model: modelLabel, engine }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('crm-ai-suggest', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function localEngineReply(input: string): string {
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
    return 'Perfeito! O canal exclusivo para alunos ativos é o Fale com o Nutri: https://wa.me/5521998984153';
  }
  return 'Recebi sua mensagem. Para te ajudar melhor, responda com 1️⃣ Planos, 2️⃣ Como funciona, 3️⃣ Falar com consultor ou 4️⃣ Já sou aluno.';
}