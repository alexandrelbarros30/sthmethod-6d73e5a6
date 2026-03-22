import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { MealWithFoods } from "@/hooks/useMealTracking";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface MealDetailPanelProps {
  meal: MealWithFoods;
  mealLabel?: string;
  onClose: () => void;
}

const MealDetailPanel = ({ meal, mealLabel, onClose }: MealDetailPanelProps) => {
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState((meal as any).image_url || "");
  const qc = useQueryClient();

  const displayTitle = mealLabel || (meal.sort_order <= 5 ? `Refeição ${meal.sort_order + 1}` : "Refeição Extra");
  const displaySubtitle = meal.name;

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

  const handleGenerateImage = async () => {
    if (meal.diet_foods.length === 0) return;
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-meal-image", {
        body: {
          mealId: meal.id,
          foods: meal.diet_foods.map((f) => ({ item: f.item, quantity: f.quantity })),
        },
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
        qc.invalidateQueries({ queryKey: ["diet-meals-tracking"] });
        toast.success("Imagem gerada com sucesso!");
      } else {
        toast.error("Não foi possível gerar a imagem.");
      }
    } catch (e: any) {
      console.error("Image gen error:", e);
      toast.error("Erro ao gerar imagem");
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="mt-2 animate-scale-in">
      <Card className="premium-card border-primary/15 overflow-hidden">
        {/* Food Image Section */}
        {imageUrl ? (
          <div className="relative w-full aspect-[16/9] overflow-hidden">
            <img
              src={imageUrl}
              alt={meal.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <h3 className="text-lg font-bold text-white drop-shadow-lg tracking-tight">
                {displayTitle}
              </h3>
              <div className="flex items-center gap-2 text-xs text-white/80 mt-0.5">
                <span>{displaySubtitle}</span>
                <span>•</span>
                <Clock className="w-3 h-3" />
                <span>{meal.time}</span>
                <Badge className="bg-primary/80 text-primary-foreground text-[10px] border-0">
                  {Math.round(mealMacros.kcal)} kcal
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-muted/80 via-muted/40 to-primary/5 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-primary/50" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-foreground tracking-tight">{displayTitle}</h3>
              <p className="text-xs text-muted-foreground">{displaySubtitle}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 justify-center">
                <Clock className="w-3 h-3" />
                <span>{meal.time}</span>
                <span className="font-bold text-foreground">{Math.round(mealMacros.kcal)} kcal</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateImage}
              disabled={generatingImage}
              className="text-xs gap-1.5 border-primary/20 hover:bg-primary/10 hover:border-primary/40"
            >
              {generatingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              )}
              {generatingImage ? "Gerando..." : "Gerar foto do prato"}
            </Button>
          </div>
        )}

        <CardContent className="pt-4 pb-5 space-y-4">
          {/* Macro Distribution Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
              <span>Distribuição de Macros</span>
              <span className="text-foreground text-xs normal-case">{Math.round(mealMacros.kcal)} kcal</span>
            </div>
            <div className="flex gap-0.5 h-2.5 w-full rounded-full overflow-hidden">
              <div
                className="h-full bg-info rounded-l-full transition-all duration-700"
                style={{ width: `${proteinPct}%` }}
              />
              <div
                className="h-full bg-warning transition-all duration-700"
                style={{ width: `${carbsPct}%` }}
              />
              <div
                className="h-full rounded-r-full transition-all duration-700"
                style={{ width: `${fatPct}%`, background: "hsl(25, 85%, 55%)" }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-info/8 border border-info/15">
                <span className="block font-extrabold text-info text-lg tabular-nums">{Math.round(mealMacros.protein)}g</span>
                <span className="text-muted-foreground text-[10px]">Proteína</span>
              </div>
              <div className="p-2 rounded-xl bg-warning/8 border border-warning/15">
                <span className="block font-extrabold text-warning text-lg tabular-nums">{Math.round(mealMacros.carbs)}g</span>
                <span className="text-muted-foreground text-[10px]">Carboidrato</span>
              </div>
              <div className="p-2 rounded-xl border" style={{ background: "hsl(25, 85%, 55%, 0.08)", borderColor: "hsl(25, 85%, 55%, 0.15)" }}>
                <span className="block font-extrabold text-lg tabular-nums" style={{ color: "hsl(25, 85%, 55%)" }}>{Math.round(mealMacros.fat)}g</span>
                <span className="text-muted-foreground text-[10px]">Gordura</span>
              </div>
            </div>
          </div>

          {/* Food Items - Premium Text List */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Cardápio</p>
            {meal.diet_foods.map((food, i) => (
              <div
                key={food.id}
                className={cn(
                  "flex items-start justify-between py-2.5 px-3 rounded-xl text-sm transition-all duration-200",
                  i % 2 === 0 ? "bg-muted/15" : "bg-transparent",
                  "hover:bg-primary/5"
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 glow-sm" />
                  <div className="min-w-0">
                    <span className="block text-foreground font-semibold leading-tight">{food.item}</span>
                    {food.notes && (
                      <span className="block text-[10px] text-muted-foreground mt-0.5 italic">{food.notes}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground text-xs font-medium transition-all duration-200"
          >
            Fechar detalhes
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MealDetailPanel;
