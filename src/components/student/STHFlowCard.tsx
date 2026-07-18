import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePreviewAs } from "@/hooks/usePreviewAs";
import { Check, Loader2, Zap, X, Sparkles, Utensils, Dumbbell, Pill } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { key: "cadastro_recebido_at", label: "Cadastro recebido" },
  { key: "dados_em_analise_at", label: "Dados em análise" },
  { key: "estrategia_estruturando_at", label: "Estratégia sendo estruturada" },
  { key: "plataforma_liberada_at", label: "Plataforma liberada" },
  { key: "plano_avancado_pronto_at", label: "Plano avançado em preparação" },
] as const;

type FlowResponse = {
  steps: Record<string, string | null>;
  completed: number;
  total: number;
  progress: number;
  all_done: boolean;
  completed_dismissed_at: string | null;
};

const KIND_META: Record<string, { icon: any; label: string }> = {
  diet: { icon: Utensils, label: "Nova dieta" },
  training: { icon: Dumbbell, label: "Novo treino" },
  protocol: { icon: Pill, label: "Novo protocolo" },
  flow_completed: { icon: Sparkles, label: "Fluxo concluído" },
};

export default function STHFlowCard() {
  const { user } = useAuth();
  const { effectiveUserId } = usePreviewAs();
  const targetId = effectiveUserId || user?.id;
  const qc = useQueryClient();
  const [dismissing, setDismissing] = useState(false);

  const { data, isLoading } = useQuery<FlowResponse | null>({
    queryKey: ["sth-flow-status-v2", targetId],
    queryFn: async () => {
      if (!targetId) return null;
      const { data, error } = await supabase.functions.invoke("sth-flow-status", {
        body: { user_id: targetId },
      });
      if (error) throw error;
      return data as FlowResponse;
    },
    enabled: !!targetId,
    staleTime: 30_000,
    refetchOnMount: "always",
  });

  // Notificações recentes não vistas
  const { data: notifs = [] } = useQuery({
    queryKey: ["sth-flow-notifs", targetId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("student_flow_notifications")
        .select("*")
        .eq("user_id", targetId!)
        .eq("seen", false)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!targetId,
    staleTime: 15_000,
  });

  // Realtime: atualiza card + toast quando entra notificação nova
  useEffect(() => {
    if (!targetId) return;
    const channel = supabase
      .channel(`sth-flow-${targetId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "student_flow_notifications", filter: `user_id=eq.${targetId}` },
        (payload: any) => {
          const n = payload.new;
          toast.success(n.title, { description: n.message });
          qc.invalidateQueries({ queryKey: ["sth-flow-status-v2", targetId] });
          qc.invalidateQueries({ queryKey: ["sth-flow-notifs", targetId] });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [targetId, qc]);

  const dismissNotif = async (id: string) => {
    await (supabase as any)
      .from("student_flow_notifications")
      .update({ seen: true, seen_at: new Date().toISOString() })
      .eq("id", id);
    qc.invalidateQueries({ queryKey: ["sth-flow-notifs", targetId] });
  };

  const dismissCompleted = async () => {
    if (!targetId) return;
    setDismissing(true);
    const { error } = await supabase.functions.invoke("sth-flow-status", {
      body: { user_id: targetId, action: "dismiss_completed" },
    });
    setDismissing(false);
    if (error) {
      toast.error("Não foi possível fechar o STH Flow agora.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["sth-flow-status-v2", targetId] });
  };

  // Auto-dispensa o card quando o fluxo chega a 100% — mostra o aviso por
  // ~6s e some sozinho (fechamento persistido em student_flow_status).
  useEffect(() => {
    if (!data?.all_done || data?.completed_dismissed_at || !targetId) return;
    const t = window.setTimeout(() => {
      void dismissCompleted();
    }, 6000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.all_done, data?.completed_dismissed_at, targetId]);

  if (isLoading || !data) return null;

  // 100% + já fechado → oculta
  if (data.all_done && data.completed_dismissed_at) return null;

  // 100% → mostra estado de conclusão com botão fechar
  if (data.all_done) {
    return (
      <div className="mb-10 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-background p-7 relative">
        <button
          onClick={dismissCompleted}
          disabled={dismissing}
          aria-label="Fechar"
          className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center hover:bg-foreground/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.25em] uppercase text-emerald-500 mb-2">
          <Sparkles className="w-3 h-3" /> STH Flow · Concluído
        </div>
        <p className="text-[17px] font-semibold text-foreground tracking-[-0.02em] leading-tight mb-1">
          Seu plano está 100% ativo.
        </p>
        <p className="text-[12px] text-muted-foreground font-light tracking-tight">
          Todas as etapas foram entregues. Bora executar!
        </p>
      </div>
    );
  }

  return (
    <div className="mb-10 rounded-3xl border border-border/40 bg-background p-7">
      <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-2">
        <Zap className="w-3 h-3" /> STH Flow
      </div>
      <p className="text-[15px] font-semibold text-foreground tracking-[-0.02em] leading-tight mb-1">
        Sua estratégia já está em andamento.
      </p>
      <p className="text-[12px] text-muted-foreground font-light mb-5 tracking-tight">
        Recebemos seu cadastro e nosso time já está cuidando de você.
      </p>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-[40px] leading-none font-semibold text-foreground tracking-[-0.04em] tabular-nums">
          {data.progress}
        </span>
        <span className="text-lg text-muted-foreground/60 font-light">%</span>
        <span className="ml-auto text-[11px] text-muted-foreground tracking-tight">
          {data.completed} de {data.total} etapas
        </span>
      </div>
      <div className="h-1 w-full bg-foreground/10 rounded-full overflow-hidden mb-5">
        <div className="h-full bg-foreground rounded-full transition-all duration-700" style={{ width: `${data.progress}%` }} />
      </div>

      <div className="space-y-2.5">
        {STEPS.map((step) => {
          const done = !!data.steps[step.key];
          return (
            <div key={step.key} className="flex items-center gap-2.5 text-[13px]">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-foreground" : "border border-foreground/30"}`}>
                {done ? <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} /> : (
                  <Loader2 className="w-2.5 h-2.5 text-muted-foreground animate-spin" />
                )}
              </div>
              <span className={done ? "text-foreground tracking-tight" : "text-muted-foreground tracking-tight"}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {notifs.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border/40 space-y-2">
          <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-2">Novidades</p>
          {notifs.map((n: any) => {
            const meta = KIND_META[n.kind] || KIND_META.diet;
            const Icon = meta.icon;
            return (
              <div key={n.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-foreground/[0.04]">
                <Icon className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium text-foreground tracking-tight leading-tight">{n.title}</p>
                  {n.message && <p className="text-[11px] text-muted-foreground truncate">{n.message}</p>}
                </div>
                <button onClick={() => dismissNotif(n.id)} aria-label="Marcar como lida" className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
