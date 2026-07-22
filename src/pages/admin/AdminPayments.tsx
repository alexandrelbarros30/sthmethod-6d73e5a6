import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, History, CreditCard, QrCode, Landmark, Link2, Eye, ShieldCheck, ShieldAlert, Loader2, CheckCircle, XCircle, Image, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PaymentLinksTab from "@/components/admin/PaymentLinksTab";
import { normalizeSearch } from "@/lib/utils";

const AdminPayments = () => {
  const qc = useQueryClient();
  const [receiptDialog, setReceiptDialog] = useState<any>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    user_id: "",
    user_search: "",
    plan_id: "",
    method: "pix",
    action_type: "new",
    amount: "",
    paid_at: new Date().toISOString().split("T")[0],
    notes: "",
    dispatch_welcome: true,
  });

  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_settings").select("*");
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["admin-payments-history"],
    queryFn: async () => {
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*, plans(name, duration_days)")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (!paymentsData || paymentsData.length === 0) return [];

      // Fetch gateway details for these payments
      const paymentIds = paymentsData.map(p => p.id);
      const { data: gatewayData } = await supabase
        .from("payment_gateway_details")
        .select("*")
        .in("payment_id", paymentIds);

      // Merge gateway details into payments
      return paymentsData.map(p => {
        const gw = gatewayData?.find(g => g.payment_id === p.id);
        return {
          ...p,
          receipt_url: gw?.receipt_url || null,
          ai_verification_status: gw?.ai_verification_status || null,
          ai_verification_notes: gw?.ai_verification_notes || null,
          mp_payment_id: gw?.mp_payment_id || null,
        };
      });
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-for-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email, phone");
      return data || [];
    },
  });

  const { data: plansList } = useQuery({
    queryKey: ["admin-plans-for-manual-payment"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("id, name, price, card_price, duration_days").eq("active", true).order("name");
      return data || [];
    },
  });

  const registerManualPayment = useMutation({
    mutationFn: async () => {
      if (!manualForm.user_id) throw new Error("Selecione o aluno");
      if (!manualForm.plan_id) throw new Error("Selecione o plano");
      const amt = parseFloat(String(manualForm.amount).replace(",", "."));
      if (!amt || amt <= 0) throw new Error("Informe um valor válido");

      const plan = plansList?.find((p: any) => p.id === manualForm.plan_id);
      const durationDays = plan?.duration_days || 30;
      const paidAt = new Date(manualForm.paid_at + "T12:00:00");

      const { data: payment, error: payErr } = await supabase
        .from("payments")
        .insert({
          user_id: manualForm.user_id,
          plan_id: manualForm.plan_id,
          amount: amt,
          original_amount: amt,
          method: manualForm.method,
          action_type: manualForm.action_type,
          status: "approved",
          installments: 1,
          created_at: paidAt.toISOString(),
          updated_at: paidAt.toISOString(),
        })
        .select()
        .single();
      if (payErr) throw payErr;

      await supabase.from("payment_gateway_details").upsert({
        payment_id: payment.id,
        ai_verification_status: "approved",
        ai_verification_notes: `Pagamento manual registrado fora do checkout. ${manualForm.notes || ""}`.trim(),
      }, { onConflict: "payment_id" });

      const startDate = paidAt;
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id, end_date, status")
        .eq("user_id", manualForm.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Carry over remaining days if the student renews while still active
      let baseDate = new Date(startDate);
      if (existingSub?.end_date) {
        const currentEnd = new Date(existingSub.end_date + "T23:59:59");
        if (currentEnd > startDate && existingSub.status === "active") {
          baseDate = currentEnd;
        }
      }
      const endDate = new Date(baseDate);
      endDate.setDate(endDate.getDate() + durationDays);

      if (existingSub) {
        await supabase.from("subscriptions").update({
          plan_id: manualForm.plan_id,
          status: "active",
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        }).eq("id", existingSub.id);
      } else {
        await supabase.from("subscriptions").insert({
          user_id: manualForm.user_id,
          plan_id: manualForm.plan_id,
          status: "active",
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        });
      }

      // Espelha vencimento no SuperCoach.
      supabase.functions.invoke("supercoach-sync-expiration", {
        body: {
          action: "update",
          userId: manualForm.user_id,
          expiresDate: endDate.toISOString().split("T")[0],
        },
      }).catch((e) => console.warn("[SuperCoach sync]", e));

      // Dispara as automações de boas-vindas (WhatsApp Comercial + Nutri +
      // e-mails) espelhando o webhook do Mercado Pago. Best-effort — não
      // bloqueia o registro do pagamento manual em caso de falha.
      if (manualForm.dispatch_welcome) {
        try {
          const { data: dispatchRes, error: dispatchErr } =
            await supabase.functions.invoke("dispatch-payment-welcome", {
              body: { payment_id: payment.id },
            });
          if (dispatchErr) console.warn("[dispatch-payment-welcome] error", dispatchErr);
          else console.log("[dispatch-payment-welcome] ok", dispatchRes);
        } catch (e) {
          console.warn("[dispatch-payment-welcome] failed", e);
        }
      }
    },
    onSuccess: () => {
      toast.success(
        manualForm.dispatch_welcome
          ? "Pagamento manual registrado, assinatura ativada e boas-vindas disparadas!"
          : "Pagamento manual registrado e assinatura ativada."
      );
      qc.invalidateQueries({ queryKey: ["admin-payments-history"] });
      setManualOpen(false);
      setManualForm({
        user_id: "", user_search: "", plan_id: "", method: "pix",
        action_type: "new", amount: "", paid_at: new Date().toISOString().split("T")[0], notes: "",
        dispatch_welcome: true,
      });
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao registrar pagamento"),
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("payment_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-settings"] }),
  });

  const approvePayment = useMutation({
    mutationFn: async (payment: any) => {
      // Update payment status
      const { error: payErr } = await supabase
        .from("payments")
        .update({ status: "approved" })
        .eq("id", payment.id);
      if (payErr) throw payErr;

      // Update gateway details
      await supabase
        .from("payment_gateway_details")
        .upsert({ payment_id: payment.id, ai_verification_status: "approved" }, { onConflict: "payment_id" });

      // Activate subscription
      const startDate = new Date();
      const durationDays = (payment as any).plans?.duration_days || 30;

      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id, end_date, status")
        .eq("user_id", payment.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Carry over remaining days if the student renews while still active
      let baseDate = new Date(startDate);
      if (existingSub?.end_date) {
        const currentEnd = new Date(existingSub.end_date + "T23:59:59");
        if (currentEnd > startDate && existingSub.status === "active") {
          baseDate = currentEnd;
        }
      }
      const endDate = new Date(baseDate);
      endDate.setDate(endDate.getDate() + durationDays);

      if (existingSub) {
        await supabase.from("subscriptions").update({
          plan_id: payment.plan_id,
          status: "active",
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        }).eq("id", existingSub.id);
      } else {
        await supabase.from("subscriptions").insert({
          user_id: payment.user_id,
          plan_id: payment.plan_id,
          status: "active",
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        });
      }

      // Espelha vencimento no SuperCoach.
      supabase.functions.invoke("supercoach-sync-expiration", {
        body: {
          action: "update",
          userId: payment.user_id,
          expiresDate: endDate.toISOString().split("T")[0],
        },
      }).catch((e) => console.warn("[SuperCoach sync]", e));
    },
    onSuccess: () => {
      toast.success("Pagamento aprovado e assinatura ativada!");
      qc.invalidateQueries({ queryKey: ["admin-payments-history"] });
      setReceiptDialog(null);
    },
    onError: () => toast.error("Erro ao aprovar pagamento"),
  });

  const rejectPayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from("payments")
        .update({ status: "rejected" })
        .eq("id", paymentId);
      if (error) throw error;

      // Update gateway details
      await supabase
        .from("payment_gateway_details")
        .upsert({ payment_id: paymentId, ai_verification_status: "rejected" }, { onConflict: "payment_id" });
    },
    onSuccess: () => {
      toast.success("Pagamento rejeitado.");
      qc.invalidateQueries({ queryKey: ["admin-payments-history"] });
      setReceiptDialog(null);
    },
    onError: () => toast.error("Erro ao rejeitar pagamento"),
  });

  const getSetting = (key: string, fallback = "") =>
    paymentSettings?.find((s: any) => s.key === key)?.value ?? fallback;

  const getProfile = (userId: string) =>
    profiles?.find((p: any) => p.user_id === userId);

  const statusColors: Record<string, string> = {
    approved: "bg-primary/20 text-primary",
    pending: "bg-yellow-500/20 text-yellow-400",
    rejected: "bg-destructive/20 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
    refunded: "bg-blue-500/20 text-blue-400",
  };

  const statusLabels: Record<string, string> = {
    approved: "Aprovado",
    pending: "Pendente",
    rejected: "Recusado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  };

  const aiStatusLabels: Record<string, string> = {
    approved: "✅ IA Aprovado",
    review: "⚠️ Revisão Manual",
    analyzing: "🔄 Analisando...",
    rejected: "❌ Rejeitado",
  };

  const actionLabels: Record<string, string> = {
    new: "Novo Aluno",
    unlock: "Desbloqueio",
    upgrade: "Atualização",
  };

  const methodLabels: Record<string, string> = {
    pix: "PIX",
    credit: "Crédito",
    debit: "Débito",
    cash: "Dinheiro",
    transfer: "Transferência",
    other: "Outro",
  };

  const generateWhatsAppLink = (payment: any) => {
    const profile = getProfile(payment.user_id);
    const planName = (payment as any).plans?.name || "N/A";
    const msg = encodeURIComponent(
      `✅ *Pagamento Aprovado - STH*\n\n` +
      `👤 Aluno: ${profile?.full_name || "N/A"}\n` +
      `📧 Email: ${profile?.email || "N/A"}\n` +
      `📞 Tel: ${profile?.phone || "N/A"}\n` +
      `📋 Ação: ${actionLabels[payment.action_type] || payment.action_type}\n` +
      `📦 Plano: ${planName}\n` +
      `💰 Valor: R$ ${Number(payment.amount).toFixed(2)}\n` +
      `💳 Método: ${methodLabels[payment.method] || payment.method}\n` +
      `📊 Status: Aprovado`
    );
    return `https://wa.me/5521998496289?text=${msg}`;
  };

  return (
    <DashboardLayout role="admin" title="Pagamentos" subtitle="Configure métodos de pagamento e acompanhe o histórico.">
      <Tabs defaultValue="settings">
        <TabsList className="bg-muted">
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-4 h-4" />Configurações</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="w-4 h-4" />Histórico</TabsTrigger>
          <TabsTrigger value="links" className="gap-1.5"><Link2 className="w-4 h-4" />Links de Pagamento</TabsTrigger>
        </TabsList>

        {/* ─── CONFIGURAÇÕES ─── */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          {/* Dynamic vs Manual toggle */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">Modo de Pagamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">Pagamento Dinâmico via API</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cria pagamentos automaticamente pelo Mercado Pago. Quando desativado, utiliza os Links de Pagamento manuais.
                  </p>
                </div>
                <Switch
                  checked={getSetting("use_dynamic_payments", "false") === "true"}
                  onCheckedChange={(checked) => {
                    updateSetting.mutate({ key: "use_dynamic_payments", value: checked ? "true" : "false" });
                    toast.success(checked ? "Pagamento dinâmico ativado!" : "Pagamento dinâmico desativado. Usando links manuais.");
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">Métodos de Pagamento (API Dinâmica)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "pix_enabled", label: "PIX", icon: QrCode },
                { key: "credit_enabled", label: "Cartão de Crédito", icon: CreditCard },
                { key: "debit_enabled", label: "Cartão de Débito", icon: Landmark },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                  <Switch
                    checked={getSetting(key, "true") === "true"}
                    onCheckedChange={(checked) => {
                      updateSetting.mutate({ key, value: checked ? "true" : "false" });
                      toast.success(`${label} ${checked ? "ativado" : "desativado"}`);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">Integração Mercado Pago</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge className={getSetting("mp_configured") === "true" ? "bg-primary/20 text-primary" : "bg-yellow-500/20 text-yellow-400"}>
                  {getSetting("mp_configured") === "true" ? "Configurado" : "Pendente"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  As credenciais do Mercado Pago são gerenciadas via secrets do projeto.
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  updateSetting.mutate({ key: "mp_configured", value: "true" });
                  toast.success("Status atualizado!");
                }}
              >
                Marcar como Configurado
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── HISTÓRICO ─── */}
        <TabsContent value="history" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Histórico de Pagamentos</CardTitle>
              <Button size="sm" onClick={() => setManualOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Registrar pagamento manual
              </Button>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verificação</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p: any) => {
                        const profile = getProfile(p.user_id);
                        const hasReceipt = !!p.receipt_url;
                        const needsReview = p.status === "pending" && p.ai_verification_status === "review";
                        return (
                          <TableRow key={p.id} className={needsReview ? "bg-yellow-500/5" : ""}>
                            <TableCell className="text-sm">{profile?.full_name || "—"}</TableCell>
                            <TableCell className="text-sm">{(p as any).plans?.name || "—"}</TableCell>
                            <TableCell className="text-sm">R$ {Number(p.amount).toFixed(2)}</TableCell>
                            <TableCell className="text-sm">{methodLabels[p.method] || p.method}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{actionLabels[p.action_type] || p.action_type}</Badge></TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${statusColors[p.status] || ""}`}>
                                {statusLabels[p.status] || p.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {p.ai_verification_status ? (
                                <span className="text-xs">{aiStatusLabels[p.ai_verification_status] || p.ai_verification_status}</span>
                              ) : hasReceipt ? (
                                <span className="text-xs text-muted-foreground">Com comprovante</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(p.created_at).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {hasReceipt && (
                                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setReceiptDialog(p)}>
                                    <Eye className="w-3.5 h-3.5 mr-1" />Ver
                                  </Button>
                                )}
                                {needsReview && (
                                  <Button size="sm" variant="default" className="text-xs" onClick={() => setReceiptDialog(p)}>
                                    <ShieldAlert className="w-3.5 h-3.5 mr-1" />Revisar
                                  </Button>
                                )}
                                {p.status === "approved" && (
                                  <a href={generateWhatsAppLink(p)} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="ghost" className="text-primary text-xs">📲</Button>
                                  </a>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum pagamento registrado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── LINKS DE PAGAMENTO ─── */}
        <TabsContent value="links" className="mt-4">
          <PaymentLinksTab />
        </TabsContent>
      </Tabs>

      {/* Receipt Review Dialog */}
      <Dialog open={!!receiptDialog} onOpenChange={(v) => !v && setReceiptDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Revisão de Comprovante</DialogTitle>
          </DialogHeader>
          {receiptDialog && (() => {
            const profile = getProfile(receiptDialog.user_id);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Aluno:</span>
                    <p className="font-medium text-foreground">{profile?.full_name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Plano:</span>
                    <p className="font-medium text-foreground">{(receiptDialog as any).plans?.name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor esperado:</span>
                    <p className="font-medium text-foreground">R$ {Number(receiptDialog.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status IA:</span>
                    <p className="font-medium text-foreground">{aiStatusLabels[receiptDialog.ai_verification_status] || "—"}</p>
                  </div>
                </div>

                {receiptDialog.ai_verification_notes && (
                  <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Análise da IA:</p>
                    {receiptDialog.ai_verification_notes}
                  </div>
                )}

                {receiptDialog.receipt_url && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <img
                      src={receiptDialog.receipt_url}
                      alt="Comprovante PIX"
                      className="w-full max-h-96 object-contain bg-muted"
                    />
                  </div>
                )}

                {receiptDialog.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => approvePayment.mutate(receiptDialog)}
                      disabled={approvePayment.isPending || rejectPayment.isPending}
                    >
                      {approvePayment.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                      Aprovar e Ativar
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => rejectPayment.mutate(receiptDialog.id)}
                      disabled={approvePayment.isPending || rejectPayment.isPending}
                    >
                      {rejectPayment.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                      Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Manual Payment Registration Dialog */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Registrar pagamento manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-xs text-muted-foreground">
              Use para alunos que pagaram fora do checkout (PIX direto, dinheiro, transferência etc). O valor entrará no faturamento e a assinatura será ativada.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs">Aluno</Label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar por nome ou e-mail..."
                  value={manualForm.user_search}
                  onChange={(e) => setManualForm((f) => ({ ...f, user_search: e.target.value, user_id: "" }))}
                />
              </div>
              {manualForm.user_id ? (
                <div className="text-xs p-2 rounded border border-primary/30 bg-primary/5 flex items-center justify-between">
                  <span>{getProfile(manualForm.user_id)?.full_name} — {getProfile(manualForm.user_id)?.email}</span>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setManualForm((f) => ({ ...f, user_id: "", user_search: "" }))}>Trocar</Button>
                </div>
              ) : manualForm.user_search.length >= 2 ? (
                <div className="max-h-40 overflow-y-auto border border-border rounded-md divide-y divide-border">
                  {(profiles || [])
                    .filter((p: any) => {
                      const q = normalizeSearch(manualForm.user_search);
                      return normalizeSearch(p.full_name).includes(q) || normalizeSearch(p.email).includes(q);
                    })
                    .slice(0, 10)
                    .map((p: any) => (
                      <button
                        key={p.user_id}
                        type="button"
                        className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-muted/50"
                        onClick={() => setManualForm((f) => ({ ...f, user_id: p.user_id, user_search: p.full_name || p.email || "" }))}
                      >
                        <div className="font-medium">{p.full_name || "—"}</div>
                        <div className="text-muted-foreground">{p.email}</div>
                      </button>
                    ))}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Plano</Label>
                <Select
                  value={manualForm.plan_id}
                  onValueChange={(v) => {
                    const plan = plansList?.find((p: any) => p.id === v);
                    const priceStr = (plan?.price || "").toString().replace(/[^\d,\.]/g, "").replace(",", ".");
                    const auto = parseFloat(priceStr);
                    setManualForm((f) => ({ ...f, plan_id: v, amount: auto ? auto.toFixed(2) : f.amount }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {(plansList || []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={manualForm.amount}
                  onChange={(e) => setManualForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Método</Label>
                <Select value={manualForm.method} onValueChange={(v) => setManualForm((f) => ({ ...f, method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credit">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit">Cartão de Débito</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select value={manualForm.action_type} onValueChange={(v) => setManualForm((f) => ({ ...f, action_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo Aluno</SelectItem>
                    <SelectItem value="unlock">Renovação/Desbloqueio</SelectItem>
                    <SelectItem value="upgrade">Atualização</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Data do pagamento</Label>
              <Input
                type="date"
                value={manualForm.paid_at}
                onChange={(e) => setManualForm((f) => ({ ...f, paid_at: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observações (opcional)</Label>
              <Input
                placeholder="Ex: pago via PIX direto pelo telefone"
                value={manualForm.notes}
                onChange={(e) => setManualForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
              <input
                id="dispatch_welcome"
                type="checkbox"
                className="mt-1 h-4 w-4 accent-primary"
                checked={manualForm.dispatch_welcome}
                onChange={(e) => setManualForm((f) => ({ ...f, dispatch_welcome: e.target.checked }))}
              />
              <label htmlFor="dispatch_welcome" className="text-xs leading-snug cursor-pointer">
                <span className="font-semibold">Disparar boas-vindas pós-pagamento</span>
                <span className="block text-muted-foreground mt-0.5">
                  Como este pagamento foi confirmado manualmente pelo admin (fora do checkout),
                  o sistema enviará WhatsApp pelo canal Comercial + Nutri e os e-mails de
                  boas-vindas/recibo, colocando o aluno no fluxo de atendimento padrão.
                </span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setManualOpen(false)}>Cancelar</Button>
              <Button
                className="flex-1"
                onClick={() => registerManualPayment.mutate()}
                disabled={registerManualPayment.isPending}
              >
                {registerManualPayment.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                Registrar e Ativar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPayments;
