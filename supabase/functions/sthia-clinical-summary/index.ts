// STHIA — Resumo do parecer clínico para o paciente/aluno.
// Recebe o parecer HTML completo e devolve um resumo curto, em linguagem simples,
// pronto para ser lido pelo aluno sem termos técnicos pesados.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_ID = "google/gemini-2.5-flash";

const SYSTEM = `Você é STHIA, cérebro clínico da STH METHOD. Sua tarefa aqui é
converter um parecer clínico técnico em um RESUMO FINAL PARA O PACIENTE/ALUNO.
Regras:
- Português brasileiro, tom acolhedor, direto, sem jargão médico pesado.
- Nunca prometa milagres. Nunca use a expressão "modo deus".
- Máximo ~250 palavras.
- Estrutura HTML PURA (sem markdown, sem code fences), usando apenas
  <p>, <strong>, <em>, <br>, <ul>, <li>.
- Estrutura fixa:
  <p><strong>💬 Resumo do seu parecer</strong></p>
  <p>{2-4 linhas explicando em linguagem simples como o aluno está.}</p>
  <p><strong>✅ O que está indo bem</strong></p>
  <ul><li>...</li></ul>
  <p><strong>⚠️ O que precisa de atenção</strong></p>
  <ul><li>...</li></ul>
  <p><strong>🎯 Próximos passos</strong></p>
  <ul><li>...</li></ul>
  <p><em>Este resumo é um apoio educativo e não substitui avaliação médica presencial.</em></p>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const { reportHtml = "", studentName = "" } = await req.json();
    if (!reportHtml) return new Response(JSON.stringify({ error: "reportHtml required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userText = `Aluno: ${studentName || "(sem nome)"}\n\nPARECER TÉCNICO COMPLETO (HTML):\n${reportHtml}\n\nGere agora o resumo final para o paciente no formato definido.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userText }],
      }),
    });

    if (!aiResp.ok) {
      const err = await aiResp.text();
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Créditos IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error ${aiResp.status}: ${err}`);
    }

    const aiJson = await aiResp.json();
    const summaryHtml = aiJson?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ summary_html: summaryHtml, model: MODEL_ID }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("sthia-clinical-summary", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});