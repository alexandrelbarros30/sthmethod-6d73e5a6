import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { triggerSupercoachSync } from "../_shared/supercoach-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });

    const userId = claimsData.claims.sub;
    const { payment_id, receipt_url } = await req.json();

    if (!payment_id || !receipt_url)
      throw new Error("Missing payment_id or receipt_url");

    // Fetch payment
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .select("*, plans(name, price, duration_days)")
      .eq("id", payment_id)
      .single();

    if (payErr || !payment) throw new Error("Payment not found");
    if (payment.user_id !== userId)
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: corsHeaders,
      });

    // Store receipt and verification status in gateway details table
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceSupabase
      .from("payment_gateway_details")
      .upsert({
        payment_id,
        receipt_url,
        ai_verification_status: "analyzing",
      }, { onConflict: "payment_id" });

    // Use Lovable AI to analyze the receipt image
    const expectedAmount = Number(payment.amount).toFixed(2);
    const planName = (payment as any).plans?.name || "N/A";

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Você é um verificador de comprovantes de pagamento PIX. Analise a imagem do comprovante e extraia as seguintes informações:
- Valor pago (em reais)
- Data do pagamento
- Status da transação (se visível)
- Nome do destinatário (se visível)

Depois compare com o valor esperado de R$ ${expectedAmount} para o plano "${planName}".

REGRAS DE VERIFICAÇÃO:
- Se o valor pago for EXATAMENTE igual ou maior ao esperado (R$ ${expectedAmount}), marque como "approved"
- Se o valor for menor que o esperado, marque como "review" 
- Se não conseguir ler o comprovante ou a imagem não parecer ser um comprovante PIX, marque como "review"
- Uma tolerância de R$ 0.10 para mais ou menos é aceitável`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analise este comprovante PIX. Valor esperado: R$ ${expectedAmount}. Plano: ${planName}.`,
                },
                {
                  type: "image_url",
                  image_url: { url: receipt_url },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "verify_receipt",
                description:
                  "Retorna o resultado da verificação do comprovante PIX",
                parameters: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      enum: ["approved", "review"],
                      description:
                        "approved se valor confere, review se precisa de revisão manual",
                    },
                    extracted_amount: {
                      type: "string",
                      description:
                        "Valor extraído do comprovante (ex: '149.90') ou 'não identificado'",
                    },
                    payment_date: {
                      type: "string",
                      description:
                        "Data do pagamento extraída ou 'não identificada'",
                    },
                    confidence: {
                      type: "string",
                      enum: ["high", "medium", "low"],
                      description: "Nível de confiança na análise",
                    },
                    notes: {
                      type: "string",
                      description:
                        "Observações sobre a análise (resumo curto em português)",
                    },
                  },
                  required: [
                    "status",
                    "extracted_amount",
                    "payment_date",
                    "confidence",
                    "notes",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "verify_receipt" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      // Fallback: mark as review
      await serviceSupabase
        .from("payment_gateway_details")
        .upsert({
          payment_id,
          ai_verification_status: "review",
          ai_verification_notes:
            "Análise automática indisponível. Revisão manual necessária.",
        }, { onConflict: "payment_id" });

      return new Response(
        JSON.stringify({
          status: "review",
          notes: "Análise automática indisponível. Aguarde revisão do admin.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let verificationStatus = "review";
    let verificationNotes =
      "Não foi possível analisar o comprovante automaticamente.";

    if (toolCall?.function?.arguments) {
      try {
        const result = JSON.parse(toolCall.function.arguments);
        verificationStatus = result.status || "review";
        verificationNotes = `Valor: ${result.extracted_amount} | Data: ${result.payment_date} | Confiança: ${result.confidence} | ${result.notes}`;

        // If approved with high confidence, auto-activate subscription
        if (
          verificationStatus === "approved" &&
          result.confidence === "high"
        ) {
          // Update payment status
          await serviceSupabase
            .from("payments")
            .update({ status: "approved" })
            .eq("id", payment_id);

          // Activate subscription
          const startDate = new Date();
          const durationDays = (payment as any).plans?.duration_days || 30;

          const { data: existingSub } = await serviceSupabase
            .from("subscriptions")
            .select("id, start_date, end_date, status")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Carry over remaining days if the student renews while still active.
          // Skip when the existing sub started today (same activation flow).
          let baseDate = new Date(startDate);
          if (existingSub?.end_date) {
            const currentEnd = new Date(existingSub.end_date + "T23:59:59");
            const today = startDate.toISOString().split("T")[0];
            const startedToday = (existingSub as any).start_date === today;
            if (currentEnd > startDate && (existingSub as any).status === "active" && !startedToday) {
              baseDate = currentEnd;
            }
          }
          const endDate = new Date(baseDate);
          endDate.setDate(endDate.getDate() + durationDays);

          if (existingSub) {
            await serviceSupabase
              .from("subscriptions")
              .update({
                plan_id: payment.plan_id,
                status: "active",
                start_date: startDate.toISOString().split("T")[0],
                end_date: endDate.toISOString().split("T")[0],
              })
              .eq("id", existingSub.id);
          } else {
            await serviceSupabase.from("subscriptions").insert({
              user_id: userId,
              plan_id: payment.plan_id,
              status: "active",
              start_date: startDate.toISOString().split("T")[0],
              end_date: endDate.toISOString().split("T")[0],
            });
          }

          verificationNotes += " | ✅ Assinatura ativada automaticamente.";

          triggerSupercoachSync({
            userId,
            expiresDate: endDate.toISOString().split("T")[0],
          }).catch(() => {});
        }
      } catch {
        console.error("Failed to parse AI response");
      }
    }

    // Update gateway details with verification results
    await serviceSupabase
      .from("payment_gateway_details")
      .upsert({
        payment_id,
        ai_verification_status: verificationStatus,
        ai_verification_notes: verificationNotes,
        receipt_url,
      }, { onConflict: "payment_id" });

    return new Response(
      JSON.stringify({ status: verificationStatus, notes: verificationNotes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("verify-pix-receipt error:", error);
    return new Response(
      JSON.stringify({ error: "Falha ao verificar comprovante." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
