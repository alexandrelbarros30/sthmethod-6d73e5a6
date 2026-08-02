import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AI_MODULES, AiKind, daysLeftInCycle, latestOf, useAiApp } from "@/hooks/useAiApp";
import { useAiProgress } from "@/hooks/useAiProgress";
import { useAiOffer, useAiInsight } from "@/hooks/useAiGrowth";
import { useAiHealth } from "@/hooks/useAiHealth";
import AiOfferCard from "@/components/ai/AiOfferCard";
import AiHydrationCard from "@/components/ai/AiHydrationCard";
import AiNextMealCard from "@/components/ai/AiNextMealCard";
import AiWorkoutReminderCard from "@/components/ai/AiWorkoutReminderCard";
import {
  Loader2,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Flame,
  HeartPulse,
  UserRound,
  UtensilsCrossed,
  Scale,
  BrainCircuit,
  Camera,
} from "lucide-react";

const ROUTES: Record<AiKind, string> = {
  diet: "/ai/app/cardapio",
  workout: "/ai/app/treino",
  analysis: "/ai/app/analise",
};

const tile =
  "group relative overflow-hidden rounded-3xl border border-border/70 bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_50px_-30px_hsl(var(--primary)/0.75)] sm:p-5";

const Ring = ({ pct, size = 104, stroke = 9 }: { pct: number; size?: number; stroke?: number }) => {
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke} opacity={0.12} />
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

const Spark = ({ values }: { values: number[] }) => {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden>
      {values.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-full bg-primary/25 transition-all duration-500 group-hover:bg-primary/40"
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
};

const MicroLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{children}</span>
);

