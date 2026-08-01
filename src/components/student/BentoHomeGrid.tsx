import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dumbbell,
  Utensils,
  TrendingUp,
  Compass,
  Play,
  Droplets,
  Flame,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface MealTrackingSummary {
  completedCount: number;
  totalMeals: number;
  progressPercent: number;
  nextMeal: { name: string; time: string; id: string } | null;
  isMealCompleted: (id: string) => boolean;
  waterConsumedMl: number;
  hydrationGoalL: number;
}

interface TrendSummary {
  title: string;
  path: string;
}

interface Props {
  meals: MealTrackingSummary;
  latestTrend: TrendSummary;
  hasTraining: boolean;
}

const Ring = ({ pct, size = 72, stroke = 6, color = "hsl(166 76% 64%)" }: { pct: number; size?: number; stroke?: number; color?: string }) => {
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = c - (clamped / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} opacity={0.12} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

const BentoHomeGrid = ({ meals, latestTrend, hasTraining }: Props) => {
  const { user } = useAuth();
  const location = useLocation();
  const previewAs = new URLSearchParams(location.search).get("preview_as");

  const { data: nextWorkout } = useQuery({
    queryKey: ["bento-next-workout", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("student_workout_assignments")
        .select("id, template_id, workout_templates(id, title, subtitle, image_url, sort_order, released)")
        .eq("user_id", user!.id)
        .eq("active", true)
        .eq("visible", true)
        .or(`start_date.is.null,start_date.lte.${today}`)
        .or(`end_date.is.null,end_date.gte.${today}`);
      const list = (data || []).filter((a: any) => a.workout_templates?.released !== false);
      list.sort((a: any, b: any) => (a.workout_templates?.sort_order || 0) - (b.workout_templates?.sort_order || 0));
      if (!list.length) return null;

      const { data: lastSession } = await supabase
        .from("student_workout_sessions")
        .select("template_id, finished_at")
        .eq("user_id", user!.id)
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastTemplateId = lastSession?.template_id;
      const lastIdx = lastTemplateId ? list.findIndex((a: any) => a.template_id === lastTemplateId) : -1;
      const nextIdx = lastIdx >= 0 ? (lastIdx + 1) % list.length : 0;
      return list[nextIdx]?.workout_templates || null;
    },
  });

  const { data: streakData } = useQuery({
    queryKey: ["bento-meal-streak", user?.id],
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
      if (!days.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1);
      let streak = 0;
      while (days.has(iso(cursor)) && streak < 365) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
      return { streak };
    },
  });

  const trainingHref = previewAs ? `/dashboard/training?preview_as=${previewAs}` : "/dashboard/training";
  const waterPct = meals.hydrationGoalL > 0 ? Math.min(100, Math.round((meals.waterConsumedMl / (meals.hydrationGoalL * 1000)) * 100)) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:h-[420px]">
      {/* 1) Treino — grande */}
      <Link
        to={trainingHref}
        className="col-span-2 row-span-2 group relative overflow-hidden rounded-3xl bg-card border border-border/40 p-5 md:p-7 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-12px_hsl(var(--primary)/0.25)]"
      >
        <div className="absolute top-0 right-0 p-4 md:p-6 opacity-[0.08] group-hover:opacity-[0.18] transition-opacity">
          <Dumbbell className="w-24 h-24 md:w-36 md:h-36 text-primary" strokeWidth={1.2} />
        </div>
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            <Dumbbell className="w-3 h-3" strokeWidth={2.5} /> Treino
          </span>
          <h2 className="mt-4 text-xl md:text-2xl font-semibold text-card-foreground leading-tight font-space">
            {nextWorkout?.title || (hasTraining ? "Próximo Treino" : "Nenhum treino ativo")}
          </h2>
          {nextWorkout?.subtitle ? (
            <p className="text-xs md:text-sm text-muted-foreground mt-2 line-clamp-1">{nextWorkout.subtitle}</p>
          ) : (
            <p className="text-xs md:text-sm text-muted-foreground mt-2">
              {hasTraining ? "Sua sessão está pronta." : "Aguarde a liberação da equipe."}
            </p>
          )}
        </div>
        <div className="relative z-10 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">
              {hasTraining ? "Liberado" : "Pendente"}
            </span>
            {nextWorkout && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Sessão programada
              </span>
            )}
          </div>
          {hasTraining && nextWorkout && (
            <button className="w-full py-3.5 md:py-4 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-[hsl(166,76%,64%)] transition-colors text-sm tracking-wide flex items-center justify-center gap-2">
              <Play className="w-4 h-4 fill-current" /> Iniciar Sessão
            </button>
          )}
        </div>
      </Link>

      {/* 2) Dieta — médio */}
      <Link
        to="/dashboard/diet"
        className="col-span-2 group relative overflow-hidden rounded-3xl bg-card border border-border/40 p-5 flex items-center justify-between transition-all duration-300 hover:border-[hsl(166,76%,64%)]/50"
      >
        <div className="flex flex-col min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-[hsl(166,76%,64%)] bg-[hsl(166,76%,64%)]/10 px-2.5 py-1 rounded-full w-fit mb-3">
            <Utensils className="w-3 h-3" strokeWidth={2.5} /> Dieta
          </span>
          <h2 className="text-lg md:text-xl font-semibold text-card-foreground font-space">Plano Alimentar</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {meals.completedCount}/{meals.totalMeals} refeições • {meals.progressPercent}%
          </p>
          {meals.nextMeal && !meals.isMealCompleted(meals.nextMeal.id) && (
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Próxima: {meals.nextMeal.name} · {meals.nextMeal.time}
            </p>
          )}
        </div>
        <div className="shrink-0 ml-3">
          <Ring pct={meals.progressPercent} />
        </div>
      </Link>

      {/* 3) Evolução — pequeno */}
      <Link
        to="/dashboard/evolution"
        className="col-span-1 group relative overflow-hidden rounded-3xl bg-card border border-border/40 p-5 flex flex-col justify-between transition-all duration-300 hover:border-primary/40 min-h-[140px]"
      >
        <div className="flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
          </span>
          <span className="text-[10px] font-bold text-[hsl(166,76%,64%)]">+2.4%</span>
        </div>
        <div>
          <h2 className="text-base md:text-lg font-semibold text-card-foreground font-space">Evolução</h2>
          <div className="flex items-end gap-1 h-8 mt-2">
            <div className="w-full bg-muted h-[35%] rounded-sm" />
            <div className="w-full bg-muted h-[55%] rounded-sm" />
            <div className="w-full bg-muted h-[45%] rounded-sm" />
            <div className="w-full bg-primary h-[85%] rounded-sm shadow-[0_0_8px_hsl(var(--primary)/0.35)]" />
          </div>
        </div>
      </Link>

      {/* 4) Descobrir — pequeno */}
      <Link
        to={latestTrend.path}
        className="col-span-1 group relative overflow-hidden rounded-3xl bg-card border border-border/40 p-5 flex flex-col justify-between transition-all duration-300 hover:border-primary/40 min-h-[140px]"
      >
        <div className="flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-[hsl(166,76%,64%)] bg-[hsl(166,76%,64%)]/10 px-2 py-0.5 rounded-full">
            <Compass className="w-3 h-3" strokeWidth={2.5} />
          </span>
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Compass className="w-3 h-3 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-base md:text-lg font-semibold text-card-foreground font-space line-clamp-1">Descobrir</h2>
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{latestTrend.title}</p>
        </div>
      </Link>

      {/* Quick stats — linha inferior visível apenas no mobile (desktop fica abaixo do grid) */}
      <div className="col-span-2 md:hidden grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card/60 border border-border/40 p-3">
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
            <Droplets className="w-3 h-3" /> Hidratação
          </p>
          <p className="text-sm font-semibold text-card-foreground">
            {(meals.waterConsumedMl / 1000).toFixed(meals.waterConsumedMl >= 1000 ? 1 : 2)}L
            <span className="text-[10px] text-muted-foreground font-normal"> / {meals.hydrationGoalL}L</span>
          </p>
        </div>
        <div className="rounded-2xl bg-card/60 border border-border/40 p-3">
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" /> Streak
          </p>
          <p className="text-sm font-semibold text-card-foreground">
            {streakData?.streak ?? 0} <span className="text-[10px] text-muted-foreground font-normal">dias</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BentoHomeGrid;
