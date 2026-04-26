import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListOrdered, UserPlus, RefreshCw, TrendingUp, Settings, MessageCircle, Check } from "lucide-react";

type QueueType = "new" | "renewal" | "update";

interface QueueItem {
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  type: QueueType;
  detail: string;
  occurred_at: string; // ISO
}

const PRIORITY: Record<QueueType, number> = { new: 1, renewal: 2, update: 3 };

const TYPE_META: Record<QueueType, { label: string; icon: any; cls: string; badgeCls: string }> = {
  new: {
    label: "Novo aluno",
    icon: UserPlus,
    cls: "border-l-4 border-l-emerald-500",
    badgeCls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  renewal: {
    label: "Renovação",
    icon: RefreshCw,
    cls: "border-l-4 border-l-primary",
    badgeCls: "bg-primary/15 text-primary border-primary/30",
  },
  update: {
    label: "Atualização",
    icon: TrendingUp,
    cls: "border-l-4 border-l-amber-500",
    badgeCls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
};

interface Props {
  /** When provided, restrict items to these student user_ids (consultor) */
  allowedUserIds?: string[];
  /** Compact: caps list height. Used in dashboards. */
  compact?: boolean;
  /** Manage route base, e.g. "/admin/students" or "/consultor/students" */
  manageBasePath?: string;
}

const sevenDaysAgoISO = () => new Date(Date.now() - 7 * 86400000).toISOString();

const ServiceQueue = ({ allowedUserIds, compact = false, manageBasePath = "/admin/students" }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["service-queue", allowedUserIds?.join(",") || "all"],
    queryFn: async () => {
      const since = sevenDaysAgoISO();

      // 1. Approved payments in last 7 days (new + renewal)
      const { data: payments } = await supabase
        .from("payments")
        .select("user_id, action_type, created_at, updated_at, status")
        .eq("status", "approved")
        .gte("updated_at", since)
        .order("updated_at", { ascending: false });

      // 2. Evolution updates in last 7 days
      const { data: evolutions } = await supabase
        .from("evolution_notifications")
        .select("student_user_id, student_name, created_at, has_photos, new_weight")
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      // 3. Dismissed (atendidos) — chave (user_id, type, occurred_at)
      const { data: dismissals } = await supabase
        .from("service_queue_dismissals")
        .select("user_id, type, occurred_at")
        .gte("occurred_at", since);
      const dismissedKeys = new Set(
        (dismissals || []).map((d: any) => `${d.user_id}|${d.type}|${new Date(d.occurred_at).toISOString()}`),
      );

      // Collect user ids
      const userIds = new Set<string>();
      (payments || []).forEach((p: any) => p.user_id && userIds.add(p.user_id));
      (evolutions || []).forEach((e: any) => e.student_user_id && userIds.add(e.student_user_id));

      let ids = Array.from(userIds);
      if (allowedUserIds) {
        const allowSet = new Set(allowedUserIds);
        ids = ids.filter((id) => allowSet.has(id));
      }
      if (ids.length === 0) return [] as QueueItem[];

      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", ids);
      const pmap = new Map((profs || []).map((p: any) => [p.user_id, p]));

      const items: QueueItem[] = [];

      (payments || []).forEach((p: any) => {
        if (!p.user_id) return;
        if (allowedUserIds && !allowedUserIds.includes(p.user_id)) return;
        const prof = pmap.get(p.user_id);
        const isNew = (p.action_type || "new") === "new";
        const occurred = p.updated_at || p.created_at;
        const type: QueueType = isNew ? "new" : "renewal";
        const key = `${p.user_id}|${type}|${new Date(occurred).toISOString()}`;
        if (dismissedKeys.has(key)) return;
        items.push({
          user_id: p.user_id,
          name: prof?.full_name || prof?.email || "Aluno",
          email: prof?.email,
          phone: prof?.phone,
          type,
          detail: isNew ? "Pagamento de novo aluno aprovado" : "Renovação de plano aprovada",
          occurred_at: occurred,
        });
      });

      (evolutions || []).forEach((e: any) => {
        if (!e.student_user_id) return;
        if (allowedUserIds && !allowedUserIds.includes(e.student_user_id)) return;
        const prof = pmap.get(e.student_user_id);
        const parts: string[] = [];
        if (e.new_weight) parts.push(`peso ${Number(e.new_weight).toFixed(1)}kg`);
        if (e.has_photos) parts.push("fotos");
        const key = `${e.student_user_id}|update|${new Date(e.created_at).toISOString()}`;
        if (dismissedKeys.has(key)) return;
        items.push({
          user_id: e.student_user_id,
          name: prof?.full_name || e.student_name || "Aluno",
          email: prof?.email,
          phone: prof?.phone,
          type: "update",
          detail: parts.length ? `Atualização: ${parts.join(" + ")}` : "Atualização enviada",
          occurred_at: e.created_at,
        });
      });

      // Dedup por user_id mantendo o de maior prioridade (menor número)
      const byUser = new Map<string, QueueItem>();
      items.forEach((it) => {
        const cur = byUser.get(it.user_id);
        if (!cur) {
          byUser.set(it.user_id, it);
          return;
        }
        if (PRIORITY[it.type] < PRIORITY[cur.type]) {
          byUser.set(it.user_id, it);
        } else if (PRIORITY[it.type] === PRIORITY[cur.type]) {
          // mesma prioridade: manter o mais recente
          if (new Date(it.occurred_at) > new Date(cur.occurred_at)) byUser.set(it.user_id, it);
        }
      });

      // Ordenar por data/hora desc (mais recente primeiro);
      // empates de timestamp respeitam prioridade (Novo > Renovação > Atualização)
      return Array.from(byUser.values()).sort((a, b) => {
        const diff = new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
        if (diff !== 0) return diff;
        return PRIORITY[a.type] - PRIORITY[b.type];
      });
    },
    refetchInterval: 60_000,
  });

  const items = data || [];

  const dismissMutation = useMutation({
    mutationFn: async (it: QueueItem) => {
      if (!user?.id) throw new Error("Sem usuário");
      const { error } = await supabase.from("service_queue_dismissals").insert({
        user_id: it.user_id,
        type: it.type,
        occurred_at: it.occurred_at,
        dismissed_by: user.id,
      });
      if (error && !String(error.message).includes("duplicate")) throw error;
    },
    onSuccess: () => {
      toast({ title: "Atendido", description: "Aluno removido da fila." });
      queryClient.invalidateQueries({ queryKey: ["service-queue"] });
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message || "Falha ao marcar como atendido", variant: "destructive" });
    },
  });

  const counts = useMemo(() => {
    const c = { new: 0, renewal: 0, update: 0 };
    items.forEach((i) => c[i.type]++);
    return c;
  }, [items]);

  const openWhatsApp = (phone?: string, name?: string) => {
    if (!phone) return;
    const digits = phone.replace(/\D/g, "");
    if (!digits) return;
    const msg = encodeURIComponent(`Olá ${name?.split(" ")[0] || ""}, tudo bem? Aqui é da equipe STH Method.`);
    window.open(`https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}?text=${msg}`, "_blank");
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-display flex items-center gap-2 flex-wrap">
          <ListOrdered className="w-4 h-4 text-primary" />
          Fila de Atendimento
          <Badge variant="default" className="ml-1">{items.length}</Badge>
          <div className="flex items-center gap-1.5 ml-auto text-[10px] flex-wrap">
            <Badge variant="outline" className={TYPE_META.new.badgeCls}>Novos: {counts.new}</Badge>
            <Badge variant="outline" className={TYPE_META.renewal.badgeCls}>Renov: {counts.renewal}</Badge>
            <Badge variant="outline" className={TYPE_META.update.badgeCls}>Atual: {counts.update}</Badge>
          </div>
        </CardTitle>
        <p className="text-[11px] text-muted-foreground font-body">
          Últimos 7 dias · Ordem por data/hora (mais recente primeiro) · prioridade Novo &gt; Renovação &gt; Atualização em empates · sem duplicidade
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Carregando fila...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum atendimento pendente nos últimos 7 dias.
          </p>
        ) : (
          <ScrollArea className={compact ? "h-[380px] pr-3" : "h-[70vh] pr-3"}>
            <div className="space-y-2">
              {items.map((it, idx) => {
                const meta = TYPE_META[it.type];
                const Icon = meta.icon;
                const when = new Date(it.occurred_at);
                const days = Math.floor((Date.now() - when.getTime()) / 86400000);
                const whenLabel = days === 0 ? "Hoje" : days === 1 ? "Ontem" : `${days}d atrás`;
                return (
                  <div
                    key={`${it.user_id}-${it.type}`}
                    className={`p-2.5 rounded-lg bg-card hover:bg-muted/40 transition-colors ${meta.cls}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-foreground">
                        {idx + 1}
                      </div>
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => navigate(`${manageBasePath}?manage=${it.user_id}`)}
                            className="text-sm font-medium truncate text-left hover:text-primary hover:underline transition-colors"
                            title="Abrir cadastro do aluno"
                          >
                            {it.name}
                          </button>
                          <Badge variant="outline" className={`text-[9px] ${meta.badgeCls}`}>
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {it.detail} · {whenLabel}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {it.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-success"
                            onClick={() => openWhatsApp(it.phone, it.name)}
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => navigate(`${manageBasePath}?manage=${it.user_id}`)}
                        >
                          <Settings className="w-3 h-3" /> Atender
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-2 w-full h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => dismissMutation.mutate(it)}
                      disabled={dismissMutation.isPending}
                      title="Marcar como atendido (remove da fila)"
                    >
                      <Check className="w-3.5 h-3.5" /> Atendido
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceQueue;