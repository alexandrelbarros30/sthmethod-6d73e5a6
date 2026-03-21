import React from "react";

interface SegmentData {
  leftArm?: number | null;
  rightArm?: number | null;
  leftLeg?: number | null;
  rightLeg?: number | null;
  trunk?: number | null;
}

interface BodyMetrics {
  bodyFatPct?: number | null;
  leanMassKg?: number | null;
  fatMassKg?: number | null;
  skeletalMuscleKg?: number | null;
  totalWeight?: number | null;
  visceralFat?: number | null;
  totalWaterPct?: number | null;
}

interface BodySilhouetteProps {
  segments?: SegmentData;
  metrics?: BodyMetrics;
  gender?: string | null;
  className?: string;
}

function segmentColor(value: number | null | undefined, fallback = "hsl(var(--muted))"): string {
  if (value == null) return fallback;
  const clamped = Math.max(0, Math.min(200, value));
  if (clamped < 80) return "hsl(0, 65%, 55%)";
  if (clamped < 95) return "hsl(25, 80%, 55%)";
  if (clamped < 105) return "hsl(45, 85%, 50%)";
  if (clamped < 120) return "hsl(120, 55%, 45%)";
  return "hsl(160, 65%, 40%)";
}

function trunkColorFromFat(bodyFatPct: number | null | undefined): string {
  if (bodyFatPct == null) return "hsl(var(--muted))";
  if (bodyFatPct < 10) return "hsl(160, 65%, 40%)";
  if (bodyFatPct < 15) return "hsl(120, 55%, 45%)";
  if (bodyFatPct < 22) return "hsl(45, 85%, 50%)";
  if (bodyFatPct < 30) return "hsl(25, 80%, 55%)";
  return "hsl(0, 65%, 55%)";
}

