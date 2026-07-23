import { useMemo, useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, Lock, Hourglass, Unlock, Clock, Target, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { parseProtocolPhases, type ProtocolPhase } from "@/lib/protocol-phase-parser";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  userId: string;
  readOnly?: boolean;
  maxWeeks?: number;
  continuationNotice?: string | null;
}

const STH_GREEN = "#14b780";

const todayISO = () => new Date().toISOString().slice(0, 10);

const StatusIcon = ({ status, done }: { status?: ProtocolPhase["rawStatus"]; done: boolean }) => {
  if (done) return <Check className="w-4 h-4" strokeWidth={2.5} />;
  if (status === "pending") return <Hourglass className="w-3.5 h-3.5" strokeWidth={2} />;
  if (status === "locked") return <Lock className="w-3.5 h-3.5" strokeWidth={2} />;
  if (status === "unlocked") return <Unlock className="w-3.5 h-3.5" strokeWidth={2} />;
  return null;
};

export const PhaseCard = ({
  phase,
  done,
  onToggle,
  disabled,
}: {
  phase: ProtocolPhase;
  done: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) => {
  const isLocked = phase.rawStatus === "locked";
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled || isLocked}
      aria-pressed={done}
      className={cn(
        "group relative w-full text-left rounded-2xl border backdrop-blur-xl transition-all duration-300 overflow-hidden p-4 sm:p-5",
        "bg-white/[0.03] hover:bg-white/[0.05] border-white/10",
        done && "border-[color:var(--sth-green)]/60 bg-[color:var(--sth-green)]/[0.06]",
        isLocked && "opacity-50 cursor-not-allowed",
        !disabled && !isLocked && "active:scale-[0.99] hover:border-white/20"
      )}
      style={{ ["--sth-green" as any]: STH_GREEN }}
    >
      {/* Glow ring quando done */}
      {done && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: `inset 0 0 0 1px ${STH_GREEN}55, 0 0 28px -6px ${STH_GREEN}66` }}
        />
      )}

      <div className="flex items-start gap-3 relative">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-foreground inline-flex items-center gap-2">
              <span className="text-[1em] leading-none select-none" aria-hidden>{phase.emoji}</span>
              <span>{phase.title}</span>
            </h3>
            {phase.rawStatus && !done && (
              <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground inline-flex items-center gap-1">
                <StatusIcon status={phase.rawStatus} done={false} />
                {phase.rawStatus === "pending" && "em curso"}
                {phase.rawStatus === "locked" && "bloqueado"}
                {phase.rawStatus === "unlocked" && "liberado"}
                {phase.rawStatus === "done" && "ok"}
              </span>
            )}
          </div>

          {phase.headline && (
            (/\d+\s*(mg|mcg|g|ml|ui|iu)\b/i.test(phase.headline) ? (
              <p className="mt-2 font-mono text-[13px] tracking-tight text-foreground/85 leading-relaxed whitespace-pre-line">
                {phase.headline}
              </p>
            ) : (
              <p className="mt-2 text-[15px] sm:text-base font-display font-medium tracking-tight text-foreground leading-snug whitespace-pre-line">
                “{phase.headline}”
              </p>
            ))
          )}

          <div className="mt-2.5 space-y-1.5 text-[12.5px] leading-relaxed text-foreground/75">
            {phase.action && (
              <p className="font-mono text-[13px] tracking-tight text-[color:var(--sth-green)]/90"><span className="text-foreground/40 font-sans not-italic">Ação · </span>{phase.action}</p>
            )}
            {phase.stack && (
              <p className="font-mono text-[13px] tracking-tight text-[color:var(--sth-green)]/90"><span className="text-foreground/40 font-sans">Stack · </span>{phase.stack}</p>
            )}
            {(phase.schedule || phase.timing) && (
              <div className="mt-2 rounded-md border border-[color:var(--sth-green)]/25 bg-[color:var(--sth-green)]/[0.04] pl-2.5 pr-3 py-2">
                <div className="text-[9px] tracking-[0.22em] uppercase text-[color:var(--sth-green)]/70 mb-1 font-sans inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" strokeWidth={2.5} /> Horário
                </div>
                <p className="font-mono text-[12.5px] tracking-tight text-foreground/85 leading-[1.55] whitespace-pre-line">
                  {phase.schedule || phase.timing}
                </p>
              </div>
            )}
            {phase.focus && (
              <p className="inline-flex items-start gap-1.5"><Target className="w-3 h-3 opacity-60 mt-0.5" strokeWidth={2}/> <span>{phase.focus}</span></p>
            )}
          </div>
        </div>

        {/* Checkbox circular */}
        <div
          className={cn(
            "shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300",
            done
              ? "border-transparent text-black"
              : "border-white/15 text-foreground/40 group-hover:border-white/30"
          )}
          style={done ? { background: STH_GREEN, boxShadow: `0 0 14px -2px ${STH_GREEN}99` } : {}}
        >
          <StatusIcon status={phase.rawStatus} done={done} />
        </div>
      </div>
    </button>
  );
};

