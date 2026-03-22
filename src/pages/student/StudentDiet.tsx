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
import { Clock, Utensils, ChevronRight, Flame } from "lucide-react";
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
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-display uppercase">{meal.name}</CardTitle>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{meal.time}</span>
          <Badge variant="outline" className="text-[10px]">{Math.round(mealMacros.kcal)} kcal</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Macro summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs p-2 rounded-lg bg-muted/50">
          <div>
            <span className="block font-bold text-blue-400 text-sm">{Math.round(mealMacros.protein)}g</span>
            <span className="text-muted-foreground">Proteína</span>
          </div>
          <div>
            <span className="block font-bold text-amber-400 text-sm">{Math.round(mealMacros.carbs)}g</span>
            <span className="text-muted-foreground">Carbo</span>
          </div>
          <div>
            <span className="block font-bold text-orange-400 text-sm">{Math.round(mealMacros.fat)}g</span>
            <span className="text-muted-foreground">Gordura</span>
          </div>
        </div>

        {/* Food items */}
        <div className="space-y-1.5">
          {meal.diet_foods.map((food: any, i: number) => (
            <div
              key={food.id}
              className={cn(
                "flex items-center justify-between py-1.5 px-2 rounded text-sm",
                i % 2 === 0 ? "bg-muted/30" : ""
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-primary text-xs">•</span>
                <span className="truncate text-foreground">{food.item}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">{food.quantity}</span>
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
        <p className="text-muted-foreground font-body text-sm">Carregando...</p>
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
        <Card>
          <CardContent className="py-8 text-center">
            <Utensils className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-body">Nenhuma refeição configurada ainda. Aguarde seu consultor.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Aluno";

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
      toast("Refeição pulada", { description: "Os macros serão redistribuídos" });
    }
  };

  // Remaining macros (considering skipped meals redistribute)
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
      <div className="space-y-4 max-w-lg mx-auto">
        {/* Daily Progress Header */}
        <Card className="border-primary/10">
          <CardContent className="py-5">
            <div className="flex items-center gap-4">
              <DailyProgressRing
                percent={progressPercent}
                size={110}
                strokeWidth={8}
                sublabel={nextMeal?.name || "Concluído"}
              />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground font-display">
                    {completedCount}/{totalMeals} refeições
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {progressPercent === 100 ? "Dia completo! 🎉" : `${totalMeals - completedCount} restantes`}
                  </p>
                </div>

                {nextMeal && !isMealCompleted(nextMeal.id) && (
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-[10px] text-primary font-medium uppercase">Próxima Refeição</p>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                      {nextMeal.name} <span className="text-muted-foreground text-xs">{nextMeal.time}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Macro Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" /> Macros do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
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
              color="bg-blue-500"
            />
            <MacroProgressBar
              label="Carboidrato"
              consumed={consumedMacros.carbs}
              total={totalMacros.carbs}
              color="bg-amber-500"
            />
            <MacroProgressBar
              label="Gordura"
              consumed={consumedMacros.fat}
              total={totalMacros.fat}
              color="bg-orange-500"
            />

            {skippedMacros.kcal > 0 && remainingMeals > 0 && (
              <p className="text-[10px] text-warning mt-1">
                ⚠️ +{Math.round(redistributedPerMeal.kcal)} kcal redistribuídos por refeição restante
              </p>
            )}
          </CardContent>
        </Card>

        {/* Meal List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground font-display flex items-center gap-2">
            <Utensils className="w-4 h-4" /> Refeições ({completedCount}/{totalMeals})
          </h3>

          {meals.map((meal) => (
            <div key={meal.id}>
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
                <div className="mt-2 ml-4">
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
