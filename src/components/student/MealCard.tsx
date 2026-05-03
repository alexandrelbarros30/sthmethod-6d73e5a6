import { cn } from "@/lib/utils";
import { Check, Clock, SkipForward, Utensils, ChevronDown, ChevronRight } from "lucide-react";
import type { MealWithFoods } from "@/hooks/useMealTracking";

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
        "rounded-2xl border p-4 transition-all duration-300 cursor-pointer hover-lift",
        isCompleted && "border-foreground/15 bg-foreground/5 opacity-85",
        isSkipped && "border-warning/20 bg-warning/5 opacity-60",
        isActive && !isCompleted && !isSkipped && "premium-card-active scale-[1.01]",
        isNext && !isActive && !isCompleted && !isSkipped && "border-foreground/15 bg-foreground/5",
        !isCompleted && !isSkipped && !isActive && !isNext && "border-border/50 bg-card"
      )}
      onClick={onExpand}
    >
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
          isCompleted ? "bg-foreground text-background" :
          isSkipped ? "bg-warning/20 text-warning" :
          isActive ? "bg-foreground/10 text-foreground glow-sm" :
          "bg-muted/60 text-muted-foreground"
        )}>
          {isCompleted ? <Check className="w-4.5 h-4.5" /> :
           isSkipped ? <SkipForward className="w-4 h-4" /> :
           <Utensils className="w-4 h-4" />}
        </div>

        {/* Meal info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-semibold text-sm tracking-tight",
              isCompleted ? "text-foreground line-through decoration-primary/40" : "text-foreground"
            )}>
              {mealLabel || meal.name}
            </span>
            {isActive && !isCompleted && !isSkipped && (
              <span className="text-[9px] text-foreground font-bold flex items-center gap-1 bg-foreground/10 px-1.5 py-0.5 rounded-full border border-foreground/15">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" /> AGORA
              </span>
            )}
            {isNext && !isActive && !isCompleted && !isSkipped && (
              <span className="text-[9px] text-foreground/70 font-semibold bg-foreground/5 px-1.5 py-0.5 rounded-full">PRÓXIMA</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Clock className="w-3 h-3" />
            <span>{meal.time}</span>
            <span className="text-foreground font-bold tabular-nums">{Math.round(mealMacros.kcal)}</span>
            <span className="text-muted-foreground text-[10px]">kcal</span>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {!isSkipped && (
            <button
              onClick={onToggle}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200",
                isCompleted
                  ? "bg-foreground border-foreground text-background shadow-[0_0_12px_-3px_hsl(var(--primary)/0.4)]"
                  : "border-border/60 hover:border-foreground hover:bg-foreground/10 text-muted-foreground hover:text-foreground"
              )}
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {!isCompleted && (
            <button
              onClick={onSkip}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200",
                isSkipped
                  ? "bg-warning/20 border-warning/40 text-warning"
                  : "border-border/60 hover:border-warning hover:bg-warning/10 text-muted-foreground hover:text-warning"
              )}
              title="Pular refeição"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronIcon className="w-4 h-4 text-muted-foreground/40 ml-0.5 transition-transform duration-200" />
        </div>
      </div>

      {/* Macro mini bars */}
      <div className="mt-3 flex items-center gap-2.5 text-[10px] text-muted-foreground">
        <span className="font-semibold text-info">{Math.round(mealMacros.protein)}g P</span>
        <span className="font-semibold text-warning">{Math.round(mealMacros.carbs)}g C</span>
        <span className="font-semibold" style={{ color: "hsl(25, 85%, 55%)" }}>{Math.round(mealMacros.fat)}g G</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted/40 flex">
          <div className="h-full bg-info transition-all duration-500" style={{ width: `${proteinPct}%` }} />
          <div className="h-full bg-warning transition-all duration-500" style={{ width: `${carbsPct}%` }} />
          <div className="h-full transition-all duration-500" style={{ width: `${fatPct}%`, background: "hsl(25, 85%, 55%)" }} />
        </div>
      </div>
    </div>
  );
};

export default MealCard;
