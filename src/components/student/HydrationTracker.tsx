import { Droplets, Plus, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HydrationTrackerProps {
  goalL: number;
  consumedMl: number;
  onAdd: (ml: number) => void;
  onRemove: () => void;
  isAdding?: boolean;
  disabled?: boolean;
}

const GLASS_ML = 250;

const HydrationTracker = ({ goalL, consumedMl, onAdd, onRemove, isAdding, disabled }: HydrationTrackerProps) => {
  const goalMl = goalL * 1000;
  const pct = goalMl > 0 ? Math.min(100, Math.round((consumedMl / goalMl) * 100)) : 0;
  const consumedL = (consumedMl / 1000).toFixed(1);
  const glasses = Math.floor(consumedMl / GLASS_ML);
  const totalGlasses = Math.ceil(goalMl / GLASS_ML);

  const handleAdd = () => {
    onAdd(GLASS_ML);
    if (consumedMl + GLASS_ML >= goalMl && consumedMl < goalMl) {
      toast.success("Meta de hidratação atingida! 💧🎉");
    }
  };

  return (
    <Card className="premium-card animate-fade-in border-blue-500/10" style={{ animationDelay: "0.15s" }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-tight">
          <Droplets className="w-4 h-4 text-blue-500" /> Hidratação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Água</span>
            <span className="text-foreground font-semibold tabular-nums">
              {consumedL}<span className="text-muted-foreground font-normal"> / {goalL.toFixed(1)} L</span>
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden relative">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                pct >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-blue-400 to-blue-600"
              )}
              style={{
                width: `${pct}%`,
                boxShadow: pct > 0 ? "0 0 10px hsl(210 100% 60% / 0.3)" : "none",
              }}
            />
            {/* Wave effect */}
            {pct > 0 && pct < 100 && (
              <div
                className="absolute top-0 h-full w-2 rounded-full bg-white/20 animate-pulse"
                style={{ left: `calc(${pct}% - 4px)` }}
              />
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{glasses} copos de 250ml</span>
            <span className="font-semibold tabular-nums text-blue-500">{pct}%</span>
          </div>
        </div>

        {/* Glass indicators */}
        {totalGlasses <= 20 && totalGlasses > 0 && (
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: totalGlasses }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-5 h-5 rounded-md border transition-all duration-300 flex items-center justify-center",
                  i < glasses
                    ? "bg-blue-500/20 border-blue-500/40 text-blue-500"
                    : "bg-muted/30 border-border/30"
                )}
              >
                {i < glasses && <Droplets className="w-2.5 h-2.5" />}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 border-blue-500/20 text-blue-600 hover:bg-blue-500/10 hover:border-blue-500/40"
            onClick={handleAdd}
            disabled={disabled || isAdding}
          >
            <Plus className="w-3.5 h-3.5" />
            +250ml
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 text-muted-foreground"
            onClick={onRemove}
            disabled={disabled || consumedMl === 0}
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HydrationTracker;
