import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { mealId, foods } = await req.json();
    if (!mealId || !foods || !foods.length) {
      return new Response(
        JSON.stringify({ error: "mealId and foods are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const foodList = foods.map((f: any) => `${f.quantity} de ${f.item}`).join(", ");
    const prompt = `Generate a single photorealistic top-down food photography image of a beautiful meal plate containing: ${foodList}. The plate should be on a dark elegant surface with soft natural lighting, styled like a premium fitness/nutrition app. No text or labels. High quality, appetizing, vibrant colors.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar imagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let imageUrl = "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract image from the response images array (standard format)
    const images = data.choices?.[0]?.message?.images;
    if (images && images.length > 0) {
      const imgData = images[0]?.image_url?.url;
      if (imgData && imgData.startsWith("data:")) {
        const matches = imgData.match(/data:([^;]+);base64,(.+)/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const fileName = `meal-images/${mealId}-${Date.now()}.png`;
          const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

          const { error: uploadError } = await supabase.storage
            .from("landing-assets")
            .upload(fileName, imageBuffer, { contentType: mimeType, upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("landing-assets").getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
          }
        }
      } else if (imgData && imgData.startsWith("http")) {
        imageUrl = imgData;
      }
    }

    // Fallback: check parts format
    if (!imageUrl && data.choices?.[0]?.message?.parts) {
      for (const part of data.choices[0].message.parts) {
        if (part.inline_data) {
          const base64Data = part.inline_data.data;
          const mimeType = part.inline_data.mime_type || "image/png";
          const fileName = `meal-images/${mealId}-${Date.now()}.png`;
          const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

          const { error: uploadError } = await supabase.storage
            .from("landing-assets")
            .upload(fileName, imageBuffer, { contentType: mimeType, upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("landing-assets").getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
          }
          break;
        }
      }
    }

    // Fallback: content string
    if (!imageUrl) {
      const content = data.choices?.[0]?.message?.content;
      if (typeof content === "string") {
        if (content.startsWith("http")) {
          imageUrl = content;
        } else if (content.includes("base64")) {
          const matches = content.match(/data:([^;]+);base64,(.+)/);
          if (matches) {
            const fileName = `meal-images/${mealId}-${Date.now()}.png`;
            const imageBuffer = Uint8Array.from(atob(matches[2]), (c) => c.charCodeAt(0));
            const { error: uploadError } = await supabase.storage
              .from("landing-assets")
              .upload(fileName, imageBuffer, { contentType: matches[1], upsert: true });
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from("landing-assets").getPublicUrl(fileName);
              imageUrl = urlData.publicUrl;
            }
          }
        }
      }
    }

    // Save image_url to diet_meals
    if (imageUrl) {
      await supabase.from("diet_meals").update({ image_url: imageUrl }).eq("id", mealId);
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-meal-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
