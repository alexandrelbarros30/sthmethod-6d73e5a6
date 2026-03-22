import { supabase } from "@/integrations/supabase/client";

export interface ParsedDietFood {
  item: string;
  quantity: string;
  sort_order: number;
}

export interface ParsedDietMeal {
  name: string;
  time: string;
  sort_order: number;
  foods: ParsedDietFood[];
}

const DEFAULT_MEAL_NAMES: Record<number, string> = {
  0: "Café da Manhã",
  1: "Lanche da Manhã",
  2: "Almoço",
  3: "Lanche da Tarde",
  4: "Jantar",
  5: "Ceia",
};

const DEFAULT_MEAL_TIMES: Record<number, string> = {
  0: "07:00",
  1: "10:00",
  2: "12:00",
  3: "15:00",
  4: "19:00",
  5: "21:00",
};

const SECTION_TITLE_RE = /^(ROTINA\s*ALIMENTAR|PLANO\s*ALIMENTAR|DIETA)\b/i;

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const decodeHtml = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

const htmlToLines = (content: string) => {
  const plain = decodeHtml(
    content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, " ")
  );

  return plain
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
};

const extractQuantity = (line: string) => {
  const match = line.match(/^([\d.,/]+\s?(?:g|gr|grama|gramas|kg|mg|ml|l|un|und|unidade|xicara|xícara|colher|fatia|fatia[s]?|kcal))\b/i);
  return match?.[1]?.trim() || "porção";
};

const inferMealNameFromHeadingRemainder = (value: string): string | null => {
  const n = normalize(value.replace(/[()]/g, " "));
  if (!n) return null;
  if (n.includes("cafe da manha")) return "Café da Manhã";
  if (n.includes("lanche da manha")) return "Lanche da Manhã";
  if (n.includes("almoco")) return "Almoço";
  if (n.includes("lanche da tarde")) return "Lanche da Tarde";
  if (n.includes("jantar")) return "Jantar";
  if (n.includes("ceia") || n.includes("pos treino") || n.includes("pós treino")) return "Ceia";
  if (n.includes("extra")) return "Refeição Extra";
  return null;
};

const isHeadingMetadataOnly = (value: string) => {
  const n = normalize(value.replace(/[()]/g, " "));
  if (!n) return true;
  return (
    n.includes("cafe da manha") ||
    n.includes("lanche da manha") ||
    n.includes("almoco") ||
    n.includes("lanche da tarde") ||
    n.includes("jantar") ||
    n.includes("ceia") ||
    n.includes("pos treino") ||
    n.includes("pós treino") ||
    n === "extra"
  );
};

const parseHeading = (
  line: string,
  nextExtraOrder: () => number
): { sortOrder: number; name: string; remainder: string } | null => {
  const refeicao = line.match(/^refei[cç][aã]?o\s*(extra|\d+)\b[:\-\s]*(.*)$/i);
  if (refeicao) {
    const raw = refeicao[1]?.toLowerCase();
    const remainder = (refeicao[2] || "").trim();
    const inferredName = inferMealNameFromHeadingRemainder(remainder);
    const remainderShouldBecomeFood = remainder && !inferredName && !isHeadingMetadataOnly(remainder);

    if (raw === "extra") {
      const sortOrder = nextExtraOrder();
      return {
        sortOrder,
        name: inferredName || "Refeição Extra",
        remainder: remainderShouldBecomeFood ? remainder : "",
      };
    }

    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      const sortOrder = parsed > 6 ? nextExtraOrder() : Math.max(0, parsed - 1);
      return {
        sortOrder,
        name: inferredName || DEFAULT_MEAL_NAMES[sortOrder] || `Refeição ${parsed}`,
        remainder: remainderShouldBecomeFood ? remainder : "",
      };
    }
  }

  const n = normalize(line);
  const namedMap: { test: RegExp; order: number; name: string }[] = [
    { test: /^cafe da manha\b/i, order: 0, name: "Café da Manhã" },
    { test: /^lanche da manha\b/i, order: 1, name: "Lanche da Manhã" },
    { test: /^almoco\b/i, order: 2, name: "Almoço" },
    { test: /^lanche da tarde\b/i, order: 3, name: "Lanche da Tarde" },
    { test: /^jantar\b/i, order: 4, name: "Jantar" },
    { test: /^ceia\b/i, order: 5, name: "Ceia" },
  ];

  for (const item of namedMap) {
    if (item.test.test(n)) {
      const remainder = line.replace(/^.+?[:\-]\s*/, "").trim();
      return { sortOrder: item.order, name: item.name, remainder: remainder === line ? "" : remainder };
    }
  }

  return null;
};

