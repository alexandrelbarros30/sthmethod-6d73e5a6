import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import DynamicCheckoutDialog from "@/components/DynamicCheckoutDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StudentRenew = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const targetUserId = searchParams.get("uid");
  const targetPlanId = searchParams.get("pid");

  const isAuthorized = user?.id === targetUserId;

  const { data: plans } = useQuery({
    queryKey: ["renew-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("active", true).eq("visibility", "public").order("duration_days");
      return data || [];
    },
    enabled: isAuthorized,
  });

  useEffect(() => {
    if (plans && targetPlanId && !selectedPlan) {
      const plan = plans.find((p: any) => p.id === targetPlanId);
      if (plan) {
        setSelectedPlan(plan);
        setCheckoutOpen(true);
      }
    }
  }, [plans, targetPlanId, selectedPlan]);

  const { data: profile } = useQuery({
    queryKey: ["renew-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id && isAuthorized,
  });

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
    const loginUrl = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return (
      <DashboardLayout role="student" title="Acesso Negado" subtitle="">
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Este link de pagamento não pertence à sua conta ou você não está autenticado.
            </p>
            <Button onClick={() => navigate(loginUrl)}>Fazer Login</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" title="Renovação de Plano" subtitle={`Olá, ${profile?.full_name || ""}! Escolha seu plano para renovar.`}>
      <div className="max-w-4xl mx-auto mb-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4 text-sm font-body text-foreground/90 leading-relaxed">
            <p className="font-medium text-foreground mb-1">Antes de renovar: atualize peso e fotos</p>
            <p>
              Para que o próximo ciclo seja calibrado com precisão, o envio de <span className="font-medium text-foreground">peso atualizado</span> e <span className="font-medium text-foreground">novas fotos corporais</span> não é obrigatório, mas é altamente recomendado. As fotos permitem reler sua composição estética, identificar avanços, pontos a corrigir e ajustar o <span className="font-medium text-foreground">treino de musculação</span> ao seu momento atual — sem elas, o novo protocolo trabalha só com números do ciclo anterior.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Você pode atualizar em <span className="font-medium text-foreground">Plataforma → Atualização de Rotina</span> antes ou logo após confirmar a renovação.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {plans?.map((plan: any, i: number) => {
          const finalPrice = calculateFinalPrice(plan);
          const originalPrice = parseFloat(plan.price.replace(/[^\d,\.]/g, "").replace(",", ".")) || 0;
          const hasDiscount = plan.discount_type !== "none" && plan.discount_value > 0;

          return (
            <Card key={plan.id} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <CardHeader className="text-center pb-2 pt-6">
                <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
                {plan.subtitle && <p className="text-xs text-muted-foreground">{plan.subtitle}</p>}
                {hasDiscount && <p className="text-sm line-through text-muted-foreground/60">R$ {originalPrice.toFixed(2)}</p>}
                <p className="text-2xl font-bold text-foreground mt-1">R$ {finalPrice.toFixed(2)}</p>
                {hasDiscount && (
                  <Badge variant="outline" className="text-xs text-foreground border-foreground/20">
                    {plan.discount_type === "percentage" ? `${plan.discount_value}% OFF` : `R$ ${plan.discount_value} OFF`}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">{plan.duration}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {plan.benefits?.map((b: string, j: number) => (
                    <li key={j} className="flex items-start gap-2 text-sm font-body">
                      <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedPlan(plan);
                    setCheckoutOpen(true);
                  }}
                >
                  Renovar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DynamicCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        selectedPlan={selectedPlan}
        calculateFinalPrice={calculateFinalPrice}
        actionType="unlock"
      />
    </DashboardLayout>
  );
};

export default StudentRenew;
