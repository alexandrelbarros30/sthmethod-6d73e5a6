import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DietOption {
  id: string;
  title: string;
  tab_label?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  energy_kcal?: number | null;
  is_active?: boolean | null;
}

interface DietSelectorProps {
  diets: DietOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const formatDate = (d?: string | null) => {
  if (!d) return null;
  const [y, m, day] = d.split("-");
  return `${day}/${m}`;
};

const todayStr = () => new Date().toISOString().split("T")[0];

export default function DietSelector({ diets, selectedId, onSelect }: DietSelectorProps) {
  if (!diets || diets.length <= 1) return null;
  const today = todayStr();

  return (
    <Card className="premium-card border-foreground/20 bg-gradient-to-br from-foreground/10 via-foreground/5 to-transparent animate-fade-in">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-foreground/15 flex items-center justify-center">
            <Utensils className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-foreground font-bold">Escolha seu cardápio</p>
            <p className="text-xs text-muted-foreground">Toque para alternar entre os planos disponíveis hoje</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {diets.map((d) => {
            const expired = !!d.end_date && d.end_date < today;
            const notStarted = !!d.start_date && d.start_date > today;
            const disabled = expired || notStarted;
            const isSelected = d.id === selectedId;
            const range = d.start_date || d.end_date
              ? `${formatDate(d.start_date) || "—"} → ${formatDate(d.end_date) || "—"}`
              : null;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => !disabled && onSelect(d.id)}
                disabled={disabled}
                className={cn(
                  "relative text-left p-3 rounded-xl border transition-all",
                  isSelected
                    ? "border-foreground bg-foreground/10 shadow-[0_0_0_1px_hsl(var(--primary))]"
                    : "border-border bg-card hover:border-foreground/50",
                  disabled && "opacity-40 grayscale cursor-not-allowed"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{d.tab_label || d.title || "Cardápio"}</p>
                    {d.energy_kcal ? (
                      <p className="text-[11px] text-muted-foreground tabular-nums">{Math.round(d.energy_kcal)} kcal</p>
                    ) : null}
                    {range && (
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5">{range}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-foreground" />}
                    {expired && <Badge variant="secondary" className="text-[9px]"><Lock className="w-2.5 h-2.5 mr-0.5" />Encerrada</Badge>}
                    {notStarted && <Badge variant="secondary" className="text-[9px]">Em breve</Badge>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}