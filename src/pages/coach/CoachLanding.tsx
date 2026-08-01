import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Dumbbell, ArrowRight, ShieldCheck, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COACH_PLANS } from "@/lib/coach-plans";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

const PILLARS = [
  { icon: Dumbbell, title: "Editor de treinos completo", desc: "O mesmo editor da STH METHOD: bi-set, tri-set, dropset, RPE, RIR, cadência e circuitos." },
  { icon: Zap, title: "Biblioteca oficial + ST Coach", desc: "Milhares de exercícios com GIFs e vídeos de referência técnica, prontos para montar." },
  { icon: Users, title: "Alunos no seu ambiente", desc: "Convite por link ou QR Code. Cada aluno pertence exclusivamente a você." },
  { icon: ShieldCheck, title: "Isolamento total", desc: "Arquitetura multi-tenant: nenhum profissional enxerga dados de outro." },
];

const CoachLanding = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-16">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-primary" strokeWidth={2} />
            </div>
            <span className="text-[13px] font-semibold tracking-[-0.02em]">STH METHOD COACH</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/coach/entrar">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/coach/comecar">Criar ambiente</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 pt-20 pb-16 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <Badge variant="secondary" className="rounded-full mb-6 px-3 py-1 text-[11px] tracking-wide">
            Para Personal Trainers, Educadores Físicos e Academias
          </Badge>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05]">
            A plataforma de treino
            <br className="hidden md:block" /> que trabalha no seu padrão.
          </h1>
          <p className="mt-6 text-[15px] md:text-[17px] text-muted-foreground max-w-2xl mx-auto font-light tracking-tight leading-relaxed">
            Monte, publique e acompanhe programas de treino para seus próprios alunos, com a mesma
            engenharia da STH METHOD. Sem consultoria, sem IA — o treino é seu, do começo ao fim.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link to="/coach/comecar">
                Criar meu ambiente <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <a href="#planos">Ver planos</a>
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <Card key={p.title} className="p-6 rounded-2xl border-border/60">
            <p.icon className="h-5 w-5 text-primary mb-4" strokeWidth={1.9} />
            <h3 className="text-[14px] font-semibold tracking-[-0.02em]">{p.title}</h3>
            <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed font-light">{p.desc}</p>
          </Card>
        ))}
      </section>

      <section id="planos" className="max-w-6xl mx-auto px-5 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.035em]">Planos</h2>
          <p className="mt-3 text-[14px] text-muted-foreground font-light tracking-tight">
            Escolha pelo número de alunos ativos. Troque de plano quando quiser.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {COACH_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative p-6 rounded-2xl flex flex-col border-border/60",
                plan.highlight && "border-primary/50 shadow-lg shadow-primary/5"
              )}
            >
              {plan.id === "free" && (
                <Badge variant="secondary" className="absolute -top-2.5 left-6 rounded-full text-[10px] px-2.5">
                  Grátis
                </Badge>
              )}
              {plan.highlight && (
                <Badge className="absolute -top-2.5 left-6 rounded-full text-[10px] px-2.5">Mais escolhido</Badge>
              )}
              <h3 className="text-[15px] font-semibold tracking-[-0.02em]">{plan.name}</h3>
              <p className="mt-1 text-[12px] text-muted-foreground font-light leading-snug min-h-[32px]">
                {plan.tagline}
              </p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-2xl font-semibold tracking-[-0.03em]">{plan.price}</span>
                <span className="text-[11px] text-muted-foreground">{plan.priceNote}</span>
              </div>
              <ul className="mt-5 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[12.5px] text-muted-foreground leading-relaxed">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" strokeWidth={2.4} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlight ? "default" : "outline"}
                className="mt-6 w-full rounded-full"
              >
                <Link to={`/coach/comecar?plano=${plan.id}`}>
                  {plan.id === "free" ? "Começar grátis" : "Começar"}
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-10 text-center">
        <p className="text-[12px] text-muted-foreground font-light">
          STH METHOD COACH — produto do ecossistema STH METHOD. Não é consultoria STH METHOD.
        </p>
      </footer>
    </div>
  );
};

export default CoachLanding;