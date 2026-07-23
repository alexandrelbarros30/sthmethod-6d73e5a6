import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, CreditCard, ExternalLink, Copy, CheckCircle2, Loader2, ArrowLeft, Upload, ImageIcon, ShieldCheck, AlertTriangle } from "lucide-react";
import CouponInput from "@/components/CouponInput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import LegalAcceptanceBlock, {
  recordLegalAcceptances,
  type LegalAcceptanceState,
} from "@/components/legal/LegalAcceptanceBlock";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: any;
  calculateFinalPrice: (plan: any) => number;
  actionType?: string;
  onPaymentSuccess?: () => void;
  /** Override user id for cases like Cadastro where user might not be in AuthContext yet */
  overrideUserId?: string;
  /** Force PIX-only checkout (hides credit/debit buttons regardless of global settings) */
  forcePixOnly?: boolean;
  /** Override email when user is not yet in AuthContext (e.g. Cadastro) */
  overrideEmail?: string;
}

const DynamicCheckoutDialog = ({
  open,
  onOpenChange,
  selectedPlan,
  calculateFinalPrice,
  actionType = "new",
  onPaymentSuccess,
  overrideUserId,
  forcePixOnly = false,
  overrideEmail,
}: CheckoutDialogProps) => {
  const { user } = useAuth();
  const userId = overrideUserId || user?.id;
  const userEmail = overrideEmail || user?.email || null;

  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [receiptStep, setReceiptStep] = useState<"payment" | "upload" | "result">("payment");
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ status: string; notes: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [legalState, setLegalState] = useState<LegalAcceptanceState | null>(null);
  const legalReady = !!legalState?.isComplete;

  const persistLegal = async (context: string) => {
    if (!legalState) return;
    try {
      await recordLegalAcceptances({
        state: legalState,
        userId: userId ?? null,
        email: userEmail,
        context,
      });
    } catch (e) {
      console.error("[legal] persist failed", e);
    }
  };

  const requireLegal = () => {
    if (!legalReady) {
      toast.error("Para prosseguir, confirme os aceites do Programa.");
      return false;
    }
    return true;
  };

  // Check if dynamic payments are enabled
  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings-checkout"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_settings").select("*");
      return data || [];
    },
  });

  // Get manual payment links
  const { data: paymentLinks } = useQuery({
    queryKey: ["plan-payment-links-checkout"],
    queryFn: async () => {
      const { data } = await supabase.from("plan_payment_links").select("*");
      return data || [];
    },
  });

  const isDynamic = paymentSettings?.find((s: any) => s.key === "use_dynamic_payments")?.value === "true";
  const getPlanLink = (planId: string) => paymentLinks?.find((l: any) => l.plan_id === planId);

  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const baseFinalPrice = selectedPlan ? calculateFinalPrice(selectedPlan) : 0;
  const priceAfterCoupon = Math.max(0, Math.round((baseFinalPrice - couponDiscount) * 100) / 100);

  const handleClose = (val: boolean) => {
    if (!val) {
      setAppliedCoupon(null);
      setReceiptStep("payment");
      setVerificationResult(null);
    }
    onOpenChange(val);
  };

  const copyPixCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setPixCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setPixCopied(false), 3000);
  };

  // Dynamic payment via Mercado Pago API
  const handleDynamicPayment = async (method: "pix" | "credit" | "debit") => {
    if (!selectedPlan || !userId) return;
    if (!requireLegal()) return;
    await persistLegal(`checkout:${method}`);
    setCreatingPayment(true);
    try {
      // Plano Projeto Verão 180 no cartão usa assinatura escalonada (preapproval MP):
      // 2× R$ 49,50 + 4× R$ 94,50 = R$ 477,00.
      const isVerao180 = /projeto\s*ver[ãa]o\s*180/i.test(String(selectedPlan?.name || ""));
      if (isVerao180 && method === "credit") {
        const { data, error } = await supabase.functions.invoke("create-mp-subscription", {
          body: { plan_id: selectedPlan.id },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (data?.init_point) {
          window.location.href = data.init_point;
          return;
        }
        throw new Error("URL de assinatura não disponível");
      }

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          plan_id: selectedPlan.id,
          method,
          action_type: actionType,
          coupon_id: appliedCoupon?.id || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.free_activation && data?.redirect_url) {
        toast.success("🎉 Acesso gratuito ativado! Bem-vindo(a) aos testes.");
        window.location.href = data.redirect_url;
        return;
      }

      if (data?.init_point) {
        // Redirect to Mercado Pago checkout
        window.location.href = data.init_point;
      } else {
        throw new Error("URL de pagamento não disponível");
      }
    } catch (e: any) {
      console.error("Payment error:", e);
      toast.error(e.message || "Erro ao criar pagamento. Tente novamente.");
    } finally {
      setCreatingPayment(false);
    }
  };

  // Manual payment - create pending record
  const handleManualPaymentNotified = async () => {
    if (!selectedPlan || !userId) return;
    if (!requireLegal()) return;
    await persistLegal("checkout:manual_notified");
    try {
      const priceStr = selectedPlan.price.replace(/[^\d,\.]/g, "").replace(",", ".");
      const origAmount = parseFloat(priceStr) || 0;

      const insertPayload: any = {
        user_id: userId,
        plan_id: selectedPlan.id,
        amount: priceAfterCoupon,
        original_amount: origAmount,
        method: "manual",
        action_type: actionType,
        status: "pending",
      };
      if (appliedCoupon?.id) {
        insertPayload.coupon_id = appliedCoupon.id;
        insertPayload.coupon_discount = couponDiscount;
      }

      await supabase.from("payments").insert(insertPayload);

      // Increment coupon usage
      if (appliedCoupon?.id) {
        await supabase.functions.invoke("validate-coupon", {
          body: { coupon_id: appliedCoupon.id, plan_id: selectedPlan.id },
        });
      }

      toast.success("Pagamento registrado! Aguarde a confirmação.");
      handleClose(false);
      if (onPaymentSuccess) onPaymentSuccess();
    } catch {
      toast.error("Erro ao registrar pagamento.");
    }
  };

  // Receipt upload for manual PIX
  const createPendingPayment = async () => {
    if (!userId || !selectedPlan) return null;
    const priceStr = selectedPlan.price.replace(/[^\d,\.]/g, "").replace(",", ".");
    const origAmount = parseFloat(priceStr) || 0;

    const insertPayload: any = {
      user_id: userId,
      plan_id: selectedPlan.id,
      amount: priceAfterCoupon,
      original_amount: origAmount,
      method: "pix",
      action_type: actionType,
      status: "pending",
    };
    if (appliedCoupon?.id) {
      insertPayload.coupon_id = appliedCoupon.id;
      insertPayload.coupon_discount = couponDiscount;
    }

    const { data, error } = await supabase.from("payments").insert(insertPayload).select().single();
    if (error) throw error;

    if (appliedCoupon?.id) {
      await supabase.functions.invoke("validate-coupon", {
        body: { coupon_id: appliedCoupon.id, plan_id: selectedPlan.id },
      });
    }

    return data;
  };

  const handleReceiptUpload = async (file: File) => {
    if (!userId || !selectedPlan) return;
    if (!requireLegal()) return;
    await persistLegal("checkout:pix_receipt");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/receipts/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      const receiptUrl = urlData.publicUrl;

      const payment = await createPendingPayment();
      if (!payment) throw new Error("Failed to create payment");

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
        if (onPaymentSuccess) onPaymentSuccess();
      } else {
        toast.info("Comprovante enviado para análise.");
        if (onPaymentSuccess) onPaymentSuccess();
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao enviar comprovante.");
      setReceiptStep("payment");
    } finally {
      setUploading(false);
      setVerifying(false);
    }
  };

  // Check which methods are enabled (forcePixOnly overrides credit/debit)
  // Cupons PIX-only: forçam o checkout a aceitar somente PIX
  const PIX_ONLY_COUPONS = ["DESFOCADOS30", "DESFOCADOS90"];
  const isPixOnlyCoupon = appliedCoupon?.code
    ? PIX_ONLY_COUPONS.includes(String(appliedCoupon.code).toUpperCase())
    : false;
  const effectivePixOnly = forcePixOnly || isPixOnlyCoupon;
  const pixEnabled = paymentSettings?.find((s: any) => s.key === "pix_enabled")?.value !== "false";
  const creditEnabled = !effectivePixOnly && paymentSettings?.find((s: any) => s.key === "credit_enabled")?.value !== "false";
  const debitEnabled = !effectivePixOnly && paymentSettings?.find((s: any) => s.key === "debit_enabled")?.value !== "false";

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
        {receiptStep === "payment" && selectedPlan && (
          <div className="space-y-4">
            {/* Plan summary */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Plano selecionado</p>
              <p className="text-lg font-bold text-foreground">{selectedPlan.name}</p>
              {couponDiscount > 0 && (
                <p className="text-sm line-through text-muted-foreground/60">R$ {baseFinalPrice.toFixed(2)}</p>
              )}
              <p className="text-2xl font-bold text-primary mt-1">R$ {priceAfterCoupon.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Preço no PIX</p>
              {selectedPlan.card_price && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>
                    {/projeto\s*ver[ãa]o\s*180/i.test(String(selectedPlan?.name || ""))
                      ? "Cartão: 6× (2× R$ 49,50 + 4× R$ 94,50) = R$ 477,00"
                      : `Cartão: ${selectedPlan.card_price}${
                          selectedPlan.duration_days >= 180
                            ? " em até 6x de R$ 88,31"
                            : selectedPlan.duration_days >= 90
                              ? " em até 3x de R$ 96,63"
                              : " à vista"
                        }`}
                  </p>
                </div>
              )}
            </div>

            {/* Coupon */}
            <CouponInput
              planId={selectedPlan.id}
              originalPrice={baseFinalPrice}
              onCouponApplied={setAppliedCoupon}
            />

            {/* Aceites legais — obrigatórios antes do pagamento */}
            <LegalAcceptanceBlock
              email={userEmail || undefined}
              context="dynamic_checkout"
              onChange={setLegalState}
            />
            {!legalReady && (
              <p className="text-[11px] text-muted-foreground text-center">
                Marque os aceites obrigatórios para liberar os botões de pagamento.
              </p>
            )}

            {isPixOnlyCoupon && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5 text-xs text-foreground">
                <QrCode className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  Cupom <strong className="font-mono">{appliedCoupon.code}</strong> válido apenas para pagamento via PIX. Cartão de crédito e débito ficam indisponíveis enquanto este cupom estiver aplicado.
                </span>
              </div>
            )}

            {/* Dynamic Payments (API Mercado Pago) */}
            {isDynamic && (
              <div className="space-y-2">
                {pixEnabled && (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={creatingPayment || !legalReady}
                    onClick={() => handleDynamicPayment("pix")}
                  >
                    {creatingPayment ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <QrCode className="w-4 h-4 mr-2" />
                    )}
                    Pagar com PIX
                  </Button>
                )}
                {creditEnabled && (
                  <Button
                    className="w-full"
                    disabled={creatingPayment || !legalReady}
                    onClick={() => handleDynamicPayment("credit")}
                  >
                    {creatingPayment ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Pagar com Cartão de Crédito
                  </Button>
                )}
                {debitEnabled && (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={creatingPayment || !legalReady}
                    onClick={() => handleDynamicPayment("debit")}
                  >
                    {creatingPayment ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Pagar com Cartão de Débito
                  </Button>
                )}
                {!pixEnabled && !creditEnabled && !debitEnabled && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum método de pagamento ativo.
                  </p>
                )}
              </div>
            )}

            {/* Manual Payment Links (fallback) */}
            {!isDynamic && (() => {
              const link = getPlanLink(selectedPlan.id);
              const hasPix = link?.pix_enabled && link?.pix_code;
              const hasCard = !effectivePixOnly && link?.card_enabled && link?.card_link;
              const hasAny = hasPix || hasCard;
              return (
                <div className="space-y-3">
                  {!hasAny && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum método de pagamento disponível. Entre em contato com o suporte.
                    </p>
                  )}
                  {hasPix && (
                    <div className="space-y-2 p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">PIX</span>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => copyPixCode(link!.pix_code!)}>
                        {pixCopied ? (
                          <><CheckCircle2 className="w-4 h-4 mr-2 text-primary" />Código Copiado!</>
                        ) : (
                          <><Copy className="w-4 h-4 mr-2" />Copiar código PIX</>
                        )}
                      </Button>
                    </div>
                  )}
                  {hasCard && (
                    <div className="space-y-2 p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">Cartão</span>
                      </div>
                      <a href={link!.card_link!} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full">
                          <ExternalLink className="w-4 h-4 mr-2" />Pagar com Cartão
                        </Button>
                      </a>
                    </div>
                  )}
                  {hasPix && (
                    <Button
                      className="w-full"
                      disabled={!legalReady}
                      onClick={() => {
                        if (!requireLegal()) return;
                        setReceiptStep("upload");
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />Já paguei — Enviar comprovante
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!legalReady}
                    onClick={handleManualPaymentNotified}
                  >
                    ✅ Já realizei o pagamento
                  </Button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Upload step */}
        {receiptStep === "upload" && (
          <div className="space-y-4">
            <div
              className="text-center p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
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
                <p className="text-sm text-muted-foreground">Seu comprovante foi enviado e será revisado pelo administrador.</p>
                <Button className="w-full" onClick={() => handleClose(false)}>Entendi</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DynamicCheckoutDialog;
