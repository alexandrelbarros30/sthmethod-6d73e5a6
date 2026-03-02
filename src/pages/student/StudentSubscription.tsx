import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, CreditCard, QrCode, ExternalLink, Copy, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";

const phoneMask = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const StudentSubscription = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1); // 1=profile, 2=images, 3=payment
  const [renewalStep, setRenewalStep] = useState(1); // 1=update body, 2=payment
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
      const { data } = await supabase.from("plans").select("*").eq("active", true).order("duration_days");
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

  const { data: paymentLinks } = useQuery({
    queryKey: ["plan-payment-links"],
    queryFn: async () => {
      const { data } = await supabase.from("plan_payment_links").select("*");
      return data || [];
    },
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
  const hasImages = bodyImages && bodyImages.length >= 3;
  const profileComplete = profile?.full_name && profile?.phone && profile?.height && profile?.weight && profile?.physical_activity && profile?.objective && profile?.current_protocol && profile?.comorbidities;

  // For new students: determine which step to show
  const needsOnboarding = !isOnboarded && !isActive;
  const effectiveOnboardingStep = needsOnboarding
    ? (!profileComplete ? 1 : !hasImages ? 2 : 3)
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

  const getPlanLink = (planId: string) => paymentLinks?.find((l: any) => l.plan_id === planId);

  const copyPixCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setPixCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setPixCopied(false), 3000);
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
      setRenewalStep(2);
      refetchProfile();
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ONBOARDING FLOW for new students
  if (needsOnboarding) {
    return (
      <DashboardLayout role="student" title="Bem-vindo à ST&H!" subtitle="Complete seu cadastro para começar.">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { n: 1, label: "Cadastro" },
            { n: 2, label: "Fotos" },
            { n: 3, label: "Pagamento" },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                effectiveOnboardingStep >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {effectiveOnboardingStep > n ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={`text-sm font-body ${effectiveOnboardingStep >= n ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {n < 3 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Profile */}
        {effectiveOnboardingStep === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-display">Complete seu perfil</CardTitle>
              <p className="text-sm text-muted-foreground">Preencha todos os campos obrigatórios para continuar.</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Acesse <strong>Visão Geral</strong> no menu lateral para preencher seus dados pessoais, saúde e objetivos. Após completar, volte aqui.
              </p>
              <Button onClick={() => refetchProfile()}>Verificar Cadastro</Button>
              {!profileComplete && (
                <p className="text-xs text-destructive mt-2">⚠️ Cadastro incompleto. Preencha todos os campos obrigatórios.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Body Images */}
        {effectiveOnboardingStep === 2 && (
          <div className="max-w-2xl mx-auto">
            <BodyImageUpload
              userId={user!.id}
              existingImages={bodyImages || []}
              required
              onComplete={() => {
                qc.invalidateQueries({ queryKey: ["body-images"] });
                setOnboardingStep(3);
              }}
            />
          </div>
        )}

        {/* Step 3: Payment */}
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
                setPixCopied(false);
                setCheckoutOpen(true);
              }}
            />
          </div>
        )}

        <CheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          selectedPlan={selectedPlan}
          getPlanLink={getPlanLink}
          calculateFinalPrice={calculateFinalPrice}
          pixCopied={pixCopied}
          copyPixCode={copyPixCode}
          onPaymentNotified={() => markOnboarded.mutate()}
        />
      </DashboardLayout>
    );
  }

  // NORMAL VIEW (onboarded student)
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

      <PlanCards
        plans={plans || []}
        currentPlanId={currentPlanId}
        isActive={isActive}
        isExpired={isExpired}
        subscription={subscription}
        calculateFinalPrice={calculateFinalPrice}
        onSelect={(plan: any) => {
          if (isExpired || !isActive) {
            // Renewal flow
            setSelectedPlan(plan);
            setRenewalForm({ weight: profile?.weight?.toString() || "", height: profile?.height?.toString() || "" });
            setRenewalStep(1);
            setRenewalOpen(true);
          } else {
            // Upgrade — direct to payment
            setSelectedPlan(plan);
            setPixCopied(false);
            setCheckoutOpen(true);
          }
        }}
      />

      {/* Renewal Dialog */}
      <Dialog open={renewalOpen} onOpenChange={setRenewalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {renewalStep === 1 ? "Atualizar Dados Corporais" : "Pagamento da Renovação"}
            </DialogTitle>
          </DialogHeader>
          {renewalStep === 1 && (
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
                required
                onComplete={() => {
                  qc.invalidateQueries({ queryKey: ["body-images"] });
                  updateRenewalData.mutate();
                }}
              />
            </div>
          )}
          {renewalStep === 2 && selectedPlan && (() => {
            const link = getPlanLink(selectedPlan.id);
            const hasPix = link?.pix_enabled && link?.pix_code;
            const hasCard = link?.card_enabled && link?.card_link;
            const hasAny = hasPix || hasCard;
            return (
              <div className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Renovar plano</p>
                  <p className="text-lg font-bold text-foreground">{selectedPlan.name}</p>
                  <p className="text-2xl font-bold text-primary mt-1">R$ {calculateFinalPrice(selectedPlan).toFixed(2)}</p>
                </div>
                {!hasAny && <p className="text-sm text-muted-foreground text-center py-4">Nenhum método disponível. Entre em contato com o suporte.</p>}
                {hasPix && (
                  <div className="space-y-2 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2"><QrCode className="w-5 h-5 text-primary" /><span className="text-sm font-medium">PIX</span></div>
                    <Button variant="outline" className="w-full" onClick={() => copyPixCode(link!.pix_code!)}>
                      {pixCopied ? <><CheckCircle2 className="w-4 h-4 mr-2 text-primary" />Copiado!</> : <><Copy className="w-4 h-4 mr-2" />Copiar código PIX</>}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Após o pagamento, seu plano será ativado após confirmação.</p>
                  </div>
                )}
                {hasCard && (
                  <div className="space-y-2 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /><span className="text-sm font-medium">Cartão</span></div>
                    <a href={link!.card_link!} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full"><ExternalLink className="w-4 h-4 mr-2" />Pagar com Cartão</Button>
                    </a>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        selectedPlan={selectedPlan}
        getPlanLink={getPlanLink}
        calculateFinalPrice={calculateFinalPrice}
        pixCopied={pixCopied}
        copyPixCode={copyPixCode}
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

// Extracted Checkout Dialog component
const CheckoutDialog = ({ open, onOpenChange, selectedPlan, getPlanLink, calculateFinalPrice, pixCopied, copyPixCode, onPaymentNotified }: any) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
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
              <p className="text-2xl font-bold text-primary mt-1">R$ {calculateFinalPrice(selectedPlan).toFixed(2)}</p>
            </div>
            {!hasAny && <p className="text-sm text-muted-foreground text-center py-4">Nenhum método disponível. Entre em contato com o suporte.</p>}
            {hasPix && (
              <div className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2"><QrCode className="w-5 h-5 text-primary" /><span className="text-sm font-medium text-foreground">PIX</span></div>
                <Button variant="outline" className="w-full" onClick={() => copyPixCode(link!.pix_code!)}>
                  {pixCopied ? <><CheckCircle2 className="w-4 h-4 mr-2 text-primary" />Código Copiado!</> : <><Copy className="w-4 h-4 mr-2" />Copiar código PIX</>}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Após o pagamento, seu plano será ativado após confirmação.</p>
              </div>
            )}
            {hasCard && (
              <div className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2"><CreditCard className="w-5 h-5 text-primary" /><span className="text-sm font-medium text-foreground">Cartão</span></div>
                <a href={link!.card_link!} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full"><ExternalLink className="w-4 h-4 mr-2" />Pagar com Cartão</Button>
                </a>
              </div>
            )}
            {onPaymentNotified && (
              <Button variant="outline" className="w-full mt-2" onClick={() => { onPaymentNotified(); onOpenChange(false); }}>
                ✅ Já paguei
              </Button>
            )}
          </div>
        );
      })()}
    </DialogContent>
  </Dialog>
);

export default StudentSubscription;
