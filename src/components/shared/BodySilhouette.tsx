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

function segmentColor(value: number | null | undefined): string {
  if (value == null) return "rgba(20,183,128,0.3)";
  const c = Math.max(0, Math.min(200, value));
  if (c < 80) return "#ff3355";
  if (c < 95) return "#ff8833";
  if (c < 105) return "#1ed094";
  if (c < 120) return "#33ff88";
  return "#14b780";
}

function trunkColor(bodyFatPct: number | null | undefined): string {
  if (bodyFatPct == null) return "rgba(20,183,128,0.3)";
  if (bodyFatPct < 10) return "#14b780";
  if (bodyFatPct < 15) return "#33ff88";
  if (bodyFatPct < 22) return "#1ed094";
  if (bodyFatPct < 30) return "#ff8833";
  return "#ff3355";
}

const BodySilhouette: React.FC<BodySilhouetteProps> = ({ segments, metrics, className = "" }) => {
  const rA = segmentColor(segments?.rightArm);
  const lA = segmentColor(segments?.leftArm);
  const rL = segmentColor(segments?.rightLeg);
  const lL = segmentColor(segments?.leftLeg);
  const tC = segments?.trunk != null ? segmentColor(segments.trunk) : trunkColor(metrics?.bodyFatPct);

  const hasSegments = segments && (segments.leftArm != null || segments.rightArm != null || segments.leftLeg != null || segments.rightLeg != null || segments.trunk != null);
  const hasMetrics = metrics && (metrics.bodyFatPct != null || metrics.totalWeight != null);

  if (!hasSegments && !hasMetrics) {
    return (
      <div className={`flex flex-col items-center gap-2 py-4 ${className}`}>
        <div className="text-muted-foreground text-xs text-center">Dados segmentares não disponíveis</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative w-[220px] h-[380px]">
        <svg viewBox="0 0 300 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            {/* Main holographic glow */}
            <filter id="holoGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feFlood floodColor="#1ed094" floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="segGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
              <feFlood floodColor="#14b780" floodOpacity="0.4" result="c" />
              <feComposite in="c" in2="b" operator="in" result="s" />
              <feMerge><feMergeNode in="s" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="baseGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <filter id="labelGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#1ed094" floodOpacity="0.8" />
            </filter>

            {/* Radial gradient for holographic base */}
            <radialGradient id="basePlatform" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#14b780" stopOpacity="0.3" />
              <stop offset="40%" stopColor="#1ed094" stopOpacity="0.15" />
              <stop offset="80%" stopColor="#0e9468" stopOpacity="0.05" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            {/* Body wireframe gradient */}
            <linearGradient id="bodyGrad" x1="150" y1="20" x2="150" y2="380" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#14b780" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#1ed094" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#0e9468" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0a6f4d" stopOpacity="0.3" />
            </linearGradient>

            {/* Scan line */}
            <linearGradient id="scanLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="40%" stopColor="rgba(20,183,128,0.05)" />
              <stop offset="50%" stopColor="rgba(20,183,128,0.3)" />
              <stop offset="60%" stopColor="rgba(20,183,128,0.05)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* === HOLOGRAPHIC BASE PLATFORM === */}
          {/* Concentric rings */}
          {[90, 70, 50, 35].map((rx, i) => (
            <ellipse key={i} cx="150" cy="420" rx={rx} ry={rx * 0.28}
              fill="none" stroke="#14b780" strokeWidth={i === 0 ? 1.5 : 0.8}
              opacity={0.2 + i * 0.1}
              filter="url(#baseGlow)"
            >
              <animate attributeName="opacity" values={`${0.15 + i * 0.05};${0.3 + i * 0.1};${0.15 + i * 0.05}`} dur={`${3 + i}s`} repeatCount="indefinite" />
            </ellipse>
          ))}
          {/* Base glow */}
          <ellipse cx="150" cy="420" rx="100" ry="30" fill="url(#basePlatform)" opacity="0.6" />
          {/* Radial lines on base */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const x1 = 150 + Math.cos(angle) * 25;
            const y1 = 420 + Math.sin(angle) * 7;
            const x2 = 150 + Math.cos(angle) * 95;
            const y2 = 420 + Math.sin(angle) * 28;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#14b780" strokeWidth="0.4" opacity="0.15" />;
          })}

          {/* === VERTICAL BEAM from base === */}
          <line x1="150" y1="395" x2="150" y2="420" stroke="#1ed094" strokeWidth="0.5" opacity="0.2" />

          {/* === HOLOGRAPHIC BODY — Wireframe Athletic Figure === */}
          <g filter="url(#holoGlow)">
            {/* HEAD */}
            <ellipse cx="150" cy="48" rx="16" ry="19" fill="rgba(20,183,128,0.06)" stroke="url(#bodyGrad)" strokeWidth="1.2" />
            {/* Wireframe face lines */}
            <path d="M 142 42 Q 150 38, 158 42" fill="none" stroke="#1ed094" strokeWidth="0.4" opacity="0.4" />
            <path d="M 140 52 Q 150 56, 160 52" fill="none" stroke="#1ed094" strokeWidth="0.3" opacity="0.3" />
            <ellipse cx="150" cy="48" rx="8" ry="10" fill="none" stroke="#1ed094" strokeWidth="0.3" opacity="0.2" strokeDasharray="2 2" />

            {/* NECK */}
            <path d="M 143 66 L 141 76 Q 146 78, 150 78 Q 154 78, 159 76 L 157 66" fill="rgba(20,183,128,0.03)" stroke="url(#bodyGrad)" strokeWidth="0.6" />

            {/* TRUNK */}
            <path
              d="M 108 86 Q 112 78, 130 76 Q 150 74, 170 76 Q 188 78, 192 86
                 L 194 100 Q 196 118, 192 138 Q 190 152, 184 164
                 Q 180 172, 174 178 Q 164 184, 150 186
                 Q 136 184, 126 178 Q 120 172, 116 164
                 Q 110 152, 108 138 Q 104 118, 106 100 Z"
              fill="rgba(0,0,0,0.15)"
              stroke={tC}
              strokeWidth="1.4"
              opacity="0.85"
              className="transition-all duration-700"
            />
            {/* Trunk inner wireframe */}
            <path d="M 108 86 Q 112 78, 130 76 Q 150 74, 170 76 Q 188 78, 192 86 L 194 100 Q 196 118, 192 138 Q 190 152, 184 164 Q 180 172, 174 178 Q 164 184, 150 186 Q 136 184, 126 178 Q 120 172, 116 164 Q 110 152, 108 138 Q 104 118, 106 100 Z"
              fill={tC} opacity="0.06" />
            {/* Abs wireframe */}
            <line x1="150" y1="86" x2="150" y2="178" stroke={tC} strokeWidth="0.5" opacity="0.25" />
            <path d="M 128 104 Q 150 106, 172 104" stroke={tC} strokeWidth="0.35" opacity="0.2" fill="none" />
            <path d="M 127 120 Q 150 122, 173 120" stroke={tC} strokeWidth="0.35" opacity="0.2" fill="none" />
            <path d="M 126 136 Q 150 138, 174 136" stroke={tC} strokeWidth="0.35" opacity="0.2" fill="none" />
            <path d="M 128 152 Q 150 154, 172 152" stroke={tC} strokeWidth="0.35" opacity="0.2" fill="none" />
            {/* Pec arc */}
            <path d="M 112 92 Q 130 100, 150 102 Q 170 100, 188 92" stroke={tC} strokeWidth="0.4" opacity="0.18" fill="none" />

            {/* RIGHT ARM */}
            <path
              d="M 106 86 Q 94 84, 84 92 Q 76 100, 74 116 Q 72 130, 74 146 Q 75 156, 78 166 Q 80 174, 84 180 Q 86 184, 90 184 Q 94 184, 96 178 Q 100 166, 102 154 Q 104 142, 106 130 Q 108 116, 110 104 Q 111 94, 108 88 Z"
              fill="rgba(0,0,0,0.15)" stroke={rA} strokeWidth="1.4" opacity="0.85"
              className="transition-all duration-700"
            />
            <path d="M 106 86 Q 94 84, 84 92 Q 76 100, 74 116 Q 72 130, 74 146 Q 75 156, 78 166 Q 80 174, 84 180 Q 86 184, 90 184 Q 94 184, 96 178 Q 100 166, 102 154 Q 104 142, 106 130 Q 108 116, 110 104 Q 111 94, 108 88 Z"
              fill={rA} opacity="0.05" />
            {/* Wireframe muscle */}
            <path d="M 90 108 Q 88 124, 90 140" stroke={rA} strokeWidth="0.4" opacity="0.25" fill="none" />
            <path d="M 82 100 Q 80 120, 82 140" stroke={rA} strokeWidth="0.3" opacity="0.15" fill="none" strokeDasharray="3 3" />

            {/* LEFT ARM */}
            <path
              d="M 194 86 Q 206 84, 216 92 Q 224 100, 226 116 Q 228 130, 226 146 Q 225 156, 222 166 Q 220 174, 216 180 Q 214 184, 210 184 Q 206 184, 204 178 Q 200 166, 198 154 Q 196 142, 194 130 Q 192 116, 190 104 Q 189 94, 192 88 Z"
              fill="rgba(0,0,0,0.15)" stroke={lA} strokeWidth="1.4" opacity="0.85"
              className="transition-all duration-700"
            />
            <path d="M 194 86 Q 206 84, 216 92 Q 224 100, 226 116 Q 228 130, 226 146 Q 225 156, 222 166 Q 220 174, 216 180 Q 214 184, 210 184 Q 206 184, 204 178 Q 200 166, 198 154 Q 196 142, 194 130 Q 192 116, 190 104 Q 189 94, 192 88 Z"
              fill={lA} opacity="0.05" />
            <path d="M 210 108 Q 212 124, 210 140" stroke={lA} strokeWidth="0.4" opacity="0.25" fill="none" />
            <path d="M 218 100 Q 220 120, 218 140" stroke={lA} strokeWidth="0.3" opacity="0.15" fill="none" strokeDasharray="3 3" />

            {/* RIGHT LEG */}
            <path
              d="M 124 182 Q 116 186, 110 202 Q 104 222, 102 244
                 Q 100 264, 100 284 Q 100 304, 102 322
                 Q 103 336, 106 348 Q 108 358, 110 366
                 Q 112 376, 116 380 Q 120 384, 124 382
                 Q 128 380, 130 372 Q 132 358, 134 344
                 Q 136 326, 138 306 Q 140 284, 142 264
                 Q 144 244, 146 224 Q 148 206, 150 194
                 Q 151 188, 150 184 Z"
              fill="rgba(0,0,0,0.15)" stroke={rL} strokeWidth="1.4" opacity="0.85"
              className="transition-all duration-700"
            />
            <path d="M 124 182 Q 116 186, 110 202 Q 104 222, 102 244 Q 100 264, 100 284 Q 100 304, 102 322 Q 103 336, 106 348 Q 108 358, 110 366 Q 112 376, 116 380 Q 120 384, 124 382 Q 128 380, 130 372 Q 132 358, 134 344 Q 136 326, 138 306 Q 140 284, 142 264 Q 144 244, 146 224 Q 148 206, 150 194 Q 151 188, 150 184 Z"
              fill={rL} opacity="0.05" />
            <path d="M 122 216 Q 118 246, 118 276" stroke={rL} strokeWidth="0.4" opacity="0.25" fill="none" />
            <path d="M 110 308 Q 108 322, 110 336" stroke={rL} strokeWidth="0.3" opacity="0.18" fill="none" />

            {/* LEFT LEG */}
            <path
              d="M 176 182 Q 184 186, 190 202 Q 196 222, 198 244
                 Q 200 264, 200 284 Q 200 304, 198 322
                 Q 197 336, 194 348 Q 192 358, 190 366
                 Q 188 376, 184 380 Q 180 384, 176 382
                 Q 172 380, 170 372 Q 168 358, 166 344
                 Q 164 326, 162 306 Q 160 284, 158 264
                 Q 156 244, 154 224 Q 152 206, 150 194
                 Q 149 188, 150 184 Z"
              fill="rgba(0,0,0,0.15)" stroke={lL} strokeWidth="1.4" opacity="0.85"
              className="transition-all duration-700"
            />
            <path d="M 176 182 Q 184 186, 190 202 Q 196 222, 198 244 Q 200 264, 200 284 Q 200 304, 198 322 Q 197 336, 194 348 Q 192 358, 190 366 Q 188 376, 184 380 Q 180 384, 176 382 Q 172 380, 170 372 Q 168 358, 166 344 Q 164 326, 162 306 Q 160 284, 158 264 Q 156 244, 154 224 Q 152 206, 150 194 Q 149 188, 150 184 Z"
              fill={lL} opacity="0.05" />
            <path d="M 178 216 Q 182 246, 182 276" stroke={lL} strokeWidth="0.4" opacity="0.25" fill="none" />
            <path d="M 190 308 Q 192 322, 190 336" stroke={lL} strokeWidth="0.3" opacity="0.18" fill="none" />

            {/* Horizontal wireframe rings on body */}
            {[90, 110, 130, 150, 170, 200, 240, 280, 320, 360].map((y, i) => {
              const bodyWidth = y < 86 ? 12 : y < 186 ? 44 - Math.abs(y - 130) * 0.15 : y < 400 ? 28 - Math.abs(y - 280) * 0.04 : 10;
              return (
                <ellipse key={i} cx="150" cy={y} rx={Math.max(8, bodyWidth)} ry={2}
                  fill="none" stroke="#1ed094" strokeWidth="0.3" opacity={0.08 + (i % 2) * 0.04}
                  strokeDasharray="4 4" />
              );
            })}
          </g>

          {/* Particle dots floating around the body */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const radius = 60 + (i % 3) * 20;
            const cx = 150 + Math.cos(angle) * radius;
            const cy = 180 + Math.sin(angle) * radius * 1.5;
            return (
              <circle key={i} cx={cx} cy={cy} r="1" fill="#14b780" opacity="0.3">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
              </circle>
            );
          })}

          {/* Scan line animation */}
          <rect x="60" y="0" width="180" height="500" fill="url(#scanLine)" opacity="0.4">
            <animateTransform attributeName="transform" type="translate" from="0 -500" to="0 500" dur="4s" repeatCount="indefinite" />
          </rect>

          {/* HOLOGRAM label */}
          <text x="150" y="458" textAnchor="middle" fill="#1ed094" fontSize="7" opacity="0.5" fontFamily="monospace" letterSpacing="3" filter="url(#labelGlow)">
            BODY HOLOGRAM
          </text>

          {/* Corner brackets */}
          <path d="M 55 20 L 55 35" stroke="#1ed094" strokeWidth="0.5" opacity="0.25" />
          <path d="M 55 20 L 70 20" stroke="#1ed094" strokeWidth="0.5" opacity="0.25" />
          <path d="M 245 20 L 245 35" stroke="#1ed094" strokeWidth="0.5" opacity="0.25" />
          <path d="M 245 20 L 230 20" stroke="#1ed094" strokeWidth="0.5" opacity="0.25" />
          <path d="M 55 470 L 55 455" stroke="#1ed094" strokeWidth="0.5" opacity="0.25" />
          <path d="M 55 470 L 70 470" stroke="#1ed094" strokeWidth="0.5" opacity="0.25" />
          <path d="M 245 470 L 245 455" stroke="#1ed094" strokeWidth="0.5" opacity="0.25" />
          <path d="M 245 470 L 230 470" stroke="#1ed094" strokeWidth="0.5" opacity="0.25" />
        </svg>

        {/* Segment value labels */}
        {hasSegments && (
          <>
            {segments?.rightArm != null && (
              <div className="absolute top-[24%] left-[-2px] text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{ color: rA, borderColor: rA, backgroundColor: 'rgba(0,0,0,0.8)', boxShadow: `0 0 10px ${rA}50` }}>
                {segments.rightArm}
              </div>
            )}
            {segments?.leftArm != null && (
              <div className="absolute top-[24%] right-[-2px] text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{ color: lA, borderColor: lA, backgroundColor: 'rgba(0,0,0,0.8)', boxShadow: `0 0 10px ${lA}50` }}>
                {segments.leftArm}
              </div>
            )}
            {segments?.trunk != null && (
              <div className="absolute top-[28%] left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{ color: tC, borderColor: tC, backgroundColor: 'rgba(0,0,0,0.8)', boxShadow: `0 0 10px ${tC}50` }}>
                {segments.trunk}
              </div>
            )}
            {segments?.rightLeg != null && (
              <div className="absolute bottom-[16%] left-[10px] text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{ color: rL, borderColor: rL, backgroundColor: 'rgba(0,0,0,0.8)', boxShadow: `0 0 10px ${rL}50` }}>
                {segments.rightLeg}
              </div>
            )}
            {segments?.leftLeg != null && (
              <div className="absolute bottom-[16%] right-[10px] text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{ color: lL, borderColor: lL, backgroundColor: 'rgba(0,0,0,0.8)', boxShadow: `0 0 10px ${lL}50` }}>
                {segments.leftLeg}
              </div>
            )}
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <LegendDot color="#ff3355" label="Baixo" />
        <LegendDot color="#ff8833" label="Abaixo" />
        <LegendDot color="#1ed094" label="Normal" />
        <LegendDot color="#33ff88" label="Bom" />
        <LegendDot color="#14b780" label="Excelente" />
      </div>

      {/* Key metrics */}
      {hasMetrics && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-center">
          {metrics?.totalWeight != null && <MetricLabel label="Peso" value={`${metrics.totalWeight} kg`} />}
          {metrics?.bodyFatPct != null && <MetricLabel label="Gordura" value={`${metrics.bodyFatPct}%`} />}
          {metrics?.skeletalMuscleKg != null && <MetricLabel label="M. Esquelética" value={`${metrics.skeletalMuscleKg} kg`} />}
          {metrics?.totalWaterPct != null && <MetricLabel label="Água" value={`${metrics.totalWaterPct}%`} />}
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
    <span className="font-semibold" style={{ color: '#14b780' }}>{value}</span>{" "}
    <span>{label}</span>
  </div>
);

export default BodySilhouette;
