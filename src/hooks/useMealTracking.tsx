import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePreviewAs } from "@/hooks/usePreviewAs";
import { useEffect, useMemo, useState } from "react";

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

const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const todayStr = () => formatDate(new Date());

const STORAGE_KEY = (uid: string) => `selected_diet_${uid}`;
const LATEST_AVAILABLE_DIET_KEY = (uid: string) => `latest_available_diet_${uid}`;

export function useMealTracking() {
  const { user } = useAuth();
  const { effectiveUserId, isPreviewing } = usePreviewAs();
  const targetUserId = effectiveUserId || user?.id;
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [selectedDietId, setSelectedDietIdState] = useState<string | null>(() => {
    if (typeof window === "undefined" || !targetUserId) return null;
    return localStorage.getItem(STORAGE_KEY(targetUserId));
  });

  const setSelectedDietId = (id: string | null) => {
    setSelectedDietIdState(id);
    if (typeof window !== "undefined" && targetUserId) {
      if (id) localStorage.setItem(STORAGE_KEY(targetUserId), id);
      else localStorage.removeItem(STORAGE_KEY(targetUserId));
    }
  };

  const isToday = selectedDate === todayStr();

  // Fetch all visible diets to populate tabs
  const { data: availableDiets = [] } = useQuery({
    queryKey: ["student-diets-list", targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_diets")
        .select("id, title, tab_label, content, energy_kcal, protein_g, carbs_g, fat_g, hydration_l, start_date, end_date, is_active, created_at")
        .eq("user_id", targetUserId!)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!targetUserId,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !targetUserId) return;
    setSelectedDietIdState(localStorage.getItem(STORAGE_KEY(targetUserId)));
  }, [targetUserId]);

  // Determine effective diet: stored selection > latest available > first
  const today = todayStr();
  const isExpired = (d: any) => d.end_date && d.end_date < today;
  const isNotStarted = (d: any) => d.start_date && d.start_date > today;
  const isAvailableToday = (d: any) => !isExpired(d) && !isNotStarted(d);
  const latestAvailableDiet = availableDiets.find((d: any) => isAvailableToday(d)) || null;
  const validSelected = availableDiets.find((d: any) => d.id === selectedDietId && isAvailableToday(d));
  const currentDiet: any = validSelected || latestAvailableDiet || availableDiets[0] || null;

  useEffect(() => {
    if (typeof window === "undefined" || !targetUserId || !latestAvailableDiet?.id) return;

    const latestKnownDietId = localStorage.getItem(LATEST_AVAILABLE_DIET_KEY(targetUserId));
    const hasNewDietRelease = latestKnownDietId !== latestAvailableDiet.id;

    if (hasNewDietRelease) {
      localStorage.setItem(LATEST_AVAILABLE_DIET_KEY(targetUserId), latestAvailableDiet.id);
      localStorage.setItem(STORAGE_KEY(targetUserId), latestAvailableDiet.id);
      setSelectedDietIdState(latestAvailableDiet.id);
      return;
    }

    if (!validSelected && selectedDietId !== latestAvailableDiet.id) {
      localStorage.setItem(STORAGE_KEY(targetUserId), latestAvailableDiet.id);
      setSelectedDietIdState(latestAvailableDiet.id);
    }
  }, [targetUserId, latestAvailableDiet?.id, selectedDietId, validSelected]);

  const dietMeta = currentDiet
    ? {
        energy_kcal: currentDiet.energy_kcal || 0,
        protein_g: currentDiet.protein_g || 0,
        carbs_g: currentDiet.carbs_g || 0,
        fat_g: currentDiet.fat_g || 0,
        hydration_l: currentDiet.hydration_l || 0,
      }
    : null;

  const adminMacros = dietMeta ? {
    energy_kcal: dietMeta.energy_kcal,
    protein_g: dietMeta.protein_g,
    carbs_g: dietMeta.carbs_g,
    fat_g: dietMeta.fat_g,
  } as AdminMacros : null;

  const hydrationGoalL = dietMeta?.hydration_l || 0;

  const { data: meals = [], isLoading: mealsLoading, error: mealsError } = useQuery({
    queryKey: ["diet-meals-tracking", targetUserId, currentDiet?.id],
    queryFn: async () => {
      let q = supabase
        .from("diet_meals")
        .select("id, name, time, sort_order, image_url, diet_foods(id, item, quantity, energy_kcal, protein_g, carbs_g, fat_g, fiber_g, notes)")
        .eq("user_id", targetUserId!);
      if (currentDiet?.id) q = q.or(`diet_id.eq.${currentDiet.id},diet_id.is.null`);
      const { data, error } = await q.order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as MealWithFoods[];
    },
    enabled: !!targetUserId,
  });

  const { data: completions = [], isLoading: completionsLoading, error: completionsError } = useQuery({
    queryKey: ["meal-completions", targetUserId, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_completions")
        .select("*")
        .eq("user_id", targetUserId!)
        .eq("completed_date", selectedDate);
      if (error) throw error;
      return (data || []) as MealCompletion[];
    },
    enabled: !!targetUserId,
  });

  // Water logs
  const { data: waterLogs = [] } = useQuery({
    queryKey: ["water-logs", targetUserId, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_logs")
        .select("*")
        .eq("user_id", targetUserId!)
        .eq("log_date", selectedDate)
        .order("logged_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!targetUserId,
  });

  const waterConsumedMl = useMemo(() => waterLogs.reduce((s, l: any) => s + (l.amount_ml || 0), 0), [waterLogs]);

  const addWater = useMutation({
    mutationFn: async (amountMl: number) => {
      if (isPreviewing) return; // read-only preview mode
      const { error } = await supabase.from("water_logs").insert({
        user_id: user!.id,
        log_date: selectedDate,
        amount_ml: amountMl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["water-logs", targetUserId, selectedDate] });
    },
  });

  const removeLastWater = useMutation({
    mutationFn: async () => {
      if (isPreviewing) return;
      if (waterLogs.length === 0) return;
      const last = waterLogs[waterLogs.length - 1] as any;
      const { error } = await supabase.from("water_logs").delete().eq("id", last.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["water-logs", targetUserId, selectedDate] });
    },
  });

  const toggleMeal = useMutation({
    mutationFn: async ({ mealId, skipped = false }: { mealId: string; skipped?: boolean }) => {
      if (isPreviewing) return;
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
      qc.invalidateQueries({ queryKey: ["meal-completions", targetUserId, selectedDate] });
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

  // Per-meal macros: use food-level sums when available, otherwise distribute admin totals
  const rawPerMealFoodMacros = meals.map((meal) => ({
    mealId: meal.id,
    kcal: meal.diet_foods.reduce((s, f) => s + (f.energy_kcal || 0), 0),
    protein: meal.diet_foods.reduce((s, f) => s + (f.protein_g || 0), 0),
    carbs: meal.diet_foods.reduce((s, f) => s + (f.carbs_g || 0), 0),
    fat: meal.diet_foods.reduce((s, f) => s + (f.fat_g || 0), 0),
  }));

  // If food-level macros are all zero but admin totals exist, distribute equally
  const perMealFoodMacros = useMemo(() => {
    const hasAnyFoodMacros = rawPerMealFoodMacros.some((m) => m.kcal > 0 || m.protein > 0);
    if (!hasAnyFoodMacros && adminMacros && (adminMacros.energy_kcal > 0 || adminMacros.protein_g > 0) && meals.length > 0) {
      return rawPerMealFoodMacros.map((m) => ({
        ...m,
        kcal: adminMacros.energy_kcal / meals.length,
        protein: adminMacros.protein_g / meals.length,
        carbs: adminMacros.carbs_g / meals.length,
        fat: adminMacros.fat_g / meals.length,
      }));
    }
    return rawPerMealFoodMacros;
  }, [rawPerMealFoodMacros, adminMacros, meals.length]);

  // Check if food-level macros have actual values
  const hasFoodLevelMacros = foodSumMacros.kcal > 0 || foodSumMacros.protein > 0;
  const useAdminProportional = !hasFoodLevelMacros && adminMacros && (adminMacros.energy_kcal > 0 || adminMacros.protein_g > 0);

  const totalMeals = meals.length;

  const consumedMacros = meals.reduce(
    (acc, meal) => {
      const isCompleted = completions.some((c) => c.meal_id === meal.id && !c.skipped);
      if (isCompleted) {
        if (useAdminProportional && totalMeals > 0) {
          acc.kcal += totalMacros.kcal / totalMeals;
          acc.protein += totalMacros.protein / totalMeals;
          acc.carbs += totalMacros.carbs / totalMeals;
          acc.fat += totalMacros.fat / totalMeals;
        } else {
          const mealFoodMacros = perMealFoodMacros.find((m) => m.mealId === meal.id);
          if (mealFoodMacros) {
            acc.kcal += mealFoodMacros.kcal;
            acc.protein += mealFoodMacros.protein;
            acc.carbs += mealFoodMacros.carbs;
            acc.fat += mealFoodMacros.fat;
          }
        }
      }
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const completedCount = completions.filter((c) => !c.skipped).length;
  const skippedCount = completions.filter((c) => c.skipped).length;
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
    perMealFoodMacros,
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
    // Diet tabs
    availableDiets,
    currentDiet,
    selectedDietId: currentDiet?.id || null,
    setSelectedDietId,
  };
}
