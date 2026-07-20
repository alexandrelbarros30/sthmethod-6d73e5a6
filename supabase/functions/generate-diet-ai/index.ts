import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TACO_REF = `TABELA TACO (por 100g/ml) — use estes valores exatos:
- Ovo inteiro cru: 143 kcal | 13.0 P | 1.6 C | 9.5 G (1 ovo médio=50g)
- Clara: 43 kcal | 10.9 P | 0.7 C | 0 G
- Aveia flocos: 394 kcal | 13.9 P | 66.6 C | 8.5 G
- Mamão papaia: 40 kcal | 0.5 P | 10.4 C | 0.1 G
- Banana prata: 98 kcal | 1.3 P | 26 C | 0.1 G
- Arroz branco cozido: 128 kcal | 2.5 P | 28.1 C | 0.2 G
- Arroz integral cozido: 124 kcal | 2.6 P | 25.8 C | 1 G
- Feijão carioca cozido: 76 kcal | 4.8 P | 13.6 C | 0.5 G
- Batata inglesa cozida: 52 kcal | 1.2 P | 11.9 C | 0 G
- Batata doce cozida: 77 kcal | 0.6 P | 18.4 C | 0.1 G
- Macarrão cozido: 111 kcal | 3.4 P | 23.5 C | 0.6 G
- Pão francês: 300 kcal | 8 P | 58.6 C | 3.1 G (1 un=50g)
- Tapioca hidratada: 240 kcal | 0 P | 60 C | 0 G
- Peito frango cozido s/pele: 163 kcal | 32 P | 0 C | 3.2 G
- Patinho cozido: 219 kcal | 35.9 P | 0 C | 7.3 G
- Carne moída magra cozida: 212 kcal | 27 P | 0 C | 11 G
- Tilápia cozida: 117 kcal | 25.5 P | 0 C | 1.7 G
- Salmão grelhado: 211 kcal | 23.5 P | 0 C | 12.5 G
- Leite integral: 61 kcal | 2.9 P | 4.3 C | 3.2 G
- Iogurte natural desnatado: 41 kcal | 4.6 P | 5.6 C | 0.1 G
- Queijo minas frescal: 264 kcal | 17.4 P | 3.2 C | 20.2 G
- Whey concentrado: 400 kcal | 80 P | 7 C | 6 G (1 scoop=30g)
- Azeite oliva: 884 kcal | 0 P | 0 C | 100 G (1 cs=13g)
- Pasta amendoim: 596 kcal | 25 P | 15 C | 50 G
- Abacate: 96 kcal | 1.2 P | 6 C | 8.4 G
- Brócolis cozido: 25 kcal | 2.1 P | 4 C | 0.4 G`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      mode = "generate", // "generate" | "review"
      brief = {},
      freeText = "",
      dietContent = "",
      studentId = null,
      includePhotos = true,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isReview = mode === "review";

    // ---------- Fetch student body photos (latest per angle + previous for comparison) ----------
    type PhotoItem = { label: string; url: string; taken_at: string };
    const photos: PhotoItem[] = [];
    if (includePhotos && studentId && !isReview) {
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
        const { data: imgs } = await admin
          .from("body_images")
          .select("type, image_url, storage_path, uploaded_at")
          .eq("user_id", studentId)
          .order("uploaded_at", { ascending: false })
          .limit(12);
        const byType: Record<string, any[]> = {};
        for (const r of imgs || []) {
          const t = String(r.type || "").toLowerCase();
          if (!byType[t]) byType[t] = [];
          if (byType[t].length < 1) byType[t].push(r); // apenas a mais recente por ângulo (reduz payload)
        }
        for (const [t, arr] of Object.entries(byType)) {
          for (let i = 0; i < arr.length; i++) {
            const r = arr[i];
            let url = r.image_url as string | null;
            if (r.storage_path) {
              const { data: signed } = await admin.storage
                .from("body-images")
                .createSignedUrl(r.storage_path, 60 * 30);
              if (signed?.signedUrl) url = signed.signedUrl;
            }
            if (url) photos.push({
              label: `${t}${i === 0 ? " (mais recente)" : " (anterior)"} — ${new Date(r.uploaded_at).toLocaleDateString("pt-BR")}`,
              url,
              taken_at: r.uploaded_at,
            });
          }
        }
      } catch (e) {
        console.warn("photo fetch failed", e);
      }
    }

    const systemPrompt = isReview
      ? `Você é um nutricionista sênior revisando um cardápio brasileiro. Avalie coerência, distribuição de macros ao longo do dia, adequação ao objetivo, variedade, praticidade e possíveis melhorias. Use TACO/TBCA como referência.\n\n${TACO_REF}`
      : `Você é um nutricionista especialista em cardápios brasileiros, no estilo STH METHOD.
Monte um cardápio no PADRÃO STH METHOD (HTML rico usado no portal do aluno). NÃO invente valores nutricionais — use TACO/TBCA. Temperatura 0.

${photos.length ? `AVALIAÇÃO VISUAL DA EVOLUÇÃO CORPORAL:
Você receberá ${photos.length} foto(s) do aluno (frente/costas/perfil, mais recente e anterior quando disponível). Observe silhueta, composição corporal aparente, retenção hídrica, distribuição de tecido adiposo e evolução entre datas. Use esta leitura visual para calibrar a estratégia do cardápio (déficit/superávit, distribuição de carbo, timing pré/pós treino, hidratação, sódio). NÃO faça diagnóstico médico. Descreva sua leitura visual no campo "notes" em 1-2 frases e ajuste o cardápio de acordo — SEMPRE respeitando o briefing do admin/consultor (kcal alvo, macros, restrições, preferências e observações livres têm prioridade absoluta sobre sua leitura visual).\n` : ""}

FORMATO OBRIGATÓRIO — HTML PURO (sem markdown, sem \`\`\`), exatamente como o exemplo:

<p><strong>Refeição 01: Desjejum (Ativação Metabólica)</strong></p>
<p><strong>"⭐ BASE:</strong> Omelete de 1 ovo inteiro + 3 claras de ovo + 40g de farelo de aveia integral + 100g de mamão formosa.</p>
<p><strong>Opção 2:</strong> Shake com 30g de Whey Protein + 40g de farelo de aveia + 100g de morangos.</p>
<p><strong>Opção 3:</strong> 2 fatias de pão integral (50g) + 100g de peito de frango desfiado + 30g de queijo cottage zero.</p>
<p><strong>Opção 4:</strong> 170g de iogurte grego zero açúcar + 25g de Whey + 25g de granola integral.<strong>"</strong></p>
<p><strong>Macros da Refeição 01:</strong> 420 kcal | P: 35g | C: 40g | G: 12g</p>
<p><strong>Refeição 02: Almoço (Sustentação Anabólica)</strong></p>
<p><strong>"⭐ BASE:</strong> ... </p>
<p><strong>Opção 2:</strong> ...</p>
<p><strong>Opção 3:</strong> ...</p>
<p><strong>Opção 4:</strong> ...<strong>"</strong></p>
<p><strong>Macros da Refeição 02:</strong> 650 kcal | P: 50g | C: 70g | G: 18g</p>
<p><strong>TOTAL DIÁRIO:</strong> 2500 kcal | P: 180g | C: 280g | G: 70g</p>

REGRAS DE FORMATAÇÃO (obrigatórias):
- Cada refeição começa com <p><strong>Refeição NN: Nome (Subtítulo estratégico)</strong></p> (números 01, 02, 03...). NUNCA usar <ul>/<li> no cabeçalho — o cabeçalho não pode aparecer com bolinha/marcador de lista.
- Cada refeição tem SEMPRE 4 blocos: "⭐ BASE" + Opção 2 + Opção 3 + Opção 4 (substituições isocalóricas equivalentes em kcal e macros à BASE, com tolerância ±5%).
- Rótulos entre <strong>...</strong>. Abre aspas dupla no BASE (<strong>"⭐ BASE:</strong>) e fecha aspas dupla no fim da Opção 4 (<strong>"</strong></p>).
- Quantidades explícitas em g/ml/unidades. Nomes de alimentos em português BR.
- Nomes de refeição típicos: Desjejum, Colação, Almoço, Lanche da Tarde, Pré-Treino, Pós-Treino, Jantar, Ceia (adaptar ao número pedido).
- Subtítulos estratégicos entre parênteses (ex: "Ativação Metabólica", "Sustentação Anabólica", "Carga de Glicogênio", "Manutenção Nitrogenada", "Recuperação Noturna").
- Logo após a Opção 4 de CADA refeição, inclua UMA linha de macros no formato exato: <p><strong>Macros da Refeição NN:</strong> XXX kcal | P: XXg | C: XXg | G: XXg</p>
- Ao final de todas as refeições, inclua UMA linha de total no formato exato: <p><strong>TOTAL DIÁRIO:</strong> XXXX kcal | P: XXXg | C: XXXg | G: XXg</p>
- TODOS os valores de kcal, proteína, carboidrato e gordura DEVEM ser NÚMEROS INTEIROS (arredondados). NUNCA usar vírgula, ponto decimal ou casas decimais. Ex: use "420" e "35g", nunca "419,7" ou "35.2g".

${TACO_REF}

REGRAS:
- Respeite kcal alvo, macros alvo (P/C/G), número de refeições e restrições/preferências informadas.
- Calcule os macros de cada refeição usando SEMPRE a opção BASE via regra de três dos valores TACO acima; some para o total. Arredonde cada valor para inteiro antes de exibir.
- Opção 2, 3 e 4 devem ser aproximadamente isocalóricas e isomacros em relação à BASE.
- Campo diet_text DEVE conter o HTML completo pronto para renderizar no portal do aluno.
- Nos campos numéricos do tool call (energy_kcal, protein_g, carbs_g, fat_g), retorne SEMPRE valores inteiros (sem casas decimais).
- Retorne APENAS via tool call.`;

    const userText = isReview
      ? `Revise este cardápio e devolva análise + sugestões:\n\n${dietContent}`
      : `Brief estruturado:\n${JSON.stringify(brief, null, 2)}\n\nObservações livres do admin:\n${freeText || "(nenhuma)"}\n\nMonte o cardápio agora.`;

    // Build multimodal user content when photos are available
    const userContent: any = photos.length && !isReview
      ? [
          { type: "text", text: userText + `\n\nFotos anexadas para leitura visual:\n` + photos.map((p, i) => `${i + 1}. ${p.label}`).join("\n") },
          ...photos.map((p) => ({ type: "image_url", image_url: { url: p.url } })),
        ]
      : userText;

    const tool = isReview
      ? {
          type: "function",
          function: {
            name: "return_diet_review",
            description: "Return diet review with issues and suggestions",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "number", description: "0-10" },
                summary: { type: "string" },
                issues: { type: "array", items: { type: "string" } },
                suggestions: { type: "array", items: { type: "string" } },
                revised_diet: { type: "string", description: "Optional revised menu text in STH format" },
              },
              required: ["overall_score", "summary", "issues", "suggestions"],
              additionalProperties: false,
            },
          },
        }
      : {
          type: "function",
          function: {
            name: "return_generated_diet",
            description: "Return a generated diet menu with per-meal macros and totals",
            parameters: {
              type: "object",
              properties: {
                diet_text: { type: "string", description: "Full menu in STH format (plain text)" },
                meals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      meal_number: { type: "number" },
                      meal_name: { type: "string" },
                      items: { type: "array", items: { type: "string" } },
                      energy_kcal: { type: "number" },
                      protein_g: { type: "number" },
                      carbs_g: { type: "number" },
                      fat_g: { type: "number" },
                    },
                    required: ["meal_number", "meal_name", "items", "energy_kcal", "protein_g", "carbs_g", "fat_g"],
                    additionalProperties: false,
                  },
                },
                total: {
                  type: "object",
                  properties: {
                    energy_kcal: { type: "number" },
                    protein_g: { type: "number" },
                    carbs_g: { type: "number" },
                    fat_g: { type: "number" },
                  },
                  required: ["energy_kcal", "protein_g", "carbs_g", "fat_g"],
                  additionalProperties: false,
                },
                hydration_l: { type: "number", description: "Recommended water intake in liters" },
                notes: { type: "string" },
              },
              required: ["diet_text", "meals", "total"],
              additionalProperties: false,
            },
          },
        };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: tool.function.name } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos IA insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "IA não retornou resultado válido" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(toolCall.function.arguments);
    // Enforce integer macros/kcal as a safety net (in case the model returns decimals).
    const roundInt = (v: unknown) => (typeof v === "number" && isFinite(v) ? Math.round(v) : v);
    if (Array.isArray(parsed?.meals)) {
      parsed.meals = parsed.meals.map((m: any) => ({
        ...m,
        energy_kcal: roundInt(m?.energy_kcal),
        protein_g: roundInt(m?.protein_g),
        carbs_g: roundInt(m?.carbs_g),
        fat_g: roundInt(m?.fat_g),
      }));
    }
    if (parsed?.total) {
      parsed.total.energy_kcal = roundInt(parsed.total.energy_kcal);
      parsed.total.protein_g = roundInt(parsed.total.protein_g);
      parsed.total.carbs_g = roundInt(parsed.total.carbs_g);
      parsed.total.fat_g = roundInt(parsed.total.fat_g);
    }
    if (typeof parsed?.diet_text === "string") {
      // Strip decimals from numeric tokens followed by kcal/g (e.g. "419,7 kcal" -> "420 kcal", "35.2g" -> "35g")
      parsed.diet_text = parsed.diet_text.replace(
        /(\d+)[.,](\d+)\s*(kcal|g)\b/gi,
        (_m, intPart, decPart, unit) => `${Math.round(Number(`${intPart}.${decPart}`))}${unit.toLowerCase() === "g" ? "g" : " " + unit}`,
      );
    }
    return new Response(JSON.stringify({ ...parsed, _meta: { model: "google/gemini-2.5-flash", usage: data?.usage || null, photos_used: photos.length } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diet-ai error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});