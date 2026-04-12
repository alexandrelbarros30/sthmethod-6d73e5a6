import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  Rocket, Utensils, Dumbbell, Settings, BarChart3, Calendar,
  TrendingUp, ArrowLeft, ChevronLeft, ChevronRight, Target,
  Zap, DollarSign, Package, Eye, Ban, MessageCircle, FlaskConical, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const cards = [
  {
    id: 1,
    tag: "Introdução",
    title: "Como funciona a consultoria",
    brand: "STH METHOD",
    icon: Zap,
    accent: "from-primary/20 to-primary/5",
    content: (
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
          <Zap className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-foreground leading-tight">
          COMO FUNCIONA A<br />
          <span className="gradient-text">STH METHOD</span>
        </h2>
        <div className="space-y-3 max-w-sm">
          <p className="text-base text-muted-foreground leading-relaxed">
            🔥 Não é só dieta e treino
          </p>
          <p className="text-lg font-bold text-foreground">
            👉 é estratégia aplicada no seu corpo
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    tag: "O que você recebe",
    title: "Base da Consultoria",
    icon: Target,
    accent: "from-emerald-500/20 to-blue-500/10",
    content: (
      <div className="space-y-5 w-full">
        <h2 className="text-xl md:text-2xl font-extrabold text-foreground text-center mb-6">
          Base da <span className="gradient-text">Consultoria</span>
        </h2>
        {[
          { icon: Utensils, label: "Dieta Personalizada", color: "text-emerald-500" },
          { icon: Dumbbell, label: "Treino Guiado pelo App", color: "text-blue-500" },
          { icon: Settings, label: "Protocolos Estratégicos", color: "text-purple-500" },
          { icon: BarChart3, label: "Acompanhamento Contínuo", color: "text-amber-500" },
        ].map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50"
          >
            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0 shadow-sm">
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <span className="font-bold text-foreground text-sm md:text-base">{item.label}</span>
          </motion.div>
        ))}
        <p className="text-center text-sm font-semibold text-primary pt-2">
          👉 Tudo ajustado ao seu objetivo
        </p>
      </div>
    ),
  },
  {
    id: 3,
    tag: "Planos",
    title: "Diferença dos Planos",
    icon: Calendar,
    accent: "from-blue-500/20 to-purple-500/10",
    content: (
      <div className="space-y-5 w-full">
        <h2 className="text-xl md:text-2xl font-extrabold text-foreground text-center mb-4">
          Diferença dos <span className="gradient-text">Planos</span>
        </h2>
        <div className="p-5 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-6 h-6 text-primary" />
            <span className="font-extrabold text-foreground text-lg">30 DIAS</span>
          </div>
          <p className="text-sm text-muted-foreground">👉 Execução do mês — dieta, treino, protocolo e suporte focados no período.</p>
        </div>
        <div className="p-5 rounded-2xl bg-primary/5 border-2 border-primary/20 relative">
          <div className="absolute -top-2.5 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full gradient-bg text-primary-foreground">
            Recomendado
          </div>
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="font-extrabold text-foreground text-lg">90 / 180 DIAS</span>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>👉 Planejamento completo</p>
            <p>👉 Estratégia por fases</p>
            <p className="font-semibold text-foreground pt-1">Outro nível de resultado</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    tag: "Estratégia",
    title: "Visão de Projeto",
    icon: TrendingUp,
    accent: "from-purple-500/20 to-pink-500/10",
    content: (
      <div className="space-y-5 w-full">
        <h2 className="text-xl md:text-2xl font-extrabold text-foreground text-center mb-4">
          Visão de <span className="gradient-text">Projeto</span>
        </h2>
        <div className="space-y-0">
          {[
            { weeks: "1–4", label: "Estratégia inicial", emoji: "🔹" },
            { weeks: "5–8", label: "Ajustes e novo protocolo", emoji: "🔹" },
            { weeks: "9–12", label: "Refinamento e resultado", emoji: "🔹" },
          ].map((phase, i) => (
            <motion.div
              key={phase.weeks}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-center gap-4 p-4 border-b border-border/30 last:border-b-0"
            >
              <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center shrink-0 shadow-lg">
                <span className="text-primary-foreground font-extrabold text-xs">
                  SEM<br />{phase.weeks}
                </span>
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{phase.label}</p>
                <p className="text-xs text-muted-foreground">Semanas {phase.weeks}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-sm font-semibold text-primary pt-2">
          👉 Você enxerga o processo como um todo
        </p>
      </div>
    ),
  },
  {
    id: 5,
    tag: "Exames",
    title: "Análise de Exames",
    icon: FlaskConical,
    accent: "from-cyan-500/20 to-teal-500/10",
    content: (
      <div className="space-y-5 w-full">
        <h2 className="text-xl md:text-2xl font-extrabold text-foreground text-center mb-4">
          Análise de <span className="gradient-text">Exames</span>
        </h2>
        <div className="p-5 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0 shadow-sm">
              <FlaskConical className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <span className="font-bold text-foreground text-sm">Análise e interpretação de exames</span>
              <p className="text-xs text-muted-foreground mt-1">Avaliação detalhada dos seus resultados laboratoriais</p>
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <span className="font-bold text-foreground text-sm">Requisição de exames</span>
              <p className="text-xs text-muted-foreground mt-1">Solicitamos a requisição dos exames necessários</p>
              <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Custo adicional
              </span>
            </div>
          </div>
        </div>
        <p className="text-center text-sm font-semibold text-primary pt-2">
          👉 Seus exames analisados com estratégia
        </p>
      </div>
    ),
  },
  {
    id: 6,
    tag: "Controle",
    title: "Organização e Controle",
    icon: Eye,
    accent: "from-amber-500/20 to-orange-500/10",
    content: (
      <div className="space-y-5 w-full">
        <h2 className="text-xl md:text-2xl font-extrabold text-foreground text-center mb-4">
          Organização e <span className="gradient-text">Controle</span>
        </h2>
        {[
          { icon: BarChart3, label: "Visão completa do que será feito", color: "text-blue-500" },
          { icon: DollarSign, label: "Planejamento de custos", color: "text-emerald-500" },
          { icon: Package, label: "Organização de suplementos e estratégias", color: "text-purple-500" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50"
          >
            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0 shadow-sm">
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <span className="font-semibold text-foreground text-sm">{item.label}</span>
          </div>
        ))}
        <p className="text-center text-sm font-semibold text-primary pt-2">
          👉 Nada no escuro
        </p>
      </div>
    ),
  },
  {
    id: 7,
    tag: "Comece agora",
    title: "Fechamento",
    icon: Rocket,
    accent: "from-primary/20 to-emerald-500/10",
    content: (
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center shadow-lg">
          <Rocket className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Ban className="w-5 h-5" />
            <span className="font-bold text-sm">Sem cobrança automática</span>
          </div>
          <p className="text-sm text-muted-foreground">
            👉 Você renova apenas se quiser
          </p>
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-foreground">
          🎯 Quer começar com<br />
          estratégia de <span className="gradient-text">verdade</span>?
        </h2>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link to="/cadastro" className="w-full">
            <Button size="lg" className="gradient-bg text-primary-foreground w-full font-semibold">
              Começar agora <Rocket className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a
            href="https://wa.me/5521998496289?text=Ol%C3%A1!%20Vi%20como%20funciona%20a%20consultoria%20e%20gostei%20da%20proposta.%20Quero%20come%C3%A7ar%20%E2%80%94%20pode%20me%20orientar%20no%20plano%20ideal%3F"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button size="lg" variant="outline" className="w-full gap-2">
              <MessageCircle className="w-4 h-4" />
              Me chama no WhatsApp
            </Button>
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          📲 Me chama que te coloco pra dentro 💪🚀
        </p>
      </div>
    ),
  },
];

const ComoFunciona = () => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = (i: number) => {
    if (i >= 0 && i < cards.length) setCurrent(i);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? current + 1 : current - 1);
    }
  };

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(current + 1);
      if (e.key === "ArrowLeft") goTo(current - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current]);

  const card = cards[current];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <span className="text-sm font-bold tracking-wider text-foreground">STH METHOD</span>
          <Link to="/cadastro">
            <Button size="sm" className="gradient-bg text-primary-foreground text-xs px-4">
              Começar
            </Button>
          </Link>
        </div>
      </header>

      {/* Progress dots */}
      <div className="fixed top-16 left-0 right-0 z-40 flex justify-center gap-1.5 py-3">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 bg-primary"
                : i < current
                ? "w-4 bg-primary/40"
                : "w-4 bg-border"
            }`}
          />
        ))}
      </div>

      {/* Card area */}
      <main
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 flex items-center justify-center pt-24 pb-24 px-4"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 60, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.97 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className={`glass rounded-3xl p-6 md:p-8 relative overflow-hidden min-h-[420px] flex flex-col justify-center`}>
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} pointer-events-none`} />

              {/* Tag */}
              <div className="relative mb-6 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {card.tag}
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {card.id}/{cards.length}
                </span>
              </div>

              {/* Content */}
              <div className="relative flex-1 flex flex-col items-center justify-center">
                {card.content}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/50 py-3 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </Button>

          <span className="text-xs text-muted-foreground font-medium">
            Deslize para navegar
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => goTo(current + 1)}
            disabled={current === cards.length - 1}
            className="gap-1"
          >
            Próximo <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-14 left-0 right-0 z-30 text-center pb-1">
        <p className="text-[10px] text-muted-foreground/50">
          STH Method — Consultoria Estratégica
        </p>
      </footer>
    </div>
  );
};

export default ComoFunciona;
