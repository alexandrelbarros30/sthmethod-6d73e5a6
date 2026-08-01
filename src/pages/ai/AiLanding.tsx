import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Salad, Dumbbell, LineChart, ShieldCheck, ArrowRight } from "lucide-react";
import { AI_PLANS } from "@/hooks/useAiApp";

const PILLARS = [
  { icon: Salad, title: "Cardápio Inteligente", text: "Planejamento alimentar de 30 dias com macros, porções e substituições equivalentes." },
  { icon: Dumbbell, title: "Treino Inteligente", text: "Programa periodizado conforme seu nível, equipamentos e tempo disponível." },
  { icon: LineChart, title: "Central de Análise", text: "Relatório de evolução a cada 60 dias lendo peso, medidas e aderência." },
];

export default function AiLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
            <Brain className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">STH METHOD AI</span>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/ai/login?next=/ai/app">Entrar</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-3xl px-4 pb-16 pt-10 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">Inteligência da metodologia</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Seu plano de nutrição e treino construído pela inteligência do STH METHOD.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
          Um app autônomo, com a mesma lógica de periodização usada na consultoria: você responde, a inteligência
          constrói e acompanha sua evolução em ciclos.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/ai/onboarding">
              Começar agora <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/ai/assinatura">Ver planos</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-16 sm:grid-cols-3">
        {PILLARS.map((p) => (
          <article key={p.title} className="rounded-3xl border border-border/40 bg-card/40 p-6">
            <p.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-4 text-base font-semibold">{p.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight">Planos</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AI_PLANS.map((plan) => (
            <div key={plan.id} className="rounded-3xl border border-border/40 bg-card/40 p-6 text-center">
              <p className="text-sm text-muted-foreground">{plan.label}</p>
              <p className="mt-2 text-2xl font-semibold">{plan.price}</p>
              <p className="mt-1 text-xs text-muted-foreground">{plan.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="flex gap-3 rounded-3xl border border-border/40 bg-card/40 p-6 text-sm text-muted-foreground">
          <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
          <p>
            O STH METHOD AI não trata de substâncias, doses ou protocolos terapêuticos. Esses temas pertencem
            exclusivamente ao acompanhamento profissional da consultoria STH METHOD.
          </p>
        </div>
      </section>
    </div>
  );
}