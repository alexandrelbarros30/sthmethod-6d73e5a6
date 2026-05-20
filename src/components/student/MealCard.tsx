import { cn } from "@/lib/utils";
import { Check, Clock, SkipForward, Utensils, ChevronDown, ChevronRight } from "lucide-react";
import type { MealWithFoods } from "@/hooks/useMealTracking";

const STH_GREEN = "#14b780";

interface MealCardProps {
  meal: MealWithFoods;
  mealLabel?: string;
  isCompleted: boolean;
  isSkipped: boolean;
  isActive: boolean;
  isNext: boolean;
  isExpanded?: boolean;
  distributedMacros?: { kcal: number; protein: number; carbs: number; fat: number } | null;
  onToggle: () => void;
  onSkip: () => void;
  onExpand: () => void;
}

const MealCard = ({ meal, mealLabel, isCompleted, isSkipped, isActive, isNext, isExpanded, distributedMacros, onToggle, onSkip, onExpand }: MealCardProps) => {
  const foodMacros = meal.diet_foods.reduce(
    (acc, f) => ({
      kcal: acc.kcal + (f.energy_kcal || 0),
      protein: acc.protein + (f.protein_g || 0),
      carbs: acc.carbs + (f.carbs_g || 0),
      fat: acc.fat + (f.fat_g || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Use distributed admin macros if available, otherwise use food-level macros
  const mealMacros = distributedMacros && (distributedMacros.kcal > 0 || distributedMacros.protein > 0)
    ? distributedMacros : foodMacros;

  const totalMacroG = mealMacros.protein + mealMacros.carbs + mealMacros.fat;
  const proteinPct = totalMacroG > 0 ? (mealMacros.protein / totalMacroG) * 100 : 33;
  const carbsPct = totalMacroG > 0 ? (mealMacros.carbs / totalMacroG) * 100 : 33;
  const fatPct = totalMacroG > 0 ? (mealMacros.fat / totalMacroG) * 100 : 33;

  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border backdrop-blur-xl p-4 transition-all duration-300 cursor-pointer",
        "bg-white/[0.03] border-white/10 hover:border-white/20",
        isCompleted && "border-[color:var(--sth-green)]/60 bg-[color:var(--sth-green)]/[0.06] opacity-95",
        isSkipped && "border-warning/20 bg-warning/5 opacity-60",
        isActive && !isCompleted && !isSkipped && "border-[color:var(--sth-green)]/40 scale-[1.01]",
        !isCompleted && !isSkipped && !isActive && !isNext && "",
        !isCompleted && !isSkipped && "active:scale-[0.99]"
      )}
      style={{ ["--sth-green" as any]: STH_GREEN }}
      onClick={onExpand}
    >
      {isCompleted && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: `inset 0 0 0 1px ${STH_GREEN}55, 0 0 28px -6px ${STH_GREEN}66` }}
        />
      )}
      {isActive && !isCompleted && !isSkipped && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: `inset 0 0 0 1px ${STH_GREEN}33` }}
        />
      )}
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 relative",
          isCompleted ? "text-black" :
          isSkipped ? "bg-warning/20 text-warning" :
          isActive ? "bg-foreground/10 text-foreground" :
          "bg-muted/60 text-muted-foreground"
        )}>
          {isCompleted && (
            <div
              className="absolute inset-0 rounded-xl"
              style={{ background: STH_GREEN, boxShadow: `0 0 14px -2px ${STH_GREEN}99` }}
            />
          )}
          <span className="relative">
          {isCompleted ? <Check className="w-4.5 h-4.5" /> :
           isSkipped ? <SkipForward className="w-4 h-4" /> :
           <Utensils className="w-4 h-4" />}
          </span>
        </div>

        {/* Meal info */}
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-display font-bold text-sm uppercase tracking-tight",
              isCompleted ? "text-foreground" : "text-foreground"
            )}>
              {mealLabel || meal.name}
            </span>
            {isActive && !isCompleted && !isSkipped && (
              <span
                className="text-[9px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded-full border tracking-[0.2em]"
                style={{ borderColor: `${STH_GREEN}55`, color: STH_GREEN, background: `${STH_GREEN}14` }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: STH_GREEN }} /> AGORA
              </span>
            )}
            {isNext && !isActive && !isCompleted && !isSkipped && (
              <span className="text-[9px] text-muted-foreground font-semibold tracking-[0.2em] uppercase">próxima</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 font-mono tracking-tight">
            <Clock className="w-3 h-3" />
            <span>{meal.time}</span>
            <span className="font-bold tabular-nums" style={{ color: STH_GREEN }}>{Math.round(mealMacros.kcal)}</span>
            <span className="text-muted-foreground text-[10px]">kcal</span>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1.5 relative" onClick={(e) => e.stopPropagation()}>
          {!isSkipped && (
            <button
              onClick={onToggle}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200",
                isCompleted
                  ? "border-transparent text-black"
                  : "border-white/15 hover:border-white/30 text-foreground/40 hover:text-foreground"
              )}
              style={isCompleted ? { background: STH_GREEN, boxShadow: `0 0 14px -2px ${STH_GREEN}99` } : {}}
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {!isCompleted && (
            <button
              onClick={onSkip}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200",
                isSkipped
                  ? "bg-warning/20 border-warning/40 text-warning"
                  : "border-white/10 hover:border-warning hover:bg-warning/10 text-muted-foreground hover:text-warning"
              )}
              title="Pular refeição"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronIcon className="w-4 h-4 text-muted-foreground/40 ml-0.5 transition-transform duration-200" />
        </div>
      </div>

      {/* Macro chips + gradient bar */}
      <div className="mt-3 space-y-2 relative">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-lg px-2 py-1 text-center border border-info/20 bg-info/10">
            <p className="text-[8px] uppercase tracking-[0.18em] text-info/80 font-bold">Prot</p>
            <p className="text-[11px] font-extrabold tabular-nums text-info leading-tight">{Math.round(mealMacros.protein)}<span className="text-[8px] font-semibold opacity-70">g</span></p>
          </div>
          <div className="rounded-lg px-2 py-1 text-center border border-warning/20 bg-warning/10">
            <p className="text-[8px] uppercase tracking-[0.18em] text-warning/80 font-bold">Carb</p>
            <p className="text-[11px] font-extrabold tabular-nums text-warning leading-tight">{Math.round(mealMacros.carbs)}<span className="text-[8px] font-semibold opacity-70">g</span></p>
          </div>
          <div className="rounded-lg px-2 py-1 text-center border" style={{ background: "hsl(25 85% 55% / 0.1)", borderColor: "hsl(25 85% 55% / 0.22)" }}>
            <p className="text-[8px] uppercase tracking-[0.18em] font-bold" style={{ color: "hsl(25 85% 65%)" }}>Gord</p>
            <p className="text-[11px] font-extrabold tabular-nums leading-tight" style={{ color: "hsl(25 85% 60%)" }}>{Math.round(mealMacros.fat)}<span className="text-[8px] font-semibold opacity-70">g</span></p>
          </div>
        </div>
        <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/30 ring-1 ring-white/5">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${proteinPct}%`,
              background: "linear-gradient(90deg, hsl(var(--info)), hsl(var(--info) / 0.65))",
              boxShadow: "0 0 6px hsl(var(--info) / 0.55)",
            }}
          />
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${carbsPct}%`,
              background: "linear-gradient(90deg, hsl(var(--warning)), hsl(var(--warning) / 0.65))",
              boxShadow: "0 0 6px hsl(var(--warning) / 0.55)",
            }}
          />
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${fatPct}%`,
              background: "linear-gradient(90deg, hsl(25 85% 55%), hsl(25 85% 45%))",
              boxShadow: "0 0 6px hsl(25 85% 55% / 0.55)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MealCard;
