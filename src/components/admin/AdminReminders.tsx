import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Clock, Salad, RefreshCw, XCircle, Bell, User, Mail, Phone, CreditCard, Ban, PauseCircle, ExternalLink } from "lucide-react";
import { format, addDays, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Reminder {
  id: string;
  user_id: string;
  type: string;
  status: string;
  due_date: string;
  notes: string;
  created_at: string;
  profile?: { full_name: string; email: string; phone?: string };
  subscription?: { id: string; end_date: string; status: string; plans: { name: string; duration_days: number } };
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "destructive" },
  done: { label: "Realizado", variant: "default" },
  postponed: { label: "Adiado", variant: "secondary" },
  disabled: { label: "Desativado", variant: "outline" },
};

const AdminReminders = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState("diet");
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subTarget, setSubTarget] = useState<Reminder | null>(null);
  const [subForm, setSubForm] = useState({ plan_id: "", start_date: "", end_date: "", status: "active" });

  // Fetch plans for subscription dialog
  const { data: plans } = useQuery({
    queryKey: ["admin-plans-reminders"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("active", true).order("duration_days");
      return data || [];
    },
  });

  // Fetch all active subscriptions with profiles
  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subs-reminders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*, plans(*)")
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

        // Renewal reminder (3 days before end, or today if already past that window but plan still active)
        if (!existingUserTypes.has(`${sub.user_id}_renewal`)) {
          const renewalDate = addDays(endDate, -3);
          const dueDate = renewalDate > now ? renewalDate : now;
          if (endDate > now || differenceInDays(endDate, now) >= -1) {
            toInsert.push({ user_id: sub.user_id, type: "renewal", due_date: format(dueDate, "yyyy-MM-dd"), status: "pending" });
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

  // Subscription update from reminder
  const subMutation = useMutation({
    mutationFn: async () => {
      if (!subTarget?.subscription?.id) return;
      const { error } = await supabase.from("subscriptions").update({
        plan_id: subForm.plan_id,
        start_date: subForm.start_date,
        end_date: subForm.end_date,
        status: subForm.status,
      }).eq("id", subTarget.subscription.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subs-reminders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reminders"] });
      toast({ title: "Assinatura atualizada!" });
      setSubDialogOpen(false);
    },
    onError: () => toast({ title: "Erro ao atualizar assinatura", variant: "destructive" }),
  });

  // Fetch profiles for enrichment
  const allUserIds = [
    ...new Set([
      ...(reminders || []).map((r) => r.user_id),
      ...(subscriptions || []).map((s: any) => s.user_id),
    ]),
  ];

  const { data: profilesData } = useQuery({
    queryKey: ["admin-reminders-profiles", allUserIds.join(",")],
    queryFn: async () => {
      if (allUserIds.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", allUserIds);
      return data || [];
    },
    enabled: allUserIds.length > 0,
  });

  const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, p]));

  // Enrich reminders with profile/subscription data
  const enriched = (reminders || []).map((r) => {
    const sub = subscriptions?.find((s: any) => s.user_id === r.user_id);
    return {
      ...r,
      profile: profileMap.get(r.user_id),
      subscription: sub ? { id: sub.id, end_date: sub.end_date, status: sub.status, plans: (sub as any).plans } : undefined,
    };
  });

  const dietReminders = enriched.filter((r) => r.type === "diet_adjustment");
  const renewalReminders = enriched.filter((r) => r.type === "renewal");

  const openSubDialog = (r: Reminder) => {
    setSubTarget(r);
    setSubForm({
      plan_id: r.subscription?.plans ? (plans?.find((p) => p.name === r.subscription?.plans?.name)?.id || plans?.[0]?.id || "") : (plans?.[0]?.id || ""),
      start_date: r.subscription ? new Date().toISOString().split("T")[0] : "",
      end_date: r.subscription?.end_date || "",
      status: r.subscription?.status || "active",
    });
    setSubDialogOpen(true);
  };

  const handlePlanChange = (planId: string) => {
    const plan = plans?.find((p) => p.id === planId);
    const start = subForm.start_date || new Date().toISOString().split("T")[0];
    const end = plan ? new Date(new Date(start).getTime() + plan.duration_days * 86400000).toISOString().split("T")[0] : subForm.end_date;
    setSubForm({ ...subForm, plan_id: planId, end_date: end });
  };

  const ReminderRow = ({ r }: { r: Reminder }) => {
    const isOverdue = isPast(new Date(r.due_date)) && r.status === "pending";
    const cfg = statusConfig[r.status] || statusConfig.pending;
    const daysLeft = differenceInDays(new Date(r.subscription?.end_date || r.due_date), new Date());

    return (
      <div className={`rounded-lg border ${isOverdue ? "border-destructive/30 bg-destructive/5" : "border-border"} overflow-hidden`}>
        {/* Student identification header */}
        <div className="flex items-center justify-between py-3 px-4 bg-muted/30">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
                {r.profile?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{r.profile?.full_name || "Aluno"}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {r.profile?.email || "—"}</span>
                {r.profile?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {r.profile.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            {isOverdue && <Badge variant="destructive" className="text-xs">Atrasado!</Badge>}
          </div>
        </div>

        {/* Details & actions */}
        <div className="px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>📋 {r.subscription?.plans?.name || "Sem plano"}</span>
            <span>📅 Vence: {r.subscription?.end_date ? format(new Date(r.subscription.end_date), "dd/MM/yyyy") : "—"}</span>
            {r.subscription && daysLeft >= 0 && <span className={daysLeft <= 3 ? "text-destructive font-medium" : ""}>{daysLeft === 0 ? "Vence hoje!" : `${daysLeft} dias restantes`}</span>}
            {r.subscription && daysLeft < 0 && <span className="text-destructive font-medium">Vencido há {Math.abs(daysLeft)} dias</span>}
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {/* Quick action shortcuts */}
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate("/admin/alunos")} title="Ver cadastro do aluno">
              <User className="w-3 h-3 mr-1" /> Cadastro
            </Button>

            {r.subscription && (
              <>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { openSubDialog({ ...r, } as Reminder); setSubForm(f => ({ ...f, status: "active" })); }} title="Renovar assinatura">
                  <RefreshCw className="w-3 h-3 mr-1" /> Renovar
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs text-secondary-foreground border-secondary hover:bg-secondary/80" onClick={() => { openSubDialog({ ...r } as Reminder); setSubForm(f => ({ ...f, status: "suspended" })); }} title="Suspender assinatura">
                  <PauseCircle className="w-3 h-3 mr-1" /> Suspender
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => { openSubDialog({ ...r } as Reminder); setSubForm(f => ({ ...f, status: "expired" })); }} title="Bloquear/Encerrar assinatura">
                  <Ban className="w-3 h-3 mr-1" /> Bloquear
                </Button>
              </>
            )}

            <div className="w-px h-5 bg-border mx-1" />

            {r.status === "pending" && (
              <>
                <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: r.id, status: "done" })}>
                  <CheckCircle className="w-3 h-3 mr-1" /> Feito
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: r.id, status: "postponed" })}>
                  <Clock className="w-3 h-3 mr-1" /> Adiar
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: r.id, status: "disabled" })}>
                  <XCircle className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
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
            <CardContent className="space-y-3">
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
            <CardContent className="space-y-3">
              {renewalReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lembrete. Clique em "Gerar Lembretes".</p>
              ) : (
                renewalReminders.map((r) => <ReminderRow key={r.id} r={r} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subscription Management Dialog from Reminder */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Gerenciar Assinatura
            </DialogTitle>
          </DialogHeader>
          {subTarget && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {subTarget.profile?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{subTarget.profile?.full_name || "Aluno"}</p>
                  <p className="text-xs text-muted-foreground">{subTarget.profile?.email}</p>
                </div>
              </div>

              <div>
                <Label className="font-body">Plano</Label>
                <Select value={subForm.plan_id} onValueChange={handlePlanChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                  <SelectContent>{plans?.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} — {p.price}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div><Label className="font-body">Data de início</Label><Input type="date" value={subForm.start_date} onChange={(e) => setSubForm({ ...subForm, start_date: e.target.value })} /></div>
              <div><Label className="font-body">Data de vencimento</Label><Input type="date" value={subForm.end_date} onChange={(e) => setSubForm({ ...subForm, end_date: e.target.value })} /></div>
              <div>
                <Label className="font-body">Status</Label>
                <Select value={subForm.status} onValueChange={(v) => setSubForm({ ...subForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="expired">Vencido / Bloqueado</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => subMutation.mutate()} disabled={subMutation.isPending}>
              {subMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReminders;
