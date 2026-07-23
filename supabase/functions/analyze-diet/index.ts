import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============= FatSecret integration =============
const FS_CLIENT_ID = Deno.env.get("FATSECRET_CLIENT_ID");
const FS_CLIENT_SECRET = Deno.env.get("FATSECRET_CLIENT_SECRET");
let fsToken: { token: string; exp: number } | null = null;

async function fsGetToken(): Promise<string | null> {
  if (!FS_CLIENT_ID || !FS_CLIENT_SECRET) return null;
  if (fsToken && fsToken.exp > Date.now() + 60_000) return fsToken.token;
  try {
    const basic = btoa(`${FS_CLIENT_ID}:${FS_CLIENT_SECRET}`);
    const res = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials&scope=basic",
    });
    const json = await res.json();
    if (!res.ok || !json.access_token) return null;
    fsToken = { token: json.access_token, exp: Date.now() + (json.expires_in ?? 86400) * 1000 };
    return fsToken.token;
  } catch (_) {
    return null;
  }
}

function fsParseDescription(desc: string) {
  if (!desc) return null;
  const perMatch = desc.match(/Per\s+([\d.,]+)\s*(g|ml|oz|fl oz|cup|piece|unit|tbsp|tsp|serving)/i);
  let servingSize = 100;
  let servingUnit: "g" | "ml" = "g";
  if (perMatch) {
    servingSize = parseFloat(perMatch[1].replace(",", ".")) || 100;
    const u = perMatch[2].toLowerCase();
    servingUnit = u.includes("ml") || u.includes("fl") ? "ml" : "g";
  }
  const num = (re: RegExp) => {
    const r = desc.match(re);
    return r ? parseFloat(r[1].replace(",", ".")) : 0;
  };
  const kcal = num(/Calories:\s*([\d.,]+)\s*kcal/i);
  const fat = num(/Fat:\s*([\d.,]+)\s*g/i);
  const carbs = num(/Carbs:\s*([\d.,]+)\s*g/i);
  const protein = num(/Protein:\s*([\d.,]+)\s*g/i);
  const factor = servingSize > 0 ? 100 / servingSize : 1;
  return {
    per100: {
      energy_kcal: kcal * factor,
      protein_g: protein * factor,
      carbs_g: carbs * factor,
      fat_g: fat * factor,
    },
    serving_unit: servingUnit,
  };
}

const fsMemCache = new Map<string, { per100: { energy_kcal: number; protein_g: number; carbs_g: number; fat_g: number }; serving_unit: "g" | "ml"; label: string } | null>();

