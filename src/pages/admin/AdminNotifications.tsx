import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Eye, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unseen" | "seen">("all");

  const { data: notifications = [], isLoading } = useQuery({
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

  const markSeen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_notifications")
        .update({ seen: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-notifications"] }),
  });

  const markAllSeen = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("payment_notifications")
        .update({ seen: true })
        .eq("seen", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-notifications"] });
      toast.success("Todas as notificações marcadas como vistas");
    },
  });

  const unseenCount = notifications.filter((n: any) => !n.seen).length;

  const actionLabel = (type: string) =>
    type === "new" ? "Novo plano" : type === "upgrade" ? "Atualização" : "Renovação";

  const statusIcon = (status: string) =>
    status === "approved" ? "✅" : "⏳";

  return (
    <DashboardLayout role="admin">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-display font-bold">Notificações de Pagamento</h1>
            {unseenCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unseenCount} novas</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
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
            {unseenCount > 0 && (
              <Button size="sm" variant="outline" onClick={() => markAllSeen.mutate()} className="text-xs gap-1.5">
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas como vistas
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : notifications.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Nenhuma notificação encontrada.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <Card key={n.id} className={`transition-colors ${!n.seen ? "border-primary/40 bg-primary/5" : ""}`}>
                <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{statusIcon(n.payment_status)} {n.student_name}</span>
                      <Badge variant="secondary" className="text-[10px]">{actionLabel(n.action_type)}</Badge>
                      <Badge variant="outline" className="text-[10px]">{n.method?.toUpperCase()}</Badge>
                      {!n.seen && <Badge variant="destructive" className="text-[10px]">Nova</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {n.plan_name} • {Number(n.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} • {format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {!n.seen && (
                    <Button size="sm" variant="ghost" onClick={() => markSeen.mutate(n.id)} className="text-xs gap-1 shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                      Visto
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminNotifications;
