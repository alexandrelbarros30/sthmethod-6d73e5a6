import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bell,
  CheckCheck,
  CreditCard,
  TrendingUp,
  Camera,
  UserCog,
  MessageSquare,
  Eye,
  Inbox,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { sendSystemTemplate } from "@/lib/system-templates";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STAFF = ["admin", "consultor", "financeiro"] as const;

type Tab = "all" | "payments" | "evolution" | "reminders";

const NotificationCenter = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("all");

  const isStaff = !!user && (STAFF as readonly string[]).includes(role || "");

  // ---- Queries ----
  const { data: payments = [] } = useQuery({
    queryKey: ["notif-payments"],
    enabled: isStaff,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_notifications")
        .select("*")
        .eq("seen", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: evolutions = [] } = useQuery({
    queryKey: ["notif-evolutions"],
    enabled: isStaff && (role === "admin" || role === "consultor"),
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evolution_notifications")
        .select("*")
        .eq("seen", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["notif-reminders"],
    enabled: isStaff && (role === "admin" || role === "consultor"),
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evolution_reminders")
        .select("*")
        .eq("seen", false)
        .order("due_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const total = payments.length + evolutions.length + reminders.length;

  // ---- Realtime ----
  useEffect(() => {
    if (!isStaff) return;
    const channel = supabase
      .channel("notif-center-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "payment_notifications" }, () => {
        queryClient.invalidateQueries({ queryKey: ["notif-payments"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "evolution_notifications" }, () => {
        queryClient.invalidateQueries({ queryKey: ["notif-evolutions"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "evolution_reminders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["notif-reminders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isStaff, queryClient]);

  // ---- Mutations ----
  const markSeen = useMutation({
    mutationFn: async (args: { table: string; id: string; key: string }) => {
      await supabase.from(args.table as any).update({ seen: true }).eq("id", args.id);
      return args.key;
    },
    onSuccess: (key) => queryClient.invalidateQueries({ queryKey: [key] }),
  });

  const markAllSeen = useMutation({
    mutationFn: async () => {
      await Promise.all([
        payments.length && supabase.from("payment_notifications").update({ seen: true }).eq("seen", false),
        evolutions.length && supabase.from("evolution_notifications").update({ seen: true }).eq("seen", false),
        reminders.length && supabase.from("evolution_reminders").update({ seen: true }).eq("seen", false),
      ].filter(Boolean) as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notif-payments"] });
      queryClient.invalidateQueries({ queryKey: ["notif-evolutions"] });
      queryClient.invalidateQueries({ queryKey: ["notif-reminders"] });
    },
  });

  const handleSendReminderWA = async (reminder: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, full_name")
      .eq("user_id", reminder.student_user_id)
      .single();
    const result = await sendSystemTemplate(
      "evolution_update_reminder",
      { full_name: profile?.full_name, phone: profile?.phone, user_id: reminder.student_user_id },
      { logHistory: true }
    );
    if (!result.ok) {
      toast({ title: "Não foi possível enviar", description: result.reason, variant: "destructive" });
      return;
    }
    markSeen.mutate({ table: "evolution_reminders", id: reminder.id, key: "notif-reminders" });
  };

  const goToStudent = (studentId: string) => {
    const base = role === "consultor" ? "/consultor/students" : "/admin/students";
    navigate(`${base}?manage=${studentId}`);
    setOpen(false);
  };

  const actionLabel = (t: string) =>
    t === "new" ? "Novo plano" : t === "upgrade" ? "Upgrade" : "Renovação";

  const items = useMemo(() => {
    const list: Array<{ kind: "payment" | "evolution" | "reminder"; data: any; ts: number }> = [];
    payments.forEach((p: any) => list.push({ kind: "payment", data: p, ts: new Date(p.created_at).getTime() }));
    evolutions.forEach((e: any) => list.push({ kind: "evolution", data: e, ts: new Date(e.created_at).getTime() }));
    reminders.forEach((r: any) => list.push({ kind: "reminder", data: r, ts: new Date(r.due_date + "T12:00:00").getTime() }));
    return list.sort((a, b) => b.ts - a.ts);
  }, [payments, evolutions, reminders]);

  if (!isStaff) return null;

  const filtered = items.filter((i) => {
    if (tab === "all") return true;
    if (tab === "payments") return i.kind === "payment";
    if (tab === "evolution") return i.kind === "evolution";
    return i.kind === "reminder";
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Notificações"
          className={cn(
            "fixed z-50 top-3 right-3 md:top-4 md:right-4",
            "h-10 w-10 rounded-full grid place-items-center",
            "bg-background/70 backdrop-blur-xl border border-foreground/15",
            "shadow-lg hover:bg-background transition-colors",
          )}
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <Bell className="w-[18px] h-[18px] text-foreground" strokeWidth={1.8} />
          {total > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold grid place-items-center shadow">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[360px] sm:w-[400px] p-0 overflow-hidden border-foreground/10 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl"
      >
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-[-0.02em]">Notificações</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {total === 0 ? "Tudo em dia" : `${total} pendente${total === 1 ? "" : "s"}`}
            </p>
          </div>
          {total > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => markAllSeen.mutate()}
            >
              <CheckCheck className="w-3.5 h-3.5" /> Limpar
            </Button>
          )}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full">
          <div className="px-3">
            <TabsList className="w-full h-9 bg-foreground/5 rounded-xl p-0.5">
              <TabsTrigger value="all" className="flex-1 text-[11px] rounded-lg data-[state=active]:bg-background">
                Todas {total > 0 && <span className="ml-1 opacity-60">{total}</span>}
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex-1 text-[11px] rounded-lg data-[state=active]:bg-background">
                Pgto {payments.length > 0 && <span className="ml-1 opacity-60">{payments.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="evolution" className="flex-1 text-[11px] rounded-lg data-[state=active]:bg-background">
                Evol {evolutions.length > 0 && <span className="ml-1 opacity-60">{evolutions.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="reminders" className="flex-1 text-[11px] rounded-lg data-[state=active]:bg-background">
                Lembrar {reminders.length > 0 && <span className="ml-1 opacity-60">{reminders.length}</span>}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={tab} className="mt-2">
            <ScrollArea className="max-h-[60vh] h-[min(60vh,520px)]">
              <div className="px-2 pb-3 space-y-1">
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <Inbox className="w-8 h-8 opacity-40" strokeWidth={1.4} />
                    <p className="text-xs">Nenhuma notificação</p>
                  </div>
                )}

                {filtered.map((it) => {
                  if (it.kind === "payment") {
                    const n = it.data;
                    return (
                      <NotificationRow
                        key={`p-${n.id}`}
                        icon={<CreditCard className="w-4 h-4" strokeWidth={1.8} />}
                        accent="bg-emerald-500/10 text-emerald-500"
                        title={n.student_name}
                        statusIcon={n.payment_status === "approved" ? "✅" : "⏳"}
                        subtitle={`${n.plan_name} • ${Number(n.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
                        chips={[actionLabel(n.action_type), (n.method || "").toUpperCase()].filter(Boolean)}
                        time={n.created_at}
                        actions={
                          <>
                            {(role === "admin" || role === "consultor") && (
                              <RowAction icon={<UserCog className="w-3 h-3" />} label="Cadastro" onClick={() => goToStudent(n.student_user_id)} />
                            )}
                            <RowAction icon={<Eye className="w-3 h-3" />} label="Visto" onClick={() => markSeen.mutate({ table: "payment_notifications", id: n.id, key: "notif-payments" })} />
                          </>
                        }
                      />
                    );
                  }
                  if (it.kind === "evolution") {
                    const n = it.data;
                    const diff = n.previous_weight && n.new_weight
                      ? (Number(n.new_weight) - Number(n.previous_weight)).toFixed(1)
                      : null;
                    const diffLabel = diff ? (Number(diff) > 0 ? `+${diff} kg` : `${diff} kg`) : null;
                    const hasWeight = n.new_weight != null;
                    const subtitleParts: string[] = [];
                    if (hasWeight) subtitleParts.push(`Peso ${Number(n.new_weight).toFixed(1)} kg`);
                    if (n.has_photos) subtitleParts.push("Novas fotos de evolução");
                    if (!subtitleParts.length) subtitleParts.push("Atualização recebida");
                    return (
                      <NotificationRow
                        key={`e-${n.id}`}
                        icon={<TrendingUp className="w-4 h-4" strokeWidth={1.8} />}
                        accent={n.has_photos && !hasWeight ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-500"}
                        title={n.student_name}
                        statusIcon={n.has_photos && !hasWeight ? "📸" : "📊"}
                        subtitle={subtitleParts.join(" • ")}
                        chips={[diffLabel, n.has_photos ? "📸 Fotos" : null].filter(Boolean) as string[]}
                        time={n.created_at}
                        actions={
                          <RowAction icon={<Eye className="w-3 h-3" />} label="Visto" onClick={() => markSeen.mutate({ table: "evolution_notifications", id: n.id, key: "notif-evolutions" })} />
                        }
                      />
                    );
                  }
                  // reminder
                  const r = it.data;
                  return (
                    <NotificationRow
                      key={`r-${r.id}`}
                      icon={<Camera className="w-4 h-4" strokeWidth={1.8} />}
                      accent="bg-amber-500/10 text-amber-500"
                      title={r.student_name}
                      statusIcon="📸"
                      subtitle={`${r.cycle_number}º ciclo • venc. ${format(new Date(r.due_date + "T12:00:00"), "dd/MM", { locale: ptBR })}`}
                      chips={["29 dias"]}
                      time={r.due_date + "T12:00:00"}
                      actions={
                        <>
                          <RowAction icon={<MessageSquare className="w-3 h-3" />} label="WA" onClick={() => handleSendReminderWA(r)} primary />
                          <RowAction icon={<Eye className="w-3 h-3" />} label="Visto" onClick={() => markSeen.mutate({ table: "evolution_reminders", id: r.id, key: "notif-reminders" })} />
                        </>
                      }
                    />
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

const NotificationRow = ({
  icon, accent, title, statusIcon, subtitle, chips, time, actions,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  statusIcon?: string;
  subtitle: string;
  chips: string[];
  time: string;
  actions: React.ReactNode;
}) => {
  return (
    <div className="group flex gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors">
      <div className={cn("h-8 w-8 rounded-full grid place-items-center shrink-0", accent)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-medium tracking-[-0.01em] truncate">
            {statusIcon && <span className="mr-1">{statusIcon}</span>}
            {title}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(time), { locale: ptBR, addSuffix: false })}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{subtitle}</p>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {chips.map((c, i) => (
              <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal">
                {c}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-1 mt-2 opacity-90">
          {actions}
        </div>
      </div>
    </div>
  );
};

const RowAction = ({ icon, label, onClick, primary }: { icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean }) => (
  <Button
    size="sm"
    variant={primary ? "default" : "ghost"}
    className={cn(
      "h-6 px-2 text-[10px] gap-1 rounded-full",
      !primary && "text-muted-foreground hover:text-foreground"
    )}
    onClick={onClick}
  >
    {icon} {label}
  </Button>
);

export default NotificationCenter;