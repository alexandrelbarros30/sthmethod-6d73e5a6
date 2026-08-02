import { useEffect, useState } from "react";
import { RefreshCw, Timer, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const diff = target.getTime() - now;
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, over: true };
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
    over: false,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function AiRevisionsBanner({
  used,
  max,
  cycleStart,
  cycleDays,
  unlimited,
}: {
  used: number;
  max: number;
  cycleStart: string | null;
  cycleDays: number;
  unlimited?: boolean;
}) {
  const deadline = cycleStart
    ? new Date(new Date(`${cycleStart}T00:00:00`).getTime() + cycleDays * 86_400_000)
    : null;
  const c = useCountdown(deadline);
  const left = unlimited ? Infinity : Math.max(0, max - used);
  const critical = !unlimited && left <= 1;

  return (
    <div
      className={cn(
        "relative mb-4 overflow-hidden rounded-2xl border p-4",
        critical
          ? "border-destructive/40 bg-destructive/10"
          : "border-primary/30 bg-primary/5",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-60",
          critical ? "animate-pulse bg-destructive/5" : "animate-pulse bg-primary/5",
        )}
      />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {critical ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <RefreshCw className="h-4 w-4 text-primary" />
            )}
            <p className="text-sm font-semibold">
              {unlimited ? (
                "Revisões ilimitadas"
              ) : (
                <>
                  <span className={cn("text-lg font-bold", critical ? "text-destructive" : "text-primary")}>
                    {left}
                  </span>{" "}
                  de {max} revisões disponíveis neste ciclo
                </>
              )}
            </p>
          </div>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            {left === 0
              ? "As revisões deste ciclo acabaram. O próximo ciclo libera uma nova criação completa."
              : "Elabore cada pedido com o máximo de detalhe (alimentos, horários, restrições, rotina) — quanto melhor o briefing, maior o acerto da revisão."}
          </p>
        </div>

        {!unlimited && c && (
          <div className="shrink-0">
            <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Timer className="h-3 w-3" /> {c.over ? "Ciclo encerrado" : "Encerra em"}
            </p>
            <div className="flex gap-1.5">
              {[
                { v: c.d, l: "d" },
                { v: c.h, l: "h" },
                { v: c.m, l: "m" },
                { v: c.s, l: "s" },
              ].map((u) => (
                <div
                  key={u.l}
                  className={cn(
                    "min-w-[46px] rounded-xl border px-2 py-1 text-center tabular-nums",
                    critical ? "border-destructive/30 bg-background/70" : "border-primary/20 bg-background/70",
                  )}
                >
                  <span className="block text-base font-bold leading-none">{pad(u.v)}</span>
                  <span className="text-[10px] text-muted-foreground">{u.l}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
