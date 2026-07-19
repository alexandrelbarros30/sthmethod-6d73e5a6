import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Brain, Check, Loader2, Pencil, RotateCcw } from "lucide-react";
import AICreditsDialog from "./AICreditsDialog";
import AICreditUsage from "@/components/shared/AICreditUsage";

type AnalyzeErrorInfo = {
  message: string;
  status?: number;
  reason?: "insufficient" | "rate_limit";
};

const getAnalyzeDietErrorInfo = async (error: any): Promise<AnalyzeErrorInfo> => {
  const status = error?.context?.status;

  if (typeof error?.context?.json === "function") {
    try {
      const payload = await error.context.json();
      const message = payload?.error || payload?.message;
      if (message) {
        return {
          message,
          status,
          reason:
            status === 402
              ? "insufficient"
              : status === 429
              ? "rate_limit"
              : undefined,
        };
      }
    } catch {
      // ignore JSON parse issues and fall back below
    }
  }

  if (status === 402) {
    return {
      message: "Créditos insuficientes para analisar a dieta com IA.",
      status,
      reason: "insufficient",
    };
  }

  if (status === 429) {
    return {
      message: "Limite de uso temporariamente atingido. Tente novamente em alguns segundos.",
      status,
      reason: "rate_limit",
    };
  }

  return { message: error?.message || "Erro ao analisar dieta", status };
};

