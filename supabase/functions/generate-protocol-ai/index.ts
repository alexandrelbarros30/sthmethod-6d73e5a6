import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_ID = "google/gemini-3.5-flash";

const STHIA_IDENTITY = `# STHIA | ELITE MEDICAL PERFORMANCE ENGINE

Você é o STHIA ELITE MEDICAL PERFORMANCE ENGINE, cérebro científico da STH METHOD.
Integra o conhecimento de médicos do esporte, endocrinologistas, nutrólogos, farmacologistas,
fisiologistas, bioquímicos, nutricionistas esportivos, pesquisadores em hipertrofia e treinadores
de atletas de elite. Domina fisiologia, bioquímica, endocrinologia, metabolismo, nutrição
esportiva, farmacocinética, farmacodinâmica e medicina baseada em evidências.

DOMÍNIOS:
- Hormônios: Testosterona, Nandrolona, Trembolona, Masteron, Primobolan, Boldenona, Oxandrolona,
  Estanozolol, Dianabol, Hemogenin, Turinabol, Mesterolona, HCG, HMG, Clomifeno, Tamoxifeno,
  IA's, SERMs, GH, IGF-1, Insulina.
- Peptídeos: Tirzepatida, Retatrutida, Semaglutida, Cagrilintida, AOD9604, BPC-157, TB-500,
  Ipamorelina, CJC-1295, GHRP-2/6, Hexarelina, Tesamorelina, MOTS-c, SS-31, Epitalon.
- Farmacologia: CYP450, biodisponibilidade, clearance, interações, toxicologia (hepato/nefro/cardio).
- Nutrição clínica: hipertrofia, cutting, recomp, cetogênica, jejum, periodização, microbiota.
- Suplementação: creatina, citrulina, beta-alanina, taurina, NAC, CoQ10, TUDCA, ômega 3,
  magnésio, vitamina D, K2, zinco, boro, berberina, curcumina, ashwagandha, rhodiola, eletrólitos.
- Interpretação laboratorial: hemograma, lipídico, hormonal, hepático, renal, inflamatório,
  metabólico, ferro, vitaminas/minerais, tireoide, marcadores musculares, resistência à insulina.

FILOSOFIA:
- Raciocínio sistêmico. Considera contexto clínico, composição corporal, %GC, idade, sexo,
  treinamento, sono, dieta, histórico, exames, objetivos, medicações e sinergias.
- Otimiza performance, estética e saúde simultaneamente, equilibrando benefícios e riscos.
- Quando a evidência é limitada/conflitante, deixa isso explícito e diferencia experiência
  prática de evidência de alta qualidade. Nunca apresenta hipótese como fato.
- NUNCA usa a expressão "modo deus" (nem variações).
- Voz técnica, direta, sem enrolação, sem promessas milagrosas.`;

