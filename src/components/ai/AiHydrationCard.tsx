import { useCallback, useEffect, useState } from "react";
import { Droplets, Plus, Minus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAiApp } from "@/hooks/useAiApp";

const GLASS_ML = 250;
const todayStr = () => new Date().toISOString().slice(0, 10);

/** Hidratação do dia — compartilhada com o STH METHOD (food_diary_water / food_diary_goals). */
const AiHydrationCard = () => {
  const { profile, user } = useAiApp();
  const [goalMl, setGoalMl] = useState(0);
  const [ml, setMl] = useState(0);
  const [loading, setLoading] = useState(true);

  const weight = profile?.weight_kg ?? 0;

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const date = todayStr();
      const [{ data: goals }, { data: water }] = await Promise.all([
        supabase.from("food_diary_goals").select("water_ml").eq("user_id", user.id).maybeSingle(),
        supabase.from("food_diary_water").select("ml").eq("user_id", user.id).eq("log_date", date).maybeSingle(),
      ]);
      if (!active) return;
      const fallback = weight > 0 ? Math.round((weight * 35) / 50) * 50 : 2500;
      setGoalMl(goals?.water_ml && goals.water_ml > 0 ? goals.water_ml : fallback);
      setMl(water?.ml ?? 0);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, weight]);

  const update = useCallback(
    async (delta: number) => {
      if (!user) return;
      const next = Math.max(0, ml + delta);
      setMl(next);
      await supabase
        .from("food_diary_water")
        .upsert({ user_id: user.id, log_date: todayStr(), ml: next }, { onConflict: "user_id,log_date" });
    },
    [user, ml]
  );

  const pct = goalMl > 0 ? Math.min(100, Math.round((ml / goalMl) * 100)) : 0;

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <Droplets className="h-3.5 w-3.5 text-info" /> Hidratação de hoje
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="font-mono text-xs font-bold tabular-nums text-foreground">
            {(ml / 1000).toFixed(1)}
            <span className="text-muted-foreground"> / {(goalMl / 1000).toFixed(1)} L</span>
          </span>
        )}
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, hsl(210 100% 55%), hsl(195 90% 60%))" }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {Math.floor(ml / GLASS_ML)} copos de 250 ml · <span className="font-semibold text-info">{pct}%</span>
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" disabled={loading || ml === 0} onClick={() => update(-GLASS_ML)}>
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" disabled={loading} onClick={() => update(GLASS_ML)}>
            <Plus className="h-3.5 w-3.5" /> 250 ml
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AiHydrationCard;
