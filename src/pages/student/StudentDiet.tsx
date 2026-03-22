import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useMealTracking } from "@/hooks/useMealTracking";
import DailyProgressRing from "@/components/student/DailyProgressRing";
import MacroProgressBar from "@/components/student/MacroProgressBar";
import MealCard from "@/components/student/MealCard";
import { Badge } from "@/components/ui/badge";
import { Clock, Utensils, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Expanded meal detail view
const MealDetail = ({ meal, onClose }: { meal: any; onClose: () => void }) => {
  const mealMacros = meal.diet_foods.reduce(
    (acc: any, f: any) => ({
      kcal: acc.kcal + (f.energy_kcal || 0),
      protein: acc.protein + (f.protein_g || 0),
      carbs: acc.carbs + (f.carbs_g || 0),
      fat: acc.fat + (f.fat_g || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <Card className="premium-card border-primary/15 animate-scale-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold tracking-tight">{meal.name}</CardTitle>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-xs">✕</button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{meal.time}</span>
          <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">{Math.round(mealMacros.kcal)} kcal</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Macro summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs p-3 rounded-xl bg-muted/30 border border-border/30">
          <div>
            <span className="block font-bold text-info text-base tabular-nums">{Math.round(mealMacros.protein)}g</span>
            <span className="text-muted-foreground text-[10px]">Proteína</span>
          </div>
          <div>
            <span className="block font-bold text-warning text-base tabular-nums">{Math.round(mealMacros.carbs)}g</span>
            <span className="text-muted-foreground text-[10px]">Carbo</span>
          </div>
          <div>
            <span className="block font-bold text-base tabular-nums" style={{ color: "hsl(25, 85%, 55%)" }}>{Math.round(mealMacros.fat)}g</span>
            <span className="text-muted-foreground text-[10px]">Gordura</span>
          </div>
        </div>

        {/* Food items */}
        <div className="space-y-1">
          {meal.diet_foods.map((food: any, i: number) => (
            <div
              key={food.id}
              className={cn(
                "flex items-center justify-between py-2 px-3 rounded-xl text-sm transition-colors",
                i % 2 === 0 ? "bg-muted/20" : ""
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="truncate text-foreground font-medium">{food.item}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 ml-2 tabular-nums">{food.quantity}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const StudentDiet = () => {
  const { user } = useAuth();
  const { isActive, isLoading: subLoading } = useSubscriptionGuard();
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const {
    meals,
    completions,
    totalMacros,
    consumedMacros,
    completedCount,
    totalMeals,
    progressPercent,
    nextMeal,
    activeMeal,
    toggleMeal,
    isLoading,
    isMealCompleted,
    isMealSkipped,
  } = useMealTracking();

  if (subLoading || isLoading) {
    return (
      <DashboardLayout role="student" title="Dieta" subtitle="Seu plano alimentar personalizado.">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isActive) {
    return (
      <DashboardLayout role="student" title="Dieta" subtitle="Seu plano alimentar personalizado.">
        <SubscriptionBlock />
      </DashboardLayout>
    );
  }

  if (meals.length === 0) {
    return (
      <DashboardLayout role="student" title="Dieta" subtitle="Seu plano alimentar personalizado.">
        <Card className="premium-card">
          <CardContent className="py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Nenhuma refeição configurada ainda.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Aguarde seu consultor configurar seu plano.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const handleToggle = (mealId: string) => {
    const wasCompleted = isMealCompleted(mealId);
    toggleMeal.mutate({ mealId, skipped: false });
    if (!wasCompleted) {
      toast.success("Refeição concluída! ✅");
    }
  };

  const handleSkip = (mealId: string) => {
    const wasSkipped = isMealSkipped(mealId);
    toggleMeal.mutate({ mealId, skipped: true });
    if (!wasSkipped) {
      toast("Refeição pulada", { description: "Macros redistribuídos automaticamente" });
    }
  };

  const skippedMacros = meals.reduce(
    (acc, meal) => {
      if (isMealSkipped(meal.id)) {
        meal.diet_foods.forEach((f) => {
          acc.kcal += f.energy_kcal || 0;
          acc.protein += f.protein_g || 0;
          acc.carbs += f.carbs_g || 0;
          acc.fat += f.fat_g || 0;
        });
      }
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const remainingMeals = meals.filter((m) => !isMealCompleted(m.id) && !isMealSkipped(m.id)).length;
  const redistributedPerMeal = remainingMeals > 0
    ? {
        kcal: skippedMacros.kcal / remainingMeals,
        protein: skippedMacros.protein / remainingMeals,
        carbs: skippedMacros.carbs / remainingMeals,
        fat: skippedMacros.fat / remainingMeals,
      }
    : { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  const expandedMeal = expandedMealId ? meals.find((m) => m.id === expandedMealId) : null;

  return (
    <DashboardLayout role="student" title="Dieta" subtitle="Acompanhe suas refeições do dia.">
      <div className="space-y-5 max-w-lg mx-auto">
        {/* Daily Progress Header */}
        <Card className="premium-card border-primary/10 animate-fade-in overflow-hidden">
          <CardContent className="py-6 relative">
            {/* Subtle gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-5">
              <DailyProgressRing
                percent={progressPercent}
                size={120}
                strokeWidth={8}
                sublabel={nextMeal?.name || "Concluído"}
              />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-lg font-bold text-foreground tracking-tight tabular-nums">
                    {completedCount}<span className="text-muted-foreground font-normal text-sm">/{totalMeals}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {progressPercent === 100 ? "Dia completo! 🎉" : `${totalMeals - completedCount} refeições restantes`}
                  </p>
                </div>

                {nextMeal && !isMealCompleted(nextMeal.id) && (
                  <div className="p-2.5 rounded-xl bg-primary/8 border border-primary/15">
                    <p className="text-[9px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Próxima Refeição
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {nextMeal.name} <span className="text-muted-foreground text-xs font-normal">{nextMeal.time}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Macro Progress */}
        <Card className="premium-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-tight">
              <Flame className="w-4 h-4 text-primary" /> Macros do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MacroProgressBar
              label="Calorias"
              consumed={consumedMacros.kcal}
              total={totalMacros.kcal}
              unit="kcal"
              color="bg-primary"
            />
            <MacroProgressBar
              label="Proteína"
              consumed={consumedMacros.protein}
              total={totalMacros.protein}
              color="bg-info"
            />
            <MacroProgressBar
              label="Carboidrato"
              consumed={consumedMacros.carbs}
              total={totalMacros.carbs}
              color="bg-warning"
            />
            <MacroProgressBar
              label="Gordura"
              consumed={consumedMacros.fat}
              total={totalMacros.fat}
              color="bg-[hsl(25,85%,55%)]"
            />

            {skippedMacros.kcal > 0 && remainingMeals > 0 && (
              <p className="text-[10px] text-warning mt-1 flex items-center gap-1">
                ⚠️ +{Math.round(redistributedPerMeal.kcal)} kcal redistribuídos por refeição
              </p>
            )}
          </CardContent>
        </Card>

        {/* Meal List */}
        <div className="space-y-3" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
            <Utensils className="w-4 h-4" /> Refeições
            <span className="text-primary tabular-nums">{completedCount}/{totalMeals}</span>
          </h3>

          {meals.map((meal, idx) => (
            <div key={meal.id} className="animate-slide-up" style={{ animationDelay: `${0.05 * idx}s` }}>
              <MealCard
                meal={meal}
                isCompleted={isMealCompleted(meal.id)}
                isSkipped={isMealSkipped(meal.id)}
                isActive={activeMeal?.id === meal.id}
                isNext={nextMeal?.id === meal.id && activeMeal?.id !== meal.id}
                onToggle={() => handleToggle(meal.id)}
                onSkip={() => handleSkip(meal.id)}
                onExpand={() => setExpandedMealId(expandedMealId === meal.id ? null : meal.id)}
              />
              {expandedMealId === meal.id && expandedMeal && (
                <div className="mt-2 ml-3">
                  <MealDetail meal={expandedMeal} onClose={() => setExpandedMealId(null)} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDiet;