export default function AiDashboard() {
  const { profile, subscription, generations, loading, user } = useAiApp();
  const { streak, today, last7, measurements, saveCheckin } = useAiProgress();
  const { offer, dismiss } = useAiOffer();
  const { insight } = useAiInsight();
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
  const weight = measurements?.[0]?.weight_kg ?? profile?.weight_kg ?? null;
  const prevWeight = measurements?.[1]?.weight_kg ?? null;
  const weightDelta = weight != null && prevWeight != null ? Number((weight - prevWeight).toFixed(1)) : null;
  const insightText =
    insight?.content
      ?.replace(/```[\s\S]*?```/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/^\s{0,3}#{1,6}\s*/gm, "")
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, "")
      .replace(/^\s*([-*_]\s*){3,}\s*$/gm, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/(\*\*\*|\*\*|__|[*_~`])/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim() ?? "";

  return (
    <AiShell title={`Olá, ${firstName}`} subtitle="Sua inteligência de nutrição, treino e evolução.">
      {offer && (
        <div className="mb-4">
          <AiOfferCard offer={offer} onDismiss={dismiss} />
        </div>
      )}

      {!subscription && !offer && (
        <Card className="mb-4 flex flex-col gap-3 border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Ative seu plano para gerar seus programas</p>
            <p className="mt-1 text-sm text-muted-foreground">A partir de R$ 39,90/mês, sem fidelidade.</p>
          </div>
          <Button asChild>
            <Link to="/ai/assinatura">Ver planos <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        {/* Refeição de agora — destaque principal */}
        <AiNextMealCard diet={latestOf(generations, "diet")} />

        {/* Treino do dia — lembrete */}
        <AiWorkoutReminderCard
          workout={latestOf(generations, "workout")}
          done={!!today?.workout_done}
          onDone={() => saveCheckin({ workout_done: true })}
        />

        {/* Constância — compacto */}
        <Link
          to="/ai/app/progresso"
          className={`${tile} col-span-2 flex flex-col justify-between lg:col-span-3`}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              <Flame className="h-3 w-3" /> Constância
            </span>
            <Badge variant={today ? "secondary" : "outline"} className="text-[10px]">
              {today ? "Check-in feito" : "Pendente"}
            </Badge>
          </div>

          <div className="relative mt-4 flex items-center gap-4">
            <div className="relative grid place-items-center">
              <Ring pct={adherencePct} size={72} stroke={7} />
              <span className="absolute text-center">
                <span className="block text-lg font-semibold leading-none tracking-tight">{adherence7}</span>
                <span className="block text-[9px] text-muted-foreground">/7 dias</span>
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight tracking-tight">
                {streak > 0 ? `${streak} ${streak === 1 ? "dia" : "dias"} seguidos` : "Comece sua sequência hoje"}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                {today ? "Tudo registrado por hoje." : "Registre seu dia em 5 segundos."}
              </p>
            </div>
          </div>

          <div className="relative mt-4 flex items-center gap-1.5">
            {last7.map((d, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${d.done ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </Link>

        {/* Hidratação */}
        <div className="col-span-2 lg:col-span-3">
          <AiHydrationCard />
        </div>

        {/* Peso — compacto */}
        <Link to="/ai/app/progresso" className={`${tile} col-span-2 flex items-center justify-between gap-3 lg:col-span-2`}>
          <div>
            <MicroLabel>Peso atual</MicroLabel>
            <p className="mt-1.5 text-xl font-semibold leading-none tracking-tight">
              {weight != null ? `${weight} kg` : "—"}
            </p>
            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
              {weightDelta != null
                ? `${weightDelta > 0 ? "+" : ""}${weightDelta} kg desde a última`
                : "registre suas medidas"}
            </p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Scale className="h-4 w-4" />
          </span>
        </Link>

        {/* Leitura STHIA */}
        <Link to="/ai/app/progresso" className={`${tile} col-span-2 flex flex-col justify-between lg:col-span-6`}>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              <BrainCircuit className="h-3.5 w-3.5" /> Leitura preditiva
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <p className="mt-3 line-clamp-3 max-w-[70ch] text-[15px] font-light leading-[1.7] tracking-[0.01em] text-muted-foreground">
            {insightText || "Registre alguns dias e a inteligência gera sua leitura de tendência automaticamente."}
          </p>
        </Link>

        {/* Módulos de IA */}
        {(Object.keys(AI_MODULES) as AiKind[]).map((kind) => {
          const mod = AI_MODULES[kind];
          const gen = latestOf(generations, kind);
          const left = daysLeftInCycle(gen, mod.cycleDays);
          return (
            <Link key={kind} to={ROUTES[kind]} className={`${tile} col-span-2 flex flex-col justify-between lg:col-span-2`}>
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-lg">{mod.icon}</span>
                {gen ? (
                  <Badge variant="secondary" className="text-[10px]">{left > 0 ? `${left}d restantes` : "Novo ciclo"}</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Novo</Badge>
                )}
              </div>
              <div className="mt-4">
                <h2 className="text-base font-semibold tracking-tight">{mod.title}</h2>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{mod.short}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  {gen ? "Abrir" : "Gerar agora"}
                  <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                </span>
                {gen && (
                  <span className="text-[10px] text-muted-foreground">
                    revisões {gen.revisions}/{kind === "analysis" ? 1 : 2}
                  </span>
                )}
              </div>
            </Link>
          );
        })}

        {/* Imagens corporais */}
        <Link to="/ai/app/imagens" className={`${tile} col-span-2 flex flex-col justify-between lg:col-span-2`}>
          <div className="flex items-start justify-between gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Camera className="h-5 w-5" />
            </span>
            <Badge variant="outline" className="text-[10px]">Evolução</Badge>
          </div>
          <div className="mt-4">
            <h2 className="text-base font-semibold tracking-tight">Imagens corporais</h2>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
              Envie fotos de evolução e compare sua transformação ao longo do ciclo.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
              Registrar
              <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
            </span>
          </div>
        </Link>

        {/* Atalhos */}
        {[
          { to: "/ai/app/diario", label: "Diário alimentar", hint: "registre refeições e água", icon: UtensilsCrossed },
          { to: "/ai/app/saude", label: "Saúde e wearables", hint: "Galaxy Watch e Health Connect", icon: HeartPulse },
          { to: "/ai/app/coaches", label: "Coaches humanos", hint: "acompanhamento profissional", icon: UserRound },
        ].map((s) => (
          <Link key={s.to} to={s.to} className={`${tile} col-span-2 flex items-center justify-between lg:col-span-2`}>
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <s.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{s.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{s.hint}</span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
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
