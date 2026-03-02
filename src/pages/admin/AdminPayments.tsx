import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, History, CreditCard, QrCode, Landmark, Link2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PaymentLinksTab from "@/components/admin/PaymentLinksTab";

const AdminPayments = () => {
  const qc = useQueryClient();

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
      const { data } = await supabase
        .from("payments")
        .select("*, plans(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-for-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email, phone");
      return data || [];
    },
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

  const actionLabels: Record<string, string> = {
    new: "Novo Aluno",
    unlock: "Desbloqueio",
    upgrade: "Atualização",
  };

  const methodLabels: Record<string, string> = {
    pix: "PIX",
    credit: "Crédito",
    debit: "Débito",
  };

  const generateWhatsAppLink = (payment: any) => {
    const profile = getProfile(payment.user_id);
    const planName = (payment as any).plans?.name || "N/A";
    const msg = encodeURIComponent(
      `✅ *Pagamento Aprovado - ST&H*\n\n` +
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
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">Métodos de Pagamento</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="text-sm">Histórico de Pagamentos</CardTitle></CardHeader>
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
                        <TableHead>Data</TableHead>
                        <TableHead>WhatsApp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p: any) => {
                        const profile = getProfile(p.user_id);
                        return (
                          <TableRow key={p.id}>
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
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(p.created_at).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell>
                              {p.status === "approved" && (
                                <a href={generateWhatsAppLink(p)} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="ghost" className="text-primary text-xs">📲 Enviar</Button>
                                </a>
                              )}
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
    </DashboardLayout>
  );
};

export default AdminPayments;
