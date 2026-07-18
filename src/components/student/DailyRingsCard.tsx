import { Flame, Beef, Droplets } from "lucide-react";

interface Props {
  kcalConsumed: number;
  kcalGoal: number;
  proteinConsumed: number;
  proteinGoal: number;
  waterMl: number;
  waterGoalL: number;
}

// Anéis concêntricos estilo Apple Activity — 3 métricas empilhadas visualmente.
const RING_SIZE = 140;
const STROKE = 11;
const GAP = 4;

const Ring = ({ radius, pct, color }: { radius: number; pct: number; color: string }) => {
  const c = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = c - (clamped / 100) * c;
  return (
    <>
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        opacity={0.15}
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
    </>
  );
};

const DailyRingsCard = ({ kcalConsumed, kcalGoal, proteinConsumed, proteinGoal, waterMl, waterGoalL }: Props) => {
  const kcalPct = kcalGoal > 0 ? (kcalConsumed / kcalGoal) * 100 : 0;
  const proteinPct = proteinGoal > 0 ? (proteinConsumed / proteinGoal) * 100 : 0;
  const waterPct = waterGoalL > 0 ? (waterMl / (waterGoalL * 1000)) * 100 : 0;

  const r1 = (RING_SIZE - STROKE) / 2;
  const r2 = r1 - STROKE - GAP;
  const r3 = r2 - STROKE - GAP;

  const rows = [
    { icon: Flame, label: "Calorias", value: Math.round(kcalConsumed), goal: Math.round(kcalGoal), unit: "kcal", pct: kcalPct, color: "hsl(6 90% 60%)" },
    { icon: Beef, label: "Proteína", value: Math.round(proteinConsumed), goal: Math.round(proteinGoal), unit: "g", pct: proteinPct, color: "hsl(140 70% 50%)" },
    { icon: Droplets, label: "Água", value: +(waterMl / 1000).toFixed(1), goal: waterGoalL, unit: "L", pct: waterPct, color: "hsl(200 90% 55%)" },
  ];

  return (
    <div className="mb-6 rounded-3xl border border-border/40 bg-background p-4 sm:p-6">
      <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">Anéis do dia</p>
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
            <Ring radius={r1} pct={kcalPct} color={rows[0].color} />
            <Ring radius={r2} pct={proteinPct} color={rows[1].color} />
            <Ring radius={r3} pct={waterPct} color={rows[2].color} />
          </svg>
        </div>
        <div className="flex-1 min-w-0 space-y-2.5">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.label} className="flex items-center gap-2 min-w-0">
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: r.color }} strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium truncate">{r.label}</p>
                    <span className="text-[11px] font-semibold tabular-nums shrink-0" style={{ color: r.color }}>
                      {Math.round(r.pct)}%
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold text-foreground tabular-nums tracking-tight leading-tight whitespace-nowrap">
                    {r.value}
                    <span className="text-muted-foreground/60 font-light"> / {r.goal}{r.unit}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DailyRingsCard;