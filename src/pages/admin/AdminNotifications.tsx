import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Camera, CheckCheck, Eye, Filter, MessageSquare, TrendingUp, ShieldAlert, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EVOLUTION_TEMPLATE = `Olá, {nome}! 👋📸

Chegou o momento de atualizarmos sua evolução — essa etapa é essencial para ajustar sua estratégia e manter o progresso acelerado 🚀

Acesse a plataforma no menu ATUALIZAÇÃO e envie:

📷 FOTO FRONTAL

📷 FOTO LATERAL

📷 FOTO COSTAS

⚖️ PESO ATUAL

👉 Essas informações permitem ajustes mais precisos na sua dieta, treino e protocolo.

🔥 Resultado não é sorte. É acompanhamento + ajuste estratégico.

Vamos juntos nessa! 💪🚀`;

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const openStudent = (userId: string) => navigate(`/admin/students?manage=${userId}`);
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

  // Evolution reminders (29-day cycle)
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

  // Evolution update notifications (student submitted)
  const { data: evolutionUpdates = [], isLoading: loadingUpdates } = useQuery({
    queryKey: ["evolution-notifications", filter],
    queryFn: async () => {
      let query = supabase
        .from("evolution_notifications")
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

  // Authorization change notifications (image / phone)
  const { data: authNotifs = [], isLoading: loadingAuth } = useQuery({
    queryKey: ["authorization-change-notifications", filter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("authorization_change_notifications")
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

  const markUpdateSeen = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("evolution_notifications").update({ seen: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evolution-notifications"] }),
  });

  const markAllUpdatesSeen = useMutation({
    mutationFn: async () => {
      await supabase.from("evolution_notifications").update({ seen: true }).eq("seen", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evolution-notifications"] });
      toast.success("Todas as atualizações marcadas como vistas");
    },
  });

  const markAuthSeen = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from("authorization_change_notifications").update({ seen: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authorization-change-notifications"] }),
  });
  const markAllAuthSeen = useMutation({
    mutationFn: async () => {
      await (supabase as any).from("authorization_change_notifications").update({ seen: true }).eq("seen", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorization-change-notifications"] });
      toast.success("Todas as alterações de autorização marcadas como vistas");
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
    const message = EVOLUTION_TEMPLATE.replace(/\{nome\}/g, firstName);

    const phone = profile.phone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    try {
      // Find or create conversation in CRM
      let conversation_id = '';
      const { data: conv } = await supabase.from('crm_conversations')
        .select('id')
        .eq('phone', fullPhone)
        .eq('queue_type', 'nutri')
        .maybeSingle();
      
      if (conv) {
        conversation_id = conv.id;
      } else {
        const { data: newConv } = await supabase.from('crm_conversations').insert({
          phone: fullPhone,
          display_name: profile.full_name,
          channel: 'whatsapp',
          status: 'open',
          provider: 'wapi',
          queue_type: 'nutri'
        }).select('id').single();
        conversation_id = newConv?.id || '';
      }

      await supabase.functions.invoke("crm-send-whatsapp", {
        body: { 
          conversation_id,
          phone: fullPhone, 
          body: message,
          provider: 'wapi'
        }
      });
      toast.success("Lembrete enviado via WhatsApp");
      markEvolutionSeen.mutate(reminder.id);
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      toast.error("Falha ao enviar mensagem");
    }
  };

  const unseenPayment = paymentNotifs.filter((n: any) => !n.seen).length;
  const unseenEvolution = evolutionReminders.filter((n: any) => !n.seen).length;
  const unseenUpdates = evolutionUpdates.filter((n: any) => !n.seen).length;
  const unseenAuth = (authNotifs as any[]).filter((n: any) => !n.seen).length;

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
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="payments" className="text-xs gap-1">
              💰 Pagamentos
              {unseenPayment > 0 && <Badge variant="destructive" className="text-[10px] ml-1">{unseenPayment}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="evolution" className="text-xs gap-1">
              📸 Lembretes
              {unseenEvolution > 0 && <Badge variant="destructive" className="text-[10px] ml-1">{unseenEvolution}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="updates" className="text-xs gap-1">
              📊 Atualizações
              {unseenUpdates > 0 && <Badge variant="destructive" className="text-[10px] ml-1">{unseenUpdates}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="authorizations" className="text-xs gap-1">
              🛡️ Autorizações
              {unseenAuth > 0 && <Badge variant="destructive" className="text-[10px] ml-1">{unseenAuth}</Badge>}
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
                        <button onClick={() => openStudent(n.student_user_id)} className="text-sm font-medium hover:text-primary hover:underline transition-colors text-left">{n.payment_status === "approved" ? "✅" : "⏳"} {n.student_name}</button>
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

          {/* Evolution Reminders Tab (29-day cycle) */}
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
                        <button onClick={() => openStudent(r.student_user_id)} className="text-sm font-medium hover:text-primary hover:underline transition-colors text-left">📸 {r.student_name}</button>
                        <Badge variant="secondary" className="text-[10px]">{r.cycle_number}º Ciclo</Badge>
                        {!r.seen && <Badge variant="destructive" className="text-[10px]">Nova</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Solicitar fotos e peso • Vencimento: {format(new Date(r.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
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

          {/* Evolution Updates Tab (student submitted) */}
          <TabsContent value="updates" className="space-y-2 mt-3">
            {unseenUpdates > 0 && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => markAllUpdatesSeen.mutate()} className="text-xs gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar todas como vistas
                </Button>
              </div>
            )}
            {loadingUpdates ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : evolutionUpdates.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Nenhuma atualização de aluno encontrada.</CardContent></Card>
            ) : (
              evolutionUpdates.map((n: any) => {
                const diff = n.previous_weight && n.new_weight
                  ? (Number(n.new_weight) - Number(n.previous_weight)).toFixed(1)
                  : null;
                const diffLabel = diff ? (Number(diff) > 0 ? `+${diff}` : diff) : null;

                return (
                  <Card key={n.id} className={`transition-colors ${!n.seen ? "border-primary/40 bg-primary/5" : ""}`}>
                    <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => openStudent(n.student_user_id)} className="text-sm font-medium hover:text-primary hover:underline transition-colors text-left">📊 {n.student_name}</button>
                          <Badge variant="secondary" className="text-[10px]">
                            ⚖️ {Number(n.new_weight).toFixed(1)} kg
                          </Badge>
                          {diffLabel && (
                            <Badge variant="outline" className="text-[10px]">
                              {diffLabel} kg
                            </Badge>
                          )}
                          {n.has_photos && (
                            <Badge variant="outline" className="text-[10px]">📸 Fotos</Badge>
                          )}
                          {!n.seen && <Badge variant="destructive" className="text-[10px]">Nova</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Atualização de evolução • {format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {!n.seen && (
                        <Button size="sm" variant="ghost" onClick={() => markUpdateSeen.mutate(n.id)} className="text-xs gap-1 shrink-0">
                          <Eye className="w-3.5 h-3.5" /> Visto
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Authorization Changes Tab */}
          <TabsContent value="authorizations" className="space-y-2 mt-3">
            {unseenAuth > 0 && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => markAllAuthSeen.mutate()} className="text-xs gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar todas como vistas
                </Button>
              </div>
            )}
            {loadingAuth ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (authNotifs as any[]).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Nenhuma alteração de autorização registrada.</CardContent></Card>
            ) : (
              (authNotifs as any[]).map((n: any) => {
                const kindLabel = n.kind === "image" ? "Imagem" : "Telefone";
                const KindIcon = n.kind === "image" ? Camera : Phone;
                const actionLabel =
                  n.action === "granted" ? "Concedeu" :
                  n.action === "revoked" ? "Revogou" :
                  n.action === "rejected" ? "Recusou" : "Atualizou";
                const actionTone =
                  n.action === "revoked" || n.action === "rejected"
                    ? "bg-destructive/15 text-destructive border-destructive/30"
                    : n.action === "granted"
                    ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                    : "bg-sky-500/15 text-sky-600 border-sky-500/30";
                return (
                  <Card key={n.id} className={`transition-colors ${!n.seen ? "border-primary/40 bg-primary/5" : ""}`}>
                    <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => openStudent(n.student_user_id)} className="text-sm font-medium hover:text-primary hover:underline text-left">
                            <ShieldAlert className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                            {n.student_name}
                          </button>
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <KindIcon className="w-3 h-3" /> {kindLabel}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${actionTone}`}>
                            {actionLabel}
                          </Badge>
                          {!n.seen && <Badge variant="destructive" className="text-[10px]">Nova</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(n.previous_value || "—")} → {(n.new_value || "—")}
                          {" • "}{format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                        {n.reason && (
                          <p className="text-[11px] text-muted-foreground mt-1">Motivo: “{n.reason}”</p>
                        )}
                      </div>
                      {!n.seen && (
                        <Button size="sm" variant="ghost" onClick={() => markAuthSeen.mutate(n.id)} className="text-xs gap-1 shrink-0">
                          <Eye className="w-3.5 h-3.5" /> Visto
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminNotifications;
