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
    <div className="space-y-4" style={{ ["--sth-green" as any]: "#14b780" }}>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-[0.10]" style={{ background: "linear-gradient(135deg,#14b780,#0ea5e9)" }} />
        <div className="relative">
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
            <Apple className="w-3 h-3" /> Totais do Dia
          </p>
          <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
              <Flame className="w-4 h-4 mx-auto mb-1 text-orange-500" />
              <p className="text-xl font-mono font-bold tabular-nums" style={{ color: "#14b780" }}>{totals?.energy_kcal.toFixed(0) || "0"}</p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">Kcal</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
              <Beef className="w-4 h-4 mx-auto mb-1 text-red-500" />
              <p className="text-xl font-mono font-bold tabular-nums text-info">{totals?.protein_g.toFixed(1) || "0"}</p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">Proteína · g</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
              <Wheat className="w-4 h-4 mx-auto mb-1 text-amber-500" />
              <p className="text-xl font-mono font-bold tabular-nums text-warning">{totals?.carbs_g.toFixed(1) || "0"}</p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">Carbo · g</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
              <Droplets className="w-4 h-4 mx-auto mb-1 text-yellow-600" />
              <p className="text-xl font-mono font-bold tabular-nums" style={{ color: "hsl(25,85%,55%)" }}>{totals?.fat_g.toFixed(1) || "0"}</p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">Gordura · g</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
            <div className="flex justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <span className="text-muted-foreground">Fibras</span>
              <span className="font-bold text-foreground">{totals?.fiber_g.toFixed(1) || "0"}g</span>
            </div>
            <div className="flex justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <span className="text-muted-foreground">Açúcar</span>
              <span className="font-bold text-foreground">{totals?.sugar_g.toFixed(1) || "0"}g</span>
            </div>
            <div className="flex justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <span className="text-muted-foreground">Sódio</span>
              <span className="font-bold text-foreground">{totals?.sodium_mg.toFixed(0) || "0"}mg</span>
            </div>
            <div className="flex justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <span className="text-muted-foreground">Colesterol</span>
              <span className="font-bold text-foreground">{totals?.cholesterol_mg.toFixed(0) || "0"}mg</span>
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="w-3 h-3" /> Análise Metabólica
        </p>
        <div className="space-y-3">
          {!weight && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Peso não cadastrado na ficha do aluno</span>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex justify-between items-center rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Proteína / kg</span>
              <span className="font-mono font-bold text-sm text-info tabular-nums">{proteinPerKg} g/kg</span>
            </div>
            <div className="flex justify-between items-center rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Carbo / kg</span>
              <span className="font-mono font-bold text-sm text-warning tabular-nums">{carbsPerKg} g/kg</span>
            </div>
            <div className="flex justify-between items-center rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Gordura / kg</span>
              <span className="font-mono font-bold text-sm tabular-nums" style={{ color: "hsl(25,85%,55%)" }}>{fatPerKg} g/kg</span>
            </div>
          </div>
          {tdee && (
            <div className="border-t border-white/10 pt-3 space-y-2 font-mono tabular-nums">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">TDEE (Gasto)</span>
                <span className="font-bold text-foreground">{tdee.toFixed(0)} kcal</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Cardápio</span>
                <span className="font-bold" style={{ color: "#14b780" }}>{totals?.energy_kcal.toFixed(0) || "0"} kcal</span>
              </div>
              {calorieDiff !== null && (
                <div className={`flex justify-between items-center text-xs font-bold rounded-lg border px-3 py-2 ${calorieDiff > 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : calorieDiff < -200 ? "border-blue-500/30 bg-blue-500/10 text-blue-400" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"}`}>
                  <span>Balanço</span>
                  <span>{calorieDiff > 0 ? "+" : ""}{calorieDiff.toFixed(0)} kcal</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
          <Target className="w-3 h-3" /> Estratégia Nutricional
        </p>
          {currentStrategy && (
            <div className="flex items-center gap-3 mb-3 p-3 rounded-xl border border-white/10 bg-white/[0.04]">
              <StrategyIcon className={`w-6 h-6 ${currentStrategy.color}`} />
              <div>
                <p className="font-display font-bold text-sm uppercase tracking-tight">{currentStrategy.label}</p>
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
      </div>
    </div>
  );
};

export default NutritionSummaryPanel;
