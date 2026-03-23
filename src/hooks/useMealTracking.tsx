import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";

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

const formatDate = (d: Date) => d.toISOString().split("T")[0];
const todayStr = () => formatDate(new Date());

export function useMealTracking() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());

  const isToday = selectedDate === todayStr();

  // Fetch admin-defined macros + hydration from student_diets
  const { data: dietMeta } = useQuery({
    queryKey: ["student-diet-macros", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_diets")
        .select("energy_kcal, protein_g, carbs_g, fat_g, hydration_l")
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
        hydration_l: data.hydration_l || 0,
      };
    },
    enabled: !!user?.id,
  });

  const adminMacros = dietMeta ? {
    energy_kcal: dietMeta.energy_kcal,
    protein_g: dietMeta.protein_g,
    carbs_g: dietMeta.carbs_g,
    fat_g: dietMeta.fat_g,
  } as AdminMacros : null;

  const hydrationGoalL = dietMeta?.hydration_l || 0;

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
    queryKey: ["meal-completions", user?.id, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_completions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("completed_date", selectedDate);
      if (error) throw error;
      return (data || []) as MealCompletion[];
    },
    enabled: !!user?.id,
  });

  // Water logs
  const { data: waterLogs = [] } = useQuery({
    queryKey: ["water-logs", user?.id, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("log_date", selectedDate)
        .order("logged_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const waterConsumedMl = useMemo(() => waterLogs.reduce((s, l: any) => s + (l.amount_ml || 0), 0), [waterLogs]);

  const addWater = useMutation({
    mutationFn: async (amountMl: number) => {
      const { error } = await supabase.from("water_logs").insert({
        user_id: user!.id,
        log_date: selectedDate,
        amount_ml: amountMl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["water-logs", user?.id, selectedDate] });
    },
  });

  const removeLastWater = useMutation({
    mutationFn: async () => {
      if (waterLogs.length === 0) return;
      const last = waterLogs[waterLogs.length - 1] as any;
      const { error } = await supabase.from("water_logs").delete().eq("id", last.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["water-logs", user?.id, selectedDate] });
    },
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
          completed_date: selectedDate,
          skipped,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-completions", user?.id, selectedDate] });
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

  // Per-meal macros: always use food-level sums (accurate from AI analysis)
  const perMealFoodMacros = meals.map((meal) => ({
    mealId: meal.id,
    kcal: meal.diet_foods.reduce((s, f) => s + (f.energy_kcal || 0), 0),
    protein: meal.diet_foods.reduce((s, f) => s + (f.protein_g || 0), 0),
    carbs: meal.diet_foods.reduce((s, f) => s + (f.carbs_g || 0), 0),
    fat: meal.diet_foods.reduce((s, f) => s + (f.fat_g || 0), 0),
  }));

  const consumedMacros = meals.reduce(
    (acc, meal) => {
      const isCompleted = completions.some((c) => c.meal_id === meal.id && !c.skipped);
      if (isCompleted) {
        const mealFoodMacros = perMealFoodMacros.find((m) => m.mealId === meal.id);
        if (mealFoodMacros) {
          acc.kcal += mealFoodMacros.kcal;
          acc.protein += mealFoodMacros.protein;
          acc.carbs += mealFoodMacros.carbs;
          acc.fat += mealFoodMacros.fat;
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

  // Find next meal based on current time (only for today)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const completedMealIds = new Set(completions.map((c) => c.meal_id));

  const nextMeal = isToday
    ? (meals.find((meal) => {
        if (completedMealIds.has(meal.id)) return false;
        const [h, m] = meal.time.split(":").map(Number);
        const mealMinutes = (h || 0) * 60 + (m || 0);
        return mealMinutes >= currentMinutes - 30;
      }) || meals.find((meal) => !completedMealIds.has(meal.id)))
    : null;

  const activeMeal = isToday
    ? meals.find((meal) => {
        if (completedMealIds.has(meal.id)) return false;
        const [h, m] = meal.time.split(":").map(Number);
        const mealMinutes = (h || 0) * 60 + (m || 0);
        return Math.abs(mealMinutes - currentMinutes) <= 30;
      })
    : null;

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
    // Date navigation
    selectedDate,
    setSelectedDate,
    isToday,
    // Hydration
    hydrationGoalL,
    waterConsumedMl,
    addWater,
    removeLastWater,
  };
}
