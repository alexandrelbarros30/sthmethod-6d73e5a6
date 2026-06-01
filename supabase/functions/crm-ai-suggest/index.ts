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

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const model = 'google/gemini-2.5-flash';
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Você é um assistente de atendimento ao aluno da consultoria STH METHOD. Seja claro, técnico, neutro e cordial. Responda em português do Brasil.' },
          { role: 'user', content: `${context}\n${userPrompt}` },
        ],
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'AI gateway error', detail: data }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const response = (data as any)?.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ response, model }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('crm-ai-suggest', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});