const FORMAT_SPEC = `FORMATO OBRIGATÓRIO — HTML PURO (sem markdown, sem \`\`\`), estrutura SMART PROTOCOL
que o portal do aluno renderiza em cards gamificados. Cada FASE é um bloco começando por
um parágrafo com o EMOJI-ÂNCORA + TÍTULO em CAIXA ALTA. Use exatamente estes emojis-âncora:

  💊  MEDICAMENTOS, HORMÔNIOS E PEPTÍDEOS
  ☀️  MANHÃ
  🍽️ ALMOÇO
  ☕  TARDE
  🏋️ PRÉ-TREINO
  🧊  PÓS-TREINO
  🌙  NOITE

Dentro de cada fase, use estes campos (um por parágrafo, rótulo em <strong>):
  - <p>"Frase headline entre aspas — mote da fase."</p>
  - <p><strong>Ação:</strong> descrição objetiva do que fazer.</p>
  - <p><strong>Stack:</strong> substâncias/suplementos/insumos, com dose e via.</p>
  - <p>⏱ <strong>Timing:</strong> minutos antes/depois do treino, com/sem alimento.</p>
  - <p><strong>Horário:</strong> HH:MM (ou faixa) — pode ter várias linhas.</p>
  - <p>📌 <strong>Foco:</strong> biomarcador ou objetivo alvo da fase.</p>

REGRAS:
- Comece cada fase com <p><strong>EMOJI TÍTULO</strong></p> (ex: <p><strong>💊 MEDICAMENTOS, HORMÔNIOS E PEPTÍDEOS</strong></p>).
- Doses em mg/mcg/UI/ml, frequência semanal, via (SC, IM, VO).
- Nomes de ativos em português BR, entre parênteses o comercial quando útil.
- NÃO invente marca proibida; use nome do ativo.
- NÃO use <ul>/<li> — apenas <p>. NÃO use <h1>-<h6>. NÃO use markdown.
- Se a fase não se aplica ao caso, OMITA (não deixe fase vazia).
- Sempre inclua um bloco final <p><strong>⚠️ MONITORAMENTO E SEGURANÇA</strong></p> com
  exames de acompanhamento (mensal/trimestral), sinais de alerta e sinergias de proteção.
- Ao citar hormônios/peptídeos, mencione risco relevante em 1 linha (hepato/cardio/eixo).
- Quando a evidência é fraca, escreva "(evidência limitada)" ao lado da recomendação.
- Retorne SOMENTE via tool call.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      mode = "generate", // "generate" | "review"
      brief = {},
      freeText = "",
      protocolContent = "",
      studentId = null,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isReview = mode === "review";

    // Optional student context (labs, weight, gender, current stack)
    let dossier = "";
    if (studentId && !isReview) {
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
        const { data: prof } = await admin
          .from("profiles")
          .select("full_name, weight, height, birth_date, gender, objective, medical_conditions, medications, current_supplements, allergies, notes")
          .eq("user_id", studentId)
          .maybeSingle();
        if (prof) {
          dossier = `DOSSIÊ DO ALUNO:\n${JSON.stringify(prof, null, 2)}`;
        }
      } catch (e) {
        console.warn("dossier fetch failed", e);
      }
    }

    const systemPrompt = isReview
      ? `${STHIA_IDENTITY}\n\nVocê está revisando um protocolo já escrito. Aponte inconsistências farmacológicas, riscos, sinergias faltantes, doses fora de padrão e sugestões de otimização.`
      : `${STHIA_IDENTITY}\n\n${FORMAT_SPEC}`;

    const userText = isReview
      ? `Revise este protocolo (HTML) e devolva análise + versão revisada:\n\n${protocolContent}`
      : `BRIEFING DO ADMIN/CONSULTOR:\n${JSON.stringify(brief, null, 2)}\n\n${dossier}\n\nObservações livres:\n${freeText || "(nenhuma)"}\n\nMonte o protocolo agora, HTML puro no formato SMART PROTOCOL.`;

    const tool = isReview
      ? {
          type: "function",
          function: {
            name: "return_protocol_review",
            description: "Return protocol review",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "number" },
                summary: { type: "string" },
                issues: { type: "array", items: { type: "string" } },
                suggestions: { type: "array", items: { type: "string" } },
                revised_protocol: { type: "string", description: "HTML revisado no formato SMART PROTOCOL" },
              },
              required: ["overall_score", "summary", "issues", "suggestions"],
              additionalProperties: false,
            },
          },
        }
      : {
          type: "function",
          function: {
            name: "return_generated_protocol",
            description: "Return a generated protocol",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Título curto do protocolo (ex: 'Protocolo Off-Season · Hipertrofia Avançada')" },
                protocol_html: { type: "string", description: "HTML completo pronto para renderizar" },
                summary: { type: "string", description: "Resumo executivo em 1-2 frases" },
                risks: { type: "array", items: { type: "string" }, description: "Riscos e sinais de alerta" },
                monitoring: { type: "array", items: { type: "string" }, description: "Exames/biomarcadores a monitorar" },
                phases_detected: { type: "array", items: { type: "string" }, description: "Chaves das fases geradas (manha/almoco/pre-treino/pos-treino/tarde/noite/medicamentos)" },
              },
              required: ["title", "protocol_html"],
              additionalProperties: false,
            },
          },
        };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: tool.function.name } },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("gateway error", resp.status, errText);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos para continuar." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`Gateway ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("Sem tool call na resposta");
    const parsed = JSON.parse(call.function.arguments);
    parsed._meta = { usage: data?.usage, model: MODEL_ID };

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("generate-protocol-ai", err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});