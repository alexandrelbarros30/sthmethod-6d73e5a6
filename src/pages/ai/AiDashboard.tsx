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
import { Loader2, ArrowRight, Sparkles, ShieldCheck, Flame, HeartPulse, UserRound } from "lucide-react";

const ROUTES: Record<AiKind, string> = {
  diet: "/ai/app/cardapio",
  workout: "/ai/app/treino",
  analysis: "/ai/app/analise",
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

  return (
    <AiShell title={`Olá, ${firstName}`} subtitle="Sua inteligência de nutrição, treino e evolução.">
      <Card className="mb-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              {streak > 0 ? `${streak} ${streak === 1 ? "dia" : "dias"} de constância` : "Comece sua sequência hoje"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {today ? `Check-in de hoje registrado · ${adherence7}/7 dias na semana` : "Faça o check-in de hoje em 5 segundos."}
            </p>
          </div>
        </div>
        <Button asChild variant={today ? "outline" : "default"}>
          <Link to="/ai/app/progresso">{today ? "Ver evolução" : "Fazer check-in"}</Link>
        </Button>
      </Card>

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

      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(AI_MODULES) as AiKind[]).map((kind) => {
          const mod = AI_MODULES[kind];
          const gen = latestOf(generations, kind);
          const left = daysLeftInCycle(gen, mod.cycleDays);
          return (
            <Card key={kind} className="flex flex-col justify-between gap-4 p-5">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg">{mod.icon}</p>
                    <h2 className="mt-2 text-base font-semibold">{mod.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{mod.short}</p>
                  </div>
                  {gen ? (
                    <Badge variant="secondary">{left > 0 ? `${left}d restantes` : "Novo ciclo liberado"}</Badge>
                  ) : (
                    <Badge variant="outline">Não gerado</Badge>
                  )}
                </div>
                {gen && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Revisões usadas neste ciclo: {gen.revisions}/{kind === "analysis" ? 1 : 2}
                  </p>
                )}
              </div>
              <Button asChild variant={gen ? "outline" : "default"} className="w-full">
                <Link to={ROUTES[kind]}>
                  {gen ? "Abrir" : "Gerar agora"} <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button asChild variant="outline" className="h-auto justify-between rounded-2xl p-5">
          <Link to="/ai/app/saude">
            <span className="flex items-center gap-2 text-sm font-medium">
              <HeartPulse className="h-4 w-4 text-primary" /> Saúde e wearables
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-between rounded-2xl p-5">
          <Link to="/ai/app/coaches">
            <span className="flex items-center gap-2 text-sm font-medium">
              <UserRound className="h-4 w-4 text-primary" /> Coaches humanos
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
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