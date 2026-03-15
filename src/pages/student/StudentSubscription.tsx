import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import DynamicCheckoutDialog from "@/components/DynamicCheckoutDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";

const StudentSubscription = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [renewalStep, setRenewalStep] = useState(1);
  const [renewalOpen, setRenewalOpen] = useState(false);
  const [renewalForm, setRenewalForm] = useState({ weight: "", height: "" });

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["student-profile-onboard", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("active", true).eq("visibility", "public").order("duration_days");
      return data || [];
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["my-subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*, plans(*)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: bodyImages } = useQuery({
    queryKey: ["body-images", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("body_images").select("*").eq("user_id", user!.id).eq("is_current", true);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const isExpired = subscription ? new Date(subscription.end_date) < new Date() : true;
  const isActive = subscription?.status === "active" && !isExpired;
  const currentPlanId = subscription?.plan_id;
  const isOnboarded = profile?.onboarding_complete;
  const profileComplete = profile?.full_name && profile?.phone && profile?.height && profile?.weight && profile?.physical_activity && profile?.objective && profile?.current_protocol && profile?.comorbidities;

  const needsOnboarding = !isOnboarded && !isActive;
  const effectiveOnboardingStep = needsOnboarding
    ? (!profileComplete ? 1 : 3)
    : onboardingStep;

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

  const markOnboarded = useMutation({
    mutationFn: async () => {
      await supabase.from("profiles").update({ onboarding_complete: true }).eq("user_id", user!.id);
    },
    onSuccess: () => { refetchProfile(); },
  });

  const updateRenewalData = useMutation({
    mutationFn: async () => {
      if (!renewalForm.weight || !renewalForm.height) throw new Error("Preencha peso e altura");
      await supabase.from("profiles").update({
        weight: Number(renewalForm.weight),
        height: Number(renewalForm.height),
      }).eq("user_id", user!.id);
    },
    onSuccess: () => {
      toast.success("Dados atualizados!");
      // Close renewal dialog and open checkout
      setRenewalOpen(false);
      setCheckoutOpen(true);
      refetchProfile();
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ONBOARDING FLOW for new students
  if (needsOnboarding) {
    return (
      <DashboardLayout role="student" title="Bem-vindo à ST&H!" subtitle="Complete seu cadastro para começar.">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { n: 1, label: "Cadastro" },
            { n: 3, label: "Pagamento" },
          ].map(({ n, label }, idx, arr) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                effectiveOnboardingStep >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {effectiveOnboardingStep > n ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={`text-sm font-body ${effectiveOnboardingStep >= n ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {idx < arr.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {effectiveOnboardingStep === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-display">Complete seu cadastro</CardTitle>
              <p className="text-sm text-muted-foreground">
                Para liberar totalmente seu acesso, acesse a Visão Geral e complete os dados do seu cadastro.
              </p>
            </CardHeader>
            <CardContent>
              <Link to="/dashboard#status-cadastro">
                <Button className="w-full">Verificar cadastro</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {effectiveOnboardingStep === 2 && (
          <div className="max-w-2xl mx-auto">
            <BodyImageUpload
              userId={user!.id}
              existingImages={bodyImages || []}
              canDeleteExisting={false}
              onComplete={() => {
                qc.invalidateQueries({ queryKey: ["body-images"] });
                setOnboardingStep(3);
              }}
            />
          </div>
        )}

        {effectiveOnboardingStep === 3 && (
          <div className="space-y-4">
            <Card className="max-w-2xl mx-auto mb-4">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground text-center">
                  ✅ Cadastro completo! Escolha seu plano abaixo para ativar o acesso.
                </p>
              </CardContent>
            </Card>
            <PlanCards
              plans={plans || []}
              currentPlanId={null}
              isActive={false}
              isExpired={true}
              subscription={null}
              calculateFinalPrice={calculateFinalPrice}
              onSelect={(plan: any) => {
                setSelectedPlan(plan);
                setCheckoutOpen(true);
              }}
            />
          </div>
        )}

        <DynamicCheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          selectedPlan={selectedPlan}
          calculateFinalPrice={calculateFinalPrice}
          actionType="new"
          onPaymentSuccess={() => markOnboarded.mutate()}
        />
      </DashboardLayout>
    );
  }

  // NORMAL VIEW (onboarded student)
  return (
    <DashboardLayout role="student" title="Assinatura" subtitle="Gerencie seu plano e veja os benefícios.">
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

      <PlanCards
        plans={plans || []}
        currentPlanId={currentPlanId}
        isActive={isActive}
        isExpired={isExpired}
        subscription={subscription}
        calculateFinalPrice={calculateFinalPrice}
        onSelect={(plan: any) => {
          setSelectedPlan(plan);
          if (isExpired || !isActive) {
            // Renewal flow - update body data first
            setRenewalForm({ weight: profile?.weight?.toString() || "", height: profile?.height?.toString() || "" });
            setRenewalStep(1);
            setRenewalOpen(true);
          } else {
            // Upgrade — direct to payment
            setCheckoutOpen(true);
          }
        }}
      />

      {/* Renewal Dialog - update body data before payment */}
      <Dialog open={renewalOpen} onOpenChange={setRenewalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Atualizar Dados Corporais</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Atualize seu peso, altura e envie novas fotos corporais.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body">Peso (kg) *</Label>
                <Input type="number" value={renewalForm.weight} onChange={(e) => setRenewalForm({ ...renewalForm, weight: e.target.value })} />
              </div>
              <div>
                <Label className="font-body">Altura (cm) *</Label>
                <Input type="number" value={renewalForm.height} onChange={(e) => setRenewalForm({ ...renewalForm, height: e.target.value })} />
              </div>
            </div>
            <BodyImageUpload
              userId={user!.id}
              existingImages={bodyImages || []}
              canDeleteExisting={false}
              onComplete={() => {
                qc.invalidateQueries({ queryKey: ["body-images"] });
                updateRenewalData.mutate();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <DynamicCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        selectedPlan={selectedPlan}
        calculateFinalPrice={calculateFinalPrice}
        actionType={isExpired || !isActive ? "unlock" : "upgrade"}
      />
    </DashboardLayout>
  );
};

// Extracted Plan Cards component
const PlanCards = ({ plans, currentPlanId, isActive, isExpired, subscription, calculateFinalPrice, onSelect }: any) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
    {plans?.map((plan: any, i: number) => {
      const isCurrent = plan.id === currentPlanId && isActive;
      const finalPrice = calculateFinalPrice(plan);
      const originalPrice = parseFloat(plan.price.replace(/[^\d,\.]/g, "").replace(",", ".")) || 0;
      const hasDiscount = plan.discount_type !== "none" && plan.discount_value > 0;
      return (
        <Card key={plan.id} className={`animate-fade-in relative ${isCurrent ? "border-primary shadow-card-hover ring-2 ring-primary/20" : ""}`} style={{ animationDelay: `${i * 100}ms` }}>
          {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-primary text-primary-foreground">Seu plano</Badge></div>}
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
            {plan.subtitle && <p className="text-xs text-muted-foreground font-body">{plan.subtitle}</p>}
            {hasDiscount && <p className="text-sm line-through text-muted-foreground/60">R$ {originalPrice.toFixed(2)}</p>}
            <p className="text-2xl font-bold text-foreground mt-1">R$ {finalPrice.toFixed(2)}</p>
            {hasDiscount && <Badge variant="outline" className="text-xs text-primary border-primary/30">{plan.discount_type === "percentage" ? `${plan.discount_value}% OFF` : `R$ ${plan.discount_value} OFF`}</Badge>}
            <p className="text-xs text-muted-foreground font-body">{plan.duration}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {plan.benefits?.map((b: string, j: number) => (
                <li key={j} className="flex items-start gap-2 text-sm font-body"><Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span className="text-muted-foreground">{b}</span></li>
              ))}
            </ul>
            {!isCurrent && (
              <Button className="w-full" onClick={() => onSelect(plan)}>
                {!subscription ? "Assinar" : isExpired ? "🔓 Renovar" : "🔄 Atualizar"}
              </Button>
            )}
          </CardContent>
        </Card>
      );
    })}
  </div>
);

export default StudentSubscription;
