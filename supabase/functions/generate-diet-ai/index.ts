import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { STHIA_NUTRITIONAL_2_0 } from "../_shared/sthia-nutritional-2-0.ts";
import { STHIA_DIET_FORMAT } from "../_shared/sthia-diet-format.ts";
import { validateMealsAgainstTables } from "../_shared/nutrition-validator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_ID = "google/gemini-2.5-flash";
const TARGET_TOLERANCE_PCT = 5.0;
const MAX_TARGET_RETRIES = 5;
const HARD_BLOCK_TOLERANCE_PCT = 5;
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

const formatDietText = (parsed: any): string => {
  if (!parsed || !Array.isArray(parsed.meals)) return "";
  
  return parsed.meals.map((m: any) => {
    const mealNumStr = String(m.meal_number).padStart(2, "0");
    const cleanName = (m.meal_name || "").replace(/[*()]/g, "").trim();
    const title = `Refeição ${mealNumStr}: ${cleanName}`;
    
    // Format options exactly as STHIA 2.0 master prompt.
    // The options coming from the model already have "⭐ BASE:" prepended when it follows the prompt.
    // We check if it already has the prefix to avoid duplication.
    const formattedOptions = (m.options || []).map((opt: string, idx: number) => {
      const text = opt.trim();
      if (idx === 0) {
        return text.startsWith("⭐ BASE:") ? text : `⭐ BASE: ${text}`;
      } else {
        const label = `Opção ${idx + 1}:`;
        return text.startsWith(label) ? text : `${label} ${text}`;
      }
    }).join("\n\n");

    // We use a specific structure: Title, double line break, opening quote, options, closing quote
    return `${title}\n\n"${formattedOptions}"`;
  }).join("\n\n\n\n");
};

