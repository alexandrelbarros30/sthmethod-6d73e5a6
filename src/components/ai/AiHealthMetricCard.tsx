import { Link } from "react-router-dom";
import { Footprints, Flame, HeartPulse, Moon, Loader2 } from "lucide-react";
import { useAiHealth, type HealthDay } from "@/hooks/useAiHealth";

export type HealthMetric = "steps" | "active_kcal" | "resting_hr" | "sleep_minutes";

const META: Record<
  HealthMetric,
  { label: string; icon: typeof Footprints; unit: string; format: (v: number) => string; goal: number }
> = {
  steps: { label: "Passos", icon: Footprints, unit: "passos", format: (v) => v.toLocaleString("pt-BR"), goal: 10000 },
  active_kcal: { label: "Kcal ativas", icon: Flame, unit: "kcal", format: (v) => Math.round(v).toString(), goal: 500 },
  resting_hr: { label: "FC de repouso", icon: HeartPulse, unit: "bpm", format: (v) => Math.round(v).toString(), goal: 0 },
  sleep_minutes: {
    label: "Sono",
    icon: Moon,
    unit: "",
    format: (v) => `${Math.floor(v / 60)}h${String(Math.round(v % 60)).padStart(2, "0")}`,
    goal: 480,
  },
};

export const HEALTH_METRIC_LABEL = (m: HealthMetric) => META[m].label;

/** Card de métrica do relógio (Health Connect / Apple Saúde) para a tela inicial. */
export default function AiHealthMetricCard({ metric }: { metric: HealthMetric }) {
  const { days, loading } = useAiHealth();
  const cfg = META[metric];
  const Icon = cfg.icon;

  const series = [...days]
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-7)
    .map((d: HealthDay) => Number(d[metric] ?? 0));
  const latest = days.find((d) => d[metric] != null);
  const value = latest ? Number(latest[metric]) : null;
  const max = Math.max(1, ...series);
  const pct = cfg.goal > 0 && value != null ? Math.min(100, Math.round((value / cfg.goal) * 100)) : null;

  return (
    <Link
      to="/ai/app/saude"
      className="group flex h-full flex-col justify-between rounded-3xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ocean-teal/40 sm:rounded-[2rem] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase leading-tight tracking-[0.12em] text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0 text-ocean-teal" /> <span className="truncate">{cfg.label}</span>
        </span>
        {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        <span className="font-urbanist text-2xl font-extrabold leading-none tracking-tight text-ocean-mid">
          {value != null ? cfg.format(value) : "—"}
        </span>
        {cfg.unit && <span className="pb-0.5 text-[11px] text-muted-foreground">{cfg.unit}</span>}
      </div>

      <p className="mt-1 truncate text-[11px] text-muted-foreground">
        {value == null
          ? "conecte seu relógio para ver aqui"
          : pct != null
            ? `${pct}% da meta diária`
            : latest?.day
              ? `última leitura ${latest.day.slice(8, 10)}/${latest.day.slice(5, 7)}`
              : ""}
      </p>

      <div className="mt-3 flex h-8 items-end gap-1">
        {(series.length ? series : Array(7).fill(0)).map((v, i) => (
          <span
            key={i}
            className="flex-1 rounded-full bg-ocean-teal/70 transition-all"
            style={{ height: `${Math.max(8, (v / max) * 100)}%`, opacity: v > 0 ? 1 : 0.25 }}
          />
        ))}
      </div>
    </Link>
  );
}