interface MealAnalysis {
  meal_number: number;
  meal_name: string;
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface DietAnalysisResult {
  meals: MealAnalysis[];
  total: {
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

interface Props {
  dietContent: string;
  onConfirm: (result: DietAnalysisResult) => void;
}

const MEAL_LABELS: Record<number, string> = {
  1: "Café da Manhã",
  2: "Lanche da Manhã",
  3: "Almoço",
  4: "Lanche da Tarde",
  5: "Jantar",
  6: "Ceia",
};

const DietAIAnalysis = ({ dietContent, onConfirm }: Props) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DietAnalysisResult | null>(null);
  const [editingMeal, setEditingMeal] = useState<number | null>(null);
  const [meta, setMeta] = useState<{ model?: string; usage?: any } | null>(null);
  const [creditsDialog, setCreditsDialog] = useState<{
    open: boolean;
    reason: "insufficient" | "rate_limit";
  }>({ open: false, reason: "insufficient" });

  const analyze = async () => {
    if (!dietContent.replace(/<[^>]+>/g, "").trim()) {
      toast.error("Insira o conteúdo da dieta antes de analisar.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-diet", {
        body: { dietContent },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { _meta, ...analysis } = (data || {}) as any;
      setResult(analysis as DietAnalysisResult);
      setMeta(_meta || null);
      toast.success("Análise concluída! Revise e confirme os valores.");
    } catch (e: any) {
      const info = await getAnalyzeDietErrorInfo(e);
      if (info.reason) {
        setCreditsDialog({ open: true, reason: info.reason });
      } else {
        toast.error(info.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateMeal = (idx: number, field: keyof MealAnalysis, value: number) => {
    if (!result) return;
    const newMeals = [...result.meals];
    (newMeals[idx] as any)[field] = value;

    const total = newMeals.reduce(
      (acc, m) => ({
        energy_kcal: acc.energy_kcal + m.energy_kcal,
        protein_g: acc.protein_g + m.protein_g,
        carbs_g: acc.carbs_g + m.carbs_g,
        fat_g: acc.fat_g + m.fat_g,
      }),
      { energy_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    );

    setResult({ meals: newMeals, total });
  };

  const updateTotal = (field: string, value: number) => {
    if (!result) return;
    setResult({ ...result, total: { ...result.total, [field]: value } });
  };

  if (!result) {
    return (
      <>
        <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={analyze}
        disabled={loading}
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analisando com IA...
          </>
        ) : (
          <>
            <Brain className="w-4 h-4" />
            Analisar Dieta com IA
          </>
        )}
        </Button>
        <AICreditsDialog
          open={creditsDialog.open}
          onOpenChange={(open) => setCreditsDialog((s) => ({ ...s, open }))}
          reason={creditsDialog.reason}
        />
      </>
    );
  }

  return (
    <>
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Análise Nutricional por IA
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={analyze} disabled={loading} className="h-7 gap-1 text-xs">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
            Reanalisar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Per-meal breakdown */}
        <div className="space-y-2">
          {result.meals.map((meal, idx) => {
            const label = meal.meal_number <= 6
              ? `Refeição ${meal.meal_number}`
              : `Refeição Extra`;
            const isEditing = editingMeal === idx;

            return (
              <div key={idx} className="rounded-lg border border-border bg-card p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {MEAL_LABELS[meal.meal_number] || meal.meal_name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditingMeal(isEditing ? null : idx)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    <div>
                      <Label className="text-[9px] text-muted-foreground">kcal</Label>
                      <Input
                        type="number"
                        className="h-7 text-xs"
                        value={meal.energy_kcal}
                        onChange={(e) => updateMeal(idx, "energy_kcal", Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-[9px] text-muted-foreground">Prot (g)</Label>
                      <Input
                        type="number"
                        className="h-7 text-xs"
                        value={meal.protein_g}
                        onChange={(e) => updateMeal(idx, "protein_g", Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-[9px] text-muted-foreground">Carb (g)</Label>
                      <Input
                        type="number"
                        className="h-7 text-xs"
                        value={meal.carbs_g}
                        onChange={(e) => updateMeal(idx, "carbs_g", Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-[9px] text-muted-foreground">Gord (g)</Label>
                      <Input
                        type="number"
                        className="h-7 text-xs"
                        value={meal.fat_g}
                        onChange={(e) => updateMeal(idx, "fat_g", Number(e.target.value))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold text-orange-600">🔥 {Math.round(meal.energy_kcal)} kcal</span>
                    <span className="text-[10px] font-semibold text-primary">💪 {Math.round(meal.protein_g)}g P</span>
                    <span className="text-[10px] font-semibold text-blue-600">🍞 {Math.round(meal.carbs_g)}g C</span>
                    <span className="text-[10px] font-semibold text-yellow-700">🥑 {Math.round(meal.fat_g)}g G</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-3">
          <Label className="text-xs font-semibold font-display mb-2 block">Total Geral (editável)</Label>
          <div className="grid grid-cols-4 gap-1.5">
            <div>
              <Label className="text-[9px] text-muted-foreground">kcal</Label>
              <Input
                type="number"
                className="h-7 text-xs font-semibold"
                value={Math.round(result.total.energy_kcal)}
                onChange={(e) => updateTotal("energy_kcal", Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-[9px] text-muted-foreground">Prot (g)</Label>
              <Input
                type="number"
                className="h-7 text-xs font-semibold"
                value={Math.round(result.total.protein_g)}
                onChange={(e) => updateTotal("protein_g", Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-[9px] text-muted-foreground">Carb (g)</Label>
              <Input
                type="number"
                className="h-7 text-xs font-semibold"
                value={Math.round(result.total.carbs_g)}
                onChange={(e) => updateTotal("carbs_g", Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-[9px] text-muted-foreground">Gord (g)</Label>
              <Input
                type="number"
                className="h-7 text-xs font-semibold"
                value={Math.round(result.total.fat_g)}
                onChange={(e) => updateTotal("fat_g", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="text-xs">
            Descartar
          </Button>
          <Button size="sm" onClick={() => onConfirm(result)} className="gap-1 text-xs">
            <Check className="w-3.5 h-3.5" />
            Confirmar Valores
          </Button>
        </div>
        {meta?.usage && (
          <AICreditUsage model={meta.model} usage={meta.usage} label="Consumo desta análise de dieta" />
        )}
      </CardContent>
    </Card>
    <AICreditsDialog
      open={creditsDialog.open}
      onOpenChange={(open) => setCreditsDialog((s) => ({ ...s, open }))}
      reason={creditsDialog.reason}
    />
    </>
  );
};

export default DietAIAnalysis;
