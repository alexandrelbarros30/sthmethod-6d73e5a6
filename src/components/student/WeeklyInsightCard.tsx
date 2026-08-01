import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, TrendingDown, TrendingUp, Minus, Dumbbell, Utensils, Smile, X, Sparkles } from "lucide-react";

/**
 * Weekly Insight — Monday recap of the previous 7 days.
 * Signals: workouts done, meals completed, check-ins registered, weight delta, mood avg.
 * Visible on Mondays (or if the user hasn't dismissed the current ISO week).
 */

const isoWeekKey = (d: Date) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const MOOD_EMOJI: Record<string, string> = {
  great: "😄", good: "🙂", okay: "😐", bad: "😕", awful: "😣",
};
const MOOD_SCORE: Record<string, number> = { great: 5, good: 4, okay: 3, bad: 2, awful: 1 };

const WeeklyInsightCard = () => {
  const { user } = useAuth();
  const weekKey = isoWeekKey(new Date());
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("weekly-insight-dismissed") === weekKey; } catch { return false; }
  });

  const now = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0);
  const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7);

  const { data, isLoading } = useQuery({
    queryKey: ["weekly-insight", user?.id, weekKey],
    enabled: !!user?.id,
    queryFn: async () => {
      const uid = user!.id;
      const startIso = start.toISOString();
      const prevIso = prevStart.toISOString();

      const [workouts, meals, checkins, weights] = await Promise.all([
        supabase.from("student_workout_sessions").select("id, finished_at")
          .eq("user_id", uid).gte("finished_at", startIso).not("finished_at", "is", null),
        supabase.from("meal_completions").select("id, completed_at")
          .eq("user_id", uid).gte("completed_at", startIso),
        supabase.from("daily_checkins").select("mood, energy, checkin_date")
          .eq("user_id", uid).gte("checkin_date", start.toISOString().slice(0, 10)),
        supabase.from("weight_logs").select("weight, created_at")
          .eq("user_id", uid).gte("created_at", prevIso).order("created_at", { ascending: true }),
      ]);

      const wLogs = weights.data || [];
      const inWeek = wLogs.filter((w: any) => new Date(w.created_at) >= start);
      const beforeWeek = wLogs.filter((w: any) => new Date(w.created_at) < start);
      const startWeight = beforeWeek.length ? Number(beforeWeek[beforeWeek.length - 1].weight)
        : inWeek.length ? Number(inWeek[0].weight) : null;
      const endWeight = inWeek.length ? Number(inWeek[inWeek.length - 1].weight) : null;
      const weightDelta = startWeight != null && endWeight != null ? +(endWeight - startWeight).toFixed(1) : null;

      const moods = (checkins.data || []).map((c: any) => MOOD_SCORE[c.mood]).filter(Boolean);
      const moodAvg = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
      const dominantMood = (() => {
        const counts: Record<string, number> = {};
        (checkins.data || []).forEach((c: any) => { if (c.mood) counts[c.mood] = (counts[c.mood] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      })();

      return {
        workouts: workouts.data?.length || 0,
        meals: meals.data?.length || 0,
        checkins: checkins.data?.length || 0,
        weightDelta,
        endWeight,
        moodAvg,
        dominantMood,
      };
    },
  });

  const isMonday = now.getDay() === 1;
  const hasAnySignal = useMemo(() => {
    if (!data) return false;
    return data.workouts > 0 || data.meals > 0 || data.checkins > 0 || data.weightDelta != null;
  }, [data]);

  if (dismissed || isLoading || !data || !hasAnySignal) return null;
  // Show every Monday, and continue visible for the rest of the week until dismissed.
  // If it's not the first week the user is active, we still show it — nothing gates beyond signals.

  const dismiss = () => {
    try { localStorage.setItem("weekly-insight-dismissed", weekKey); } catch {}
    setDismissed(true);
  };

  const wd = data.weightDelta;
  const WeightIcon = wd == null ? Minus : wd < 0 ? TrendingDown : wd > 0 ? TrendingUp : Minus;
  const weightColor = wd == null ? "text-muted-foreground" : wd < 0 ? "text-emerald-500" : wd > 0 ? "text-amber-500" : "text-muted-foreground";

  return (
    <div className="mb-6 rounded-3xl border border-border/40 bg-background overflow-hidden relative animate-fade-in">
      <button
        onClick={dismiss}
        aria-label="Fechar resumo semanal"
        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors z-10"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="p-6">
        <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> {isMonday ? "Resumo da semana" : "Últimos 7 dias"}
        </div>

        <p className="text-[20px] leading-tight font-semibold tracking-[-0.02em] text-foreground mb-1">
          {data.workouts > 0 && data.meals > 0
            ? "Semana consistente."
            : data.workouts > 0
            ? "Bom volume de treino."
            : data.meals > 0
            ? "Aderência na dieta."
            : "Semana registrada."}
        </p>
        <p className="text-[12.5px] text-muted-foreground font-light tracking-tight mb-5">
          Um resumo rápido do que você fez nos últimos sete dias.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/40 p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              <Dumbbell className="w-3 h-3" /> Treinos
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[26px] font-semibold tabular-nums tracking-[-0.03em] text-foreground">{data.workouts}</span>
              <span className="text-[11px] text-muted-foreground/70">sessões</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              <Utensils className="w-3 h-3" /> Refeições
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[26px] font-semibold tabular-nums tracking-[-0.03em] text-foreground">{data.meals}</span>
              <span className="text-[11px] text-muted-foreground/70">registradas</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              <CalendarDays className="w-3 h-3" /> Peso
            </div>
            <div className={`flex items-baseline gap-1 ${weightColor}`}>
              <WeightIcon className="w-4 h-4" />
              <span className="text-[22px] font-semibold tabular-nums tracking-[-0.03em]">
                {wd == null ? "—" : `${wd > 0 ? "+" : ""}${wd}`}
              </span>
              <span className="text-[11px] text-muted-foreground/70">{wd == null ? "sem registro" : "kg"}</span>
            </div>
            {data.endWeight != null && (
              <p className="text-[10.5px] text-muted-foreground mt-1">Atual: {data.endWeight} kg</p>
            )}
          </div>

          <div className="rounded-2xl border border-border/40 p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              <Smile className="w-3 h-3" /> Humor
            </div>
            {data.dominantMood ? (
              <div className="flex items-baseline gap-2">
                <span className="text-[26px] leading-none">{MOOD_EMOJI[data.dominantMood]}</span>
                <span className="text-[11px] text-muted-foreground/70">
                  {data.checkins} check-in{data.checkins === 1 ? "" : "s"}
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-[22px] font-semibold tracking-[-0.03em] text-muted-foreground">—</span>
                <span className="text-[11px] text-muted-foreground/70">sem check-in</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyInsightCard;