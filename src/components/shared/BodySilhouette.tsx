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

function segmentNeonColor(value: number | null | undefined): string {
  if (value == null) return "rgba(100,100,120,0.3)";
  const clamped = Math.max(0, Math.min(200, value));
  if (clamped < 80) return "#ff3355";
  if (clamped < 95) return "#ff8833";
  if (clamped < 105) return "#ffdd33";
  if (clamped < 120) return "#33ff88";
  return "#00ffcc";
}

function trunkNeonFromFat(bodyFatPct: number | null | undefined): string {
  if (bodyFatPct == null) return "rgba(100,100,120,0.3)";
  if (bodyFatPct < 10) return "#00ffcc";
  if (bodyFatPct < 15) return "#33ff88";
  if (bodyFatPct < 22) return "#ffdd33";
  if (bodyFatPct < 30) return "#ff8833";
  return "#ff3355";
}

function glowFilter(color: string, id: string) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={color} floodOpacity="0.7" />
      <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={color} floodOpacity="0.3" />
    </filter>
  );
}

const BodySilhouette: React.FC<BodySilhouetteProps> = ({
  segments,
  metrics,
  className = "",
}) => {
  const rightArmC = segmentNeonColor(segments?.rightArm);
  const leftArmC = segmentNeonColor(segments?.leftArm);
  const rightLegC = segmentNeonColor(segments?.rightLeg);
  const leftLegC = segmentNeonColor(segments?.leftLeg);
  const trunkC = segments?.trunk != null
    ? segmentNeonColor(segments.trunk)
    : trunkNeonFromFat(metrics?.bodyFatPct);

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

  // DNA helix points generator
  const dnaHelixPath = (yStart: number, yEnd: number, xCenter: number, amplitude: number, phase: number) => {
    const points = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = yStart + (yEnd - yStart) * t;
      const x = xCenter + Math.sin(t * Math.PI * 4 + phase) * amplitude;
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative w-[180px] h-[320px]">
        <svg
          viewBox="0 0 220 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Neon glow filters for each segment */}
            {glowFilter(rightArmC, "glowRA")}
            {glowFilter(leftArmC, "glowLA")}
            {glowFilter(rightLegC, "glowRL")}
            {glowFilter(leftLegC, "glowLL")}
            {glowFilter(trunkC, "glowTrunk")}
            {glowFilter("#00ddff", "glowHead")}
            {glowFilter("#00ddff", "glowDna")}

            {/* Subtle grid pattern */}
            <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,220,255,0.04)" strokeWidth="0.3" />
            </pattern>

            {/* Scan line animation */}
            <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="45%" stopColor="rgba(0,255,200,0.08)" />
              <stop offset="50%" stopColor="rgba(0,255,200,0.25)" />
              <stop offset="55%" stopColor="rgba(0,255,200,0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            <linearGradient id="bodyFill" x1="110" y1="0" x2="110" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(0,220,255,0.05)" />
              <stop offset="50%" stopColor="rgba(0,220,255,0.02)" />
              <stop offset="100%" stopColor="rgba(0,220,255,0.05)" />
            </linearGradient>
          </defs>

          {/* Background grid */}
          <rect width="220" height="400" fill="url(#gridPattern)" />

          {/* === DNA HELIX STRANDS running through the body === */}
          <path
            d={dnaHelixPath(15, 385, 110, 18, 0)}
            stroke="#00ddff"
            strokeWidth="1.2"
            opacity="0.35"
            fill="none"
            filter="url(#glowDna)"
          />
          <path
            d={dnaHelixPath(15, 385, 110, 18, Math.PI)}
            stroke="#00ffcc"
            strokeWidth="1.2"
            opacity="0.35"
            fill="none"
            filter="url(#glowDna)"
          />
          {/* DNA rungs */}
          {Array.from({ length: 16 }, (_, i) => {
            const t = (i + 0.5) / 16;
            const y = 15 + (385 - 15) * t;
            const x1 = 110 + Math.sin(t * Math.PI * 4) * 18;
            const x2 = 110 + Math.sin(t * Math.PI * 4 + Math.PI) * 18;
            return (
              <line key={i} x1={x1} y1={y} x2={x2} y2={y}
                stroke="#00ddff" strokeWidth="0.5" opacity="0.15" />
            );
          })}

          {/* === HEAD — circuit/tech pattern === */}
          <ellipse cx="110" cy="28" rx="19" ry="21"
            fill="rgba(0,200,255,0.06)" stroke="#00ddff" strokeWidth="0.8" opacity="0.6"
            filter="url(#glowHead)"
          />
          {/* Circuit lines on head */}
          <circle cx="110" cy="28" r="10" fill="none" stroke="#00ddff" strokeWidth="0.3" opacity="0.3" strokeDasharray="2 3" />
          <line x1="110" y1="12" x2="110" y2="20" stroke="#00ddff" strokeWidth="0.4" opacity="0.4" />

          {/* Jaw */}
          <path d="M 91 32 Q 94 46, 110 50 Q 126 46, 129 32"
            fill="rgba(0,200,255,0.04)" stroke="#00ddff" strokeWidth="0.5" opacity="0.4" />

          {/* === NECK === */}
          <path d="M 98 48 L 96 60 Q 98 64, 110 64 Q 122 64, 124 60 L 122 48"
            fill="rgba(0,200,255,0.03)" stroke="#00ddff" strokeWidth="0.4" opacity="0.3" />

          {/* === TRUNK — V-taper athletic === */}
          <path
            d="M 62 72 Q 64 66, 86 64 Q 110 62, 134 64 Q 156 66, 158 72 
               L 160 84 Q 162 104, 158 124 Q 156 139, 150 152 
               Q 146 160, 140 166 Q 130 172, 110 174 
               Q 90 172, 80 166 Q 74 160, 70 152 
               Q 64 139, 62 124 Q 58 104, 60 84 Z"
            fill="rgba(0,0,0,0.3)"
            stroke={trunkC}
            strokeWidth="1.5"
            opacity="0.9"
            filter="url(#glowTrunk)"
            className="transition-all duration-700"
          />
          {/* Abs circuit lines */}
          <line x1="110" y1="72" x2="110" y2="162" stroke={trunkC} strokeWidth="0.4" opacity="0.3" />
          <path d="M 95 92 Q 110 94, 125 92" stroke={trunkC} strokeWidth="0.3" opacity="0.25" fill="none" />
          <path d="M 94 109 Q 110 111, 126 109" stroke={trunkC} strokeWidth="0.3" opacity="0.25" fill="none" />
          <path d="M 93 126 Q 110 128, 127 126" stroke={trunkC} strokeWidth="0.3" opacity="0.25" fill="none" />
          <path d="M 94 142 Q 110 144, 126 142" stroke={trunkC} strokeWidth="0.3" opacity="0.25" fill="none" />
          {/* Pec arc */}
          <path d="M 68 80 Q 85 88, 110 90 Q 135 88, 152 80" stroke={trunkC} strokeWidth="0.4" opacity="0.2" fill="none" />
          {/* Inner glow fill */}
          <path
            d="M 62 72 Q 64 66, 86 64 Q 110 62, 134 64 Q 156 66, 158 72 
               L 160 84 Q 162 104, 158 124 Q 156 139, 150 152 
               Q 146 160, 140 166 Q 130 172, 110 174 
               Q 90 172, 80 166 Q 74 160, 70 152 
               Q 64 139, 62 124 Q 58 104, 60 84 Z"
            fill={trunkC}
            opacity="0.08"
          />

          {/* === RIGHT ARM (viewer's left) === */}
          <path
            d="M 60 72 Q 48 70, 38 78 Q 30 86, 28 102 Q 26 116, 28 132 Q 29 142, 32 152 Q 34 160, 38 166 Q 40 170, 44 170 Q 48 170, 50 164 Q 54 152, 56 140 Q 58 128, 60 116 Q 62 102, 64 90 Q 65 80, 62 74 Z"
            fill="rgba(0,0,0,0.3)"
            stroke={rightArmC}
            strokeWidth="1.5"
            opacity="0.9"
            filter="url(#glowRA)"
            className="transition-all duration-700"
          />
          <path
            d="M 60 72 Q 48 70, 38 78 Q 30 86, 28 102 Q 26 116, 28 132 Q 29 142, 32 152 Q 34 160, 38 166 Q 40 170, 44 170 Q 48 170, 50 164 Q 54 152, 56 140 Q 58 128, 60 116 Q 62 102, 64 90 Q 65 80, 62 74 Z"
            fill={rightArmC} opacity="0.08"
          />
          {/* Muscle circuit line */}
          <path d="M 44 94 Q 42 110, 44 126" stroke={rightArmC} strokeWidth="0.4" opacity="0.3" fill="none" />

          {/* === LEFT ARM (viewer's right) === */}
          <path
            d="M 160 72 Q 172 70, 182 78 Q 190 86, 192 102 Q 194 116, 192 132 Q 191 142, 188 152 Q 186 160, 182 166 Q 180 170, 176 170 Q 172 170, 170 164 Q 166 152, 164 140 Q 162 128, 160 116 Q 158 102, 156 90 Q 155 80, 158 74 Z"
            fill="rgba(0,0,0,0.3)"
            stroke={leftArmC}
            strokeWidth="1.5"
            opacity="0.9"
            filter="url(#glowLA)"
            className="transition-all duration-700"
          />
          <path
            d="M 160 72 Q 172 70, 182 78 Q 190 86, 192 102 Q 194 116, 192 132 Q 191 142, 188 152 Q 186 160, 182 166 Q 180 170, 176 170 Q 172 170, 170 164 Q 166 152, 164 140 Q 162 128, 160 116 Q 158 102, 156 90 Q 155 80, 158 74 Z"
            fill={leftArmC} opacity="0.08"
          />
          <path d="M 176 94 Q 178 110, 176 126" stroke={leftArmC} strokeWidth="0.4" opacity="0.3" fill="none" />

          {/* === RIGHT LEG (viewer's left) === */}
          <path
            d="M 78 170 Q 70 174, 64 189 Q 58 209, 56 232 
               Q 54 252, 54 272 Q 54 292, 56 309 
               Q 57 322, 60 334 Q 62 346, 64 354 
               Q 66 364, 70 368 Q 74 372, 78 370 
               Q 82 368, 84 360 Q 86 346, 88 332 
               Q 90 314, 92 294 Q 94 272, 96 252 
               Q 98 232, 100 212 Q 102 194, 104 182 
               Q 105 176, 104 172 Z"
            fill="rgba(0,0,0,0.3)"
            stroke={rightLegC}
            strokeWidth="1.5"
            opacity="0.9"
            filter="url(#glowRL)"
            className="transition-all duration-700"
          />
          <path
            d="M 78 170 Q 70 174, 64 189 Q 58 209, 56 232 
               Q 54 252, 54 272 Q 54 292, 56 309 
               Q 57 322, 60 334 Q 62 346, 64 354 
               Q 66 364, 70 368 Q 74 372, 78 370 
               Q 82 368, 84 360 Q 86 346, 88 332 
               Q 90 314, 92 294 Q 94 272, 96 252 
               Q 98 232, 100 212 Q 102 194, 104 182 
               Q 105 176, 104 172 Z"
            fill={rightLegC} opacity="0.08"
          />
          <path d="M 80 204 Q 76 234, 76 264" stroke={rightLegC} strokeWidth="0.4" opacity="0.3" fill="none" />
          <path d="M 66 294 Q 64 309, 66 322" stroke={rightLegC} strokeWidth="0.3" opacity="0.2" fill="none" />

          {/* === LEFT LEG (viewer's right) === */}
          <path
            d="M 142 170 Q 150 174, 156 189 Q 162 209, 164 232 
               Q 166 252, 166 272 Q 166 292, 164 309 
               Q 163 322, 160 334 Q 158 346, 156 354 
               Q 154 364, 150 368 Q 146 372, 142 370 
               Q 138 368, 136 360 Q 134 346, 132 332 
               Q 130 314, 128 294 Q 126 272, 124 252 
               Q 122 232, 120 212 Q 118 194, 116 182 
               Q 115 176, 116 172 Z"
            fill="rgba(0,0,0,0.3)"
            stroke={leftLegC}
            strokeWidth="1.5"
            opacity="0.9"
            filter="url(#glowLL)"
            className="transition-all duration-700"
          />
          <path
            d="M 142 170 Q 150 174, 156 189 Q 162 209, 164 232 
               Q 166 252, 166 272 Q 166 292, 164 309 
               Q 163 322, 160 334 Q 158 346, 156 354 
               Q 154 364, 150 368 Q 146 372, 142 370 
               Q 138 368, 136 360 Q 134 346, 132 332 
               Q 130 314, 128 294 Q 126 272, 124 252 
               Q 122 232, 120 212 Q 118 194, 116 182 
               Q 115 176, 116 172 Z"
            fill={leftLegC} opacity="0.08"
          />
          <path d="M 140 204 Q 144 234, 144 264" stroke={leftLegC} strokeWidth="0.4" opacity="0.3" fill="none" />
          <path d="M 154 294 Q 156 309, 154 322" stroke={leftLegC} strokeWidth="0.3" opacity="0.2" fill="none" />

          {/* Scan line animation overlay */}
          <rect x="0" y="0" width="220" height="400" fill="url(#scanGrad)" opacity="0.5">
            <animateTransform attributeName="transform" type="translate" from="0 -400" to="0 400" dur="4s" repeatCount="indefinite" />
          </rect>

          {/* Corner tech markers */}
          <path d="M 5 5 L 5 20" stroke="#00ddff" strokeWidth="0.5" opacity="0.3" />
          <path d="M 5 5 L 20 5" stroke="#00ddff" strokeWidth="0.5" opacity="0.3" />
          <path d="M 215 5 L 215 20" stroke="#00ddff" strokeWidth="0.5" opacity="0.3" />
          <path d="M 215 5 L 200 5" stroke="#00ddff" strokeWidth="0.5" opacity="0.3" />
          <path d="M 5 395 L 5 380" stroke="#00ddff" strokeWidth="0.5" opacity="0.3" />
          <path d="M 5 395 L 20 395" stroke="#00ddff" strokeWidth="0.5" opacity="0.3" />
          <path d="M 215 395 L 215 380" stroke="#00ddff" strokeWidth="0.5" opacity="0.3" />
          <path d="M 215 395 L 200 395" stroke="#00ddff" strokeWidth="0.5" opacity="0.3" />

          {/* Tech label */}
          <text x="110" y="396" textAnchor="middle" fill="#00ddff" fontSize="5" opacity="0.4" fontFamily="monospace">
            DNA • BIOANALYSIS
          </text>
        </svg>

        {/* Segmental value labels with neon style */}
        {hasSegments && (
          <>
            {segments?.rightArm != null && (
              <div className="absolute top-[26%] left-[-4px] text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{ color: rightArmC, borderColor: rightArmC, backgroundColor: 'rgba(0,0,0,0.7)', boxShadow: `0 0 8px ${rightArmC}40` }}>
                {segments.rightArm}
              </div>
            )}
            {segments?.leftArm != null && (
              <div className="absolute top-[26%] right-[-4px] text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{ color: leftArmC, borderColor: leftArmC, backgroundColor: 'rgba(0,0,0,0.7)', boxShadow: `0 0 8px ${leftArmC}40` }}>
                {segments.leftArm}
              </div>
            )}
            {segments?.trunk != null && (
              <div className="absolute top-[30%] left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{ color: trunkC, borderColor: trunkC, backgroundColor: 'rgba(0,0,0,0.7)', boxShadow: `0 0 8px ${trunkC}40` }}>
                {segments.trunk}
              </div>
            )}
            {segments?.rightLeg != null && (
              <div className="absolute bottom-[10%] left-[8px] text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{ color: rightLegC, borderColor: rightLegC, backgroundColor: 'rgba(0,0,0,0.7)', boxShadow: `0 0 8px ${rightLegC}40` }}>
                {segments.rightLeg}
              </div>
            )}
            {segments?.leftLeg != null && (
              <div className="absolute bottom-[10%] right-[8px] text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{ color: leftLegC, borderColor: leftLegC, backgroundColor: 'rgba(0,0,0,0.7)', boxShadow: `0 0 8px ${leftLegC}40` }}>
                {segments.leftLeg}
              </div>
            )}
          </>
        )}
      </div>

      {/* Neon color legend */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <LegendDot color="#ff3355" label="Baixo" />
        <LegendDot color="#ff8833" label="Abaixo" />
        <LegendDot color="#ffdd33" label="Normal" />
        <LegendDot color="#33ff88" label="Bom" />
        <LegendDot color="#00ffcc" label="Excelente" />
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
    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
    <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
  </div>
);

const MetricLabel = ({ label, value }: { label: string; value: string }) => (
  <div className="text-muted-foreground">
    <span className="font-semibold" style={{ color: '#00ffcc' }}>{value}</span>{" "}
    <span>{label}</span>
  </div>
);

export default BodySilhouette;
