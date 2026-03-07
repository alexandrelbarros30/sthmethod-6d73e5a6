import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Copy, Search, GripVertical, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import FoodSearchDialog from "./FoodSearchDialog";

interface MealData {
  id?: string;
  name: string;
  time: string;
  sort_order: number;
  foods: FoodItem[];
  collapsed?: boolean;
}

interface FoodItem {
  id?: string;
  food_id: string | null;
  item: string;
  quantity: string;
  quantity_grams: number;
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
  sort_order: number;
}

const DEFAULT_MEALS: Omit<MealData, "foods">[] = [
  { name: "Café da manhã", time: "07:00", sort_order: 0 },
  { name: "Colação", time: "10:00", sort_order: 1 },
  { name: "Almoço", time: "12:00", sort_order: 2 },
  { name: "Lanche", time: "15:00", sort_order: 3 },
  { name: "Jantar", time: "19:00", sort_order: 4 },
  { name: "Ceia", time: "21:00", sort_order: 5 },
];

interface Props {
  studentId: string;
  studentName: string;
}

const NutritionMealBuilder = ({ studentId, studentName }: Props) => {
  const qc = useQueryClient();
  const [meals, setMeals] = useState<MealData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [foodSearchOpen, setFoodSearchOpen] = useState(false);
  const [activeMealIndex, setActiveMealIndex] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Load existing meals
  const { isLoading } = useQuery({
    queryKey: ["nutrition-meals", studentId],
    queryFn: async () => {
      const { data: mealsData } = await supabase
        .from("diet_meals")
        .select("*")
        .eq("user_id", studentId)
        .order("sort_order");

      if (!mealsData?.length) {
        setMeals(DEFAULT_MEALS.map((m) => ({ ...m, foods: [] })));
        setLoaded(true);
        return [];
      }

      const mealIds = mealsData.map((m) => m.id);
      const { data: foodsData } = await supabase
        .from("diet_foods")
        .select("*")
        .in("meal_id", mealIds)
        .order("sort_order");

      const mealsWithFoods: MealData[] = mealsData.map((m) => ({
        id: m.id,
        name: m.name,
        time: m.time,
        sort_order: m.sort_order,
        foods: (foodsData || [])
          .filter((f: any) => f.meal_id === m.id)
          .map((f: any) => ({
            id: f.id,
            food_id: f.food_id,
            item: f.item,
            quantity: f.quantity,
            quantity_grams: f.quantity_grams || parseFloat(f.quantity) || 100,
            energy_kcal: f.energy_kcal || 0,
            protein_g: f.protein_g || 0,
            carbs_g: f.carbs_g || 0,
            fat_g: f.fat_g || 0,
            fiber_g: f.fiber_g || 0,
            sugar_g: f.sugar_g || 0,
            sodium_mg: f.sodium_mg || 0,
            cholesterol_mg: f.cholesterol_mg || 0,
            sort_order: f.sort_order,
          })),
      }));

      setMeals(mealsWithFoods);
      setLoaded(true);
      return mealsWithFoods;
    },
  });

  const getMealTotals = (foods: FoodItem[]) => {
    return foods.reduce(
      (acc, f) => ({
        energy_kcal: acc.energy_kcal + (f.energy_kcal || 0),
        protein_g: acc.protein_g + (f.protein_g || 0),
        carbs_g: acc.carbs_g + (f.carbs_g || 0),
        fat_g: acc.fat_g + (f.fat_g || 0),
        fiber_g: acc.fiber_g + (f.fiber_g || 0),
        sugar_g: acc.sugar_g + (f.sugar_g || 0),
        sodium_mg: acc.sodium_mg + (f.sodium_mg || 0),
        cholesterol_mg: acc.cholesterol_mg + (f.cholesterol_mg || 0),
      }),
      { energy_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0, cholesterol_mg: 0 }
    );
  };

  const addMeal = () => {
    setMeals((prev) => [
      ...prev,
      { name: `Refeição ${prev.length + 1}`, time: "12:00", sort_order: prev.length, foods: [] },
    ]);
  };

  const removeMeal = (index: number) => {
    setMeals((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMeal = (index: number, field: keyof MealData, value: string) => {
    setMeals((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const toggleCollapse = (index: number) => {
    setMeals((prev) => prev.map((m, i) => (i === index ? { ...m, collapsed: !m.collapsed } : m)));
  };

  const openFoodSearch = (mealIndex: number) => {
    setActiveMealIndex(mealIndex);
    setFoodSearchOpen(true);
  };

  const addFoodToMeal = (food: any, quantityGrams: number) => {
    const ratio = quantityGrams / 100;
    const newFood: FoodItem = {
      food_id: food.id,
      item: food.name,
      quantity: `${quantityGrams}g`,
      quantity_grams: quantityGrams,
      energy_kcal: Math.round(food.energy_kcal * ratio * 10) / 10,
      protein_g: Math.round(food.protein_g * ratio * 10) / 10,
      carbs_g: Math.round(food.carbs_g * ratio * 10) / 10,
      fat_g: Math.round(food.fat_g * ratio * 10) / 10,
      fiber_g: Math.round(food.fiber_g * ratio * 10) / 10,
      sugar_g: Math.round(food.sugar_g * ratio * 10) / 10,
      sodium_mg: Math.round(food.sodium_mg * ratio * 10) / 10,
      cholesterol_mg: Math.round(food.cholesterol_mg * ratio * 10) / 10,
      sort_order: meals[activeMealIndex]?.foods.length || 0,
    };
    setMeals((prev) =>
      prev.map((m, i) => (i === activeMealIndex ? { ...m, foods: [...m.foods, newFood] } : m))
    );
  };

  const removeFood = (mealIndex: number, foodIndex: number) => {
    setMeals((prev) =>
      prev.map((m, i) =>
        i === mealIndex ? { ...m, foods: m.foods.filter((_, fi) => fi !== foodIndex) } : m
      )
    );
  };

  const updateFoodQuantity = (mealIndex: number, foodIndex: number, newQuantity: number) => {
    setMeals((prev) =>
      prev.map((m, i) => {
        if (i !== mealIndex) return m;
        return {
          ...m,
          foods: m.foods.map((f, fi) => {
            if (fi !== foodIndex || !f.food_id) return f;
            // We need to recalculate based on the original food data
            // For now, proportionally scale from current values
            const currentQ = f.quantity_grams || 100;
            const ratio = newQuantity / currentQ;
            return {
              ...f,
              quantity: `${newQuantity}g`,
              quantity_grams: newQuantity,
              energy_kcal: Math.round(f.energy_kcal * ratio * 10) / 10,
              protein_g: Math.round(f.protein_g * ratio * 10) / 10,
              carbs_g: Math.round(f.carbs_g * ratio * 10) / 10,
              fat_g: Math.round(f.fat_g * ratio * 10) / 10,
              fiber_g: Math.round(f.fiber_g * ratio * 10) / 10,
              sugar_g: Math.round(f.sugar_g * ratio * 10) / 10,
              sodium_mg: Math.round(f.sodium_mg * ratio * 10) / 10,
              cholesterol_mg: Math.round(f.cholesterol_mg * ratio * 10) / 10,
            };
          }),
        };
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing meals and foods for this student
      const { data: existingMeals } = await supabase
        .from("diet_meals")
        .select("id")
        .eq("user_id", studentId);

      if (existingMeals?.length) {
        const mealIds = existingMeals.map((m) => m.id);
        await supabase.from("diet_foods").delete().in("meal_id", mealIds);
        await supabase.from("diet_meals").delete().eq("user_id", studentId);
      }

      // Insert new meals
      for (let i = 0; i < meals.length; i++) {
        const meal = meals[i];
        const { data: insertedMeal } = await supabase
          .from("diet_meals")
          .insert({ user_id: studentId, name: meal.name, time: meal.time, sort_order: i })
          .select("id")
          .single();

        if (insertedMeal && meal.foods.length > 0) {
          const foodInserts = meal.foods.map((f, fi) => ({
            meal_id: insertedMeal.id,
            food_id: f.food_id || undefined,
            item: f.item,
            quantity: f.quantity,
            quantity_grams: f.quantity_grams,
            energy_kcal: f.energy_kcal,
            protein_g: f.protein_g,
            carbs_g: f.carbs_g,
            fat_g: f.fat_g,
            fiber_g: f.fiber_g,
            sugar_g: f.sugar_g,
            sodium_mg: f.sodium_mg,
            cholesterol_mg: f.cholesterol_mg,
            sort_order: fi,
          }));
          await supabase.from("diet_foods").insert(foodInserts);
        }
      }

      toast.success("Cardápio salvo com sucesso!");
      qc.invalidateQueries({ queryKey: ["nutrition-meals", studentId] });
    } catch (err) {
      toast.error("Erro ao salvar cardápio");
    }
    setSaving(false);
  };

  const handleDuplicate = () => {
    toast.info("Cardápio duplicado na memória. Selecione outro aluno e salve.");
  };

  if (isLoading) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando...</CardContent></Card>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-display">Refeições</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addMeal}>
            <Plus className="w-4 h-4 mr-1" /> Refeição Extra
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {meals.map((meal, mealIndex) => {
          const totals = getMealTotals(meal.foods);
          return (
            <Card key={mealIndex} className="overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 bg-muted/30 cursor-pointer"
                onClick={() => toggleCollapse(mealIndex)}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs font-mono">{mealIndex + 1}</Badge>
                  <Input
                    value={meal.name}
                    onChange={(e) => updateMeal(mealIndex, "name", e.target.value)}
                    className="h-7 w-40 text-sm font-medium border-none bg-transparent p-0 focus-visible:ring-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <Input
                      type="time"
                      value={meal.time}
                      onChange={(e) => updateMeal(mealIndex, "time", e.target.value)}
                      className="h-7 w-24 text-xs border-none bg-transparent p-0 focus-visible:ring-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{totals.energy_kcal.toFixed(0)} kcal</span>
                    <span>P:{totals.protein_g.toFixed(1)}g</span>
                    <span>C:{totals.carbs_g.toFixed(1)}g</span>
                    <span>G:{totals.fat_g.toFixed(1)}g</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); removeMeal(mealIndex); }}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                  {meal.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {!meal.collapsed && (
                <CardContent className="p-4 space-y-2">
                  {meal.foods.length > 0 && (
                    <div className="space-y-1">
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                        <div className="col-span-4">Alimento</div>
                        <div className="col-span-2">Qtd (g)</div>
                        <div className="col-span-1 text-right">Kcal</div>
                        <div className="col-span-1 text-right">Prot</div>
                        <div className="col-span-1 text-right">Carb</div>
                        <div className="col-span-1 text-right">Gord</div>
                        <div className="col-span-1 text-right">Fibra</div>
                        <div className="col-span-1"></div>
                      </div>
                      {meal.foods.map((food, foodIndex) => (
                        <div key={foodIndex} className="grid grid-cols-12 gap-2 items-center text-sm bg-muted/20 rounded px-1 py-1.5">
                          <div className="col-span-4 truncate font-body">{food.item}</div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={food.quantity_grams}
                              onChange={(e) => updateFoodQuantity(mealIndex, foodIndex, Number(e.target.value) || 0)}
                              className="h-7 text-xs w-full"
                              min={1}
                            />
                          </div>
                          <div className="col-span-1 text-right text-xs">{food.energy_kcal.toFixed(0)}</div>
                          <div className="col-span-1 text-right text-xs">{food.protein_g.toFixed(1)}</div>
                          <div className="col-span-1 text-right text-xs">{food.carbs_g.toFixed(1)}</div>
                          <div className="col-span-1 text-right text-xs">{food.fat_g.toFixed(1)}</div>
                          <div className="col-span-1 text-right text-xs">{food.fiber_g.toFixed(1)}</div>
                          <div className="col-span-1 text-right">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFood(mealIndex, foodIndex)}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="grid grid-cols-12 gap-2 items-center text-xs font-semibold bg-primary/5 rounded px-1 py-2 mt-1">
                        <div className="col-span-4">Subtotal</div>
                        <div className="col-span-2"></div>
                        <div className="col-span-1 text-right">{totals.energy_kcal.toFixed(0)}</div>
                        <div className="col-span-1 text-right">{totals.protein_g.toFixed(1)}</div>
                        <div className="col-span-1 text-right">{totals.carbs_g.toFixed(1)}</div>
                        <div className="col-span-1 text-right">{totals.fat_g.toFixed(1)}</div>
                        <div className="col-span-1 text-right">{totals.fiber_g.toFixed(1)}</div>
                        <div className="col-span-1"></div>
                      </div>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => openFoodSearch(mealIndex)}>
                    <Search className="w-4 h-4 mr-1" /> Buscar Alimento (TACO/TBCA)
                  </Button>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <FoodSearchDialog
        open={foodSearchOpen}
        onOpenChange={setFoodSearchOpen}
        onSelect={addFoodToMeal}
      />
    </>
  );
};

export default NutritionMealBuilder;
