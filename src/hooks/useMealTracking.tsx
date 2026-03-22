import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MealWithFoods {
  id: string;
  name: string;
  time: string;
  sort_order: number;
  image_url?: string;
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

export interface AdminMacros {
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

const todayStr = () => new Date().toISOString().split("T")[0];

export function useMealTracking() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Fetch admin-defined macros from student_diets
  const { data: adminMacros } = useQuery({
    queryKey: ["student-diet-macros", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_diets")
        .select("energy_kcal, protein_g, carbs_g, fat_g")
        .eq("user_id", user!.id)
        .eq("visible", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        energy_kcal: data.energy_kcal || 0,
        protein_g: data.protein_g || 0,
        carbs_g: data.carbs_g || 0,
        fat_g: data.fat_g || 0,
      } as AdminMacros;
    },
    enabled: !!user?.id,
  });

  const { data: meals = [], isLoading: mealsLoading, error: mealsError } = useQuery({
    queryKey: ["diet-meals-tracking", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diet_meals")
        .select("id, name, time, sort_order, image_url, diet_foods(id, item, quantity, energy_kcal, protein_g, carbs_g, fat_g, fiber_g, notes)")
        .eq("user_id", user!.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as MealWithFoods[];
    },
    enabled: !!user?.id,
  });

  const { data: completions = [], isLoading: completionsLoading, error: completionsError } = useQuery({
    queryKey: ["meal-completions", user?.id, todayStr()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_completions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("completed_date", todayStr());
      if (error) throw error;
      return (data || []) as MealCompletion[];
    },
    enabled: !!user?.id,
  });

  const toggleMeal = useMutation({
    mutationFn: async ({ mealId, skipped = false }: { mealId: string; skipped?: boolean }) => {
      const existing = completions.find((c) => c.meal_id === mealId);
      if (existing) {
        const { error } = await supabase.from("meal_completions").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meal_completions").insert({
          user_id: user!.id,
          meal_id: mealId,
          completed_date: todayStr(),
          skipped,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-completions", user?.id, todayStr()] });
    },
  });

  // Use admin-defined totals if available, otherwise sum from foods
  const foodSumMacros = meals.reduce(
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

  const totalMacros = adminMacros && (adminMacros.energy_kcal > 0 || adminMacros.protein_g > 0)
    ? {
        kcal: adminMacros.energy_kcal,
        protein: adminMacros.protein_g,
        carbs: adminMacros.carbs_g,
        fat: adminMacros.fat_g,
      }
    : foodSumMacros;

  // Distribute admin macros evenly across meals for per-meal display
  const mealCount = meals.length;
  const perMealMacros = mealCount > 0 && adminMacros && (adminMacros.energy_kcal > 0 || adminMacros.protein_g > 0)
    ? {
        kcal: adminMacros.energy_kcal / mealCount,
        protein: adminMacros.protein_g / mealCount,
        carbs: adminMacros.carbs_g / mealCount,
        fat: adminMacros.fat_g / mealCount,
      }
    : null;

  const consumedMacros = meals.reduce(
    (acc, meal, idx) => {
      const isCompleted = completions.some((c) => c.meal_id === meal.id && !c.skipped);
      if (isCompleted) {
        if (perMealMacros) {
          acc.kcal += perMealMacros.kcal;
          acc.protein += perMealMacros.protein;
          acc.carbs += perMealMacros.carbs;
          acc.fat += perMealMacros.fat;
        } else {
          meal.diet_foods.forEach((f) => {
            acc.kcal += f.energy_kcal || 0;
            acc.protein += f.protein_g || 0;
            acc.carbs += f.carbs_g || 0;
            acc.fat += f.fat_g || 0;
          });
        }
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
    return mealMinutes >= currentMinutes - 30;
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
    perMealMacros,
    completedCount,
    skippedCount,
    totalMeals,
    progressPercent,
    nextMeal,
    activeMeal,
    toggleMeal,
    isLoading: mealsLoading || completionsLoading,
    error: mealsError || completionsError,
    isMealCompleted: (mealId: string) => completions.some((c) => c.meal_id === mealId && !c.skipped),
    isMealSkipped: (mealId: string) => completions.some((c) => c.meal_id === mealId && c.skipped),
  };
}
