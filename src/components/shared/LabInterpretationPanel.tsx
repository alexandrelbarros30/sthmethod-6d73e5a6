import { useMemo, useState } from "react";
import { Activity, LayoutGrid, Table2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractLabMarkers, STATUS_META, type LabStatus } from "@/lib/lab-markers";

interface Props {
  html: string;
  className?: string;
  /** título exibido no cabeçalho do painel */
  title?: string;
}

const ORDER: LabStatus[] = ["high", "low", "attention", "optimal", "unknown"];

/**
 * Painel ilustrativo e didático da INTERPRETAÇÃO LABORATORIAL:
 * lê o quadro do parecer STHIA e o transforma em cards com barra de faixa,
 * marcador posicional e leitura clínica — visualização web moderna,
 * exibida antes da pré-visualização / exportação.
 */
export default function LabInterpretationPanel({ html, className, title = "Interpretação laboratorial" }: Props) {
  const markers = useMemo(() => extractLabMarkers(html), [html]);
  const [filter, setFilter] = useState<LabStatus | "all">("all");
  const [openRow, setOpenRow] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    markers.forEach((m) => { c[m.status] = (c[m.status] || 0) + 1; });
    return c;
  }, [markers]);

  if (!markers.length) return null;

  const visible = filter === "all" ? markers : markers.filter((m) => m.status === filter);
  const alerts = (counts.high || 0) + (counts.low || 0);
  const total = markers.length;
  const okPct = Math.round(((counts.optimal || 0) / total) * 100);

  return (
    <section className={cn("rounded-2xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden", className)}>
      {/* Cabeçalho */}
      <header className="relative px-4 sm:px-5 py-4 border-b border-border/70">
        <div className="absolute inset-0 pointer-events-none opacity-[0.35] bg-[radial-gradient(120%_120%_at_0%_0%,hsl(var(--primary)/0.18),transparent_60%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-2">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-muted-foreground">STHIA · Leitura visual</p>
              <h3 className="text-[15px] font-semibold tracking-tight truncate">{title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Metric label="Marcadores" value={String(total)} />
            <Metric label="Em faixa" value={`${okPct}%`} tone="text-emerald-400" />
            <Metric label="Alertas" value={String(alerts)} tone={alerts ? "text-red-400" : undefined} />
          </div>
        </div>

        {/* Barra de composição */}
        <div className="relative mt-4 h-1.5 w-full rounded-full overflow-hidden flex bg-muted/50">
          {ORDER.map((s) => {
            const n = counts[s] || 0;
            if (!n) return null;
            return <div key={s} className={cn("h-full", STATUS_META[s].dot)} style={{ width: `${(n / total) * 100}%` }} />;
          })}
        </div>

        {/* Filtros */}
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          <Chip active={filter === "all"} onClick={() => setFilter("all")} label={`Todos · ${total}`} />
          {ORDER.filter((s) => counts[s]).map((s) => (
            <Chip
              key={s}
              active={filter === s}
              onClick={() => setFilter(filter === s ? "all" : s)}
              label={`${STATUS_META[s].label} · ${counts[s]}`}
              dot={STATUS_META[s].dot}
            />
          ))}
        </div>
      </header>

      {/* Cards */}
      <div className="p-3 sm:p-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((m, i) => {
          const meta = STATUS_META[m.status];
          const key = `${m.name}-${i}`;
          const open = openRow === key;
          return (
            <article
              key={key}
              className={cn(
                "group rounded-xl border p-3.5 transition-all duration-300 hover:-translate-y-0.5",
                meta.ring
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium tracking-tight leading-snug">{m.name}</p>
                <span className={cn("shrink-0 inline-flex items-center gap-1 rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", meta.tone)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                  {m.statusLabel || meta.label}
                </span>
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[22px] font-semibold tracking-tight tabular-nums">{m.value || "—"}</span>
                {m.reference && <span className="text-[11px] text-muted-foreground">ref. {m.reference}</span>}
              </div>

              {/* Régua de faixa */}
              <div className="mt-3">
                <div className="relative h-2 rounded-full bg-muted/60 overflow-hidden">
                  <div className="absolute inset-y-0 left-[16.6%] right-[16.6%] bg-emerald-500/20" />
                  {m.position != null && (
                    <div
                      className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", meta.bar)}
                      style={{ width: `${Math.max(3, m.position * 100)}%` }}
                    />
                  )}
                </div>
                {m.position != null && (
                  <div className="relative h-3">
                    <span
                      className={cn("absolute -top-[13px] h-3.5 w-[3px] rounded-full ring-2 ring-background", meta.dot)}
                      style={{ left: `calc(${m.position * 100}% - 1.5px)` }}
                    />
                  </div>
                )}
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums">
                  <span>{m.refMin != null ? m.refMin : "—"}</span>
                  <span className="uppercase tracking-[0.18em]">faixa</span>
                  <span>{m.refMax != null ? m.refMax : "—"}</span>
                </div>
              </div>

              {m.reading && (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenRow(open ? null : key)}
                    className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Leitura clínica
                    <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
                  </button>
                  <p
                    className={cn(
                      "text-[12px] leading-relaxed text-foreground/80 overflow-hidden transition-all duration-300",
                      open ? "mt-1.5 max-h-60 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    {m.reading}
                  </p>
                </>
              )}
            </article>
          );
        })}
      </div>

      <footer className="px-4 sm:px-5 py-2.5 border-t border-border/70 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <LayoutGrid className="w-3 h-3" /> visualização web
        <span className="opacity-40">·</span>
        <Table2 className="w-3 h-3" /> quadro completo abaixo
      </footer>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="text-right">
      <p className={cn("text-[16px] font-semibold tabular-nums leading-none", tone)}>{value}</p>
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function Chip({ label, active, onClick, dot }: { label: string; active: boolean; onClick: () => void; dot?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
        active ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
      {label}
    </button>
  );
}