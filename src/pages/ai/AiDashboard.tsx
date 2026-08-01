import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AI_MODULES, AiKind, daysLeftInCycle, latestOf, useAiApp } from "@/hooks/useAiApp";
import { useAiProgress } from "@/hooks/useAiProgress";
import { useAiOffer } from "@/hooks/useAiGrowth";
import AiOfferCard from "@/components/ai/AiOfferCard";
import {
  Loader2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Flame,
  HeartPulse,
  UserRound,
  UtensilsCrossed,
  CheckCircle2,
} from "lucide-react";

const ROUTES: Record<AiKind, string> = {
  diet: "/ai/app/cardapio",
  workout: "/ai/app/treino",
  analysis: "/ai/app/analise",
};

const Ring = ({ pct, size = 92, stroke = 8 }: { pct: number; size?: number; stroke?: number }) => {
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke} opacity={0.14} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (clamped / 100) * c}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

export default function AiDashboard() {
  const { profile, subscription, generations, loading, user } = useAiApp();
  const { streak, today, last7 } = useAiProgress();
  const { offer, dismiss } = useAiOffer();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/ai/login?next=/ai/app");
    else if (!profile?.phase1_complete) navigate("/ai/onboarding");
  }, [loading, user, profile, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "atleta";
  const adherence7 = last7.filter((d) => d.done).length;
  const adherencePct = Math.round((adherence7 / 7) * 100);

  return (
    <AiShell title={`Olá, ${firstName}`} subtitle="Sua inteligência de nutrição, treino e evolução.">
      {offer && (
        <div className="mb-4">
          <AiOfferCard offer={offer} onDismiss={dismiss} />
        </div>
      )}

      {!subscription && !offer && (
        <Card className="mb-5 flex flex-col gap-3 border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Ative seu plano para gerar seus programas</p>
            <p className="mt-1 text-sm text-muted-foreground">A partir de R$ 39,90/mês, sem fidelidade.</p>
          </div>
          <Button asChild>
            <Link to="/ai/assinatura">Ver planos <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </Card>
      )}

      {/* Bento command center */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Constância — tile grande */}
        <Link
          to="/ai/app/progresso"
          className="group col-span-2 row-span-2 flex flex-col justify-between rounded-3xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_10px_40px_-24px_hsl(var(--primary)/0.6)] sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              <Flame className="h-3 w-3" /> Constância
            </span>
            <Badge variant={today ? "secondary" : "outline"}>{today ? "Check-in feito" : "Check-in pendente"}</Badge>
          </div>

          <div className="mt-5 flex items-center gap-5">
            <div className="relative grid place-items-center">
              <Ring pct={adherencePct} />
              <span className="absolute text-center">
                <span className="block text-xl font-semibold leading-none">{adherence7}</span>
                <span className="block text-[10px] text-muted-foreground">/7 dias</span>
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-tight">
                {streak > 0 ? `${streak} ${streak === 1 ? "dia" : "dias"} seguidos` : "Comece sua sequência hoje"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {today ? "Tudo registrado por hoje. Siga o ritmo." : "Registre seu dia em 5 segundos."}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5">
            {last7.map((d, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${d.done ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          <span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors group-hover:opacity-90">
            {today ? "Ver evolução" : "Fazer check-in"} <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        {/* Módulos IA */}
        {(Object.keys(AI_MODULES) as AiKind[]).map((kind, idx) => {
          const mod = AI_MODULES[kind];
          const gen = latestOf(generations, kind);
          const left = daysLeftInCycle(gen, mod.cycleDays);
          return (
            <Link
              key={kind}
              to={ROUTES[kind]}
              className={`group flex flex-col justify-between rounded-3xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_10px_40px_-28px_hsl(var(--primary)/0.6)] sm:p-5 ${
                idx === 0 ? "col-span-2" : "col-span-1"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-lg">{mod.icon}</span>
                {gen ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {left > 0 ? `${left}d` : "Novo ciclo"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Novo</Badge>
                )}
              </div>
              <div className="mt-4">
                <h2 className="text-sm font-semibold tracking-tight sm:text-base">{mod.title}</h2>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{mod.short}</p>
                {gen && (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Revisões: {gen.revisions}/{kind === "analysis" ? 1 : 2}
                  </p>
                )}
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                {gen ? "Abrir" : "Gerar agora"}
                <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
              </span>
            </Link>
          );
        })}

        {/* Atalhos */}
        <Link
          to="/ai/app/diario"
          className="group col-span-2 flex items-center justify-between rounded-3xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5"
        >
          <span className="flex items-center gap-3 text-sm font-medium">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
              <UtensilsCrossed className="h-4 w-4" />
            </span>
            Diário alimentar
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link
          to="/ai/app/saude"
          className="group col-span-1 flex flex-col justify-between rounded-3xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5"
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
            <HeartPulse className="h-4 w-4" />
          </span>
          <span className="mt-4 text-sm font-medium">Saúde e wearables</span>
        </Link>

        <Link
          to="/ai/app/coaches"
          className="group col-span-1 flex flex-col justify-between rounded-3xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5"
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UserRound className="h-4 w-4" />
          </span>
          <span className="mt-4 text-sm font-medium">Coaches humanos</span>
        </Link>
      </div>

      <div className="mt-6 flex gap-3 rounded-2xl border border-border/40 bg-card/40 p-5 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
        <p>
          O STH METHOD AI oferece orientação plena e suporte para o alcance do objetivo. Assuntos de substâncias, doses
          e protocolos terapêuticos são exclusivos do acompanhamento profissional da consultoria.
        </p>
      </div>
    </AiShell>
  );
}