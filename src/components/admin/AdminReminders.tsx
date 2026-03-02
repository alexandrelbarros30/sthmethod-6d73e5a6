import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, CheckCircle, Clock, Salad, RefreshCw, XCircle, Bell } from "lucide-react";
import { format, addDays, differenceInDays, isPast, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Reminder {
  id: string;
  user_id: string;
  type: string;
  status: string;
  due_date: string;
  notes: string;
  created_at: string;
  profile?: { full_name: string; email: string };
  subscription?: { end_date: string; plans: { name: string; duration_days: number } };
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "destructive" },
  done: { label: "Realizado", variant: "default" },
  postponed: { label: "Adiado", variant: "secondary" },
  disabled: { label: "Desativado", variant: "outline" },
};

const AdminReminders = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("diet");

  // Fetch all active subscriptions with profiles
  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subs-reminders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*, plans(*), profiles:user_id(full_name, email)")
        .eq("status", "active");
      return data || [];
    },
  });

  // Fetch existing reminders
  const { data: reminders } = useQuery({
    queryKey: ["admin-reminders"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_reminders").select("*").order("due_date", { ascending: true });
      return (data || []) as Reminder[];
    },
  });

  // Generate reminders for active subscriptions that don't have one yet
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!subscriptions) return;
      const existingUserTypes = new Set((reminders || []).map((r) => `${r.user_id}_${r.type}`));
      const now = new Date();
      const toInsert: any[] = [];

      for (const sub of subscriptions) {
        const startDate = new Date(sub.start_date);
        const endDate = new Date(sub.end_date);
        const planDays = (sub as any).plans?.duration_days || 30;

        // Diet adjustment reminders (every 30 days from start)
        if (!existingUserTypes.has(`${sub.user_id}_diet_adjustment`)) {
          let nextDiet = addDays(startDate, 30);
          while (nextDiet < endDate) {
            if (nextDiet > now) {
              toInsert.push({ user_id: sub.user_id, type: "diet_adjustment", due_date: format(nextDiet, "yyyy-MM-dd"), status: "pending" });
              break;
            }
            nextDiet = addDays(nextDiet, 30);
          }
        }

        // Renewal reminder (3 days before end)
        if (!existingUserTypes.has(`${sub.user_id}_renewal`)) {
          const renewalDate = addDays(endDate, -3);
          if (renewalDate > now) {
            toInsert.push({ user_id: sub.user_id, type: "renewal", due_date: format(renewalDate, "yyyy-MM-dd"), status: "pending" });
          }
        }
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from("admin_reminders").insert(toInsert);
        if (error) throw error;
      }
      return toInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reminders"] });
      toast({ title: `${count || 0} lembretes gerados com sucesso.` });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("admin_reminders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reminders"] });
      toast({ title: "Status atualizado." });
    },
  });

  // Enrich reminders with profile/subscription data
  const enriched = (reminders || []).map((r) => {
    const sub = subscriptions?.find((s: any) => s.user_id === r.user_id);
    return {
      ...r,
      profile: sub ? (sub as any).profiles : undefined,
      subscription: sub ? { end_date: sub.end_date, plans: (sub as any).plans } : undefined,
    };
  });

  const dietReminders = enriched.filter((r) => r.type === "diet_adjustment");
  const renewalReminders = enriched.filter((r) => r.type === "renewal");

  const ReminderRow = ({ r }: { r: Reminder }) => {
    const isOverdue = isPast(new Date(r.due_date)) && r.status === "pending";
    const cfg = statusConfig[r.status] || statusConfig.pending;

    return (
      <div className={`flex items-center justify-between py-3 px-4 rounded-lg border ${isOverdue ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {r.profile?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{r.profile?.full_name || "Aluno"}</p>
            <p className="text-xs text-muted-foreground">
              {r.subscription?.plans?.name || "—"} • {format(new Date(r.due_date), "dd/MM/yyyy")}
              {isOverdue && " • Atrasado!"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          {r.status === "pending" && (
            <>
              <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "done" })}>
                <CheckCircle className="w-3 h-3 mr-1" /> Feito
              </Button>
              <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: r.id, status: "postponed" })}>
                <Clock className="w-3 h-3 mr-1" /> Adiar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: r.id, status: "disabled" })}>
                <XCircle className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const pendingDiet = dietReminders.filter((r) => r.status === "pending").length;
  const pendingRenewal = renewalReminders.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Lembretes Inteligentes</h3>
          <p className="text-sm text-muted-foreground">Gerencie ajustes de dieta e renovações.</p>
        </div>
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          <RefreshCw className={`w-4 h-4 mr-2 ${generateMutation.isPending ? "animate-spin" : ""}`} />
          Gerar Lembretes
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="diet" className="gap-2">
            <Salad className="w-4 h-4" /> Ajuste de Dieta
            {pendingDiet > 0 && <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{pendingDiet}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="renewal" className="gap-2">
            <Bell className="w-4 h-4" /> Renovação
            {pendingRenewal > 0 && <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{pendingRenewal}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diet">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Salad className="w-4 h-4" /> Lembretes de Ajuste de Dieta (Mensal)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dietReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lembrete. Clique em "Gerar Lembretes".</p>
              ) : (
                dietReminders.map((r) => <ReminderRow key={r.id} r={r} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewal">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Bell className="w-4 h-4" /> Lembretes de Renovação (3 dias antes)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {renewalReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lembrete. Clique em "Gerar Lembretes".</p>
              ) : (
                renewalReminders.map((r) => <ReminderRow key={r.id} r={r} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReminders;
