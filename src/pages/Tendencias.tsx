import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, FlaskConical, Settings, Dumbbell, ClipboardCheck,
  Rocket, MessageCircle, Globe, Newspaper, ExternalLink,
  TrendingUp, Zap, ChevronRight, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const references = [
  {
    name: "ACSM — Worldwide Fitness Trends",
    tag: "ACSM",
    desc: "Referência global em diretrizes de exercício e saúde.",
    color: "from-blue-600 to-blue-800",
    links: [
      { label: "Top Fitness Trends", url: "https://www.acsm.org/news-detail/2023/01/01/top-fitness-trends" },
    ],
  },
  {
    name: "Harvard Medical School",
    tag: "HARVARD",
    desc: "Publicações sobre exercício, prevenção de doenças e longevidade baseada em evidência.",
    color: "from-red-700 to-red-900",
    links: [
      { label: "Exercise and Fitness", url: "https://www.health.harvard.edu/exercise-and-fitness" },
    ],
  },
  {
    name: "Cleveland Clinic",
    tag: "CLEVELAND",
    desc: "Abordagem baseada em biomarcadores e medicina preventiva de alto nível.",
    color: "from-emerald-600 to-emerald-800",
    links: [
      { label: "Health Essentials", url: "https://health.clevelandclinic.org" },
    ],
  },
  {
    name: "Mayo Clinic",
    tag: "MAYO",
    desc: "Diretrizes de saúde integrativa, performance e acompanhamento contínuo.",
    color: "from-sky-600 to-sky-800",
    links: [
      { label: "Fitness & Lifestyle", url: "https://www.mayoclinic.org/healthy-lifestyle/fitness" },
    ],
  },
];

const pillars = [
  { icon: FlaskConical, title: "Análise de Exames", desc: "Ajustes baseados no que seu corpo realmente precisa — biomarcadores e dados reais.", tag: "BIOMARCADORES" },
  { icon: Settings, title: "Protocolos Personalizados", desc: "Nada genérico. Tudo individualizado para o seu momento e objetivo.", tag: "PERSONALIZAÇÃO" },
  { icon: Dumbbell, title: "Treino + Nutrição Estratégica", desc: "Com foco em performance, saúde e longevidade — não apenas estética.", tag: "ESTRATÉGIA" },
  { icon: ClipboardCheck, title: "Acompanhamento Contínuo", desc: "Avaliar → ajustar → evoluir. Ciclo de melhoria constante.", tag: "EVOLUÇÃO" },
];

