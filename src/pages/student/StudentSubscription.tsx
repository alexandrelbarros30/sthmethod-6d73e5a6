import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, CreditCard, QrCode, ExternalLink, Copy, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Upload, ImageIcon, ShieldCheck, AlertTriangle } from "lucide-react";
import CouponInput from "@/components/CouponInput";
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

        {/* Step 1: Profile — redirect to Overview */}
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

        {/* Step 2: Body Images */}
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
                canDeleteExisting={false}
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

// Extracted Checkout Dialog component with receipt upload
const CheckoutDialog = ({ open, onOpenChange, selectedPlan, getPlanLink, calculateFinalPrice, pixCopied, copyPixCode, onPaymentNotified }: any) => {
  const { user } = useAuth();
  const [receiptStep, setReceiptStep] = useState<"payment" | "upload" | "result">("payment");
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ status: string; notes: string } | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const baseFinalPrice = selectedPlan ? calculateFinalPrice(selectedPlan) : 0;
  const priceAfterCoupon = Math.max(0, Math.round((baseFinalPrice - couponDiscount) * 100) / 100);

  const handleClose = (val: boolean) => {
    if (!val) {
      setReceiptStep("payment");
      setVerificationResult(null);
      setAppliedCoupon(null);
    }
    onOpenChange(val);
  };

  const createPendingPayment = async () => {
    if (!user || !selectedPlan) return null;
    const amount = priceAfterCoupon;
    const priceStr = selectedPlan.price.replace(/[^\d,\.]/g, "").replace(",", ".");
    const origAmount = parseFloat(priceStr) || 0;

    const insertPayload: any = {
      user_id: user.id,
      plan_id: selectedPlan.id,
      amount,
      original_amount: origAmount,
      method: "pix",
      action_type: "new",
      status: "pending",
    };
    if (appliedCoupon?.id) {
      insertPayload.coupon_id = appliedCoupon.id;
      insertPayload.coupon_discount = couponDiscount;
    }

    const { data, error } = await supabase.from("payments").insert(insertPayload).select().single();
    if (error) throw error;

    // Increment coupon usage via edge function
    if (appliedCoupon?.id) {
      await supabase.functions.invoke("validate-coupon", {
        body: { coupon_id: appliedCoupon.id, plan_id: selectedPlan.id },
      });
    }

    return data;
  };

  const handleReceiptUpload = async (file: File) => {
    if (!user || !selectedPlan) return;
    setUploading(true);
    try {
      // Upload receipt to storage
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/receipts/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      const receiptUrl = urlData.publicUrl;

      // Create pending payment if needed
      let payment = await createPendingPayment();
      if (!payment) throw new Error("Failed to create payment");

      // Call verification edge function
      setUploading(false);
      setVerifying(true);
      setReceiptStep("result");

      const { data: fnData, error: fnErr } = await supabase.functions.invoke("verify-pix-receipt", {
        body: { payment_id: payment.id, receipt_url: receiptUrl },
      });

      if (fnErr) throw fnErr;

      setVerificationResult(fnData);

      if (fnData?.status === "approved") {
        toast.success("Comprovante verificado! Assinatura ativada.");
        if (onPaymentNotified) onPaymentNotified();
      } else {
        toast.info("Comprovante enviado para análise. Aguarde a confirmação.");
        if (onPaymentNotified) onPaymentNotified();
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao enviar comprovante. Tente novamente.");
      setReceiptStep("payment");
    } finally {
      setUploading(false);
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">
            {receiptStep === "payment" && "Realizar Pagamento"}
            {receiptStep === "upload" && "Enviar Comprovante"}
            {receiptStep === "result" && "Verificação do Comprovante"}
          </DialogTitle>
        </DialogHeader>

        {/* Payment step */}
        {receiptStep === "payment" && selectedPlan && (() => {
          const link = getPlanLink(selectedPlan.id);
          const hasPix = link?.pix_enabled && link?.pix_code;
          const hasCard = link?.card_enabled && link?.card_link;
          const hasAny = hasPix || hasCard;
          return (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Plano selecionado</p>
                <p className="text-lg font-bold text-foreground">{selectedPlan.name}</p>
                {couponDiscount > 0 && <p className="text-sm line-through text-muted-foreground/60">R$ {baseFinalPrice.toFixed(2)}</p>}
                <p className="text-2xl font-bold text-primary mt-1">R$ {priceAfterCoupon.toFixed(2)}</p>
              </div>
              <CouponInput
                planId={selectedPlan.id}
                originalPrice={baseFinalPrice}
                onCouponApplied={setAppliedCoupon}
              />
              {!hasAny && <p className="text-sm text-muted-foreground text-center py-4">Nenhum método disponível. Entre em contato com o suporte.</p>}
              {hasPix && (
                <div className="space-y-2 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2"><QrCode className="w-5 h-5 text-primary" /><span className="text-sm font-medium text-foreground">PIX</span></div>
                  <Button variant="outline" className="w-full" onClick={() => copyPixCode(link!.pix_code!)}>
                    {pixCopied ? <><CheckCircle2 className="w-4 h-4 mr-2 text-primary" />Código Copiado!</> : <><Copy className="w-4 h-4 mr-2" />Copiar código PIX</>}
                  </Button>
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
              {hasPix && (
                <Button className="w-full" onClick={() => setReceiptStep("upload")}>
                  <Upload className="w-4 h-4 mr-2" />Já paguei — Enviar comprovante
                </Button>
              )}
              {!hasPix && onPaymentNotified && (
                <Button variant="outline" className="w-full mt-2" onClick={() => { onPaymentNotified(); handleClose(false); }}>
                  ✅ Já paguei
                </Button>
              )}
            </div>
          );
        })()}

        {/* Upload step */}
        {receiptStep === "upload" && (
          <div className="space-y-4">
            <div className="text-center p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Enviando...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Toque para selecionar o comprovante</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG ou screenshot do pagamento</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleReceiptUpload(file);
              }}
            />
            <Button variant="outline" className="w-full" onClick={() => setReceiptStep("payment")}>
              <ArrowLeft className="w-4 h-4 mr-2" />Voltar
            </Button>
          </div>
        )}

        {/* Result step */}
        {receiptStep === "result" && (
          <div className="space-y-4">
            {verifying ? (
              <div className="text-center py-8">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">Analisando comprovante com IA...</p>
                <p className="text-xs text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
              </div>
            ) : verificationResult?.status === "approved" ? (
              <div className="text-center py-6 space-y-3">
                <ShieldCheck className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-lg font-bold text-foreground">Pagamento Confirmado!</h3>
                <p className="text-sm text-muted-foreground">Seu comprovante foi verificado e a assinatura foi ativada automaticamente.</p>
                <Button className="w-full" onClick={() => handleClose(false)}>Fechar</Button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
                <h3 className="text-lg font-bold text-foreground">Comprovante em Análise</h3>
                <p className="text-sm text-muted-foreground">Seu comprovante foi enviado e será revisado pelo administrador. Você receberá a confirmação em breve.</p>
                <Button className="w-full" onClick={() => handleClose(false)}>Entendi</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentSubscription;
