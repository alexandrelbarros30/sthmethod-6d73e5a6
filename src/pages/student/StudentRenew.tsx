import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, CreditCard, ExternalLink, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const StudentRenew = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pixCopied, setPixCopied] = useState(false);
  const targetUserId = searchParams.get("uid");

  // Verify user matches the link target
  const isAuthorized = user?.id === targetUserId;

  const { data: plans } = useQuery({
    queryKey: ["renew-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("active", true).order("duration_days");
      return data || [];
    },
    enabled: isAuthorized,
  });

  const { data: paymentLinks } = useQuery({
    queryKey: ["renew-payment-links"],
    queryFn: async () => {
      const { data } = await supabase.from("plan_payment_links").select("*");
      return data || [];
    },
    enabled: isAuthorized,
  });

  const { data: profile } = useQuery({
    queryKey: ["renew-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id && isAuthorized,
  });

  const getPlanLink = (planId: string) => paymentLinks?.find((l: any) => l.plan_id === planId);

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

  const copyPixCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setPixCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setPixCopied(false), 3000);
  };

  const notifyPayment = async (planId: string, method: string, amount: number) => {
    try {
      await supabase.from("payments").insert({
        user_id: user!.id,
        plan_id: planId,
        amount,
        original_amount: amount,
        method,
        action_type: "unlock",
        status: "pending",
      });
      toast.success("Pagamento notificado! Aguarde a confirmação do administrador.");
    } catch {
      toast.error("Erro ao notificar pagamento.");
    }
  };

  if (!targetUserId) {
    return (
      <DashboardLayout role="student" title="Link Inválido" subtitle="">
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-sm text-muted-foreground">Este link de pagamento é inválido.</p>
            <Button onClick={() => navigate("/dashboard/subscription")}>Ir para Assinaturas</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!isAuthorized) {
    return (
      <DashboardLayout role="student" title="Acesso Negado" subtitle="">
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Este link de pagamento não pertence à sua conta. Faça login com a conta correta.
            </p>
            <Button onClick={() => navigate("/login")}>Fazer Login</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" title="Renovação de Plano" subtitle={`Olá, ${profile?.full_name || ""}! Escolha seu plano para renovar.`}>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {plans?.map((plan: any) => {
          const finalPrice = calculateFinalPrice(plan);
          const link = getPlanLink(plan.id);
          const hasPix = link?.pix_enabled && link?.pix_code;
          const hasCard = link?.card_enabled && link?.card_link;
          const hasDiscount = plan.discount_type !== "none" && plan.discount_value > 0;
          const originalPrice = parseFloat(plan.price.replace(/[^\d,\.]/g, "").replace(",", ".")) || 0;

          return (
            <Card key={plan.id} className="animate-fade-in">
              <CardHeader className="text-center pb-2 pt-6">
                <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
                {plan.subtitle && <p className="text-xs text-muted-foreground">{plan.subtitle}</p>}
                {hasDiscount && <p className="text-sm line-through text-muted-foreground/60">R$ {originalPrice.toFixed(2)}</p>}
                <p className="text-2xl font-bold text-foreground mt-1">R$ {finalPrice.toFixed(2)}</p>
                {hasDiscount && (
                  <Badge variant="outline" className="text-xs text-primary border-primary/30">
                    {plan.discount_type === "percentage" ? `${plan.discount_value}% OFF` : `R$ ${plan.discount_value} OFF`}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">{plan.duration}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {hasPix && (
                  <div className="space-y-2 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">PIX</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => copyPixCode(link!.pix_code!)}>
                      {pixCopied ? <><CheckCircle2 className="w-4 h-4 mr-1 text-primary" />Copiado!</> : <><Copy className="w-4 h-4 mr-1" />Copiar PIX</>}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground"
                      onClick={() => notifyPayment(plan.id, "pix", finalPrice)}
                    >
                      Já realizei o pagamento
                    </Button>
                  </div>
                )}
                {hasCard && (
                  <div className="space-y-2 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Cartão</span>
                    </div>
                    <a href={link!.card_link!} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="w-full"><ExternalLink className="w-4 h-4 mr-1" />Pagar com Cartão</Button>
                    </a>
                  </div>
                )}
                {!hasPix && !hasCard && (
                  <p className="text-xs text-muted-foreground text-center py-2">Método de pagamento indisponível.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default StudentRenew;