const Tendencias = () => {
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header — editorial style */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4">
          {/* Top bar */}
          <div className="h-12 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </Link>
            <div className="flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-black tracking-[0.2em] text-foreground uppercase">STH News</span>
            </div>
            <Link to="/cadastro">
              <Button size="sm" className="gradient-bg text-primary-foreground text-[10px] px-3 h-7 rounded-full font-bold">
                Começar
              </Button>
            </Link>
          </div>
          {/* Ticker */}
          <div className="h-7 flex items-center gap-3 border-t border-border/50 overflow-hidden">
            <span className="shrink-0 text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded leading-none">AO VIVO</span>
            <div className="relative flex-1 overflow-hidden h-full flex items-center">
              <div className="flex items-center gap-6 animate-[marquee_30s_linear_infinite] whitespace-nowrap">
                <span className="text-[10px] text-muted-foreground">🌍 ACSM publica novas diretrizes globais de fitness</span>
                <span className="text-[10px] text-primary">•</span>
                <span className="text-[10px] text-muted-foreground">🧬 Harvard reforça: dados + exercício = longevidade</span>
                <span className="text-[10px] text-primary">•</span>
                <span className="text-[10px] text-muted-foreground">📊 Cleveland Clinic aposta em biomarcadores preventivos</span>
                <span className="text-[10px] text-primary">•</span>
                <span className="text-[10px] text-muted-foreground">🏥 Mayo Clinic atualiza protocolo de saúde integrativa</span>
                <span className="text-[10px] text-primary mx-4">•</span>
                <span className="text-[10px] text-muted-foreground">🌍 ACSM publica novas diretrizes globais de fitness</span>
                <span className="text-[10px] text-primary">•</span>
                <span className="text-[10px] text-muted-foreground">🧬 Harvard reforça: dados + exercício = longevidade</span>
                <span className="text-[10px] text-primary">•</span>
                <span className="text-[10px] text-muted-foreground">📊 Cleveland Clinic aposta em biomarcadores preventivos</span>
                <span className="text-[10px] text-primary">•</span>
                <span className="text-[10px] text-muted-foreground">🏥 Mayo Clinic atualiza protocolo de saúde integrativa</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        {/* Featured Article Link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="space-y-3">
            <Link
              to="/tendencias/drostanolona-masteron"
              className="block rounded-2xl border border-destructive/40 bg-gradient-to-r from-destructive/10 via-background to-primary/5 p-4 hover:border-destructive/60 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded tracking-wider animate-pulse">EXCLUSIVO</span>
                <span className="text-[10px] text-muted-foreground">Nova matéria</span>
              </div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                🧬 Drostanolona (Masteron): o derivado de DHT que define densidade e performance
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                Densidade muscular, estética e os limites do uso feminino · Ler matéria <ChevronRight className="w-3 h-3" />
              </p>
            </Link>

            <Link
              to="/tendencias/triade-intestino-hormonio"
              className="block rounded-2xl border border-destructive/40 bg-gradient-to-r from-destructive/10 via-background to-primary/5 p-4 hover:border-destructive/60 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded tracking-wider animate-pulse">EXCLUSIVO</span>
                <span className="text-[10px] text-muted-foreground">Nova matéria</span>
              </div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                🧬 Tríade SII, SOP e DRGE: o eixo intestino-hormônio-inflamação
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                Mesma raiz, três expressões · Ler matéria <ChevronRight className="w-3 h-3" />
              </p>
            </Link>

            <Link
              to="/tendencias/cintura-estetica"
              className="block rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-4 hover:border-primary/60 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded tracking-wider animate-pulse">NOVO</span>
                <span className="text-[10px] text-muted-foreground">22 Abr 2026</span>
              </div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                ⚡ A estética da cintura não é só genética: o que treino e alimentação realmente fazem
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                Estrutura, estímulo e estratégia · Ler matéria <ChevronRight className="w-3 h-3" />
              </p>
            </Link>

            <Link
              to="/tendencias/subcutanea-estrategia"
              className="block rounded-2xl border border-destructive/40 bg-gradient-to-r from-destructive/10 via-background to-primary/5 p-4 hover:border-destructive/60 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded tracking-wider animate-pulse">EXCLUSIVO</span>
                <span className="text-[10px] text-muted-foreground">Nova matéria</span>
              </div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                💉 IM → SubQ: a estratégia farmacocinética que mudou o jogo
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                Estabilidade sérica e técnica de precisão · Ler matéria <ChevronRight className="w-3 h-3" />
              </p>
            </Link>

            <Link
              to="/tendencias/recomposicao-avancada"
              className="block rounded-2xl border border-destructive/40 bg-gradient-to-r from-destructive/10 via-background to-primary/5 p-4 hover:border-destructive/60 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded tracking-wider animate-pulse">EXCLUSIVO</span>
                <span className="text-[10px] text-muted-foreground">Nova matéria</span>
              </div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                🔥 Recomposição Corporal Avançada: o novo cenário da performance
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                Tirzepatida + estratégia anabólica · Ler matéria <ChevronRight className="w-3 h-3" />
              </p>
            </Link>

            <Link
              to="/tendencias/cenario-fitness-2026"
              className="block rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-4 hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded tracking-wider">MATÉRIA</span>
                <span className="text-[10px] text-muted-foreground">Abril 2026</span>
              </div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                O cenário atual do fitness global: IFBB, FIBO Europe e o fim do conteúdo genérico
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                Ler matéria completa <ChevronRight className="w-3 h-3" />
              </p>
            </Link>
          </div>
        </motion.div>

        {/* HEADLINE — Breaking news style */}
        <motion.section
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded tracking-wider">BREAKING</span>
            <span className="text-[10px] text-muted-foreground">{today}</span>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-2xl md:text-4xl font-black text-foreground leading-[1.15] mb-3 tracking-tight">
            O jogo mudou: EUA e Europa integram{" "}
            <span className="gradient-text">Fitness, Medicina e Dados</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4">
            O novo padrão global não é mais sobre estética. É sobre entender o corpo e tomar decisões com base em informação real — e as maiores instituições do mundo já confirmam.
          </motion.p>
        </motion.section>

        {/* Featured image / infographic banner */}
        <motion.section
          initial="hidden"
          animate="visible"
          className="mb-10"
        >
          <motion.div
            variants={fadeUp}
            custom={3}
            className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-background to-primary/5 border border-primary/20 p-6 md:p-8"
          >
            <div className="absolute top-3 right-3">
              <Globe className="w-16 h-16 text-primary/10" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Tendência Global</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-background/60 backdrop-blur border border-border/50">
                <FlaskConical className="w-6 h-6 mx-auto mb-1.5 text-cyan-500" />
                <p className="text-[11px] font-bold text-foreground">Fitness</p>
              </div>
              <div className="p-3 rounded-xl bg-background/60 backdrop-blur border border-border/50">
                <Zap className="w-6 h-6 mx-auto mb-1.5 text-amber-500" />
                <p className="text-[11px] font-bold text-foreground">Medicina</p>
              </div>
              <div className="p-3 rounded-xl bg-background/60 backdrop-blur border border-border/50">
                <BookOpen className="w-6 h-6 mx-auto mb-1.5 text-emerald-500" />
                <p className="text-[11px] font-bold text-foreground">Dados</p>
              </div>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-3">A tríade que está revolucionando a saúde e performance no mundo</p>
          </motion.div>
        </motion.section>

        {/* EDITORIAL: References as main feature — news cards */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-10"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-5">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Fontes que validam</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div className="space-y-3" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {references.map((ref, i) => (
              <motion.div
                key={ref.tag}
                variants={fadeUp}
                custom={i}
                className="group relative rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Badge */}
                  <div className={`shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${ref.color} flex items-center justify-center shadow-lg`}>
                    <span className="text-[9px] font-black text-white tracking-wider leading-none text-center">{ref.tag}</span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground leading-tight">{ref.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ref.desc}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ref.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                        >
                          {link.label} <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Bottom accent */}
                <div className={`h-0.5 bg-gradient-to-r ${ref.color} opacity-30 group-hover:opacity-70 transition-opacity`} />
              </motion.div>
            ))}
          </motion.div>

          <motion.p variants={fadeUp} custom={5} className="text-center text-xs text-muted-foreground mt-5 font-medium">
            👉 Todos reforçando:{" "}
            <span className="font-bold text-foreground">exercício + dados + acompanhamento = resultado sustentável</span>
          </motion.p>
        </motion.section>

        {/* PILLAR deep-dives — editorial format */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-10"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Os 4 pilares</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <div className="space-y-3">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                variants={fadeUp}
                custom={i + 1}
                className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <p.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded tracking-wider">{p.tag}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-0.5">{p.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Before / After — editorial contrast */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-10"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Antes vs Agora</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div variants={fadeUp} custom={1} className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 text-center">
              <span className="text-2xl mb-2 block">❌</span>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Antes</p>
              <p className="text-xs font-bold text-foreground">Dieta + treino genérico</p>
              <p className="text-[10px] text-muted-foreground mt-1">Tentativa e erro</p>
            </motion.div>
            <motion.div variants={fadeUp} custom={2} className="p-4 rounded-2xl bg-primary/5 border-2 border-primary/30 text-center">
              <span className="text-2xl mb-2 block">🔥</span>
              <p className="text-[9px] uppercase tracking-widest text-primary mb-1 font-bold">Agora</p>
              <p className="text-xs font-bold text-foreground">Sistema baseado em dados</p>
              <p className="text-[10px] text-muted-foreground mt-1">Estratégia + acompanhamento</p>
            </motion.div>
          </div>
        </motion.section>

        {/* CTA — editorial closing */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-8"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 p-6 text-center"
          >
            <p className="text-[9px] uppercase tracking-[0.2em] text-primary font-bold mb-2">Opinião do Editor</p>
            <h2 className="text-lg md:text-xl font-black text-foreground mb-3 leading-tight">
              É exatamente essa linha que seguimos na{" "}
              <span className="gradient-text">STH Method</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-1">👉 Não é sobre tentativa e erro</p>
            <p className="text-sm font-bold text-foreground mb-5">
              É sobre saber o que fazer, quando fazer e por quê
            </p>

            <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
              <Link to="/cadastro" className="w-full">
                <Button size="lg" className="gradient-bg text-primary-foreground w-full font-bold gap-2 rounded-xl">
                  Começar agora <Rocket className="w-4 h-4" />
                </Button>
              </Link>
              <a
                href="https://wa.me/5521998496289?text=Ol%C3%A1!%20Vi%20sobre%20as%20tend%C3%AAncias%20globais%20de%20fitness%20e%20quero%20entender%20como%20aplicar%20isso%20no%20meu%20caso.%20Pode%20me%20ajudar%3F"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button size="lg" variant="outline" className="w-full gap-2 rounded-xl">
                  <MessageCircle className="w-4 h-4" />
                  Falar com especialista
                </Button>
              </a>
            </div>
          </motion.div>
        </motion.section>

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">STH News — Informação que transforma</p>
          <p className="text-[9px] text-muted-foreground/30">Consultoria Estratégica em Saúde & Performance</p>
        </div>
      </main>

      {/* Marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default Tendencias;
