import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Flame } from "lucide-react";

// Calcula streak de dias consecutivos com pelo menos 1 refeição concluída,
// terminando em hoje ou ontem (se hoje ainda não teve check-in, o streak não quebra até virar o dia).
const StreakCard = () => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["meal-streak", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 60);
      const { data } = await supabase
        .from("meal_completions")
        .select("completed_date")
        .eq("user_id", user!.id)
        .gte("completed_date", since.toISOString().slice(0, 10))
        .order("completed_date", { ascending: false });
      const days = new Set((data || []).map((r: any) => r.completed_date));
      const today = new Date();
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      let cursor = new Date(today);
      // Se hoje não tem, começa contando a partir de ontem (não quebra streak durante o dia).
      if (!days.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1);
      let streak = 0;
      while (days.has(iso(cursor)) && streak < 365) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
      // Recorde nos últimos 60 dias
      const sorted = Array.from(days).sort();
      let best = 0;
      let run = 0;
      let prev: Date | null = null;
      for (const d of sorted) {
        const dt = new Date(d + "T12:00:00");
        if (prev && (dt.getTime() - prev.getTime()) === 86400000) run++;
        else run = 1;
        if (run > best) best = run;
        prev = dt;
      }
      return { streak, best };
    },
  });

  const streak = data?.streak ?? 0;
  const best = Math.max(streak, data?.best ?? 0);

  return (
    <div className="mb-6 rounded-3xl border border-border/40 bg-background overflow-hidden">
      <div className="p-6 flex items-center gap-5">
        <div className="relative w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/30">
          <Flame className="w-6 h-6 text-orange-500" strokeWidth={2} fill={streak > 0 ? "currentColor" : "none"} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">Sequência</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-[32px] leading-none font-semibold text-foreground tabular-nums tracking-[-0.03em]">{streak}</span>
            <span className="text-[13px] text-muted-foreground font-light">{streak === 1 ? "dia" : "dias"} seguidos</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-light mt-1.5 tracking-tight">
            {streak === 0 ? "Marque uma refeição hoje e comece sua sequência." : `Recorde: ${best} ${best === 1 ? "dia" : "dias"}. Mantenha o ritmo.`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StreakCard;