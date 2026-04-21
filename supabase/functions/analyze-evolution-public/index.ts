import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente da STH Method, focado em conversão e retenção.
Seu objetivo NÃO é apenas processar imagens, mas guiar o usuário a perceber sua própria evolução física e gerar desejo por um acompanhamento profissional.

REGRAS DE LINGUAGEM:
- Tom humano, próximo, leve. Nada robótico.
- NÃO use termos técnicos pesados (sem "hipertrofia sarcoplasmática", "lipólise", etc.)
- NÃO seja vendedor agressivo. Gere curiosidade e leve pressão emocional.
- Português do Brasil. 2ª pessoa ("você").
- Seja honesto: se as fotos forem do mesmo dia ou muito parecidas, diga isso com gentileza.
- NUNCA invente dados médicos, percentuais de gordura ou números que você não pode ver.

ESTRUTURA OBRIGATÓRIA da resposta (use exatamente esses títulos em markdown):

## ✨ O que dá pra ver
(2-3 frases curtas, observação visual simples — postura, simetria, definição aparente, expressão. Sem técnicismo.)

## 💪 Pontos positivos
(2-3 bullets curtos com vitórias visíveis. Gere leve ganho de confiança. Se for só uma foto, foque em pontos fortes da composição atual.)

## 🎯 O que ainda pode evoluir
(2-3 bullets honestos sobre o que tem potencial — sem julgamento, criando desejo de melhorar.)

## 🔥 Percepção
(1 parágrafo curto: evolução é possível, mas sozinho é mais lento. Termine com a frase EXATA, em itálico:)
*Agora imagina isso sendo feito com estratégia aplicada no seu dia a dia.*

Não adicione nada depois. Não inclua CTA — o app cuida disso.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { images } = await req.json();
    if (!Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "images array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit to 6 images, ensure they are data URLs
    const safeImages = images
      .filter((u: unknown) => typeof u === "string" && (u as string).startsWith("data:image/"))
      .slice(0, 6);

    if (safeImages.length === 0) {
      return new Response(JSON.stringify({ error: "No valid images" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userContent: any[] = [
      {
        type: "text",
        text:
          safeImages.length >= 2
            ? "Analise estas fotos do mesmo usuário (antes e depois, ou múltiplos ângulos). Compare a evolução visual e siga a estrutura solicitada."
            : "Analise esta foto e siga a estrutura solicitada — foque na composição atual e no potencial de evolução.",
      },
      ...safeImages.map((url: string) => ({ type: "image_url", image_url: { url } })),
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Muita gente analisando agora. Tente em alguns segundos." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "Limite de análises atingido. Tente novamente mais tarde." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "Falha na análise. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const analysis: string = data?.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});