const normalizeGeneratedMacros = (parsed: any) => {
  if (Array.isArray(parsed?.meals)) {
    parsed.meals = parsed.meals
      .slice()
      .sort((a: any, b: any) => (Number(a?.meal_number) || 0) - (Number(b?.meal_number) || 0))
      .map((m: any, idx: number) => {
        const items = Array.isArray(m?.base_items)
          ? m.base_items.map((it: any) => ({
              food: String(it?.food ?? "").trim(),
              quantity: String(it?.quantity ?? "").trim(),
              energy_kcal: roundInt(it?.energy_kcal),
              protein_g: roundInt(it?.protein_g),
              carbs_g: roundInt(it?.carbs_g),
              fat_g: roundInt(it?.fat_g),
              fiber_g: roundInt(it?.fiber_g),
            }))
          : [];
        const itemsTotal = items.reduce(
          (acc: any, it: any) => ({
            energy_kcal: acc.energy_kcal + it.energy_kcal,
            protein_g: acc.protein_g + it.protein_g,
            carbs_g: acc.carbs_g + it.carbs_g,
            fat_g: acc.fat_g + it.fat_g,
            fiber_g: acc.fiber_g + it.fiber_g,
          }),
          { energy_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
        );
        // Auditoria interna: os macros da refeição devem ser a soma real dos alimentos da BASE.
        const useItems = items.length > 0 && itemsTotal.energy_kcal > 0;
        return {
          ...m,
          meal_number: roundInt(m?.meal_number) || idx + 1,
          base_items: items,
          base_items_total: useItems ? itemsTotal : undefined,
          energy_kcal: useItems ? itemsTotal.energy_kcal : roundInt(m?.energy_kcal),
          protein_g: useItems ? itemsTotal.protein_g : roundInt(m?.protein_g),
          carbs_g: useItems ? itemsTotal.carbs_g : roundInt(m?.carbs_g),
          fat_g: useItems ? itemsTotal.fat_g : roundInt(m?.fat_g),
        };
      });
    parsed.total = sumMealTotals(parsed.meals);
  } else if (parsed?.total) {
    parsed.total.energy_kcal = roundInt(parsed.total.energy_kcal);
    parsed.total.protein_g = roundInt(parsed.total.protein_g);
    parsed.total.carbs_g = roundInt(parsed.total.carbs_g);
    parsed.total.fat_g = roundInt(parsed.total.fat_g);
  }
  
  // Always regenerate diet_text from JSON to ensure formatting
  parsed.diet_text = formatDietText(parsed);
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
  // Handle comma-separated decimals or direct numbers
  const clean = (s: string) => parseInt(s.replace(",", "."));
  
  const kcalMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(kcal|calorias)/i);
  if (kcalMatch) targets.energy_kcal = clean(kcalMatch[1]);
  
  const pMatch = text.match(/(\d+(?:[.,]\d+)?)\s*g?\s*(proteina|ptn|protein)/i);
  if (pMatch) targets.protein_g = clean(pMatch[1]);
  
  const cMatch = text.match(/(\d+(?:[.,]\d+)?)\s*g?\s*(carbo|carboidrato|cho|carb)/i);
  if (cMatch) targets.carbs_g = clean(cMatch[1]);
  
  const fMatch = text.match(/(\d+(?:[.,]\d+)?)\s*g?\s*(gordura|lipidio|fat)/i);
  if (fMatch) targets.fat_g = clean(fMatch[1]);
  
  return targets;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { mode = "generate", brief = {}, freeText = "", dietContent = "", studentId = null, includePhotos = true, protocolText = "", adviceText = "", previousDiet = "", correction = "", motor } = body;
    const isSthia2 = motor === "sthia_2";

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
                  meals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        meal_number: { type: "number" },
                        meal_name: { type: "string" },
                        base_items: {
                          type: "array",
                          description: "Detalhamento alimento a alimento da opção BASE (tabela de valores). Cada item com quantidade e valores nutricionais reais da base FatSecret/TACO.",
                          items: {
                            type: "object",
                            properties: {
                              food: { type: "string", description: "Nome do alimento" },
                              quantity: { type: "string", description: "Quantidade (ex: 120g, 2 unidades)" },
                              energy_kcal: { type: "number" },
                              protein_g: { type: "number" },
                              carbs_g: { type: "number" },
                              fat_g: { type: "number" },
                              fiber_g: { type: "number" },
                            },
                            required: ["food", "quantity", "energy_kcal", "protein_g", "carbs_g", "fat_g"],
                          },
                        },
                        options: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Exatamente 5 opções para STHIA 2.0 (1 Base + 4 Alternativas) ou 4 opções para STHIA 1.0. A primeira deve ser a BASE."
                        },
                        energy_kcal: { type: "number" },
                        protein_g: { type: "number" },
                        carbs_g: { type: "number" },
                        fat_g: { type: "number" },
                      },
                        required: ["meal_number", "meal_name", "options", "base_items", "energy_kcal", "protein_g", "carbs_g", "fat_g"]
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
                required: ["meals", "total"]
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

    const systemPrompt = isSthia2 
      ? `${STHIA_NUTRITIONAL_2_0}

IMPORTANTE: 
- Retorne apenas o JSON via ferramenta 'return_diet'.
- Garanta que as metas nutricionais fiquem dentro de ±5% (não precisa ser exato) seguindo os cálculos da API FatSecret.
- Preencha SEMPRE 'base_items' com a tabela de valores de cada alimento da opção BASE e audite a soma antes de responder.
- AUDITORIA EXTERNA: cada item de 'base_items' será confrontado automaticamente com a tabela oficial TACO/TBCA e com a FatSecret. Valores divergentes acima de 8% serão SOBRESCRITOS pelos oficiais. Declare quantidades em gramas/ml (ou unidades para ovos/claras/pães) e use valores nutricionais reais.
- Mantenha a formatação exata dentro do campo 'options' do JSON conforme as regras de FORMATAÇÃO OBRIGATÓRIA (sem markdown, sem HTML).`
      : `Você é a STHia, a inteligência nutricional do STH Method. 
Sua missão é gerar cardápios precisos retornando um JSON estruturado.

ESTILO E CULTURA:
- Ofereça um cardápio tipicamente BRASILEIRO e DIVERSIFICADO (Arroz, feijão, carnes, ovos, mas também pães, whey protein, iogurtes, frutas variadas, legumes e vegetais).

REGRAS DE CONTEÚDO PARA O JSON:
1. Para cada refeição, você deve fornecer EXATAMENTE 4 opções de alimentos.
2. A primeira opção (índice 0 no array 'options') será a BASE. Ela deve ser a mais completa e balanceada.
3. Ovos e claras de ovos DEVEM estar em UNIDADES (ex: "4 ovos inteiros", "3 claras de ovo"), NUNCA em gramas.
4. Mantenha a equivalência nutricional entre as 4 opções. 
5. O JSON deve ser focado em dados puros.

${STHIA_DIET_FORMAT}

IMPORTANTE: 
- Retorne apenas o JSON via ferramenta 'return_diet'.
- Garanta que as metas nutricionais fiquem dentro de ±5% do alvo (não precisa ser exato).
- Preencha SEMPRE 'base_items' com o detalhamento de cada alimento da opção BASE (nome, quantidade, kcal, P, C, G, fibra) usando valores reais TACO/FatSecret, e confira que a soma dos alimentos é igual aos macros da refeição.
- Diversifique os alimentos.`;

    const fullPrompt = `${systemPrompt}

META ATUAL: ${targetsForRetry?.energy_kcal ? targetsForRetry.energy_kcal + " kcal" : "Não definida"}
PERFIL: ${profileData ? JSON.stringify({
      comorbidades: profileData.comorbidities,
      medicamentos: profileData.medications,
      objetivo: profileData.objective,
      idade: profileData.age,
      genero: profileData.gender
    }) : "Desconhecido"}`;

    const messages = [{ role: "system", content: fullPrompt }];
    if (previousDiet) {
      messages.push({ role: "assistant", content: `VERSÃO ANTERIOR A SER CORRIGIDA:\n${previousDiet}` });
    }

    const userMessage = mode === "review" 
      ? `Revise esta dieta: ${dietContent}. Correção: ${correction}` 
      : mode === "advice"
        ? `Gere orientações. Briefing: ${JSON.stringify(brief)}. Texto livre: ${freeText}`
        : correction
          ? `CONTRA-RESPOSTA CRÍTICA DO USUÁRIO: "${correction}". \n\nINSTRUÇÃO: O usuário não aceitou a versão anterior. Você DEVE refazer o plano incorporando OBRIGATORIAMENTE o que foi pedido acima. Se o usuário pediu para incluir ou remover algo, obedeça cegamente a essa instrução de ajuste, mantendo a precisão nutricional total.`
          : `Gere uma nova dieta. Briefing: ${JSON.stringify(brief)}. Observações/Prompt Livre: ${freeText}`;

    messages.push({ role: "user", content: userMessage });

    let parsed = null;
    let retries = 0;
    let validation: any = null;
    while (retries < MAX_TARGET_RETRIES) {
      const result = await callModel(messages);
      const tc = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!tc) throw new Error("No tool call returned by model");
      parsed = JSON.parse(tc.function.arguments);

      if (!isReview && !isAdvice && targetsForRetry) {
        // GABARITO: confronta cada alimento com TACO/TBCA + FatSecret antes de liberar.
        try {
          validation = await validateMealsAgainstTables(parsed?.meals);
        } catch (e) {
          console.warn("nutrition validation failed", e);
          validation = null;
        }
        if (!validation || validation.checked === 0) {
          await reconcileWithAnalyzer(parsed);
        }
        const gate = computeQualityGate(parsed, targetsForRetry, expectedMeals);
        if (gate.valid || gate.worst_deviation_pct <= HARD_BLOCK_TOLERANCE_PCT) break;
        
        messages.push({ role: "assistant", content: tc.function.arguments });
        const corrections = (validation?.entries || [])
          .filter((e: any) => e.status === "corrigido")
          .slice(0, 12)
          .map((e: any) => `${e.food} (${e.quantity}): você declarou ${e.before?.energy_kcal}kcal, a base ${e.source} indica ${e.after?.energy_kcal}kcal / P${e.after?.protein_g} C${e.after?.carbs_g} G${e.after?.fat_g}`)
          .join("; ");
        messages.push({
          role: "user",
          content: `ERRO DE CALIBRAGEM: A dieta gerada tem ${gate.worst_deviation_pct}% de desvio após a conferência contra TACO/TBCA + FatSecret. Falhas: ${gate.violations.join("; ")}.${corrections ? `\n\nDIVERGÊNCIAS CORRIGIDAS PELA BASE OFICIAL: ${corrections}. Use EXATAMENTE esses valores oficiais e reajuste as quantidades para bater a meta.` : ""}\n\nRefaça respeitando a meta de ${targetsForRetry.energy_kcal} kcal (tolerância ±5%).`,
        });
        retries++;
      } else {
        break;
      }
    }

    if (!isReview && !isAdvice) {
      if (!validation || validation.checked === 0) {
        await reconcileWithAnalyzer(parsed);
      }
    }
    normalizeGeneratedMacros(parsed);
    if (validation) {
      (parsed as any).validation_report = {
        checked: validation.checked,
        corrected: validation.corrected,
        unverified: validation.unverified,
        entries: validation.entries,
      };
    }

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