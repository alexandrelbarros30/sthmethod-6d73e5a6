import { cn } from "@/lib/utils";

interface MacroProgressBarProps {
  label: string;
  consumed: number;
  total: number;
  unit?: string;
  color: string;
  className?: string;
}

const MacroProgressBar = ({ label, consumed, total, unit = "g", color, className }: MacroProgressBarProps) => {
  const pct = total > 0 ? Math.min(100, Math.round((consumed / total) * 100)) : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="text-foreground font-semibold tabular-nums">
          {Math.round(consumed)}<span className="text-muted-foreground font-normal"> / {Math.round(total)} {unit}</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden">
        <div
          className={cn("h-full rounded-full animate-fill-bar", color)}
          style={{
            width: `${pct}%`,
            boxShadow: pct > 0 ? `0 0 8px hsl(var(--primary) / 0.3)` : "none",
          }}
        />
      </div>
    </div>
  );
};

export default MacroProgressBar;
