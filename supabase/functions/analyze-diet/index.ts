import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const systemPrompt = `Você é um nutricionista especialista em análise de cardápios alimentares. 
Analise o cardápio fornecido e retorne os valores nutricionais estimados.

REGRAS:
- Identifique cada refeição (Refeição 1 = Café da Manhã, Refeição 2 = Lanche da Manhã, Refeição 3 = Almoço, Refeição 4 = Lanche da Tarde, Refeição 5 = Jantar, Refeição 6 = Ceia, Refeição Extra se houver)
- Para cada refeição, estime: energy_kcal, protein_g, carbs_g, fat_g
- Calcule o total geral somando todas as refeições
- Use valores médios de tabelas nutricionais brasileiras (TACO/TBCA)
- Quando houver opções alternativas (separadas por "ou"), use a PRIMEIRA opção para o cálculo
- Considere as quantidades especificadas (ex: 150g, 2 ovos, 30g whey)
- Seja preciso e realista nos valores

Retorne APENAS o JSON no formato especificado, sem texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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

    return new Response(JSON.stringify(analysis), {
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