const MedicamentosWeekCarousel = ({
  parent,
  weeks,
  doneSet,
  readOnly,
  disabled,
  onToggle,
}: {
  parent: ProtocolPhase;
  weeks: ProtocolPhase[];
  doneSet: Set<string>;
  readOnly?: boolean;
  disabled?: boolean;
  onToggle: (sub: ProtocolPhase) => void;
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      if (w === 0) return;
      const idx = Math.round(el.scrollLeft / w);
      setActive(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-foreground">
          <span className="text-base leading-none" aria-hidden>{parent.emoji}</span>
          <h3 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-muted-foreground">
            {parent.title}
          </h3>
        </div>
        <span
          className="text-[10px] tracking-[0.2em] uppercase tabular-nums font-semibold"
          style={{ color: STH_GREEN }}
        >
          Semana {active + 1}/{weeks.length}
        </span>
      </div>

      {/* Banner de instrução: passador de semanas */}
      <div
        className="rounded-xl border px-3 py-2 flex items-center justify-between gap-2"
        style={{
          borderColor: `${STH_GREEN}55`,
          background: `linear-gradient(90deg, ${STH_GREEN}10, transparent 60%, ${STH_GREEN}10)`,
          boxShadow: `0 0 18px -8px ${STH_GREEN}66`,
        }}
      >
        <button
          type="button"
          aria-label="Semana anterior"
          onClick={() => goTo(Math.max(0, active - 1))}
          disabled={active === 0}
          className="shrink-0 w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-foreground/80 disabled:opacity-30 active:scale-95 transition"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <p className="flex-1 text-center text-[10.5px] leading-tight tracking-[0.12em] uppercase font-semibold" style={{ color: STH_GREEN }}>
          Deslize para trocar a semana
          <span className="block text-[9px] tracking-[0.18em] mt-0.5 text-foreground/60 font-normal normal-case">
            Arraste ← → ou toque nas setas
          </span>
        </p>
        <button
          type="button"
          aria-label="Próxima semana"
          onClick={() => goTo(Math.min(weeks.length - 1, active + 1))}
          disabled={active === weeks.length - 1}
          className="shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-black disabled:opacity-30 active:scale-95 transition animate-pulse"
          style={{ background: STH_GREEN, borderColor: STH_GREEN, boxShadow: `0 0 14px -2px ${STH_GREEN}` }}
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-1 px-1 gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {weeks.map((w) => (
          <div key={w.key} className="snap-center shrink-0 w-full">
            <PhaseCard
              phase={w}
              done={doneSet.has(w.key)}
              onToggle={() => !readOnly && onToggle(w)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5 pt-1">
        {weeks.map((w, i) => (
          <button
            key={w.key}
            type="button"
            aria-label={`Ir para ${w.title}`}
            onClick={() => goTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === active ? "w-6 bg-[color:var(--sth-green)]" : "w-1.5 bg-foreground/30"
            )}
            style={{ ["--sth-green" as any]: STH_GREEN }}
          />
        ))}
      </div>
    </div>
  );
};

const GamifiedProtocolPanel = ({ content, userId, readOnly, maxWeeks, continuationNotice }: Props) => {
  const qc = useQueryClient();
  const phases = useMemo(() => {
    const parsed = parseProtocolPhases(content);
    if (!maxWeeks || maxWeeks <= 0) return parsed;
    const parseStartWeek = (title: string): number | null => {
      const m = title.match(/(\d+)/);
      return m ? parseInt(m[1], 10) : null;
    };
    return parsed.map((p) => {
      if (!p.key.startsWith("medicamentos") || !p.subWeeks) return p;
      const filtered = p.subWeeks.filter((w) => {
        const start = parseStartWeek(w.title);
        return start === null || start <= maxWeeks;
      });
      return { ...p, subWeeks: filtered };
    });
  }, [content, maxWeeks]);

  const date = todayISO();
  const { data: checkins = [] } = useQuery({
    queryKey: ["protocol-phase-checkins", userId, date],
    queryFn: async () => {
      const { data } = await supabase
        .from("protocol_phase_checkins")
        .select("phase_key")
        .eq("user_id", userId)
        .eq("checkin_date", date);
      return (data || []).map((r) => r.phase_key);
    },
    enabled: !!userId && phases.length > 0,
  });

  const doneSet = useMemo(() => new Set(checkins), [checkins]);

  const toggle = useMutation({
    mutationFn: async (phase: ProtocolPhase) => {
      const isDone = doneSet.has(phase.key);
      if (isDone) {
        await supabase
          .from("protocol_phase_checkins")
          .delete()
          .eq("user_id", userId)
          .eq("phase_key", phase.key)
          .eq("checkin_date", date);
        return { phase, isDone: false };
      }
      await supabase.from("protocol_phase_checkins").upsert(
        { user_id: userId, phase_key: phase.key, checkin_date: date, completed_at: new Date().toISOString() },
        { onConflict: "user_id,phase_key,checkin_date" }
      );
      return { phase, isDone: true };
    },
    onSuccess: ({ phase, isDone }) => {
      qc.invalidateQueries({ queryKey: ["protocol-phase-checkins", userId, date] });
      if (isDone) toast.success(phase.flowLabel, { duration: 1600 });
    },
  });

  if (phases.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-muted/30 p-6 text-center">
        <Sparkles className="w-5 h-5 mx-auto mb-2 opacity-50" strokeWidth={1.6} />
        <p className="text-sm text-foreground/80 font-medium">Estratégia Premium ainda não configurada</p>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-sm mx-auto">
          Seu consultor pode ativar este painel adicionando blocos com emojis-âncora (☀️ MANHÃ · 🍽 ALMOÇO · 🏋️ PRÉ-TREINO · 🌙 NOITE) no protocolo.
        </p>
      </div>
    );
  }

  const total = phases.length;
  const doneCount = phases.filter((p) => doneSet.has(p.key)).length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="space-y-4">
      {continuationNotice && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] backdrop-blur-xl px-4 py-3">
          <p className="text-[11px] tracking-tight leading-relaxed text-amber-200/90">
            {continuationNotice}
          </p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h2 className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground">
          Estratégia STH Premium
        </h2>
        <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground tabular-nums">
          {doneCount}/{total} hoje
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {phases.map((p) => {
          if (p.key.startsWith("medicamentos") && p.subWeeks && p.subWeeks.length > 0) {
            return (
              <MedicamentosWeekCarousel
                key={p.key}
                parent={p}
                weeks={p.subWeeks}
                doneSet={doneSet}
                readOnly={readOnly}
                disabled={readOnly || toggle.isPending}
                onToggle={(sub) => toggle.mutate(sub)}
              />
            );
          }
          return (
            <PhaseCard
              key={p.key}
              phase={p}
              done={doneSet.has(p.key)}
              onToggle={() => !readOnly && toggle.mutate(p)}
              disabled={readOnly || toggle.isPending}
            />
          );
        })}
      </div>

      {/* Dashboard de Performance */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground">
            Dashboard de Performance
          </p>
          <span className="text-[10px] tracking-[0.25em] uppercase text-foreground/70 tabular-nums">
            {pct}%
          </span>
        </div>

        {/* Status do dia (chips compactos) */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {phases.map((p) => {
            const d = doneSet.has(p.key);
            return (
              <span
                key={`chip-${p.key}`}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase",
                  d ? "border-transparent text-black" : "border-white/10 text-foreground/60"
                )}
                style={d ? { background: STH_GREEN } : {}}
              >
                <span className="text-sm leading-none">{p.emoji}</span>
                <span>{p.title.split(" ")[0]}</span>
              </span>
            );
          })}
        </div>

        {/* Barra ⚡ Progresso */}
        <div className="space-y-1.5">
          <Progress value={pct} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {doneCount === 0 && "Comece pela primeira fase do dia."}
            {doneCount > 0 && doneCount < total && `${doneCount} de ${total} fases ativadas. Mantenha a hidratação em 3,5L.`}
            {doneCount === total && "Ciclo do dia completo. Recovery Mode On."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GamifiedProtocolPanel;