export const parseDietContentToMeals = (content: string): ParsedDietMeal[] => {
  const lines = htmlToLines(content);
  const mealsMap = new Map<number, ParsedDietMeal>();
  let currentOrder: number | null = null;
  let extraOrder = 6;

  const nextExtraOrder = () => {
    const value = extraOrder;
    extraOrder += 1;
    return value;
  };

  const ensureMeal = (order: number, name?: string) => {
    if (!mealsMap.has(order)) {
      mealsMap.set(order, {
        sort_order: order,
        name: name || DEFAULT_MEAL_NAMES[order] || "Refeição Extra",
        time: DEFAULT_MEAL_TIMES[order] || "12:00",
        foods: [],
      });
    }
    return mealsMap.get(order)!;
  };

  for (const raw of lines) {
    if (!raw || SECTION_TITLE_RE.test(raw)) continue;

    const heading = parseHeading(raw, nextExtraOrder);
    if (heading) {
      currentOrder = heading.sortOrder;
      const meal = ensureMeal(heading.sortOrder, heading.name);
      if (heading.remainder && !SECTION_TITLE_RE.test(heading.remainder)) {
        meal.foods.push({
          item: heading.remainder,
          quantity: extractQuantity(heading.remainder),
          sort_order: meal.foods.length,
        });
      }
      continue;
    }

    if (currentOrder === null) continue;

    // Only strip bullet markers (•, -, *) but preserve leading numbers that are food quantities
    const cleaned = raw.replace(/^[•\-*]\s*/, "").trim();
    if (!cleaned) continue;

    const meal = ensureMeal(currentOrder);
    meal.foods.push({
      item: cleaned,
      quantity: extractQuantity(cleaned),
      sort_order: meal.foods.length,
    });
  }

  return Array.from(mealsMap.values())
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((meal) => meal.foods.length > 0);
};

export interface MealMacros {
  meal_number: number;
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const syncStudentDietMeals = async (
  studentId: string,
  content: string,
  perMealMacros?: MealMacros[]
) => {
  const meals = parseDietContentToMeals(content);

  const { data: existingMeals, error: existingMealsError } = await supabase
    .from("diet_meals")
    .select("id")
    .eq("user_id", studentId);

  if (existingMealsError) throw existingMealsError;

  if (existingMeals?.length) {
    const mealIds = existingMeals.map((m) => m.id);
    const { error: deleteFoodsError } = await supabase.from("diet_foods").delete().in("meal_id", mealIds);
    if (deleteFoodsError) throw deleteFoodsError;

    const { error: deleteMealsError } = await supabase.from("diet_meals").delete().eq("user_id", studentId);
    if (deleteMealsError) throw deleteMealsError;
  }

  let foodsCount = 0;

  for (let i = 0; i < meals.length; i++) {
    const meal = meals[i];
    const { data: insertedMeal, error: insertMealError } = await supabase
      .from("diet_meals")
      .insert({
        user_id: studentId,
        name: meal.name,
        time: meal.time,
        sort_order: i,
      })
      .select("id")
      .single();

    if (insertMealError) throw insertMealError;

    if (meal.foods.length > 0) {
      // Find matching per-meal macros from AI analysis (meal_number is 1-based, sort_order is 0-based)
      const mealMacro = perMealMacros?.find((m) => m.meal_number === meal.sort_order + 1);

      const rows = meal.foods.map((food, index) => {
        const foodCount = meal.foods.length;
        return {
          meal_id: insertedMeal.id,
          item: food.item,
          quantity: food.quantity,
          sort_order: index,
          // Distribute meal macros equally across foods
          energy_kcal: mealMacro ? Math.round((mealMacro.energy_kcal / foodCount) * 10) / 10 : 0,
          protein_g: mealMacro ? Math.round((mealMacro.protein_g / foodCount) * 10) / 10 : 0,
          carbs_g: mealMacro ? Math.round((mealMacro.carbs_g / foodCount) * 10) / 10 : 0,
          fat_g: mealMacro ? Math.round((mealMacro.fat_g / foodCount) * 10) / 10 : 0,
        };
      });

      const { error: insertFoodsError } = await supabase.from("diet_foods").insert(rows);
      if (insertFoodsError) throw insertFoodsError;
      foodsCount += rows.length;
    }
  }

  return { mealsCount: meals.length, foodsCount };
};
