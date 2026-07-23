import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_ID = "google/gemini-3-flash-preview";
const TARGET_TOLERANCE_PCT = 3;
const MAX_TARGET_RETRIES = 5;

type MacroTotal = {
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type MacroTargets = {
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

const numericTarget = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

const roundInt = (v: unknown) => (typeof v === "number" && isFinite(v) ? Math.round(v) : Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);

const emptyTotal = (): MacroTotal => ({ energy_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

const sumMealTotals = (meals: any[]): MacroTotal => {
  const total = emptyTotal();
  for (const m of meals || []) {
    total.energy_kcal += roundInt(m?.energy_kcal);
    total.protein_g += roundInt(m?.protein_g);
    total.carbs_g += roundInt(m?.carbs_g);
    total.fat_g += roundInt(m?.fat_g);
  }
  return total;
};

const normalizeGeneratedMacros = (parsed: any) => {
  if (Array.isArray(parsed?.meals)) {
    parsed.meals = parsed.meals
      .slice()
      .sort((a: any, b: any) => (Number(a?.meal_number) || 0) - (Number(b?.meal_number) || 0))
      .map((m: any, idx: number) => ({
        ...m,
        meal_number: roundInt(m?.meal_number) || idx + 1,
        energy_kcal: roundInt(m?.energy_kcal),
        protein_g: roundInt(m?.protein_g),
        carbs_g: roundInt(m?.carbs_g),
        fat_g: roundInt(m?.fat_g),
      }));
    // The meal cards are the source of truth. Never trust a model-written daily total
    // when it disagrees with the structured per-meal values shown to the student.
    parsed.total = sumMealTotals(parsed.meals);
  } else if (parsed?.total) {
    parsed.total.energy_kcal = roundInt(parsed.total.energy_kcal);
    parsed.total.protein_g = roundInt(parsed.total.protein_g);
    parsed.total.carbs_g = roundInt(parsed.total.carbs_g);
    parsed.total.fat_g = roundInt(parsed.total.fat_g);
  }
};

const computeQualityGate = (parsed: any, targets: MacroTargets | null, expectedMeals: number | null) => {
  normalizeGeneratedMacros(parsed);
  const total = parsed?.total || emptyTotal();
  const deviations: Record<string, number> = {};
  const violations: string[] = [];
  let worst = 0;

  if (targets) {
    for (const k of Object.keys(targets) as Array<keyof MacroTargets>) {
      const target = targets[k];
      const value = Number(total[k]);
      if (target && isFinite(value)) {
        const pct = Math.round(((value - target) / target) * 1000) / 10;
        deviations[k] = pct;
        worst = Math.max(worst, Math.abs(pct));
        if (Math.abs(pct) > TARGET_TOLERANCE_PCT) {
          const label = k === "energy_kcal" ? "kcal" : k === "protein_g" ? "proteína" : k === "carbs_g" ? "carboidrato" : "lipídio";
          const unit = k === "energy_kcal" ? "kcal" : "g";
          violations.push(`${label}: ${Math.round(value)}${unit} vs meta ${target}${unit} (${pct > 0 ? "+" : ""}${pct}%)`);
        }
      }
    }
  }

  const mealCount = Array.isArray(parsed?.meals) ? parsed.meals.length : 0;
  if (expectedMeals && mealCount !== expectedMeals) {
    violations.push(`nº de refeições: ${mealCount || 0} vs meta ${expectedMeals}`);
  }

  return {
    valid: violations.length === 0,
    violations,
    deviation_pct: deviations,
    worst_deviation_pct: Math.round(worst * 10) / 10,
    total,
    meal_count: mealCount,
    expected_meals: expectedMeals,
  };
};

const buildMealBudget = (targets: MacroTargets, nMeals: number) => {
  const presets: Record<number, number[]> = {
    3: [30, 40, 30],
    4: [25, 35, 25, 15],
    5: [20, 10, 30, 15, 25],
    6: [18, 10, 27, 12, 23, 10],
    7: [16, 8, 24, 10, 18, 14, 10],
  };
  const weights = presets[nMeals] || Array.from({ length: nMeals }, () => 100 / nMeals);
  const labels = Array.from({ length: nMeals }, (_v, i) => `Refeição ${String(i + 1).padStart(2, "0")}`);
  return labels.map((label, i) => {
    const pct = weights[i] / 100;
    const parts = [`${label}:`];
    if (targets.energy_kcal) parts.push(`~${Math.round(targets.energy_kcal * pct)} kcal`);
    if (targets.protein_g) parts.push(`P ~${Math.round(targets.protein_g * pct)}g`);
    if (targets.carbs_g) parts.push(`C ~${Math.round(targets.carbs_g * pct)}g`);
    if (targets.fat_g) parts.push(`G ~${Math.round(targets.fat_g * pct)}g`);
    return `- ${parts.join(" ")}`;
  }).join("\n");
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

// Reconcile generated macros with the SAME analyzer used on the student diet screen
// (supabase/functions/analyze-diet). This guarantees that "Cardápio IA (BETA)" and
// "Análise IA" show identical numbers instead of two divergent estimates.
async function reconcileWithAnalyzer(parsed: any): Promise<void> {
  if (!parsed || typeof parsed.diet_text !== "string" || !parsed.diet_text.trim()) return;
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const ANON = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !ANON) return;
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/analyze-diet`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}`, apikey: ANON },
      body: JSON.stringify({ dietContent: parsed.diet_text }),
    });
    if (!resp.ok) { console.warn("reconcile analyze-diet non-ok", resp.status); return; }
    const a = await resp.json();
    if (!a?.total || !Array.isArray(a?.meals)) return;
    const byNum: Record<string, any> = {};
    for (const m of a.meals) byNum[String(m.meal_number)] = m;
    if (Array.isArray(parsed.meals)) {
      parsed.meals = parsed.meals.map((m: any) => {
        const src = byNum[String(m?.meal_number)];
        if (!src) return m;
        return {
          ...m,
          energy_kcal: roundInt(src.energy_kcal),
          protein_g: roundInt(src.protein_g),
          carbs_g: roundInt(src.carbs_g),
          fat_g: roundInt(src.fat_g),
        };
      });
    }
    parsed.total = {
      energy_kcal: roundInt(a.total.energy_kcal),
      protein_g: roundInt(a.total.protein_g),
      carbs_g: roundInt(a.total.carbs_g),
      fat_g: roundInt(a.total.fat_g),
    };
    parsed._reconciled_with = "analyze-diet";
  } catch (e) {
    console.warn("reconcile analyze-diet failed", e);
  }
}

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
          .limit(60);
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
<p><strong>Refeição 02: Almoço (Sustentação Anabólica)</strong></p>
<p><strong>"⭐ BASE:</strong> ... </p>
<p><strong>Opção 2:</strong> ...</p>
<p><strong>Opção 3:</strong> ...</p>
<p><strong>Opção 4:</strong> ...<strong>"</strong></p>

