import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_ID = "google/gemini-2.5-flash";
const TARGET_TOLERANCE_PCT = 10.0;
const MAX_TARGET_RETRIES = 5;
const HARD_BLOCK_TOLERANCE_PCT = 20;
const RECONCILE_TIMEOUT_MS = 110000;

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

async function reconcileWithAnalyzer(parsed: any): Promise<void> {
  if (!parsed || typeof parsed.diet_text !== "string" || !parsed.diet_text.trim()) return;
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const ANON = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !ANON) return;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), RECONCILE_TIMEOUT_MS);
    let resp: Response;
    try {
      resp = await fetch(`${SUPABASE_URL}/functions/v1/analyze-diet`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}`, apikey: ANON },
        body: JSON.stringify({ dietContent: parsed.diet_text }),
        signal: ctl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (!resp.ok) return;
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

function extractCorrectionTargets(text: string): Partial<MacroTargets> {
  const targets: Partial<MacroTargets> = {};
  const kcalMatch = text.match(/(\d+)\s*(kcal|calorias)/i);
  if (kcalMatch) targets.energy_kcal = parseInt(kcalMatch[1]);
  const pMatch = text.match(/(\d+)\s*g?\s*(proteina|ptn)/i);
  if (pMatch) targets.protein_g = parseInt(pMatch[1]);
  const cMatch = text.match(/(\d+)\s*g?\s*(carbo|carboidrato|cho)/i);
  if (cMatch) targets.carbs_g = parseInt(cMatch[1]);
  const fMatch = text.match(/(\d+)\s*g?\s*(gordura|lipidio|fat)/i);
  if (fMatch) targets.fat_g = parseInt(fMatch[1]);
  return targets;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { mode = "generate", brief = {}, freeText = "", dietContent = "", studentId = null, includePhotos = true, protocolText = "", adviceText = "", previousDiet = "", correction = "" } = body;

    if (mode === "generate" && !brief && !freeText && !correction) {
      return new Response(JSON.stringify({ error: "Parâmetros insuficientes para geração." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const isReview = mode === "review";
    const isAdvice = mode === "advice";
    const correctionTargets = (!isReview && !isAdvice && correction) ? extractCorrectionTargets(String(correction)) : {};
    
    if (Object.keys(correctionTargets).length) {
      Object.assign(brief as any, correctionTargets);
    }

    const targetsForRetry: MacroTargets | null = (!isReview && !isAdvice) ? {
      energy_kcal: numericTarget((brief as any)?.kcal_alvo),
      protein_g: numericTarget((brief as any)?.proteina_g_alvo),
      carbs_g: numericTarget((brief as any)?.carboidrato_g_alvo),
      fat_g: numericTarget((brief as any)?.lipidio_g_alvo),
    } : null;

    const expectedMeals = (!isReview && !isAdvice) ? Math.max(1, Math.min(10, Math.round(Number((brief as any)?.numero_refeicoes) || 5))) : null;

    const callModel = async (messages: any[]) => {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL_ID,
          temperature: 0,
          messages,
          tools: [{
            type: "function",
            function: {
              name: "return_diet",
              parameters: {
                type: "object",
                properties: {
                  diet_text: { type: "string" },
                  meals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        meal_number: { type: "number" },
                        meal_name: { type: "string" },
                        energy_kcal: { type: "number" },
                        protein_g: { type: "number" },
                        carbs_g: { type: "number" },
                        fat_g: { type: "number" },
                      },
                      required: ["meal_number", "meal_name", "energy_kcal", "protein_g", "carbs_g", "fat_g"]
                    }
                  },
                  total: {
                    type: "object",
                    properties: {
                      energy_kcal: { type: "number" },
                      protein_g: { type: "number" },
                      carbs_g: { type: "number" },
                      fat_g: { type: "number" }
                    }
                  }
                },
                required: ["diet_text", "meals", "total"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "return_diet" } },
        }),
      });
      if (!resp.ok) throw new Error(`Model call failed: ${resp.status} ${await resp.text()}`);
      return resp.json();
    };

    let profileData = null;
    if (studentId) {
      const { data } = await supabase.from("profiles").select("*").eq("id", studentId).single();
      profileData = data;
    }

    const systemPrompt = `Você é a STHia, a inteligência nutricional do STH Method. 
Sua missão é gerar cardápios precisos seguindo a TABELA TACO (4ª Edição) e validando via API FatSecret.

ESTILO E CULTURA:
- Ofereça um cardápio tipicamente BRASILEIRO (Arroz, feijão, carnes grelhadas, frutas tropicais, cuscuz, tapioca, mandioca).
- A base e as opções alternativas devem refletir alimentos comuns na culinária do Brasil.

REGRAS DE FORMATAÇÃO (PADRÃO STHia - OBRIGATÓRIO):
Você DEVE seguir EXATAMENTE este exemplo de formatação. O texto deve ter espaçamentos amplos (parágrafos) para não chegar "misturado" ao aluno. Use quebras de linha duplas (\n\n) entre cada opção:

Refeição 01: Desjejum Metabólico

"⭐ BASE: 3 ovos inteiros mexidos + 2 claras de ovo + 100g de mamão.

Opção 2: 100g de peito de frango desfiado + 2 fatias de pão de forma integral + 1 ovo cozido.

Opção 3: 150g de iogurte grego natural (zero açúcar) + 20g de Whey Protein + 10g de sementes de abóbora.

Opção 4: Omelete de 2 ovos + 30g de queijo cottage + 100g de morangos."

Refeição 02: Densidade e Suporte

"⭐ BASE: 150g de patinho moído ou filé mignon (pesado cozido) + 60g de arroz integral + Salada de folhas verdes à vontade (azeite: 10ml).

Opção 2: 150g de peito de frango grelhado + 80g de batata doce cozida + Brócolis e couve-flor à vontade.

Opção 3: 180g de filé de tilápia ou pescada + 60g de quinoa cozida + Espargos salteados.

Opção 4: 150g de lombo suíno magro + 80g de abóbora cabotiá assada + Mix de folhas."

ESTRUTURA OBRIGATÓRIA (CRÍTICO):
1. O TÍTULO da refeição NÃO deve ter NENHUMA formatação Markdown (SEM asteriscos, SEM parênteses, SEM negrito). Apenas o texto limpo: "Refeição XX: Nome".
2. O bloco de opções (BASE + Alternativas) deve estar OBRIGATORIAMENTE agrupado entre um único par de aspas duplas (") começando imediatamente na BASE e terminando na última OPÇÃO.
3. Use DUAS quebras de linha (\n\n) entre o TÍTULO e o início das aspas.
4. Dentro das aspas, cada OPÇÃO deve ser separada por DUAS quebras de linha (\n\n) para criar parágrafos claros.
5. Mantenha um espaçamento amplo entre as refeições (pule TRÊS ou QUATRO linhas após o fechamento das aspas).
6. Ovos e claras de ovos DEVEM ser apresentados em UNIDADES no texto (ex: "4 ovos inteiros", "3 claras de ovo"), NUNCA em gramas.
7. A base deve começar com o emoji ⭐ e o texto "BASE:".
8. Cada refeição DEVE ter exatamente 4 opções (1 Base + 3 Alternativas).
9. Não use tabelas Markdown.
10. NUNCA envie o texto "misturado". Se o texto não tiver parágrafos visíveis (pulos de linha duplos entre opções), ele será rejeitado. Cada opção deve estar em sua própria linha com espaço duplo.
11. NUNCA coloque texto na mesma linha que o título da refeição. O título deve estar sozinho em sua linha, seguido por duas quebras de linha.
12. Dentro das aspas, a "⭐ BASE" deve ser o início da primeira linha, e a "Opção 2" deve começar em uma nova linha após um pulo duplo. Não concatene opções na mesma linha.

REGRAS CRÍTICAS:
1. Para CADA refeição, forneça 4 opções (1 Base + 3 Alternativas) com equivalência nutricional.
2. O total calórico e macros no JSON devem considerar APENAS a ALIMENTAÇÃO BASE.
3. Priorize Integralmente bater as metas de Calorias (Kcal) e Proteínas.
4. Use APENAS a TABELA TACO (Arroz cozido: 128kcal, Frango cozido: 163kcal, Ovo inteiro: 143kcal/100g).
5. Se houver conflito entre carboidratos e calorias, ajuste os carboidratos para bater a meta de Kcal.
6. NÃO retorne erros genéricos.

META ATUAL: ${targetsForRetry?.energy_kcal ? targetsForRetry.energy_kcal + " kcal" : "Não definida"}
PERFIL: ${profileData ? JSON.stringify({
      comorbidades: profileData.comorbidities,
      medicamentos: profileData.medications,
      objetivo: profileData.objective,
      idade: profileData.age,
      genero: profileData.gender
    }) : "Desconhecido"}`;

    const messages = [{ role: "system", content: systemPrompt }];
    if (previousDiet) messages.push({ role: "assistant", content: `Dieta anterior: ${previousDiet}` });
    messages.push({ role: "user", content: mode === "review" ? `Revise esta dieta: ${dietContent}. Correção: ${correction}` : `Gere uma nova dieta. Briefing: ${JSON.stringify(brief)}. Texto livre: ${freeText}` });

    let parsed = null;
    let retries = 0;
    while (retries < MAX_TARGET_RETRIES) {
      const result = await callModel(messages);
      const tc = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!tc) throw new Error("No tool call returned by model");
      parsed = JSON.parse(tc.function.arguments);

      if (!isReview && !isAdvice && targetsForRetry) {
        await reconcileWithAnalyzer(parsed);
        const gate = computeQualityGate(parsed, targetsForRetry, expectedMeals);
        if (gate.valid || gate.worst_deviation_pct <= HARD_BLOCK_TOLERANCE_PCT) break;
        
        messages.push({ role: "assistant", content: tc.function.arguments });
        messages.push({ role: "user", content: `ERRO DE CALIBRAGEM: A dieta gerada tem ${gate.worst_deviation_pct}% de desvio. Falhas: ${gate.violations.join("; ")}. Tente novamente respeitando RIGOROSAMENTE a meta de ${targetsForRetry.energy_kcal} kcal.` });
        retries++;
      } else {
        break;
      }
    }

    if (!isReview && !isAdvice) {
      await reconcileWithAnalyzer(parsed);
    }
    normalizeGeneratedMacros(parsed);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message || "Internal Error" }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});