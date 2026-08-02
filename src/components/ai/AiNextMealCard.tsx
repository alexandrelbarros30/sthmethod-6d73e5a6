import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Utensils, Clock, ArrowRight } from "lucide-react";
import { AiGeneration } from "@/hooks/useAiApp";
import { parseMeals } from "@/components/ai/AiDietPlan";

const toMin = (t?: string) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Refeição do momento — atualiza conforme o horário definido no cardápio. */
const AiNextMealCard = ({ diet }: { diet: AiGeneration | null }) => {
  const { current, next } = useMemo(() => {
    const meals = diet ? parseMeals(diet.content) : [];
    const now = new Date().getHours() * 60 + new Date().getMinutes();
    const timed = meals.filter((m) => toMin(m.time) != null);
    if (!timed.length) return { current: meals[0] ?? null, next: meals[1] ?? null };
    const sorted = [...timed].sort((a, b) => (toMin(a.time)! - toMin(b.time)!));
    const idx = sorted.findIndex((m, i) => {
      const start = toMin(m.time)!;
      const end = i + 1 < sorted.length ? toMin(sorted[i + 1].time)! : 24 * 60;
      return now >= start && now < end;
    });
    const c = idx >= 0 ? sorted[idx] : sorted[0];
    const n = idx >= 0 ? sorted[idx + 1] ?? sorted[0] : sorted[0];
    return { current: c, next: n };
  }, [diet]);

  const base = current?.options.find((o) => o.isBase) ?? current?.options[0] ?? null;

  return (
    <Link
      to="/ai/app/cardapio"
      className="group relative col-span-2 flex flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 lg:col-span-3 lg:p-6"
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          <Utensils className="h-3 w-3" /> Refeição de agora
        </span>
        {current?.time && (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {current.time}
          </span>
        )}
      </div>

      {current ? (
        <>
          <div className="relative mt-4 min-w-0">
            <p className="truncate text-lg font-semibold leading-tight tracking-tight sm:text-xl">
              {current.name}
            </p>
            {base && (
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{base.text}</p>
            )}
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-baseline gap-1 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-[12px] font-extrabold tabular-nums text-primary">
              {current.kcal}
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] opacity-75">kcal</span>
            </span>
            <span className="inline-flex items-baseline gap-1 rounded-lg border border-info/25 bg-info/10 px-2.5 py-1 font-mono text-[12px] font-extrabold tabular-nums text-info">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-80">Prot</span>
              {current.protein}
              <span className="text-[9px] font-semibold opacity-70">g</span>
            </span>
            <span className="inline-flex items-baseline gap-1 rounded-lg border border-warning/25 bg-warning/10 px-2.5 py-1 font-mono text-[12px] font-extrabold tabular-nums text-warning">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-80">Carb</span>
              {current.carbs}
              <span className="text-[9px] font-semibold opacity-70">g</span>
            </span>
            <span className="inline-flex items-baseline gap-1 rounded-lg border border-[hsl(25_85%_55%/0.25)] bg-[hsl(25_85%_55%/0.1)] px-2.5 py-1 font-mono text-[12px] font-extrabold tabular-nums text-[hsl(25_85%_50%)]">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-80">Gord</span>
              {current.fat}
              <span className="text-[9px] font-semibold opacity-70">g</span>
            </span>
          </div>

          <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
            <span className="truncate text-[11px] text-muted-foreground">
              {next && next !== current ? `Próxima: ${next.name}${next.time ? ` · ${next.time}` : ""}` : "Siga o plano do dia"}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
          </div>
        </>
      ) : (
        <div className="relative mt-4">
          <p className="text-base font-semibold tracking-tight">Nenhum cardápio ativo</p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Gere seu cardápio inteligente para acompanhar as refeições por horário.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            Gerar cardápio <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      )}
    </Link>
  );
};

export default AiNextMealCard;