async function fsLookup(name: string) {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  if (fsMemCache.has(key)) return fsMemCache.get(key)!;
  const token = await fsGetToken();
  if (!token) {
    fsMemCache.set(key, null);
    return null;
  }
  try {
    const params = new URLSearchParams({
      method: "foods.search",
      search_expression: name.trim(),
      page_number: "0",
      max_results: "5",
      format: "json",
      region: "BR",
      language: "pt",
    });
    const res = await fetch(`https://platform.fatsecret.com/rest/server.api?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      fsMemCache.set(key, null);
      return null;
    }
    const rawFoods = json.foods?.food
      ? Array.isArray(json.foods.food) ? json.foods.food : [json.foods.food]
      : [];
    // Prefer generic (no brand) first
    const generic = rawFoods.find((f: any) => !f.brand_name) || rawFoods[0];
    if (!generic) {
      fsMemCache.set(key, null);
      return null;
    }
    const parsed = fsParseDescription(generic.food_description || "");
    if (!parsed) {
      fsMemCache.set(key, null);
      return null;
    }
    const out = { ...parsed, label: generic.food_name as string };
    fsMemCache.set(key, out);
    return out;
  } catch (_) {
    fsMemCache.set(key, null);
    return null;
  }
}

type ExtractedItem = { name: string; grams: number };
type ExtractedMeal = { meal_number: number; meal_name: string; items: ExtractedItem[] };

async function extractItems(plainText: string, apiKey: string): Promise<ExtractedMeal[] | null> {
  try {
    const sys = `Extraia APENAS os alimentos BASE (ignore substituições/opções/alternativas/OU) de cada refeição do cardápio, convertendo cada quantidade para GRAMAS (para líquidos, use ml tratado como gramas 1:1). Use estas conversões: 1 ovo=50g; 1 col. sopa azeite=13g; 1 col. sopa pasta amendoim=15g; 1 fatia pão forma=25g; 1 pão francês=50g; 1 scoop whey=30g; 1 xícara arroz cozido=150g; 1 concha média feijão=80g; 1 filé médio frango=120g; 1 fatia média queijo=30g. Refeição 1=Café da Manhã, 2=Lanche Manhã, 3=Almoço, 4=Lanche Tarde, 5=Jantar, 6=Ceia. Retorne apenas via tool call.`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: plainText },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_items",
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
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string", description: "Nome curto do alimento em português (ex: 'arroz branco cozido', 'peito de frango grelhado', 'aveia em flocos')" },
                            grams: { type: "number", description: "Quantidade em gramas" },
                          },
                          required: ["name", "grams"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["meal_number", "meal_name", "items"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["meals"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_items" } },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const tc = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) return null;
    const parsed = JSON.parse(tc.function.arguments);
    return parsed.meals as ExtractedMeal[];
  } catch (_) {
    return null;
  }
}

async function reconcileWithFatSecret(meals: ExtractedMeal[]) {
  // resolve unique names
  const uniqueNames = Array.from(new Set(meals.flatMap((m) => m.items.map((i) => i.name.trim().toLowerCase())).filter(Boolean)));
  await Promise.all(uniqueNames.map((n) => fsLookup(n)));

  const perMeal: Array<{
    meal_number: number; meal_name: string;
    energy_kcal: number; protein_g: number; carbs_g: number; fat_g: number;
    resolved: boolean; resolved_count: number; total_count: number;
  }> = [];

  for (const meal of meals) {
    let kcal = 0, p = 0, c = 0, f = 0;
    let resolvedCount = 0;
    for (const item of meal.items) {
      const hit = await fsLookup(item.name);
      if (hit) {
        const factor = (item.grams || 0) / 100;
        kcal += hit.per100.energy_kcal * factor;
        p += hit.per100.protein_g * factor;
        c += hit.per100.carbs_g * factor;
        f += hit.per100.fat_g * factor;
        resolvedCount++;
      }
    }
    perMeal.push({
      meal_number: meal.meal_number,
      meal_name: meal.meal_name,
      energy_kcal: +kcal.toFixed(2),
      protein_g: +p.toFixed(2),
      carbs_g: +c.toFixed(2),
      fat_g: +f.toFixed(2),
      resolved: meal.items.length > 0 && resolvedCount === meal.items.length,
      resolved_count: resolvedCount,
      total_count: meal.items.length,
    });
  }
  return perMeal;
}
// ============= end FatSecret integration =============

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { dietContent } = await req.json();
    if (!dietContent || typeof dietContent !== "string") {
      return new Response(JSON.stringify({ error: "dietContent is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const plainText = dietContent
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();

    const systemPrompt = `Você é um nutricionista especialista em análise de cardápios alimentares brasileiros.
Sua ÚNICA fonte de referência para energia e macronutrientes é a TABELA TACO (Tabela Brasileira de Composição de Alimentos - UNICAMP, 4ª edição).
Quando um alimento não constar na TACO, use a TBCA (USP) como fonte secundária. NUNCA invente valores e NUNCA use bases internacionais (USDA).

TABELA DE REFERÊNCIA TACO POR 100g/100ml (USE EXATAMENTE ESTES VALORES — NÃO ARREDONDE PARA CIMA):
- Ovo de galinha inteiro cru: 143 kcal | 13.0 P | 1.6 C | 9.5 G  (1 ovo médio = 50g)
- Clara de ovo crua: 43 kcal | 10.9 P | 0.7 C | 0.0 G
- Gema de ovo crua: 322 kcal | 13.6 P | 0.6 C | 28.7 G
- Aveia em flocos crua: 394 kcal | 13.9 P | 66.6 C | 8.5 G
- Mamão formosa cru: 45 kcal | 0.8 P | 11.6 C | 0.1 G
- Mamão papaia cru: 40 kcal | 0.5 P | 10.4 C | 0.1 G
- Banana prata: 98 kcal | 1.3 P | 26.0 C | 0.1 G
- Banana nanica: 92 kcal | 1.4 P | 23.8 C | 0.1 G
- Maçã com casca: 56 kcal | 0.3 P | 15.2 C | 0.0 G
- Arroz branco cozido: 128 kcal | 2.5 P | 28.1 C | 0.2 G
- Arroz integral cozido: 124 kcal | 2.6 P | 25.8 C | 1.0 G
- Feijão carioca cozido: 76 kcal | 4.8 P | 13.6 C | 0.5 G
- Feijão preto cozido: 77 kcal | 4.5 P | 14.0 C | 0.5 G
- Batata inglesa cozida: 52 kcal | 1.2 P | 11.9 C | 0.0 G
- Batata doce cozida: 77 kcal | 0.6 P | 18.4 C | 0.1 G
- Mandioca cozida: 125 kcal | 0.6 P | 30.1 C | 0.3 G
- Macarrão cozido: 111 kcal | 3.4 P | 23.5 C | 0.6 G
- Pão francês: 300 kcal | 8.0 P | 58.6 C | 3.1 G  (1 unidade = 50g)
- Pão de forma integral: 253 kcal | 9.4 P | 49.0 C | 3.4 G  (1 fatia = 25g)
- Tapioca (goma hidratada): 240 kcal | 0.0 P | 60.0 C | 0.0 G
- Peito de frango cozido s/ pele: 163 kcal | 32.0 P | 0.0 C | 3.2 G
- Coxa de frango cozida s/ pele: 215 kcal | 27.0 P | 0.0 C | 11.0 G
- Carne bovina patinho cozido: 219 kcal | 35.9 P | 0.0 C | 7.3 G
- Carne bovina alcatra grelhada: 220 kcal | 32.0 P | 0.0 C | 9.0 G
- Carne bovina coxão mole cozido: 219 kcal | 35.9 P | 0.0 C | 7.3 G
- Carne moída magra cozida: 212 kcal | 27.0 P | 0.0 C | 11.0 G
- Tilápia cozida: 117 kcal | 25.5 P | 0.0 C | 1.7 G
- Salmão grelhado: 211 kcal | 23.5 P | 0.0 C | 12.5 G
- Atum em água: 116 kcal | 25.5 P | 0.0 C | 0.8 G
- Leite integral: 61 kcal | 2.9 P | 4.3 C | 3.2 G
- Leite desnatado: 35 kcal | 3.2 P | 4.7 C | 0.2 G
- Iogurte natural integral: 51 kcal | 4.1 P | 1.9 C | 3.0 G
- Iogurte natural desnatado: 41 kcal | 4.6 P | 5.6 C | 0.1 G
- Queijo minas frescal: 264 kcal | 17.4 P | 3.2 C | 20.2 G
- Queijo cottage: 88 kcal | 13.5 P | 2.6 C | 3.0 G
- Whey protein concentrado (ref. comercial): 400 kcal | 80.0 P | 7.0 C | 6.0 G  (1 scoop = 30g)
- Azeite de oliva: 884 kcal | 0.0 P | 0.0 C | 100.0 G  (1 col. sopa = 13g)
- Pasta de amendoim integral: 596 kcal | 25.0 P | 15.0 C | 50.0 G
- Castanha do Pará: 643 kcal | 14.5 P | 15.1 C | 63.5 G
- Amêndoas: 581 kcal | 21.6 P | 19.5 C | 47.3 G
- Abacate: 96 kcal | 1.2 P | 6.0 C | 8.4 G
- Brócolis cozido: 25 kcal | 2.1 P | 4.0 C | 0.4 G
- Alface: 11 kcal | 1.4 P | 1.7 C | 0.2 G
- Tomate: 15 kcal | 1.1 P | 3.1 C | 0.2 G
- Cenoura crua: 34 kcal | 1.3 P | 7.7 C | 0.2 G

REGRAS OBRIGATÓRIAS DE CÁLCULO:
0. TEMPERATURA ZERO. Use SEMPRE os valores da tabela acima quando o alimento estiver listado. Apenas para alimentos NÃO listados consulte sua memória da TACO/TBCA. Se não souber, retorne 0.
1. SEPARAÇÃO POR REFEIÇÃO: Identifique cada refeição presente no cardápio e calcule os macros SOMENTE com os alimentos listados naquela refeição específica. NÃO misture alimentos entre refeições.
   - Refeição 1 = Café da Manhã
   - Refeição 2 = Lanche da Manhã
   - Refeição 3 = Almoço
   - Refeição 4 = Lanche da Tarde
   - Refeição 5 = Jantar
   - Refeição 6 = Ceia
   - Refeição 7+ = Refeição Extra / Pré-treino / Pós-treino
2. FONTE DE ALIMENTOS A CONSIDERAR — REGRA CRÍTICA:
   - Considere APENAS os alimentos marcados/listados sob os rótulos: "base", "alimentação principal", "principal", "Base:", "Alimentação principal:", "Principal:" (case-insensitive, com ou sem acento, com ou sem dois pontos).
   - IGNORE COMPLETAMENTE qualquer item listado sob rótulos como "substituições", "substituição", "opções", "alternativas", "troca", "trocas", "extras", "opcional", "OU", "ou", separadores tipo "/", "|", listas após "—" indicando alternativas.
   - Se uma refeição NÃO possuir explicitamente um bloco "base/alimentação principal/principal", interprete TODOS os alimentos diretamente listados como base (sem alternativas).
   - Quando houver opções alternativas dentro do bloco base (ex: "ou", "/"), use APENAS a PRIMEIRA opção.
3. Para CADA alimento BASE: identifique a quantidade exata em gramas/ml. Aplique a regra de três a partir do valor por 100g da TABELA. Ex.: 50g de aveia = 394 × 0.5 = 197 kcal | 6.95 P | 33.3 C | 4.25 G.
4. Conversões padrão: 1 ovo médio inteiro = 50g; 1 colher de sopa de azeite = 13g; 1 colher de sopa rasa de pasta de amendoim = 15g; 1 fatia de pão de forma = 25g; 1 pão francês = 50g; 1 scoop whey = 30g; 1 xícara de arroz cozido = 150g; 1 concha média de feijão = 80g; 1 filé médio de frango = 120g; 1 fatia média de queijo = 30g.
5. Some os alimentos BASE da refeição para obter o total da refeição (com 2 casas decimais).
6. O TOTAL GERAL deve ser EXATAMENTE a soma aritmética dos totais por refeição.
7. Se uma refeição não tiver alimentos BASE identificáveis, retorne 0 em todos os macros para ela.
8. Inclua TODAS as refeições encontradas no texto, na ordem em que aparecem.
9. PROIBIDO: inflar valores, somar substituições, usar densidade calórica genérica (4/4/9), arredondar para múltiplos de 50 ou 100. Calcule item por item com a tabela acima.

EXEMPLO DE CÁLCULO CORRETO (siga este padrão mentalmente):
Entrada: "Base: 3 ovos inteiros + 100g de claras + 50g de aveia + 100g de mamão papaia"
- 3 ovos × 50g = 150g ovo inteiro: 143×1.5 = 214.5 kcal | 19.5 P | 2.4 C | 14.25 G
- 100g claras: 43 kcal | 10.9 P | 0.7 C | 0 G
- 50g aveia: 197 kcal | 6.95 P | 33.3 C | 4.25 G
- 100g mamão papaia: 40 kcal | 0.5 P | 10.4 C | 0.1 G
TOTAL refeição: 494.5 kcal | 37.85 P | 46.8 C | 18.6 G

Retorne APENAS o JSON via tool call, sem texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analise este cardápio e retorne os macros:\n\n${plainText}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_diet_analysis",
              description: "Return the nutritional analysis of a diet plan with per-meal and total macros",
              parameters: {
                type: "object",
                properties: {
                  meals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        meal_number: { type: "number", description: "Meal number (1-6, or 7+ for extra)" },
                        meal_name: { type: "string", description: "Name like Café da Manhã, Almoço, etc." },
                        energy_kcal: { type: "number" },
                        protein_g: { type: "number" },
                        carbs_g: { type: "number" },
                        fat_g: { type: "number" },
                      },
                      required: ["meal_number", "meal_name", "energy_kcal", "protein_g", "carbs_g", "fat_g"],
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
                },
                required: ["meals", "total"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_diet_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione fundos em Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "A IA não retornou uma análise válida" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    const usage = data?.usage || null;

    // ============= FatSecret reconciliation pass =============
    // Extrai itens estruturados e recalcula por refeição via FatSecret.
    // Só sobrescreve uma refeição se TODOS os itens forem resolvidos com sucesso.
    let fsMeta: any = { enabled: false };
    try {
      if (FS_CLIENT_ID && FS_CLIENT_SECRET) {
        const items = await extractItems(plainText, LOVABLE_API_KEY);
        if (items && items.length > 0) {
          const fsMeals = await reconcileWithFatSecret(items);
          const overrides: Record<number, typeof fsMeals[number]> = {};
          for (const fm of fsMeals) if (fm.resolved) overrides[fm.meal_number] = fm;

          const newMeals = (analysis.meals || []).map((m: any) => {
            const ov = overrides[m.meal_number];
            if (!ov) return { ...m, _source: "taco" };
            return {
              meal_number: m.meal_number,
              meal_name: m.meal_name,
              energy_kcal: ov.energy_kcal,
              protein_g: ov.protein_g,
              carbs_g: ov.carbs_g,
              fat_g: ov.fat_g,
              _source: "fatsecret",
            };
          });
          const total = newMeals.reduce(
            (acc: any, m: any) => ({
              energy_kcal: +(acc.energy_kcal + (m.energy_kcal || 0)).toFixed(2),
              protein_g: +(acc.protein_g + (m.protein_g || 0)).toFixed(2),
              carbs_g: +(acc.carbs_g + (m.carbs_g || 0)).toFixed(2),
              fat_g: +(acc.fat_g + (m.fat_g || 0)).toFixed(2),
            }),
            { energy_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
          );
          analysis.meals = newMeals;
          analysis.total = total;
          fsMeta = {
            enabled: true,
            meals_reconciled: Object.keys(overrides).length,
            meals_total: fsMeals.length,
            per_meal: fsMeals.map((m) => ({
              meal_number: m.meal_number,
              resolved: m.resolved,
              resolved_count: m.resolved_count,
              total_count: m.total_count,
            })),
          };
        }
      }
    } catch (fsErr) {
      console.warn("FatSecret reconciliation failed, keeping TACO result:", fsErr);
      fsMeta = { enabled: false, error: fsErr instanceof Error ? fsErr.message : String(fsErr) };
    }

    return new Response(JSON.stringify({ ...analysis, _meta: { model: "google/gemini-2.5-pro", usage, fatsecret: fsMeta } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-diet error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
