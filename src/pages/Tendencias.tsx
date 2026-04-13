import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, FlaskConical, Settings, Dumbbell, ClipboardCheck,
  BarChart3, Rocket, MessageCircle, TrendingUp, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: FlaskConical,
    title: "Análise de Exames",
    subtitle: "Biomarcadores & Ajustes",
    color: "text-cyan-500",
  },
  {
    icon: Settings,
    title: "Protocolos Personalizados",
    subtitle: "Abordagem Individualizada",
    color: "text-purple-500",
  },
  {
    icon: Dumbbell,
    title: "Treino & Nutrição",
    subtitle: "Performance & Longevidade",
    color: "text-emerald-500",
  },
  {
    icon: ClipboardCheck,
    title: "Acompanhamento Contínuo",
    subtitle: "Avaliar & Evoluir",
    color: "text-amber-500",
  },
];

const references = [
  "American College of Sports Medicine",
  "Harvard Medical School",
  "Cleveland Clinic",
  "Mayo Clinic",
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Tendencias = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
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

      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        {/* Hero */}
        <motion.section
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
            <Globe className="w-3.5 h-3.5" />
            Tendências Globais
          </motion.div>

          <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mb-2 tracking-wide">
            O QUE ESTÁ EM EVIDÊNCIA NO <span className="font-bold text-foreground">FITNESS</span> (EUA & EUROPA)?
          </motion.p>

          <motion.h1 variants={fadeUp} custom={2} className="text-2xl md:text-4xl font-extrabold text-foreground leading-tight mb-4">
            FITNESS + MEDICINA +{" "}
            <span className="gradient-text">DADOS</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={3} className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            O jogo mudou — não é mais só sobre estética. É entender o corpo e tomar decisões com base em informação real.
          </motion.p>
        </motion.section>

        {/* Pillars grid */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-3 mb-12"
        >
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              variants={fadeUp}
              custom={i}
              className="flex flex-col items-center text-center p-5 rounded-2xl bg-muted/50 border border-border/50 gap-3"
            >
              <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center shadow-sm border border-border/30">
                <p.icon className={`w-7 h-7 ${p.color}`} />
              </div>
              <div>
                <p className="font-bold text-foreground text-xs leading-tight mb-1">{p.title}</p>
                <p className="text-[11px] text-muted-foreground">{p.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* Context */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-12"
        >
          <motion.div variants={fadeUp} custom={0} className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
            <div className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>👉 Não é mais só treinar e fazer dieta.</p>
                <p>É entender o corpo e tomar decisões com base em <span className="font-bold text-foreground">informação real</span>.</p>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Before / After */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-12 space-y-3"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-4 p-4 rounded-2xl bg-destructive/5 border border-destructive/20">
            <span className="text-lg">❌</span>
            <div>
              <p className="text-xs text-muted-foreground">Antes</p>
              <p className="font-bold text-foreground text-sm">Dieta + treino genérico</p>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20">
            <span className="text-lg">🔥</span>
            <div>
              <p className="text-xs text-muted-foreground">Agora</p>
              <p className="font-bold text-foreground text-sm">Sistema completo baseado em dados e estratégia</p>
            </div>
          </motion.div>
        </motion.section>

        {/* References */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-12"
        >
          <motion.p variants={fadeUp} custom={0} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Referências
          </motion.p>
          <div className="grid grid-cols-2 gap-2">
            {references.map((ref, i) => (
              <motion.div
                key={ref}
                variants={fadeUp}
                custom={i}
                className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/30"
              >
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-xs font-medium text-foreground leading-tight">{ref}</span>
              </motion.div>
            ))}
          </div>
          <motion.p variants={fadeUp} custom={4} className="text-center text-xs text-muted-foreground mt-4">
            Todos reforçando: <span className="font-bold text-foreground">exercício + dados + acompanhamento = resultado sustentável</span>
          </motion.p>
        </motion.section>

        {/* Conclusion */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center space-y-4 mb-8"
        >
          <motion.div variants={fadeUp} custom={0} className="space-y-1">
            <p className="text-xs text-muted-foreground tracking-wide uppercase">Exercício + Dados + Acompanhamento</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground">
              RESULTADO <span className="gradient-text">SUSTENTÁVEL</span>
            </h2>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
            <p>📲 É exatamente essa linha que seguimos na <span className="font-bold text-foreground">STH Method</span>.</p>
            <p>👉 Não é sobre tentativa e erro</p>
            <p className="font-bold text-foreground">👉 É sobre saber o que fazer, quando fazer e por quê</p>
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
            <Link to="/cadastro" className="w-full">
              <Button size="lg" className="gradient-bg text-primary-foreground w-full font-semibold">
                Começar agora <Rocket className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a
              href="https://wa.me/5521998496289?text=Ol%C3%A1!%20Vi%20sobre%20as%20tend%C3%AAncias%20globais%20de%20fitness%20e%20quero%20entender%20como%20aplicar%20isso%20no%20meu%20caso.%20Pode%20me%20ajudar%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button size="lg" variant="outline" className="w-full gap-2">
                <MessageCircle className="w-4 h-4" />
                Me chama no WhatsApp
              </Button>
            </a>
          </motion.div>
        </motion.section>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground/50">
          STH Method — Consultoria Estratégica
        </p>
      </main>
    </div>
  );
};

export default Tendencias;
