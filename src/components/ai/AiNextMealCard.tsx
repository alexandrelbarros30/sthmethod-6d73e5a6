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
      className="group relative col-span-2 flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ocean-mid to-ocean-deep p-4 text-white shadow-xl shadow-ocean-deep/20 transition-all duration-300 hover:-translate-y-0.5 sm:rounded-[2rem] sm:p-5 lg:col-span-3 lg:p-6"
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-ocean-mint/20 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-urbanist text-[10px] font-bold uppercase tracking-[0.18em] text-ocean-mint backdrop-blur-md">
          <Utensils className="h-3 w-3" /> Refeição de agora
        </span>
        {current?.time && (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums text-white/70">
            <Clock className="h-3.5 w-3.5" /> {current.time}
          </span>
        )}
      </div>

      {current ? (
        <>
          <div className="relative mt-4 min-w-0">
            <p className="break-words font-urbanist text-lg font-bold leading-tight tracking-tight sm:truncate sm:text-xl">
              {current.name}
            </p>
            {base && (
              <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-white/75 sm:line-clamp-2">{base.text}</p>
            )}
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center">
            <span className="inline-flex items-baseline justify-center gap-1 rounded-lg border border-ocean-mint/40 bg-ocean-mint/15 px-2.5 py-1.5 font-mono text-[12px] font-extrabold tabular-nums text-ocean-mint">
              {current.kcal}
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] opacity-75">kcal</span>
            </span>
            <span className="inline-flex items-baseline justify-center gap-1 rounded-lg border border-sky-300/40 bg-sky-300/15 px-2.5 py-1.5 font-mono text-[12px] font-extrabold tabular-nums text-sky-200">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-80">Prot</span>
              {current.protein}
              <span className="text-[9px] font-semibold opacity-70">g</span>
            </span>
            <span className="inline-flex items-baseline justify-center gap-1 rounded-lg border border-amber-300/40 bg-amber-300/15 px-2.5 py-1.5 font-mono text-[12px] font-extrabold tabular-nums text-amber-200">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-80">Carb</span>
              {current.carbs}
              <span className="text-[9px] font-semibold opacity-70">g</span>
            </span>
            <span className="inline-flex items-baseline justify-center gap-1 rounded-lg border border-orange-300/40 bg-orange-300/15 px-2.5 py-1.5 font-mono text-[12px] font-extrabold tabular-nums text-orange-200">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-80">Gord</span>
              {current.fat}
              <span className="text-[9px] font-semibold opacity-70">g</span>
            </span>
          </div>

          <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <span className="truncate text-xs text-white/65">
              {next && next !== current ? `Próxima: ${next.name}${next.time ? ` · ${next.time}` : ""}` : "Siga o plano do dia"}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-ocean-mint transition-transform group-hover:translate-x-0.5" />
          </div>
        </>
      ) : (
        <div className="relative mt-4">
          <p className="font-urbanist text-base font-bold tracking-tight">Nenhum cardápio ativo</p>
          <p className="mt-1.5 text-[13px] text-white/70">
            Gere seu cardápio inteligente para acompanhar as refeições por horário.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ocean-mint">
            Gerar cardápio <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      )}
    </Link>
  );
};

export default AiNextMealCard;
