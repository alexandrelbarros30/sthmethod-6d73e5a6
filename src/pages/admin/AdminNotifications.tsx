import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Camera, CheckCheck, Eye, Filter, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unseen" | "seen">("all");

  // Payment notifications
  const { data: paymentNotifs = [], isLoading: loadingPayment } = useQuery({
    queryKey: ["payment-notifications", filter],
    queryFn: async () => {
      let query = supabase
        .from("payment_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter === "unseen") query = query.eq("seen", false);
      if (filter === "seen") query = query.eq("seen", true);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Evolution reminders
  const { data: evolutionReminders = [], isLoading: loadingEvolution } = useQuery({
    queryKey: ["evolution-reminders", filter],
    queryFn: async () => {
      let query = supabase
        .from("evolution_reminders")
        .select("*")
        .order("due_date", { ascending: false })
        .limit(200);
      if (filter === "unseen") query = query.eq("seen", false);
      if (filter === "seen") query = query.eq("seen", true);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const markPaymentSeen = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("payment_notifications").update({ seen: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-notifications"] }),
  });

  const markAllPaymentSeen = useMutation({
    mutationFn: async () => {
      await supabase.from("payment_notifications").update({ seen: true }).eq("seen", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-notifications"] });
      toast.success("Todas as notificações de pagamento marcadas como vistas");
    },
  });

  const markEvolutionSeen = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("evolution_reminders").update({ seen: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evolution-reminders"] }),
  });

  const markAllEvolutionSeen = useMutation({
    mutationFn: async () => {
      await supabase.from("evolution_reminders").update({ seen: true }).eq("seen", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evolution-reminders"] });
      toast.success("Todos os lembretes de evolução marcados como vistos");
    },
  });

  const handleSendEvolutionWhatsApp = async (reminder: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, full_name")
      .eq("user_id", reminder.student_user_id)
      .single();

    if (!profile?.phone) {
      toast.error("Aluno sem telefone cadastrado");
      return;
    }

    const firstName = profile.full_name?.split(" ")[0] || "Aluno";
    const message = `Olá ${firstName}! 📸\n\nÉ hora de atualizar suas fotos e peso para acompanharmos sua evolução. Envie por aqui:\n\n✅ Foto frontal\n✅ Foto lateral\n✅ Foto costas\n✅ Peso atual\n\nVamos juntos! 💪`;

    const phone = profile.phone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
    markEvolutionSeen.mutate(reminder.id);
  };

  const unseenPayment = paymentNotifs.filter((n: any) => !n.seen).length;
  const unseenEvolution = evolutionReminders.filter((n: any) => !n.seen).length;

  const actionLabel = (type: string) =>
    type === "new" ? "Novo plano" : type === "upgrade" ? "Atualização" : "Renovação";

  return (
    <DashboardLayout role="admin" title="Notificações">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-display font-bold">Central de Notificações</h1>
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="unseen">Não vistas</SelectItem>
              <SelectItem value="seen">Vistas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="payments" className="text-xs gap-1.5">
              💰 Pagamentos
              {unseenPayment > 0 && <Badge variant="destructive" className="text-[10px] ml-1">{unseenPayment}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="evolution" className="text-xs gap-1.5">
              📸 Evolução
              {unseenEvolution > 0 && <Badge variant="destructive" className="text-[10px] ml-1">{unseenEvolution}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Payment Notifications Tab */}
          <TabsContent value="payments" className="space-y-2 mt-3">
            {unseenPayment > 0 && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => markAllPaymentSeen.mutate()} className="text-xs gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar todas como vistas
                </Button>
              </div>
            )}
            {loadingPayment ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : paymentNotifs.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Nenhuma notificação encontrada.</CardContent></Card>
            ) : (
              paymentNotifs.map((n: any) => (
                <Card key={n.id} className={`transition-colors ${!n.seen ? "border-primary/40 bg-primary/5" : ""}`}>
                  <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{n.payment_status === "approved" ? "✅" : "⏳"} {n.student_name}</span>
                        <Badge variant="secondary" className="text-[10px]">{actionLabel(n.action_type)}</Badge>
                        <Badge variant="outline" className="text-[10px]">{n.method?.toUpperCase()}</Badge>
                        {!n.seen && <Badge variant="destructive" className="text-[10px]">Nova</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {n.plan_name} • {Number(n.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} • {format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {!n.seen && (
                      <Button size="sm" variant="ghost" onClick={() => markPaymentSeen.mutate(n.id)} className="text-xs gap-1 shrink-0">
                        <Eye className="w-3.5 h-3.5" /> Visto
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Evolution Reminders Tab */}
          <TabsContent value="evolution" className="space-y-2 mt-3">
            {unseenEvolution > 0 && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => markAllEvolutionSeen.mutate()} className="text-xs gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar todas como vistas
                </Button>
              </div>
            )}
            {loadingEvolution ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : evolutionReminders.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Nenhum lembrete de evolução encontrado.</CardContent></Card>
            ) : (
              evolutionReminders.map((r: any) => (
                <Card key={r.id} className={`transition-colors ${!r.seen ? "border-primary/40 bg-primary/5" : ""}`}>
                  <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">📸 {r.student_name}</span>
                        <Badge variant="secondary" className="text-[10px]">{r.cycle_number}º Ciclo</Badge>
                        {!r.seen && <Badge variant="destructive" className="text-[10px]">Nova</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Atualização de fotos e peso • Vencimento: {format(new Date(r.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="default" onClick={() => handleSendEvolutionWhatsApp(r)} className="text-xs h-8 gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                      </Button>
                      {!r.seen && (
                        <Button size="sm" variant="ghost" onClick={() => markEvolutionSeen.mutate(r.id)} className="text-xs h-8 gap-1">
                          <Eye className="w-3.5 h-3.5" /> Visto
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminNotifications;
