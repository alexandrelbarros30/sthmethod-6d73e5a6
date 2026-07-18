import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePreviewAs } from "@/hooks/usePreviewAs";
import { Check, Loader2, Zap } from "lucide-react";

const STEPS = [
  { key: "cadastro_recebido_at", label: "Cadastro recebido" },
  { key: "dados_em_analise_at", label: "Dados em análise" },
  { key: "estrategia_estruturando_at", label: "Estratégia sendo estruturada" },
  { key: "plataforma_liberada_at", label: "Plataforma liberada" },
  { key: "plano_avancado_pronto_at", label: "Plano avançado em preparação" },
] as const;

export default function STHFlowCard() {
  const { user } = useAuth();
  const { effectiveUserId } = usePreviewAs();
  const targetId = effectiveUserId || user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["sth-flow-status", targetId],
    queryFn: async () => {
      // Base manual (definida por admin/consultor)
      const manualPromise = (supabase as any)
        .from("student_flow_status")
        .select("*")
        .eq("user_id", targetId!)
        .maybeSingle();

      // Fontes reais para derivar automaticamente
      const [
        manualRes,
        bodyImgs,
        weightLogs,
        subs,
        diets,
        protocols,
        trainings,
      ] = await Promise.all([
        manualPromise,
        (supabase as any).from("body_images").select("id", { count: "exact", head: true }).eq("user_id", targetId!),
        (supabase as any).from("weight_logs").select("id", { count: "exact", head: true }).eq("user_id", targetId!),
        (supabase as any).from("subscriptions").select("id,status,end_date").eq("user_id", targetId!),
        (supabase as any).from("student_diets").select("id", { count: "exact", head: true }).eq("user_id", targetId!),
        (supabase as any).from("student_protocols").select("id", { count: "exact", head: true }).eq("user_id", targetId!),
        (supabase as any).from("student_workout_assignments").select("id", { count: "exact", head: true }).eq("user_id", targetId!),
      ]);

      const manual = manualRes?.data || {};
      const nowIso = new Date().toISOString();
      const has = (r: any) => (r?.count ?? 0) > 0;
      const hasSub = Array.isArray(subs?.data) && subs.data.some((s: any) =>
        ["active", "approved", "trialing"].includes(String(s.status || "").toLowerCase()) ||
        (s.end_date && new Date(s.end_date) > new Date())
      );
      const hasDiet = has(diets);
      const hasProt = has(protocols);
      const hasTrain = has(trainings);
      const hasAnalysis = has(bodyImgs) || has(weightLogs);
      const platformReleased = hasDiet || hasProt || hasTrain;
      const advancedReady = hasDiet && hasProt && hasTrain;

      return {
        cadastro_recebido_at: manual.cadastro_recebido_at || nowIso,
        dados_em_analise_at:
          manual.dados_em_analise_at || (hasAnalysis || hasSub ? nowIso : null),
        estrategia_estruturando_at:
          manual.estrategia_estruturando_at || (hasSub || platformReleased ? nowIso : null),
        plataforma_liberada_at:
          manual.plataforma_liberada_at || (platformReleased ? nowIso : null),
        plano_avancado_pronto_at:
          manual.plano_avancado_pronto_at || (advancedReady ? nowIso : null),
      };
    },
    enabled: !!targetId,
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  if (isLoading || !data) return null;

  const completed = STEPS.filter((s) => !!data[s.key]).length;
  const allDone = completed === STEPS.length;
  if (allDone) return null;
  const progress = Math.round((completed / STEPS.length) * 100);

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
          {progress}
        </span>
        <span className="text-lg text-muted-foreground/60 font-light">%</span>
        <span className="ml-auto text-[11px] text-muted-foreground tracking-tight">
          {completed} de {STEPS.length} etapas
        </span>
      </div>
      <div className="h-1 w-full bg-foreground/10 rounded-full overflow-hidden mb-5">
        <div className="h-full bg-foreground rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-2.5">
        {STEPS.map((step) => {
          const done = !!data[step.key];
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
    </div>
  );
}