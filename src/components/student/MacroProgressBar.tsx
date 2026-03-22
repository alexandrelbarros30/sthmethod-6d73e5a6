import { cn } from "@/lib/utils";

interface MacroProgressBarProps {
  label: string;
  consumed: number;
  total: number;
  unit?: string;
  color: string; // tailwind color class like "bg-blue-500"
  className?: string;
}

const MacroProgressBar = ({ label, consumed, total, unit = "g", color, className }: MacroProgressBarProps) => {
  const pct = total > 0 ? Math.min(100, Math.round((consumed / total) * 100)) : 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-body">{label}</span>
        <span className="text-foreground font-medium font-body">
          {Math.round(consumed)} / {Math.round(total)} {unit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default MacroProgressBar;
