import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Beef, Wheat, Droplets, Activity, Target, TrendingDown, TrendingUp, Minus, Apple, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";

export interface NutritionTotals {
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
}

interface Props {
  studentId: string;
  weight: number | null;
  tdee: number | null;
  objective: string | null;
  totals: NutritionTotals | null;
}

const NutritionSummaryPanel = ({ studentId, weight, tdee, objective, totals }: Props) => {
  const [manualStrategy, setManualStrategy] = useState<string | null>(null);

  const autoStrategy = useMemo(() => {
    if (!totals || !tdee) return null;
    const diff = totals.energy_kcal - tdee;
    if (diff < -200) return "deficit";
    if (diff > 200) return "superavit";
    return "manutencao";
  }, [totals, tdee]);

  const strategy = manualStrategy || autoStrategy;

  const strategyConfig: Record<string, { label: string; color: string; icon: any; description: string }> = {
    deficit: { label: "Déficit Calórico", color: "text-blue-500", icon: TrendingDown, description: "Perda de peso" },
    manutencao: { label: "Manutenção", color: "text-yellow-500", icon: Minus, description: "Manter peso" },
    superavit: { label: "Superávit Calórico", color: "text-green-500", icon: TrendingUp, description: "Hipertrofia" },
  };

  const currentStrategy = strategy ? strategyConfig[strategy] : null;
  const StrategyIcon = currentStrategy?.icon || Target;

  const proteinPerKg = weight && totals ? (totals.protein_g / weight).toFixed(2) : "–";
  const carbsPerKg = weight && totals ? (totals.carbs_g / weight).toFixed(2) : "–";
  const fatPerKg = weight && totals ? (totals.fat_g / weight).toFixed(2) : "–";
  const calorieDiff = totals && tdee ? totals.energy_kcal - tdee : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Apple className="w-4 h-4 text-primary" /> Totais do Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Flame className="w-4 h-4 mx-auto mb-1 text-orange-500" />
              <p className="text-xl font-bold">{totals?.energy_kcal.toFixed(0) || "0"}</p>
              <p className="text-[10px] text-muted-foreground">Kcal</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Beef className="w-4 h-4 mx-auto mb-1 text-red-500" />
              <p className="text-xl font-bold">{totals?.protein_g.toFixed(1) || "0"}</p>
              <p className="text-[10px] text-muted-foreground">Proteína (g)</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Wheat className="w-4 h-4 mx-auto mb-1 text-amber-500" />
              <p className="text-xl font-bold">{totals?.carbs_g.toFixed(1) || "0"}</p>
              <p className="text-[10px] text-muted-foreground">Carboidratos (g)</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Droplets className="w-4 h-4 mx-auto mb-1 text-yellow-600" />
              <p className="text-xl font-bold">{totals?.fat_g.toFixed(1) || "0"}</p>
              <p className="text-[10px] text-muted-foreground">Gordura (g)</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between bg-muted/30 rounded px-3 py-2">
              <span className="text-muted-foreground">Fibras</span>
              <span className="font-medium">{totals?.fiber_g.toFixed(1) || "0"}g</span>
            </div>
            <div className="flex justify-between bg-muted/30 rounded px-3 py-2">
              <span className="text-muted-foreground">Açúcar</span>
              <span className="font-medium">{totals?.sugar_g.toFixed(1) || "0"}g</span>
            </div>
            <div className="flex justify-between bg-muted/30 rounded px-3 py-2">
              <span className="text-muted-foreground">Sódio</span>
              <span className="font-medium">{totals?.sodium_mg.toFixed(0) || "0"}mg</span>
            </div>
            <div className="flex justify-between bg-muted/30 rounded px-3 py-2">
              <span className="text-muted-foreground">Colesterol</span>
              <span className="font-medium">{totals?.cholesterol_mg.toFixed(0) || "0"}mg</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Análise Metabólica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!weight && (
            <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 rounded-lg p-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Peso não cadastrado na ficha do aluno</span>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-muted/50 rounded-lg px-3 py-2.5">
              <span className="text-xs text-muted-foreground">Proteína / kg</span>
              <span className="font-bold text-sm">{proteinPerKg} g/kg</span>
            </div>
            <div className="flex justify-between items-center bg-muted/50 rounded-lg px-3 py-2.5">
              <span className="text-xs text-muted-foreground">Carboidrato / kg</span>
              <span className="font-bold text-sm">{carbsPerKg} g/kg</span>
            </div>
            <div className="flex justify-between items-center bg-muted/50 rounded-lg px-3 py-2.5">
              <span className="text-xs text-muted-foreground">Gordura / kg</span>
              <span className="font-bold text-sm">{fatPerKg} g/kg</span>
            </div>
          </div>
          {tdee && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">TDEE (Gasto)</span>
                <span className="font-medium">{tdee.toFixed(0)} kcal</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Cardápio</span>
                <span className="font-medium">{totals?.energy_kcal.toFixed(0) || "0"} kcal</span>
              </div>
              {calorieDiff !== null && (
                <div className={`flex justify-between items-center text-xs font-bold rounded-lg px-3 py-2 ${calorieDiff > 0 ? "bg-green-500/10 text-green-600" : calorieDiff < -200 ? "bg-blue-500/10 text-blue-600" : "bg-yellow-500/10 text-yellow-600"}`}>
                  <span>Balanço</span>
                  <span>{calorieDiff > 0 ? "+" : ""}{calorieDiff.toFixed(0)} kcal</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Estratégia Nutricional
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStrategy && (
            <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-muted/50">
              <StrategyIcon className={`w-6 h-6 ${currentStrategy.color}`} />
              <div>
                <p className="font-bold text-sm">{currentStrategy.label}</p>
                <p className="text-xs text-muted-foreground">{currentStrategy.description}</p>
              </div>
              {!manualStrategy && <Badge variant="outline" className="text-[10px] ml-auto">Auto</Badge>}
            </div>
          )}
          <Select value={manualStrategy || ""} onValueChange={(v) => setManualStrategy(v || null)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Alterar estratégia manualmente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deficit">Déficit — Perda de peso</SelectItem>
              <SelectItem value="manutencao">Manutenção — Manter peso</SelectItem>
              <SelectItem value="superavit">Superávit — Hipertrofia</SelectItem>
            </SelectContent>
          </Select>
          {objective && (
            <p className="text-xs text-muted-foreground mt-2">
              Objetivo do aluno: <span className="font-medium text-foreground">{objective}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NutritionSummaryPanel;