REGRAS DE FORMATAÇÃO (obrigatórias):
- Cada refeição começa com <p><strong>Refeição NN: Nome (Subtítulo estratégico)</strong></p> (números 01, 02, 03...). NUNCA usar <ul>/<li> no cabeçalho — o cabeçalho não pode aparecer com bolinha/marcador de lista.
- Cada refeição tem SEMPRE 4 blocos: "⭐ BASE" + Opção 2 + Opção 3 + Opção 4 (substituições isocalóricas equivalentes em kcal e macros à BASE, com tolerância ±5%).
- Rótulos entre <strong>...</strong>. Abre aspas dupla no BASE (<strong>"⭐ BASE:</strong>) e fecha aspas dupla no fim da Opção 4 (<strong>"</strong></p>).
- Quantidades explícitas em g/ml/unidades. Nomes de alimentos em português BR.
- Nomes de refeição típicos: Desjejum, Colação, Almoço, Lanche da Tarde, Pré-Treino, Pós-Treino, Jantar, Ceia (adaptar ao número pedido).
- Subtítulos estratégicos entre parênteses (ex: "Ativação Metabólica", "Sustentação Anabólica", "Carga de Glicogênio", "Manutenção Nitrogenada", "Recuperação Noturna").
- NÃO inclua linha de macros por refeição no HTML (diet_text). Os macros por refeição são retornados apenas no tool call estruturado (campo meals).
- NÃO inclua linha de TOTAL DIÁRIO no HTML (diet_text). O total é retornado apenas no tool call estruturado (campo total).
- TODOS os valores de kcal, proteína, carboidrato e gordura DEVEM ser NÚMEROS INTEIROS (arredondados). NUNCA usar vírgula, ponto decimal ou casas decimais. Ex: use "420" e "35g", nunca "419,7" ou "35.2g".