const BodySilhouette: React.FC<BodySilhouetteProps> = ({
  segments,
  metrics,
  className = "",
}) => {
  const leftArmColor = segmentColor(segments?.leftArm);
  const rightArmColor = segmentColor(segments?.rightArm);
  const leftLegColor = segmentColor(segments?.leftLeg);
  const rightLegColor = segmentColor(segments?.rightLeg);
  const trunkColor = segments?.trunk != null
    ? segmentColor(segments.trunk)
    : trunkColorFromFat(metrics?.bodyFatPct);

  const hasSegments = segments && (
    segments.leftArm != null || segments.rightArm != null ||
    segments.leftLeg != null || segments.rightLeg != null ||
    segments.trunk != null
  );

  const hasMetrics = metrics && (
    metrics.bodyFatPct != null || metrics.totalWeight != null
  );

  if (!hasSegments && !hasMetrics) {
    return (
      <div className={`flex flex-col items-center gap-2 py-4 ${className}`}>
        <div className="text-muted-foreground text-xs text-center">
          Dados segmentares não disponíveis
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative w-[160px] h-[300px]">
        <svg
          viewBox="0 0 200 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}
        >
          <defs>
            <linearGradient id="headGrad" x1="100" y1="0" x2="100" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.18" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id="neckGrad" x1="100" y1="42" x2="100" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.08" />
            </linearGradient>
            {/* Muscle definition overlay */}
            <filter id="muscleGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Head - athletic proportioned */}
          <ellipse cx="100" cy="22" rx="18" ry="20" fill="url(#headGrad)" />
          {/* Jaw line */}
          <path d="M 82 26 Q 84 40, 100 44 Q 116 40, 118 26" fill="url(#headGrad)" />

          {/* Neck - muscular */}
          <path d="M 88 42 L 86 56 Q 87 60, 100 60 Q 113 60, 114 56 L 112 42" fill="url(#neckGrad)" />
          {/* Trapezius */}
          <path d="M 86 56 Q 70 58, 52 68 L 56 64 Q 72 56, 86 54" fill="hsl(var(--foreground))" opacity="0.06" />
          <path d="M 114 56 Q 130 58, 148 68 L 144 64 Q 128 56, 114 54" fill="hsl(var(--foreground))" opacity="0.06" />

          {/* Right Arm (viewer's left) - athletic with deltoid, bicep, forearm */}
          <path
            d="M 50 68 Q 38 66, 28 74 Q 20 82, 18 98 Q 16 112, 18 128 Q 19 138, 22 148 Q 24 156, 28 162 Q 30 166, 34 166 Q 38 166, 40 160 Q 44 148, 46 136 Q 48 124, 50 112 Q 52 98, 54 86 Q 55 76, 52 70 Z"
            fill={rightArmColor}
            opacity="0.85"
            className="transition-colors duration-700"
            filter="url(#muscleGlow)"
          />
          {/* Right arm muscle line */}
          <path d="M 36 90 Q 34 105, 36 120" stroke="hsl(var(--background))" strokeWidth="0.6" opacity="0.25" fill="none" />

          {/* Left Arm (viewer's right) */}
          <path
            d="M 150 68 Q 162 66, 172 74 Q 180 82, 182 98 Q 184 112, 182 128 Q 181 138, 178 148 Q 176 156, 172 162 Q 170 166, 166 166 Q 162 166, 160 160 Q 156 148, 154 136 Q 152 124, 150 112 Q 148 98, 146 86 Q 145 76, 148 70 Z"
            fill={leftArmColor}
            opacity="0.85"
            className="transition-colors duration-700"
            filter="url(#muscleGlow)"
          />
          {/* Left arm muscle line */}
          <path d="M 164 90 Q 166 105, 164 120" stroke="hsl(var(--background))" strokeWidth="0.6" opacity="0.25" fill="none" />

          {/* Trunk - V-taper athletic torso */}
          <path
            d="M 52 68 Q 54 62, 76 60 Q 100 58, 124 60 Q 146 62, 148 68 
               L 150 80 Q 152 100, 148 120 Q 146 135, 140 148 
               Q 136 156, 130 162 Q 120 168, 100 170 
               Q 80 168, 70 162 Q 64 156, 60 148 
               Q 54 135, 52 120 Q 48 100, 50 80 Z"
            fill={trunkColor}
            opacity="0.8"
            className="transition-colors duration-700"
            filter="url(#muscleGlow)"
          />
          {/* Abs definition lines */}
          <line x1="100" y1="68" x2="100" y2="158" stroke="hsl(var(--background))" strokeWidth="0.5" opacity="0.2" />
          <path d="M 85 88 Q 100 90, 115 88" stroke="hsl(var(--background))" strokeWidth="0.4" opacity="0.15" fill="none" />
          <path d="M 84 105 Q 100 107, 116 105" stroke="hsl(var(--background))" strokeWidth="0.4" opacity="0.15" fill="none" />
          <path d="M 83 122 Q 100 124, 117 122" stroke="hsl(var(--background))" strokeWidth="0.4" opacity="0.15" fill="none" />
          <path d="M 84 138 Q 100 140, 116 138" stroke="hsl(var(--background))" strokeWidth="0.4" opacity="0.15" fill="none" />
          {/* Pec line */}
          <path d="M 58 76 Q 75 84, 100 86 Q 125 84, 142 76" stroke="hsl(var(--background))" strokeWidth="0.5" opacity="0.15" fill="none" />

          {/* Right Leg (viewer's left) - athletic quads/calves */}
          <path
            d="M 68 166 Q 60 170, 54 185 Q 48 205, 46 228 
               Q 44 248, 44 268 Q 44 288, 46 305 
               Q 47 318, 50 330 Q 52 342, 54 350 
               Q 56 360, 60 364 Q 64 368, 68 366 
               Q 72 364, 74 356 Q 76 342, 78 328 
               Q 80 310, 82 290 Q 84 268, 86 248 
               Q 88 228, 90 208 Q 92 190, 94 178 
               Q 95 172, 94 168 Z"
            fill={rightLegColor}
            opacity="0.85"
            className="transition-colors duration-700"
            filter="url(#muscleGlow)"
          />
          {/* Right leg muscle line */}
          <path d="M 70 200 Q 66 230, 66 260" stroke="hsl(var(--background))" strokeWidth="0.5" opacity="0.2" fill="none" />
          {/* Right calf definition */}
          <path d="M 56 290 Q 54 305, 56 318" stroke="hsl(var(--background))" strokeWidth="0.4" opacity="0.15" fill="none" />

          {/* Left Leg (viewer's right) */}
          <path
            d="M 132 166 Q 140 170, 146 185 Q 152 205, 154 228 
               Q 156 248, 156 268 Q 156 288, 154 305 
               Q 153 318, 150 330 Q 148 342, 146 350 
               Q 144 360, 140 364 Q 136 368, 132 366 
               Q 128 364, 126 356 Q 124 342, 122 328 
               Q 120 310, 118 290 Q 116 268, 114 248 
               Q 112 228, 110 208 Q 108 190, 106 178 
               Q 105 172, 106 168 Z"
            fill={leftLegColor}
            opacity="0.85"
            className="transition-colors duration-700"
            filter="url(#muscleGlow)"
          />
          {/* Left leg muscle line */}
          <path d="M 130 200 Q 134 230, 134 260" stroke="hsl(var(--background))" strokeWidth="0.5" opacity="0.2" fill="none" />
          {/* Left calf definition */}
          <path d="M 144 290 Q 146 305, 144 318" stroke="hsl(var(--background))" strokeWidth="0.4" opacity="0.15" fill="none" />

          {/* Subtle body outline glow */}
          <path
            d="M 100 44 Q 86 42, 82 26"
            stroke="hsl(var(--foreground))" strokeWidth="0.3" opacity="0.08" fill="none"
          />
        </svg>

        {/* Segmental value labels */}
        {hasSegments && (
          <>
            {segments?.rightArm != null && (
              <div className="absolute top-[28%] left-[-6px] text-[9px] font-bold text-foreground bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm border border-border/30">
                {segments.rightArm}
              </div>
            )}
            {segments?.leftArm != null && (
              <div className="absolute top-[28%] right-[-6px] text-[9px] font-bold text-foreground bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm border border-border/30">
                {segments.leftArm}
              </div>
            )}
            {segments?.trunk != null && (
              <div className="absolute top-[32%] left-1/2 -translate-x-1/2 text-[9px] font-bold text-foreground bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm border border-border/30">
                {segments.trunk}
              </div>
            )}
            {segments?.rightLeg != null && (
              <div className="absolute bottom-[12%] left-[10px] text-[9px] font-bold text-foreground bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm border border-border/30">
                {segments.rightLeg}
              </div>
            )}
            {segments?.leftLeg != null && (
              <div className="absolute bottom-[12%] right-[10px] text-[9px] font-bold text-foreground bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm border border-border/30">
                {segments.leftLeg}
              </div>
            )}
          </>
        )}
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <LegendDot color="hsl(0, 65%, 55%)" label="Baixo" />
        <LegendDot color="hsl(25, 80%, 55%)" label="Abaixo" />
        <LegendDot color="hsl(45, 85%, 50%)" label="Normal" />
        <LegendDot color="hsl(120, 55%, 45%)" label="Bom" />
        <LegendDot color="hsl(160, 65%, 40%)" label="Excelente" />
      </div>

      {/* Key metrics */}
      {hasMetrics && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-center">
          {metrics?.totalWeight != null && (
            <MetricLabel label="Peso" value={`${metrics.totalWeight} kg`} />
          )}
          {metrics?.bodyFatPct != null && (
            <MetricLabel label="Gordura" value={`${metrics.bodyFatPct}%`} />
          )}
          {metrics?.skeletalMuscleKg != null && (
            <MetricLabel label="M. Esquelética" value={`${metrics.skeletalMuscleKg} kg`} />
          )}
          {metrics?.totalWaterPct != null && (
            <MetricLabel label="Água" value={`${metrics.totalWaterPct}%`} />
          )}
        </div>
      )}
    </div>
  );
};

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1">
    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }} />
    <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
  </div>
);

const MetricLabel = ({ label, value }: { label: string; value: string }) => (
  <div className="text-muted-foreground">
    <span className="font-semibold text-foreground">{value}</span>{" "}
    <span>{label}</span>
  </div>
);

export default BodySilhouette;
