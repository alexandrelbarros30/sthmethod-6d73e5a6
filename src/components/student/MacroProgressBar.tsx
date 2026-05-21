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

  // Map tailwind bg-* token to an HSL var to use for glow/gradient
  const colorVar = color.includes("info")
    ? "hsl(var(--info))"
    : color.includes("warning")
    ? "hsl(var(--warning))"
    : color.includes("foreground")
    ? "hsl(var(--foreground))"
    : color.includes("25,85%,55%")
    ? "hsl(25 85% 55%)"
    : "hsl(var(--primary))";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-[11px]">
        <span
          className="font-bold tracking-[0.18em] uppercase"
          style={{ color: colorVar, textShadow: `0 0 8px ${colorVar.replace(")", " / 0.55)")}` }}
        >
          {label}
        </span>
        <span className="font-mono font-semibold tabular-nums text-foreground/90">
          {Math.round(consumed)}
          <span className="text-muted-foreground font-normal"> / {Math.round(total)} {unit}</span>
          <span
            className="ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-tight border"
            style={{
              color: colorVar,
              borderColor: colorVar.replace(")", " / 0.4)"),
              background: colorVar.replace(")", " / 0.08)"),
            }}
          >
            {pct}%
          </span>
        </span>
      </div>
      <div
        className="relative h-3 w-full rounded-full overflow-hidden border border-white/5 bg-muted/40 ring-1 ring-inset ring-white/5"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out neon-bar"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${colorVar.replace(")", " / 0.7)")}, ${colorVar})`,
            boxShadow:
              pct > 0
                ? `0 0 8px ${colorVar.replace(")", " / 0.7)")}, 0 0 18px ${colorVar.replace(")", " / 0.45)")}, inset 0 0 6px rgba(255,255,255,0.35)`
                : "none",
          }}
        />
        {/* shimmer overlay */}
        {pct > 0 && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${pct}%`,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
              mixBlendMode: "overlay",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MacroProgressBar;
