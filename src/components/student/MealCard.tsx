import { cn } from "@/lib/utils";
import { Check, Clock, SkipForward, Utensils } from "lucide-react";
import type { MealWithFoods } from "@/hooks/useMealTracking";

interface MealCardProps {
  meal: MealWithFoods;
  isCompleted: boolean;
  isSkipped: boolean;
  isActive: boolean;
  isNext: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onExpand: () => void;
}

const MealCard = ({ meal, isCompleted, isSkipped, isActive, isNext, onToggle, onSkip, onExpand }: MealCardProps) => {
  const mealMacros = meal.diet_foods.reduce(
    (acc, f) => ({
      kcal: acc.kcal + (f.energy_kcal || 0),
      protein: acc.protein + (f.protein_g || 0),
      carbs: acc.carbs + (f.carbs_g || 0),
      fat: acc.fat + (f.fat_g || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const totalMacroG = mealMacros.protein + mealMacros.carbs + mealMacros.fat;
  const proteinPct = totalMacroG > 0 ? (mealMacros.protein / totalMacroG) * 100 : 33;
  const carbsPct = totalMacroG > 0 ? (mealMacros.carbs / totalMacroG) * 100 : 33;
  const fatPct = totalMacroG > 0 ? (mealMacros.fat / totalMacroG) * 100 : 33;

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-all duration-200 cursor-pointer",
        isCompleted && "border-primary/30 bg-primary/5 opacity-80",
        isSkipped && "border-warning/30 bg-warning/5 opacity-60",
        isActive && !isCompleted && !isSkipped && "border-primary bg-primary/10 ring-1 ring-primary/30",
        isNext && !isActive && !isCompleted && !isSkipped && "border-accent bg-accent/30",
        !isCompleted && !isSkipped && !isActive && !isNext && "border-border bg-card"
      )}
      onClick={onExpand}
    >
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors",
          isCompleted ? "bg-primary text-primary-foreground" :
          isSkipped ? "bg-warning text-warning-foreground" :
          isActive ? "bg-primary/20 text-primary" :
          "bg-muted text-muted-foreground"
        )}>
          {isCompleted ? <Check className="w-4 h-4" /> :
           isSkipped ? <SkipForward className="w-4 h-4" /> :
           <Utensils className="w-4 h-4" />}
        </div>

        {/* Meal info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-semibold text-sm font-display uppercase",
              isCompleted ? "text-primary line-through" : "text-foreground"
            )}>
              {meal.name}
            </span>
            {isActive && !isCompleted && !isSkipped && (
              <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> AGORA
              </span>
            )}
            {isNext && !isActive && !isCompleted && !isSkipped && (
              <span className="text-[10px] text-accent-foreground font-medium">PRÓXIMA</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{meal.time}</span>
            <span className="ml-1 text-foreground font-medium">{Math.round(mealMacros.kcal)} kcal</span>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {!isSkipped && (
            <button
              onClick={onToggle}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                isCompleted
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border hover:border-primary hover:bg-primary/10 text-muted-foreground hover:text-primary"
              )}
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {!isCompleted && (
            <button
              onClick={onSkip}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                isSkipped
                  ? "bg-warning border-warning text-warning-foreground"
                  : "border-border hover:border-warning hover:bg-warning/10 text-muted-foreground hover:text-warning"
              )}
              title="Pular refeição"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Macro mini bars */}
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="font-medium text-blue-400">{Math.round(mealMacros.protein)}g P</span>
        <span className="font-medium text-amber-400">{Math.round(mealMacros.carbs)}g C</span>
        <span className="font-medium text-orange-400">{Math.round(mealMacros.fat)}g G</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted flex">
          <div className="h-full bg-blue-500" style={{ width: `${proteinPct}%` }} />
          <div className="h-full bg-amber-500" style={{ width: `${carbsPct}%` }} />
          <div className="h-full bg-orange-500" style={{ width: `${fatPct}%` }} />
        </div>
      </div>
    </div>
  );
};

export default MealCard;
