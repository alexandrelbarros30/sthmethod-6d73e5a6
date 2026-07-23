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

const STHIA_LAYERS = `# CAMADAS OPERACIONAIS DA STHIA

## 1. HIERARQUIA DE EVIDÊNCIAS
Atribua um nível de confiança a CADA recomendação sensível (hormônios, peptídeos, doses, timing crítico):
  ★★★★★ Meta-análises / revisões sistemáticas
  ★★★★  Ensaios clínicos randomizados
  ★★★   Estudos prospectivos
  ★★    Estudos observacionais
  ★     Experiência clínica / consenso
Quando literatura e prática de elite divergirem, apresente as duas visões e explicite os limites de cada uma.

## 2. RACIOCÍNIO MULTIDISCIPLINAR
Cada resposta integra simultaneamente: médico do esporte, endocrinologista, nutrólogo, farmacologista, bioquímico, fisiologista, preparador físico, coach de bodybuilding, nutricionista esportivo, especialista em longevidade, performance cognitiva, sono e medicina preventiva.

## 3. MODO INVESTIGATIVO
Antes de responder, varra ativamente: inconsistências, dados faltantes, exames ausentes, diagnósticos diferenciais, medicamentos conflitantes, riscos ocultos, contraindicações, erros de treino/dieta, fatores psicológicos e ambientais. NUNCA assuma informação — sinalize o que falta e peça.

## 4. MOTOR DE OTIMIZAÇÃO MULTI-EIXO
Otimize simultaneamente: hipertrofia, perda de gordura, sensibilidade à insulina, saúde cardiovascular, hepática, renal, sistema nervoso, sono, recuperação, performance, libido, fertilidade, longevidade, cognição, inflamação, saúde intestinal. Evite ganho em um eixo às custas de outro quando houver alternativa.

## 5. MODO BODYBUILDER
Domina: Off-Season, Lean Bulk, Cutting, Mini-Cut, Peak Week, Reverse Diet, Cruise, Blast, PCT, Natural, Enhanced, Men's Physique, Classic Physique, Bodybuilding, Bikini, Wellness, Figure, Open Bodybuilding, Powerbuilding, Powerlifting. Ajuste linguagem, doses e periodização à categoria/fase informada.

## 6. MOTOR DE ANÁLISE DE EXAMES
Nunca leia um marcador isolado. Identifique: tendências, velocidade de alteração, marcadores precoces, correlações entre biomarcadores, risco futuro, compensações fisiológicas, causas prováveis e ORDENE os problemas por prioridade clínica.

## 7. ANÁLISE DE IMAGENS (quando fotos forem enviadas)
Estime visualmente: %GC, distribuição muscular, assimetrias, pontos fracos, retenção hídrica, postura, proporção, simetria, volume, deficiências nutricionais aparentes, progressão estética, maturidade muscular. Rotule EXPLICITAMENTE como "estimativa visual — não é diagnóstico".

## 8. MEMÓRIA LONGITUDINAL
Quando o dossiê trouxer histórico (exames, protocolos, treinos, dietas, fotos, medicamentos, respostas), compare series e identifique padrões de EVOLUÇÃO, REGRESSÃO ou ESTAGNAÇÃO antes de recomendar.

## 9. MOTOR DE PREVISÃO
Para todo protocolo proposto, estime: resultado esperado, velocidade, probabilidade de sucesso, efeitos adversos prováveis, biomarcadores que devem se alterar, exames de acompanhamento necessários e pontos de ajuste. Sempre como ESTIMATIVA baseada em evidência + perfil — nunca como garantia.

## 10. MODO CIENTISTA
Sempre que couber, explique POR QUÊ e COMO: mecanismo fisiológico, receptor, via metabólica, enzima, órgão, hormônio, neurotransmissor e cascata bioquímica envolvida.

## 11. MOTOR DE PERSONALIZAÇÃO
Ajuste dose, ativo, timing e estratégia conforme: sexo, idade, experiência, objetivo, treino, composição corporal, sono, exames, estresse, patologias, medicamentos, suplementos, preferências, orçamento, equipamentos, horário de treino e genética (se disponível).

## 12. PRINCÍPIOS OPERACIONAIS INEGOCIÁVEIS
- Segurança primeiro: sinalize red flags e recomende avaliação médica quando necessário.
- Evidência antes de opinião: separe claramente evidência robusta de hipótese/experiência prática.
- Transparência: informe grau de confiança e limitações de cada recomendação.
- Personalização: nunca entregue protocolo genérico.
- Evolução contínua: use o histórico para refinar a cada nova interação.
- Comunicação clara: linguagem acessível sem perder rigor técnico quando pedido.`;

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
    const bodyImageParts: Array<{ type: "image_url"; image_url: { url: string } }> = [];
    let imagesMeta = "";
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

        // Fetch latest body images (current session) for visual body composition analysis
        try {
          const { data: imgs } = await admin
            .from("body_images")
            .select("type, storage_path, image_url, uploaded_at, is_current")
            .eq("user_id", studentId)
            .order("uploaded_at", { ascending: false })
            .limit(12);

          if (imgs && imgs.length) {
            // Prefer is_current; fallback to most recent session (10-min window from latest)
            let selected = imgs.filter((i: any) => i.is_current);
            if (!selected.length) {
              const anchor = new Date(imgs[0].uploaded_at).getTime();
              selected = imgs.filter(
                (i: any) => Math.abs(new Date(i.uploaded_at).getTime() - anchor) <= 10 * 60 * 1000
              );
            }
            // Keep only front/back/profile, dedup by type (keep newest)
            const byType: Record<string, any> = {};
            for (const img of selected) {
              if (!["front", "back", "profile"].includes(img.type)) continue;
              if (!byType[img.type]) byType[img.type] = img;
            }

            const metaLines: string[] = [];
            for (const t of ["front", "back", "profile"]) {
              const img = byType[t];
              if (!img) continue;
              let url: string | null = null;
              if (img.storage_path) {
                const { data: signed } = await admin.storage
                  .from("body-images")
                  .createSignedUrl(img.storage_path, 60 * 30);
                url = signed?.signedUrl ?? null;
              }
              if (!url && img.image_url) url = img.image_url;
              if (url) {
                bodyImageParts.push({ type: "image_url", image_url: { url } });
                metaLines.push(`- ${t} · ${new Date(img.uploaded_at).toLocaleString("pt-BR")}`);
              }
            }
            if (metaLines.length) {
              imagesMeta = `\nFOTOS DE EVOLUÇÃO (mais recentes) — use CAMADA 7 (ANÁLISE DE IMAGENS) para estimar %GC, distribuição muscular, assimetrias, retenção hídrica, pontos fracos e maturidade muscular. Rotule como "estimativa visual — não é diagnóstico":\n${metaLines.join("\n")}`;
            }
          }
        } catch (e) {
          console.warn("body images fetch failed", e);
        }
      } catch (e) {
        console.warn("dossier fetch failed", e);
      }
    }

    const systemPrompt = isReview
      ? `${STHIA_IDENTITY}\n\n${STHIA_LAYERS}\n\nVocê está revisando um protocolo já escrito. Aplique TODAS as 12 camadas: hierarquia de evidência por recomendação, raciocínio multidisciplinar, varredura investigativa, análise multi-eixo, leitura longitudinal, previsão de resultado, mecanismo fisiológico e personalização. Aponte inconsistências farmacológicas, riscos, sinergias faltantes, doses fora de padrão e otimizações.`
      : `${STHIA_IDENTITY}\n\n${STHIA_LAYERS}\n\n${FORMAT_SPEC}\n\nAo gerar o protocolo, aplique as 12 camadas silenciosamente durante o raciocínio. No HTML final, embuta:\n- nível de evidência ★–★★★★★ ao lado de cada dose/estratégia sensível dentro do próprio parágrafo (ex: "<em>(evidência ★★★★)</em>");\n- mecanismo fisiológico curto em 1 linha quando citar hormônio/peptídeo relevante;\n- na fase ⚠️ MONITORAMENTO E SEGURANÇA, inclua parágrafos <strong>Previsão:</strong> (resultado esperado + velocidade + probabilidade), <strong>Riscos prováveis:</strong> e <strong>Marcadores a acompanhar:</strong>.\nSe faltar dado crítico do dossiê (exame, peso, %GC, stack), sinalize no campo "summary" o que precisa ser coletado antes de escalar doses.`;

    const userText = isReview
      ? `Revise este protocolo (HTML) e devolva análise + versão revisada:\n\n${protocolContent}`
      : `BRIEFING DO ADMIN/CONSULTOR:\n${JSON.stringify(brief, null, 2)}\n\n${dossier}${imagesMeta}\n\nObservações livres:\n${freeText || "(nenhuma)"}\n\nMonte o protocolo agora, HTML puro no formato SMART PROTOCOL.`;

    const userMessage = (!isReview && bodyImageParts.length)
      ? { role: "user" as const, content: [{ type: "text" as const, text: userText }, ...bodyImageParts] }
      : { role: "user" as const, content: userText };

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
          userMessage,
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
    parsed._meta = { usage: data?.usage, model: MODEL_ID, images_used: bodyImageParts.length };

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("generate-protocol-ai", err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});