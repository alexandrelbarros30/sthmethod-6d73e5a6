import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AI_PLANS, useAiApp } from "@/hooks/useAiApp";
import { useAiOffer } from "@/hooks/useAiGrowth";
import AiOfferCard from "@/components/ai/AiOfferCard";
import { Loader2, Check } from "lucide-react";

export default function AiSubscription() {
  const { subscription, loading, user, refresh } = useAiApp();
  const { offer, dismiss } = useAiOffer();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ discount: number; code: string } | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const status = params.get("status");
    if (status === "approved") {
      toast.success("Pagamento aprovado. Ativando seu plano...");
      setTimeout(refresh, 2500);
    } else if (status === "failed") {
      toast.error("Pagamento não aprovado.");
    }
  }, [params, refresh]);

  async function validateCoupon(planId: string) {
    if (!couponCode) return;
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-coupon", {
        body: { code: couponCode, plan_id: planId, payment_method: "pix" }
      });
      if (error) throw error;
      if (data.valid) {
        setAppliedCoupon({ discount: data.discount_value, code: data.code });
        toast.success(`Cupom ${data.code} aplicado: ${data.discount_value}% de desconto.`);
      } else {
        toast.error(data.reason || "Cupom inválido");
        setAppliedCoupon(null);
      }
    } catch (err) {
      toast.error("Erro ao validar cupom.");
    } finally {
      setValidating(false);
    }
  }

  async function subscribe(plan: string) {
    setBusy(plan);
    try {
      const { data, error } = await supabase.functions.invoke("sth-ai-subscribe", { 
        body: { 
          plan, 
          coupon_code: appliedCoupon?.code,
          payment_method: "pix" 
        } 
      });
      if (error) throw error;
      const url = (data as any)?.init_point;
      if (!url) throw new Error((data as any)?.error || "Checkout indisponível");
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error)?.message || "Não foi possível iniciar o pagamento.");
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AiShell title="Seu plano" subtitle="Assinatura do STH METHOD AI, sem fidelidade.">
      {offer && (
        <div className="mb-5">
          <AiOfferCard offer={offer} onDismiss={dismiss} />
        </div>
      )}

      {subscription && (
        <Card className="mb-5 flex items-center justify-between gap-3 border-primary/30 bg-primary/5 p-5">
          <div>
            <p className="text-sm font-semibold capitalize">Plano {subscription.plan} ativo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Válido até {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString("pt-BR") : "—"}
            </p>
          </div>
          <Badge>Ativo</Badge>
        </Card>
      )}

      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        {AI_PLANS.map((plan) => {
          const isOfficial = !plan.id.includes('oferta') && !plan.id.includes('fundador');
          const finalPrice = appliedCoupon && isOfficial
            ? (parseFloat(plan.price.replace("R$ ", "").replace(",", ".")) * (1 - appliedCoupon.discount / 100))
                .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
            : plan.price;

          return (
            <Card key={plan.id} className={`flex flex-col justify-between gap-4 p-5 ${!isOfficial ? 'border-primary/30 bg-primary/5' : ''}`}>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{plan.label}</p>
                  {!isOfficial && <Badge variant="secondary" className="text-[10px] uppercase">Lançamento</Badge>}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className={`text-3xl font-semibold tracking-tight ${appliedCoupon && isOfficial ? 'text-primary' : ''}`}>
                    {finalPrice}
                  </p>
                  {appliedCoupon && isOfficial && (
                    <p className="text-sm text-muted-foreground line-through opacity-50">{plan.price}</p>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{plan.note}</p>
                
                {isOfficial && (
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Cupom STH10AI" 
                        className="h-8 text-xs" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-3 text-xs"
                        onClick={() => validateCoupon(plan.id)}
                        disabled={validating}
                      >
                        Aplicar
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <p className="text-[10px] text-primary font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" /> Cupom {appliedCoupon.code} aplicado (-{appliedCoupon.discount}%)
                      </p>
                    )}
                  </div>
                )}

                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Cardápio inteligente por ciclo</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Treino periodizado por ciclo</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Central de análise a cada 60 dias</li>
                </ul>
              </div>
              <Button 
                onClick={() => subscribe(plan.id)} 
                disabled={busy !== null}
                className={!isOfficial ? "shadow-lg shadow-primary/20" : ""}
              >
                {busy === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isOfficial && appliedCoupon ? "Assinar com desconto" : "Assinar agora"}
              </Button>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Pagamento processado pelo Mercado Pago. A liberação é automática após a aprovação.
      </p>
    </AiShell>
  );
}