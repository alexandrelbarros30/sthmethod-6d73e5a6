import { Link } from "react-router-dom";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { Button } from "@/components/ui/button";
import { Salad, Dumbbell, LineChart, ShieldCheck, ArrowRight } from "lucide-react";
import { AI_PLANS } from "@/hooks/useAiApp";
import AiLogoMark from "@/components/ai/AiLogoMark";

const PILLARS = [
  {
    icon: Salad,
    title: "Cardápio Inteligente",
    text: "Planejamento alimentar de 30 dias com macros, porções e substituições equivalentes.",
  },
  {
    icon: Dumbbell,
    title: "Treino Inteligente",
    text: "Programa periodizado conforme seu nível, equipamentos e tempo disponível.",
  },
  {
    icon: LineChart,
    title: "Central de Análise",
    text: "Relatório de evolução a cada 60 dias lendo peso, medidas e aderência.",
  },
];

export default function AiLanding() {
  useSthAiTheme();
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Background tech layer */}
      <div className="ai-tech-grid pointer-events-none absolute inset-0 opacity-[0.05]" />
      <div className="pointer-events-none absolute -right-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-[10%] -left-[10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />

      {/* Header */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <AiLogoMark className="h-8 w-8 shadow-lg shadow-primary/25" />
          <span className="text-sm font-semibold tracking-tight">STH METHOD AI</span>
        </div>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link to="/ai/instalar">Baixar app</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/ai/login?next=/ai/app">Entrar</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-10 pt-6 lg:pt-10">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left: Visual core */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto flex aspect-square w-full max-w-[420px] items-center justify-center">
              {/* Orbital rings */}
              <div className="absolute inset-0 rounded-full border border-primary/10 animate-spin-slow" />
              <div className="absolute inset-8 rounded-full border border-primary/5 animate-spin-reverse" />

              {/* Center core */}
              <div className="relative rounded-[40px] bg-card p-10 shadow-apple-xl border border-border/40 group transition-all duration-500 hover:border-primary/30">
                <div className="absolute -inset-1 rounded-[44px] bg-gradient-to-r from-primary/20 to-transparent opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100" />
                <div className="relative flex flex-col items-center">
                  <AiLogoMark className="mb-5 h-24 w-24 rounded-[28px] shadow-lg shadow-primary/30" />
                  <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">System Active</span>
                  <h2 className="text-3xl font-bold tracking-tight">STH AI</h2>
                </div>
              </div>

              {/* Floating data points */}
              <div className="absolute right-4 top-2 flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 shadow-apple-sm backdrop-blur-md animate-float">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SYNC_98%</span>
              </div>
              <div className="absolute bottom-16 left-0 flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 shadow-apple-sm backdrop-blur-md animate-float [animation-delay:1s]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">LATENCY_2MS</span>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Inteligência da metodologia</span>
            </div>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              O futuro do <br />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                STH METHOD
              </span>{" "}
              é IA.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Seu plano de nutrição e treino construído pela inteligência do STH METHOD. Um app autônomo, com a mesma
              lógica de periodização usada na consultoria: você responde, a inteligência constrói e acompanha sua
              evolução em ciclos.
            </p>

            {/* Pillars */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {PILLARS.map((p) => (
                <article
                  key={p.title}
                  className="rounded-3xl border border-border/40 bg-card/70 p-5 shadow-apple-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card"
                >
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-muted">
                    <p.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">{p.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.text}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0">
                <Link to="/ai/onboarding">
                  Começar agora <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                <Link to="/ai/assinatura">Ver planos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-8">
        <h2 className="text-center text-2xl font-semibold tracking-tight">Planos</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AI_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="rounded-3xl border border-border/40 bg-card/60 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-card"
            >
              <p className="text-sm text-muted-foreground">{plan.label}</p>
              <p className="mt-2 text-2xl font-semibold">{plan.price}</p>
              <p className="mt-1 text-xs text-muted-foreground">{plan.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-20">
        <div className="flex gap-3 rounded-3xl border border-border/40 bg-card/60 p-6 text-sm text-muted-foreground backdrop-blur-sm">
          <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
          <p>
            O STH METHOD AI não trata de substâncias, doses ou protocolos terapêuticos. Esses temas pertencem
            exclusivamente ao acompanhamento profissional da consultoria STH METHOD.
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao contratar, você concorda com os{" "}
          <a href="/ai/legal/termos-de-uso" className="text-primary underline underline-offset-4">
            Termos de Uso
          </a>{" "}
          ·{" "}
          <a href="/ai/legal" className="text-primary underline underline-offset-4">
            Documentos e Termos
          </a>
        </p>
      </section>
    </div>
  );
}
