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

/**
 * Maps a segmental value (typically 0-200+ scale) to a color.
 * Lower = red/orange (less muscle), Higher = green/teal (more muscle).
 * Returns HSL string.
 */
function segmentColor(value: number | null | undefined, fallback = "hsl(var(--muted))"): string {
  if (value == null) return fallback;
  // Normalize: assume typical range 50-150 for segmental analysis
  const clamped = Math.max(0, Math.min(200, value));
  if (clamped < 80) return "hsl(0, 65%, 55%)";       // Red - low
  if (clamped < 95) return "hsl(25, 80%, 55%)";      // Orange - below avg
  if (clamped < 105) return "hsl(45, 85%, 50%)";     // Yellow - average
  if (clamped < 120) return "hsl(120, 55%, 45%)";    // Green - good
  return "hsl(160, 65%, 40%)";                         // Teal - excellent
}

/**
 * Maps body fat % to a trunk color intensity
 */
function trunkColorFromFat(bodyFatPct: number | null | undefined, visceralFat: number | null | undefined): string {
  if (bodyFatPct == null && visceralFat == null) return "hsl(var(--muted))";
  // Use body fat % if available
  if (bodyFatPct != null) {
    if (bodyFatPct < 10) return "hsl(160, 65%, 40%)";
    if (bodyFatPct < 15) return "hsl(120, 55%, 45%)";
    if (bodyFatPct < 22) return "hsl(45, 85%, 50%)";
    if (bodyFatPct < 30) return "hsl(25, 80%, 55%)";
    return "hsl(0, 65%, 55%)";
  }
  return "hsl(var(--muted))";
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
    : trunkColorFromFat(metrics?.bodyFatPct, metrics?.visceralFat);

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
      {/* SVG Body */}
      <div className="relative w-[140px] h-[260px]">
        <svg
          viewBox="0 0 140 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
        >
          {/* Head */}
          <ellipse cx="70" cy="22" rx="16" ry="18" fill="hsl(var(--foreground))" opacity="0.15" />

          {/* Neck */}
          <rect x="63" y="38" width="14" height="10" rx="4" fill="hsl(var(--foreground))" opacity="0.12" />

          {/* Right Arm (viewer's left) */}
          <path
            d="M 32 52 Q 25 48, 18 60 Q 8 80, 10 105 Q 11 115, 16 118 Q 22 120, 26 110 Q 32 90, 35 75 Q 38 62, 38 55 Z"
            fill={rightArmColor}
            opacity="0.85"
            className="transition-colors duration-500"
          />

          {/* Left Arm (viewer's right) */}
          <path
            d="M 108 52 Q 115 48, 122 60 Q 132 80, 130 105 Q 129 115, 124 118 Q 118 120, 114 110 Q 108 90, 105 75 Q 102 62, 102 55 Z"
            fill={leftArmColor}
            opacity="0.85"
            className="transition-colors duration-500"
          />

          {/* Trunk */}
          <path
            d="M 38 48 Q 40 46, 70 46 Q 100 46, 102 48 L 105 85 Q 106 110, 100 130 Q 95 138, 70 140 Q 45 138, 40 130 Q 34 110, 35 85 Z"
            fill={trunkColor}
            opacity="0.8"
            className="transition-colors duration-500"
          />

          {/* Trunk center line (subtle) */}
          <line x1="70" y1="52" x2="70" y2="135" stroke="hsl(var(--background))" strokeWidth="0.5" opacity="0.3" />

          {/* Right Leg (viewer's left) */}
          <path
            d="M 42 136 Q 38 138, 36 155 Q 33 180, 35 210 Q 36 230, 38 245 Q 40 252, 48 252 Q 55 252, 55 245 Q 56 230, 58 210 Q 60 180, 62 155 Q 64 142, 65 140 Z"
            fill={rightLegColor}
            opacity="0.85"
            className="transition-colors duration-500"
          />

          {/* Left Leg (viewer's right) */}
          <path
            d="M 98 136 Q 102 138, 104 155 Q 107 180, 105 210 Q 104 230, 102 245 Q 100 252, 92 252 Q 85 252, 85 245 Q 84 230, 82 210 Q 80 180, 78 155 Q 76 142, 75 140 Z"
            fill={leftLegColor}
            opacity="0.85"
            className="transition-colors duration-500"
          />
        </svg>

        {/* Segmental labels */}
        {hasSegments && (
          <>
            {segments?.rightArm != null && (
              <div className="absolute top-[55px] left-[-8px] text-[8px] font-bold text-foreground bg-background/80 px-1 rounded">
                {segments.rightArm}
              </div>
            )}
            {segments?.leftArm != null && (
              <div className="absolute top-[55px] right-[-8px] text-[8px] font-bold text-foreground bg-background/80 px-1 rounded">
                {segments.leftArm}
              </div>
            )}
            {segments?.trunk != null && (
              <div className="absolute top-[75px] left-1/2 -translate-x-1/2 text-[8px] font-bold text-foreground bg-background/80 px-1 rounded">
                {segments.trunk}
              </div>
            )}
            {segments?.rightLeg != null && (
              <div className="absolute bottom-[25px] left-[12px] text-[8px] font-bold text-foreground bg-background/80 px-1 rounded">
                {segments.rightLeg}
              </div>
            )}
            {segments?.leftLeg != null && (
              <div className="absolute bottom-[25px] right-[12px] text-[8px] font-bold text-foreground bg-background/80 px-1 rounded">
                {segments.leftLeg}
              </div>
            )}
          </>
        )}
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <LegendDot color="hsl(0, 65%, 55%)" label="Baixo" />
        <LegendDot color="hsl(25, 80%, 55%)" label="Abaixo" />
        <LegendDot color="hsl(45, 85%, 50%)" label="Normal" />
        <LegendDot color="hsl(120, 55%, 45%)" label="Bom" />
        <LegendDot color="hsl(160, 65%, 40%)" label="Excelente" />
      </div>

      {/* Key metrics below body */}
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
  <div className="flex items-center gap-0.5">
    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
    <span className="text-[8px] text-muted-foreground">{label}</span>
  </div>
);

const MetricLabel = ({ label, value }: { label: string; value: string }) => (
  <div className="text-muted-foreground">
    <span className="font-medium text-foreground">{value}</span>{" "}
    <span>{label}</span>
  </div>
);

export default BodySilhouette;
