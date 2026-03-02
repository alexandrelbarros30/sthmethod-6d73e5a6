import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, CreditCard, QrCode, ExternalLink, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const StudentSubscription = () => {
  const { user } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [pixCopied, setPixCopied] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("active", true).order("duration_days");
      return data || [];
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["my-subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: paymentLinks } = useQuery({
    queryKey: ["plan-payment-links"],
    queryFn: async () => {
      const { data } = await supabase.from("plan_payment_links").select("*");
      return data || [];
    },
  });

  const currentPlanId = subscription?.plan_id;
  const isExpired = subscription ? new Date(subscription.end_date) < new Date() : true;
  const isActive = subscription?.status === "active" && !isExpired;

  const calculateFinalPrice = (plan: any) => {
    const priceStr = plan.price.replace(/[^\d,\.]/g, "").replace(",", ".");
    let amount = parseFloat(priceStr) || 0;
    if (plan.discount_type === "percentage" && plan.discount_value > 0) {
      amount = amount * (1 - plan.discount_value / 100);
    } else if (plan.discount_type === "fixed" && plan.discount_value > 0) {
      amount = Math.max(0, amount - plan.discount_value);
    }
    return Math.round(amount * 100) / 100;
  };

  const getPlanLink = (planId: string) =>
    paymentLinks?.find((l: any) => l.plan_id === planId);

  const openCheckout = (plan: any) => {
    setSelectedPlan(plan);
    setPixCopied(false);
    setCheckoutOpen(true);
  };

  const copyPixCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setPixCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setPixCopied(false), 3000);
  };

  return (
    <DashboardLayout role="student" title="Assinatura" subtitle="Gerencie seu plano e veja os benefícios.">
      {/* Current subscription status */}
      {subscription && (
        <Card className="mb-6 bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plano atual</p>
                <p className="text-lg font-bold text-foreground">{(subscription as any).plans?.name || "—"}</p>
              </div>
              <Badge className={isActive ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}>
                {isActive ? "Ativo" : isExpired ? "Vencido" : "Inativo"}
              </Badge>
              <div className="text-sm text-muted-foreground">
                <span>Início: {new Date(subscription.start_date).toLocaleDateString("pt-BR")}</span>
                <span className="mx-2">•</span>
                <span>Término: {new Date(subscription.end_date).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
        {plans?.map((plan: any, i: number) => {
          const isCurrent = plan.id === currentPlanId && isActive;
          const finalPrice = calculateFinalPrice(plan);
          const originalPrice = parseFloat(plan.price.replace(/[^\d,\.]/g, "").replace(",", ".")) || 0;
          const hasDiscount = plan.discount_type !== "none" && plan.discount_value > 0;

          return (
            <Card
              key={plan.id}
              className={`animate-fade-in relative ${isCurrent ? "border-primary shadow-card-hover ring-2 ring-primary/20" : ""}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Seu plano</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2 pt-6">
                <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
                {plan.subtitle && <p className="text-xs text-muted-foreground font-body">{plan.subtitle}</p>}
                {hasDiscount && (
                  <p className="text-sm line-through text-muted-foreground/60 font-body">R$ {originalPrice.toFixed(2)}</p>
                )}
                <p className="text-2xl font-bold text-foreground mt-1 font-body">
                  R$ {finalPrice.toFixed(2)}
                </p>
                {hasDiscount && (
                  <Badge variant="outline" className="text-xs text-primary border-primary/30">
                    {plan.discount_type === "percentage" ? `${plan.discount_value}% OFF` : `R$ ${plan.discount_value} OFF`}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground font-body">{plan.duration}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.benefits?.map((b: string, j: number) => (
                    <li key={j} className="flex items-start gap-2 text-sm font-body">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
                {!isCurrent && (
                  <Button className="w-full" onClick={() => openCheckout(plan)}>
                    {!subscription ? "Assinar" : isExpired ? "🔓 Desbloquear" : "🔄 Atualizar"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Checkout Dialog with manual links */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Realizar Pagamento</DialogTitle>
          </DialogHeader>
          {selectedPlan && (() => {
            const link = getPlanLink(selectedPlan.id);
            const hasPix = link?.pix_enabled && link?.pix_code;
            const hasCard = link?.card_enabled && link?.card_link;
            const hasAny = hasPix || hasCard;

            return (
              <div className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Plano selecionado</p>
                  <p className="text-lg font-bold text-foreground">{selectedPlan.name}</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    R$ {calculateFinalPrice(selectedPlan).toFixed(2)}
                  </p>
                </div>

                {!hasAny && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum método de pagamento disponível para este plano no momento. Entre em contato com o suporte.
                  </p>
                )}

                {/* PIX */}
                {hasPix && (
                  <div className="space-y-2 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">PIX</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => copyPixCode(link!.pix_code!)}
                    >
                      {pixCopied ? (
                        <><CheckCircle2 className="w-4 h-4 mr-2 text-primary" />Código Copiado!</>
                      ) : (
                        <><Copy className="w-4 h-4 mr-2" />Copiar código PIX</>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Após o pagamento, seu plano será ativado após confirmação.
                    </p>
                  </div>
                )}

                {/* Card */}
                {hasCard && (
                  <div className="space-y-2 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">Cartão de Crédito / Débito</span>
                    </div>
                    <a href={link!.card_link!} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Pagar com Cartão
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentSubscription;
