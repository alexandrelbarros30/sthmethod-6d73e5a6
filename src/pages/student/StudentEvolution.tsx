import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { TrendingUp, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import EvolutionImageHistory from "@/components/student/EvolutionImageHistory";
import EvolutionUpdateCard from "@/components/student/EvolutionUpdateCard";
import { useEvolutionStatus } from "@/hooks/useEvolutionStatus";

const StudentEvolution = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? "";

  const { data: status } = useEvolutionStatus();

  const { data: fullProfile } = useQuery({
    queryKey: ["student-profile-evo", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      return data;
    },
    enabled: Boolean(userId),
  });

  const { data: currentImages, refetch: refetchImages } = useQuery({
    queryKey: ["body-images-current", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("body_images")
        .select("*")
        .eq("user_id", userId)
        .eq("is_current", true);
      return data || [];
    },
    enabled: Boolean(userId),
  });

  const { data: allImages } = useQuery({
    queryKey: ["body-images-all", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("body_images")
        .select("*")
        .eq("user_id", userId)
        .order("uploaded_at", { ascending: false });
      return data || [];
    },
    enabled: Boolean(userId),
  });

  const currentWeight = useMemo(() => {
    if (!fullProfile?.weight) return null;
    const parsed = Number(fullProfile.weight);
    return Number.isFinite(parsed) ? parsed : null;
  }, [fullProfile?.weight]);

  const handleComplete = () => {
    refetchImages();
    qc.invalidateQueries({ queryKey: ["student-profile-evo", userId] });
    qc.invalidateQueries({ queryKey: ["student-full-profile"] });
    qc.invalidateQueries({ queryKey: ["student-weight-logs"] });
    qc.invalidateQueries({ queryKey: ["body-images-all", userId] });
    qc.invalidateQueries({ queryKey: ["body-images"] });
    qc.invalidateQueries({ queryKey: ["evolution-status"] });
  };

  // ---------- HEADER STATUS ----------
  const statusBlock = (() => {
    if (!status) return null;
    const cfg = {
      never: { Icon: TrendingUp, label: "Sem registros", desc: "Faça sua primeira atualização" },
      ok: { Icon: CheckCircle2, label: "Em dia", desc: `Próxima em ${status.daysUntilNext} dias` },
      approaching: { Icon: Clock, label: `Faltam ${status.daysUntilNext}d`, desc: "Atualização chegando" },
      due: { Icon: CheckCircle2, label: "Disponível", desc: "Ciclo de 29 dias completo" },
      late: { Icon: AlertCircle, label: `${Math.abs(status.daysUntilNext)}d atrasado`, desc: "Atualize para reajustar macros" },
    }[status.status];
    const Icon = cfg.Icon;
    const lastTxt = status.lastUpdateAt
      ? new Date(status.lastUpdateAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
      : "Nunca";
    return (
      <div className="rounded-3xl border border-border/40 bg-background p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-foreground/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-foreground" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">{cfg.label}</p>
            <p className="text-[13px] font-medium text-foreground tracking-tight mt-0.5">{cfg.desc}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Última</p>
            <p className="text-[12px] font-medium text-foreground mt-0.5">{lastTxt}</p>
          </div>
        </div>
        {status.recentLogs.length > 0 && (
          <div className="flex gap-2 pt-3 border-t border-border/40">
            {status.recentLogs.slice(0, 3).map((l, i) => (
              <div key={i} className="flex-1 rounded-xl bg-foreground/[0.03] p-2.5 text-center">
                <p className="text-[14px] font-semibold tabular-nums text-foreground tracking-tight">{l.weight.toFixed(1)}<span className="text-[10px] text-muted-foreground font-light ml-0.5">kg</span></p>
                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                  {new Date(l.logged_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  })();

  return (
    <DashboardLayout role="student" title="Atualização" subtitle="Registre seu progresso para acompanhamento profissional.">
      {statusBlock}
      {userId && fullProfile ? (
        <EvolutionUpdateCard
          userId={userId}
          currentWeight={currentWeight}
          existingImages={currentImages || []}
          profile={fullProfile}
          onComplete={handleComplete}
        />
      ) : (
        <div className="rounded-3xl border border-border/40 bg-background p-6 mb-6">
          <p className="text-sm text-muted-foreground">Carregando missão de atualização...</p>
        </div>
      )}

      <EvolutionImageHistory allImages={allImages || []} />
    </DashboardLayout>
  );
};

export default StudentEvolution;
