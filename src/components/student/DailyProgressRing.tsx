import { cn } from "@/lib/utils";

interface DailyProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

const DailyProgressRing = ({
  percent,
  size = 160,
  strokeWidth = 10,
  label,
  sublabel,
  className,
}: DailyProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{
            filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.4))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground font-display">{percent}%</span>
        {label && <span className="text-xs text-muted-foreground font-body mt-0.5">{label}</span>}
        {sublabel && (
          <span className="text-[10px] text-primary font-medium mt-0.5 px-2 py-0.5 rounded-full bg-primary/10">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default DailyProgressRing;
