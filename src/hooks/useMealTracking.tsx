import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MealWithFoods {
  id: string;
  name: string;
  time: string;
  sort_order: number;
  diet_foods: {
    id: string;
    item: string;
    quantity: string;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    notes: string | null;
  }[];
}

export interface MealCompletion {
  id: string;
  meal_id: string;
  completed_date: string;
  completed_at: string;
  skipped: boolean;
}

const todayStr = () => new Date().toISOString().split("T")[0];

export function useMealTracking() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: meals = [], isLoading: mealsLoading } = useQuery({
    queryKey: ["diet-meals-tracking", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("diet_meals")
        .select("id, name, time, sort_order, diet_foods(id, item, quantity, energy_kcal, protein_g, carbs_g, fat_g, fiber_g, notes)")
        .eq("user_id", user!.id)
        .order("sort_order", { ascending: true });
      return (data || []) as MealWithFoods[];
    },
    enabled: !!user?.id,
  });

  const { data: completions = [], isLoading: completionsLoading } = useQuery({
    queryKey: ["meal-completions", user?.id, todayStr()],
    queryFn: async () => {
      const { data } = await supabase
        .from("meal_completions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("completed_date", todayStr());
      return (data || []) as MealCompletion[];
    },
    enabled: !!user?.id,
  });

  const toggleMeal = useMutation({
    mutationFn: async ({ mealId, skipped = false }: { mealId: string; skipped?: boolean }) => {
      const existing = completions.find((c) => c.meal_id === mealId);
      if (existing) {
        await supabase.from("meal_completions").delete().eq("id", existing.id);
      } else {
        await supabase.from("meal_completions").insert({
          user_id: user!.id,
          meal_id: mealId,
          completed_date: todayStr(),
          skipped,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-completions", user?.id, todayStr()] });
    },
  });

  // Compute totals
  const totalMacros = meals.reduce(
    (acc, meal) => {
      meal.diet_foods.forEach((f) => {
        acc.kcal += f.energy_kcal || 0;
        acc.protein += f.protein_g || 0;
        acc.carbs += f.carbs_g || 0;
        acc.fat += f.fat_g || 0;
      });
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const consumedMacros = meals.reduce(
    (acc, meal) => {
      const isCompleted = completions.some((c) => c.meal_id === meal.id && !c.skipped);
      if (isCompleted) {
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

  const completedCount = completions.filter((c) => !c.skipped).length;
  const skippedCount = completions.filter((c) => c.skipped).length;
  const totalMeals = meals.length;
  const progressPercent = totalMeals > 0 ? Math.round((completedCount / totalMeals) * 100) : 0;

  // Find next meal based on current time
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const completedMealIds = new Set(completions.map((c) => c.meal_id));

  const nextMeal = meals.find((meal) => {
    if (completedMealIds.has(meal.id)) return false;
    const [h, m] = meal.time.split(":").map(Number);
    const mealMinutes = (h || 0) * 60 + (m || 0);
    return mealMinutes >= currentMinutes - 30; // within 30min window
  }) || meals.find((meal) => !completedMealIds.has(meal.id));

  // Active meal (current time window)
  const activeMeal = meals.find((meal) => {
    if (completedMealIds.has(meal.id)) return false;
    const [h, m] = meal.time.split(":").map(Number);
    const mealMinutes = (h || 0) * 60 + (m || 0);
    return Math.abs(mealMinutes - currentMinutes) <= 30;
  });

  return {
    meals,
    completions,
    totalMacros,
    consumedMacros,
    completedCount,
    skippedCount,
    totalMeals,
    progressPercent,
    nextMeal,
    activeMeal,
    toggleMeal,
    isLoading: mealsLoading || completionsLoading,
    isMealCompleted: (mealId: string) => completions.some((c) => c.meal_id === mealId && !c.skipped),
    isMealSkipped: (mealId: string) => completions.some((c) => c.meal_id === mealId && c.skipped),
  };
}