${TACO_REF}

REGRAS:
- Respeite kcal alvo, macros alvo (P/C/G), número de refeições e restrições/preferências informadas como CONTRATO DE ENTREGA. Se kcal alvo = 1900, total final precisa ficar entre 1843 e 1957 kcal. Se carbo alvo = 150g, total final precisa ficar entre 146g e 155g. O mesmo vale para proteína e lipídio quando informados.
- O número de refeições é obrigatório e exato. Se o admin pedir 6 refeições, retorne exatamente 6 objetos em meals e exatamente 6 blocos no diet_text.
- Calcule os macros de cada refeição usando SEMPRE a opção BASE via regra de três dos valores TACO acima; some para o total. Arredonde cada valor para inteiro antes de exibir.
- O campo total deve ser a SOMA EXATA dos objetos em meals. Não invente total separado.
- Opção 2, 3 e 4 devem ser aproximadamente isocalóricas e isomacros em relação à BASE.
- Campo diet_text DEVE conter o HTML completo pronto para renderizar no portal do aluno.
- Nos campos numéricos do tool call (energy_kcal, protein_g, carbs_g, fat_g), retorne SEMPRE valores inteiros (sem casas decimais).
- Retorne APENAS via tool call.`;

    const userText = isReview
      ? `Revise este cardápio e devolva análise + sugestões:\n\n${dietContent}`
      : (() => {
          const kcal = Number((brief as any)?.kcal_alvo) || null;
          const p = Number((brief as any)?.proteina_g_alvo) || null;
          const c = Number((brief as any)?.carboidrato_g_alvo) || null;
          const g = Number((brief as any)?.lipidio_g_alvo) || null;
          const nMeals = Math.max(1, Math.min(10, Math.round(Number((brief as any)?.numero_refeicoes) || 5)));
          const targetsBlock =
            (kcal || p || c || g)
              ? `\n\n🎯 METAS OBRIGATÓRIAS (prioridade absoluta — tolerância ±3%):\n` +
                `- Energia total: ${kcal ?? "livre"} kcal\n` +
                `- Proteína total: ${p ?? "livre"} g\n` +
                `- Carboidrato total: ${c ?? "livre"} g\n` +
                `- Lipídio total: ${g ?? "livre"} g\n` +
                `- Nº de refeições: ${nMeals}\n\n` +
                `DISTRIBUIÇÃO DE REFERÊNCIA POR REFEIÇÃO (use como ponto de partida e ajuste as gramagens até a soma fechar):\n${buildMealBudget({ energy_kcal: kcal, protein_g: p, carbs_g: c, fat_g: g }, nMeals)}\n\n` +
                `Antes de fechar, SOME os macros das BASES de cada refeição e confirme que o TOTAL bate com as metas acima (±3%). Se não bater, AJUSTE as quantidades (gramagem dos alimentos) e recalcule até bater. NUNCA entregue um cardápio fora das metas do admin. Se foi pedido ${nMeals} refeições, entregue exatamente ${nMeals}.`
              : "";
          return `Brief estruturado:\n${JSON.stringify(brief, null, 2)}${targetsBlock}\n\nObservações livres do admin:\n${freeText || "(nenhuma)"}\n\nMonte o cardápio agora respeitando as metas acima ao pé da letra.`;
        })();

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

    const targetsForRetry: MacroTargets | null = !isReview ? {
      energy_kcal: numericTarget((brief as any)?.kcal_alvo),
      protein_g: numericTarget((brief as any)?.proteina_g_alvo),
      carbs_g: numericTarget((brief as any)?.carboidrato_g_alvo),
      fat_g: numericTarget((brief as any)?.lipidio_g_alvo),
    } : null;
    const expectedMeals = !isReview ? Math.max(1, Math.min(10, Math.round(Number((brief as any)?.numero_refeicoes) || 5))) : null;

    const callModel = async (messages: any[]) => fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        temperature: 0,
        messages,
        tools: [tool],
        tool_choice: { type: "function", function: { name: tool.function.name } },
      }),
    });

    const baseMessages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];
    let response = await callModel(baseMessages);

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

    let data = await response.json();
    let toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "IA não retornou resultado válido" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let parsed = JSON.parse(toolCall.function.arguments);
    let retries = 0;

    // Hard quality gate: never deliver a generated menu if the structured totals
    // do not match the admin briefing. The previous implementation only warned;
    // this one retries aggressively and then blocks the response if still wrong.
    if (!isReview && targetsForRetry) {
      // Reconcile using the same analyzer the student diet screen uses,
      // so the quality gate validates the AUTHORITATIVE numbers.
      await reconcileWithAnalyzer(parsed);
      let gate = computeQualityGate(parsed, targetsForRetry, expectedMeals);
      while (!gate.valid && retries < MAX_TARGET_RETRIES) {
        retries++;
        const currentTotal = gate.total || parsed?.total || {};
        const feedback = `REPROVADO PELO VALIDADOR STH METHOD (números medidos pelo mesmo analisador TACO usado na tela da dieta do aluno). O cardápio anterior NÃO pode ser entregue porque ficou fora das metas do admin (tolerância máxima ±${TARGET_TOLERANCE_PCT}%) ou com nº incorreto de refeições.\n\n` +
          `Falhas encontradas:\n- ${gate.violations.join("\n- ")}\n\n` +
          `Total MEDIDO pelo analisador TACO: ${currentTotal.energy_kcal ?? "?"} kcal | P ${currentTotal.protein_g ?? "?"}g | C ${currentTotal.carbs_g ?? "?"}g | G ${currentTotal.fat_g ?? "?"}g\n` +
          `Metas do admin: ${targetsForRetry.energy_kcal ?? "livre"} kcal | P ${targetsForRetry.protein_g ?? "livre"}g | C ${targetsForRetry.carbs_g ?? "livre"}g | G ${targetsForRetry.fat_g ?? "livre"}g\n` +
          `Nº de refeições obrigatório: ${expectedMeals}\n` +
          `Desvios %: ${JSON.stringify(gate.deviation_pct)}\n\n` +
          `REFAÇA do zero ajustando as GRAMAGENS dos alimentos BASE de cada refeição. Some as BASES antes de responder. O campo total deve ser exatamente a soma das refeições e deve ficar dentro de ±${TARGET_TOLERANCE_PCT}% das metas. Mantenha ${expectedMeals} refeições, cada uma com ⭐ BASE + Opção 2 + Opção 3 + Opção 4. Devolva apenas via tool call.`;
        const retryMessages = [
          ...baseMessages,
          { role: "assistant", content: null, tool_calls: [toolCall] },
          { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(parsed) },
          { role: "user", content: feedback },
        ];
        const retryResp = await callModel(retryMessages);
        if (!retryResp.ok) break;
        data = await retryResp.json();
        const nextCall = data.choices?.[0]?.message?.tool_calls?.[0];
        if (!nextCall) break;
        toolCall = nextCall;
        try { parsed = JSON.parse(nextCall.function.arguments); } catch { break; }
        await reconcileWithAnalyzer(parsed);
        gate = computeQualityGate(parsed, targetsForRetry, expectedMeals);
      }

      if (!gate.valid) {
        console.error("generate-diet-ai quality gate failed", { violations: gate.violations, total: gate.total, targets: targetsForRetry, retries });
        return new Response(JSON.stringify({
          error: `A STHIA não entregou uma dieta dentro da meta após ${retries} tentativa(s). Nenhum cardápio incorreto foi liberado. Ajuste o briefing ou gere novamente. Falhas: ${gate.violations.join("; ")}`,
          blocked: true,
          total: gate.total,
          targets: targetsForRetry,
          deviation_pct: gate.deviation_pct,
          retries,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // Non-target flows (or review==false without targets) still benefit from reconciling
    // so the numbers shown match the student diet screen.
    if (!isReview && !targetsForRetry) {
      await reconcileWithAnalyzer(parsed);
    }
    normalizeGeneratedMacros(parsed);
    // Validate against admin targets and expose deviation so the client can warn.
    if (!isReview && parsed?.total) {
      const gate = computeQualityGate(parsed, targetsForRetry, expectedMeals);
      parsed.targets = targetsForRetry;
      parsed.deviation_pct = gate.deviation_pct;
      parsed.validation = {
        ok: gate.valid,
        tolerance_pct: TARGET_TOLERANCE_PCT,
        meal_count: gate.meal_count,
        expected_meals: gate.expected_meals,
      };
    }
    if (typeof parsed?.diet_text === "string") {
      // Remove per-meal macro lines from the HTML output (they live in the structured meals array).
      parsed.diet_text = parsed.diet_text.replace(
        /<p[^>]*>\s*(?:<[^>]+>\s*)*Macros\s+da\s+Refei[cç][aã]o[\s\S]*?<\/p>\s*/gi,
        "",
      );
      parsed.diet_text = parsed.diet_text.replace(
        /(?:<[^>]+>\s*)*Macros\s+da\s+Refei[cç][aã]o\s*\d*\s*:\s*\d+\s*kcal\s*\|\s*P\s*:\s*\d+\s*g\s*\|\s*C\s*:\s*\d+\s*g\s*\|\s*G\s*:\s*\d+\s*g\s*(?:<[^>]+>\s*)*/gi,
        "",
      );
      // Remove TOTAL DIÁRIO lines from the HTML output (kept only in structured total field).
      parsed.diet_text = parsed.diet_text.replace(
        /<p[^>]*>\s*(?:<[^>]+>\s*)*TOTAL\s+DI[ÁA]RIO[\s\S]*?<\/p>\s*/gi,
        "",
      );
      parsed.diet_text = parsed.diet_text.replace(
        /(?:<[^>]+>\s*)*TOTAL\s+DI[ÁA]RIO\s*:?\s*\d+\s*kcal\s*\|\s*P\s*:\s*\d+\s*g\s*\|\s*C\s*:\s*\d+\s*g\s*\|\s*G\s*:\s*\d+\s*g\s*(?:<[^>]+>\s*)*/gi,
        "",
      );
      // Strip decimals from numeric tokens followed by kcal/g (e.g. "419,7 kcal" -> "420 kcal", "35.2g" -> "35g")
      parsed.diet_text = parsed.diet_text.replace(
        /(\d+)[.,](\d+)\s*(kcal|g)\b/gi,
        (_m, intPart, decPart, unit) => `${Math.round(Number(`${intPart}.${decPart}`))}${unit.toLowerCase() === "g" ? "g" : " " + unit}`,
      );
    }
    return new Response(JSON.stringify({ ...parsed, _meta: { model: MODEL_ID, usage: data?.usage || null, photos_used: photos.length, retries } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diet-ai error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});