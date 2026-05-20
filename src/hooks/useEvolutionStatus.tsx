import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CYCLE_DAYS = 29;

export type EvolutionStatus = "ok" | "approaching" | "due" | "late" | "never";

export interface EvolutionStatusData {
  lastUpdateAt: Date | null;
  daysSince: number | null;
  daysUntilNext: number; // negativo = atrasado
  status: EvolutionStatus;
  recentLogs: { weight: number; logged_at: string }[];
}

/**
 * Calcula o status do ciclo de atualização de evolução (29 dias)
 * com base no último weight_log do aluno.
 */
export const useEvolutionStatus = () => {
  const { user } = useAuth();

  return useQuery<EvolutionStatusData>({
    queryKey: ["evolution-status", user?.id],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from("weight_logs")
        .select("weight, logged_at")
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: false })
        .limit(3);

      const recentLogs = (logs || []).map((l: any) => ({
        weight: Number(l.weight),
        logged_at: l.logged_at,
      }));

      if (recentLogs.length === 0) {
        return {
          lastUpdateAt: null,
          daysSince: null,
          daysUntilNext: 0,
          status: "never" as EvolutionStatus,
          recentLogs: [],
        };
      }

      const lastUpdateAt = new Date(recentLogs[0].logged_at);
      const now = new Date();
      const daysSince = Math.floor((now.getTime() - lastUpdateAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilNext = CYCLE_DAYS - daysSince;

      let status: EvolutionStatus = "ok";
      if (daysUntilNext <= -3) status = "late";
      else if (daysUntilNext <= 0) status = "due";
      else if (daysUntilNext <= 5) status = "approaching";

      return { lastUpdateAt, daysSince, daysUntilNext, status, recentLogs };
    },
    enabled: !!user?.id,
  });
};