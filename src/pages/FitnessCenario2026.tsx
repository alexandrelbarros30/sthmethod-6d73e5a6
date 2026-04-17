import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Newspaper, Globe, MessageCircle, Rocket,
  Trophy, Cpu, TrendingUp, Target, Layers, ChevronRight,
  ExternalLink, Zap, Shield, Flame, Calendar, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import fiboImg from "@/assets/fibo-2026.jpg";
import ifbbMemphisImg from "@/assets/ifbb-memphis-2026.jpg";
import ifbbMercosurImg from "@/assets/ifbb-mercosur-2026.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const FitnessCenario2026 = () => {
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4">
          <div className="h-12 flex items-center justify-between">
            <Link to="/tendencias" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> STH News
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
            <span className="shrink-0 text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded leading-none">EDIÇÃO ESPECIAL</span>
            <div className="relative flex-1 overflow-hidden h-full flex items-center">
              <div className="flex items-center gap-6 animate-[marquee_35s_linear_infinite] whitespace-nowrap">
                <span className="text-[10px] text-muted-foreground">🏆 IFBB confirma European Championships e Mr. Universe 2026</span>
                <span className="text-[10px] text-primary">•</span>
                <span className="text-[10px] text-muted-foreground">🇩🇪 FIBO Europe bate recorde com foco em saúde integrada</span>
                <span className="text-[10px] text-primary">•</span>
                <span className="text-[10px] text-muted-foreground">💻 Bodybuilding.com reposiciona marca para dados e longevidade</span>
                <span className="text-[10px] text-primary">•</span>
                <span className="text-[10px] text-muted-foreground">📊 Fitness em 2026: de estética para sistema biológico</span>
                <span className="text-[10px] text-primary mx-4">•</span>
                <span className="text-[10px] text-muted-foreground">🏆 IFBB confirma European Championships e Mr. Universe 2026</span>
                <span className="text-[10px] text-primary">•</span>
                <span className="text-[10px] text-muted-foreground">🇩🇪 FIBO Europe bate recorde com foco em saúde integrada</span>
                <span className="text-[10px] text-primary">•</span>
                <span className="text-[10px] text-muted-foreground">💻 Bodybuilding.com reposiciona marca para dados e longevidade</span>
                <span className="text-[10px] text-primary">•</span>
                <span className="text-[10px] text-muted-foreground">📊 Fitness em 2026: de estética para sistema biológico</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        {/* HEADLINE */}
        <motion.section initial="hidden" animate="visible" className="mb-8">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded tracking-wider">ANÁLISE ESPECIAL</span>
            <span className="text-[10px] text-muted-foreground">{today}</span>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-2xl md:text-4xl font-black text-foreground leading-[1.15] mb-3 tracking-tight">
            Abril de 2026: o fitness global{" "}
            <span className="gradient-text">não é mais o que você pensa</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4">
            Enquanto a maioria ainda associa fitness a séries, repetições e dieta da moda, 
            as maiores organizações do mundo — IFBB, FIBO e plataformas como Bodybuilding.com — 
            já operam em outro nível. Este é o cenário real. E ele não perdoa amadores.
          </motion.p>
        </motion.section>

        {/* ABERTURA EDITORIAL */}
        <motion.section initial="hidden" animate="visible" className="mb-10">
          <motion.div
            variants={fadeUp}
            custom={3}
            className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/20 p-5 md:p-7"
          >
            <div className="absolute top-3 right-3 opacity-10">
              <Globe className="w-20 h-20 text-primary" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-bold mb-3">Contexto Global — Abril 2026</p>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              O fitness deixou de ser uma indústria de produtos e virou uma <strong>indústria de sistemas</strong>. 
              Competições internacionais agora integram análise genética. Feiras europeias expõem wearables médicos 
              ao lado de suplementos. E as maiores plataformas digitais do setor abandonaram o conteúdo genérico 
              em favor de <strong>inteligência aplicada à saúde</strong>.
            </p>
            <p className="text-xs text-muted-foreground italic">
              A pergunta não é mais "qual dieta seguir". É: <strong className="text-foreground">você tem dados suficientes para tomar essa decisão?</strong>
            </p>
          </motion.div>
        </motion.section>

        {/* BLOCO 1 — IFBB */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">IFBB — Elite Física Global</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
            {/* Image grid */}
            <div className="grid grid-cols-2 gap-0">
              <img src={ifbbMercosurImg} alt="Copa Mercosur IFBB Brasil 2026" className="w-full h-36 md:h-48 object-cover" />
              <img src={ifbbMemphisImg} alt="IFBB Pro League Memphis Championship 2026" className="w-full h-36 md:h-48 object-cover" />
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded tracking-wider">COMPETIÇÕES</span>
                <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Mai–Jun 2026</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                A IFBB (International Federation of Bodybuilding & Fitness) segue como a <strong>maior organização 
                competitiva do planeta</strong>. Em 2026, os eventos de destaque incluem o <strong>European Championships</strong>, o 
                lendário <strong>Mr. Universe</strong>, a <strong>Copa Mercosur IFBB no Brasil</strong> e o 
                <strong> Memphis Bodybuilding Championship</strong> — todos com protocolos de avaliação cada vez mais técnicos.
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                O que mudou: a elite física não é mais avaliada apenas pela simetria e volume muscular. 
                Agora, a <strong>condição metabólica, a maturidade dos protocolos e a sustentabilidade 
                do preparo</strong> são fatores decisivos. Atletas que chegam "secos" mas sem saúde são cada vez 
                mais questionados — pelo público e pelos juízes.
              </p>

              {/* Mini news cards */}
              <div className="grid grid-cols-1 gap-2 mt-2">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-background/60 border border-border/40">
                  <Flame className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-foreground">Copa Mercosur IFBB — Brasil 2026</p>
                    <p className="text-[9px] text-muted-foreground">Atletas de 12 países do Mercosul competem em solo brasileiro. O evento reforça a expansão da IFBB na América Latina com foco em categorias clássicas e novas divisões.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-background/60 border border-border/40">
                  <Flame className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-foreground">Memphis IFBB Pro & NPC — Maio 2026</p>
                    <p className="text-[9px] text-muted-foreground">Qualifier oficial para o Olympia. Men's Physique, Bikini Masters e divisões 35+ a 60+ mostram a longevidade competitiva como nova tendência.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-background/60 border border-border/40">
                <Target className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Leitura STH:</strong> Performance de palco sem performance biológica é insustentável. 
                  Os atletas que dominam o circuito internacional hoje são os que tratam o corpo como um <em>sistema</em>, não como uma vitrine.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* BLOCO 2 — EUROPA / FIBO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-cyan-500" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">FIBO Europe — Inovação e Saúde</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 overflow-hidden">
            {/* FIBO Hero image */}
            <img src={fiboImg} alt="FIBO 2026 — Exhibition Centre Cologne, 16-19 April" className="w-full h-44 md:h-56 object-cover" />
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded tracking-wider">ALEMANHA 2026</span>
                <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> 16–19 Abril</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                A <strong>FIBO</strong> (Fitness, Innovation, Body & Outdoor), realizada em Colônia, na Alemanha, é a <strong>maior feira 
                de fitness do mundo</strong>. Em 2026, o evento consolidou uma tendência irreversível: a fusão entre 
                <strong> fitness, tecnologia médica e lifestyle</strong>.
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                Os destaques não foram suplementos ou equipamentos. Foram <strong>plataformas de rastreamento biológico, 
                dispositivos de bioimpedância em tempo real, integração com prontuários médicos</strong> e painéis 
                inteiros dedicados à <strong>saúde mental como componente de performance</strong>.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-3 rounded-xl bg-background/60 border border-border/40 text-center">
                  <Layers className="w-5 h-5 mx-auto mb-1.5 text-cyan-500" />
                  <p className="text-[10px] font-bold text-foreground">Saúde Integrada</p>
                  <p className="text-[9px] text-muted-foreground">Fitness + Medicina + Tech</p>
                </div>
                <div className="p-3 rounded-xl bg-background/60 border border-border/40 text-center">
                  <Shield className="w-5 h-5 mx-auto mb-1.5 text-cyan-500" />
                  <p className="text-[10px] font-bold text-foreground">Dados Biológicos</p>
                  <p className="text-[9px] text-muted-foreground">Wearables + Exames</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-background/60 border border-border/40">
                <Target className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Leitura STH:</strong> A Europa não vende mais fitness. 
                  Vende <em>gestão biológica</em>. E quem não acompanha, fica preso num modelo de década passada.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* BLOCO 3 — MERCADO DIGITAL */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Mercado Digital — Reposicionamento</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded tracking-wider">PLATAFORMAS</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              A <strong>Bodybuilding.com</strong> — que por duas décadas foi sinônimo de treinos prontos e suplementação em massa — 
              completou seu <strong>reposicionamento estratégico</strong>. Em 2026, a plataforma opera como um 
              hub de <strong>conteúdo baseado em evidência, ferramentas de tracking e parcerias com profissionais de saúde</strong>.
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              O modelo "treino de 12 semanas para hipertrofia" deu lugar a <strong>ecossistemas 
              personalizados</strong>: integração com apps de sono, painéis nutricionais com IA e 
              conteúdo editorial revisado por médicos. A mensagem é clara: 
              <strong> o fitness genérico morreu</strong>.
            </p>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-background/60 border border-border/40">
              <Target className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Leitura STH:</strong> Se a maior plataforma do mundo abandonou 
                o conteúdo genérico, qual é a sua desculpa para continuar seguindo planilhas de internet?
              </p>
            </div>
          </motion.div>
        </motion.section>

        {/* COMPARAÇÃO: Performance Estética vs Biológica */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Palco vs Biologia</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div variants={fadeUp} custom={1} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-2">
              <Trophy className="w-7 h-7 mx-auto text-amber-500" />
              <p className="text-[9px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">Performance Estética</p>
              <p className="text-xs font-bold text-foreground">Palco & Competição</p>
              <div className="space-y-1 text-left">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><ChevronRight className="w-3 h-3 text-amber-500" />Simetria visual</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><ChevronRight className="w-3 h-3 text-amber-500" />% gordura extremo</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><ChevronRight className="w-3 h-3 text-amber-500" />Depleção e peak week</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><ChevronRight className="w-3 h-3 text-amber-500" />Resultado temporário</p>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={2} className="p-4 rounded-2xl bg-primary/5 border-2 border-primary/30 text-center space-y-2">
              <Shield className="w-7 h-7 mx-auto text-primary" />
              <p className="text-[9px] uppercase tracking-widest text-primary font-bold">Performance Biológica</p>
              <p className="text-xs font-bold text-foreground">Saúde & Dados</p>
              <div className="space-y-1 text-left">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><ChevronRight className="w-3 h-3 text-primary" />Biomarcadores otimizados</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><ChevronRight className="w-3 h-3 text-primary" />Composição sustentável</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><ChevronRight className="w-3 h-3 text-primary" />Protocolos ajustáveis</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><ChevronRight className="w-3 h-3 text-primary" />Resultado contínuo</p>
              </div>
            </motion.div>
          </div>

          <motion.p variants={fadeUp} custom={3} className="text-center text-xs text-muted-foreground mt-4 px-2">
            Os dois caminhos têm valor. Mas só um deles é <strong className="text-foreground">replicável, mensurável e sustentável a longo prazo</strong>.
          </motion.p>
        </motion.section>

        {/* CONCLUSÃO — Fitness virou sistema */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Conclusão Estratégica</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={1}
            className="rounded-2xl border border-border bg-muted/30 p-5 space-y-3"
          >
            <p className="text-sm text-foreground leading-relaxed">
              O cenário global de abril de 2026 é inequívoco: <strong>o fitness deixou de ser estética e virou sistema</strong>.
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              As competições mais relevantes cobram maturidade biológica. As feiras mais influentes priorizam 
              tecnologia médica. E as maiores plataformas digitais do mundo substituíram conteúdo genérico 
              por <strong>inteligência personalizada</strong>.
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              Quem ainda opera no modelo "dieta + treino + motivação" está atrasado — não por opinião, 
              mas porque <strong>os dados, o mercado e as instituições já mudaram de direção</strong>.
            </p>

            <div className="border-t border-border/50 pt-3 mt-3">
              <p className="text-xs text-muted-foreground italic">
                Referências: IFBB Official (ifbb.com) · FIBO Global Fitness (fibo.com) · Bodybuilding.com · 
                ACSM Worldwide Fitness Trends 2025-2026
              </p>
            </div>
          </motion.div>
        </motion.section>

        {/* CTA STH */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-8">
          <motion.div
            variants={fadeUp}
            custom={0}
            className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 p-6 text-center"
          >
            <p className="text-[9px] uppercase tracking-[0.2em] text-primary font-bold mb-2">Posicionamento STH</p>
            <h2 className="text-lg md:text-xl font-black text-foreground mb-3 leading-tight">
              A <span className="gradient-text">STH Method</span> não segue tendências.
              <br />Ela opera no modelo que virou tendência.
            </h2>
            <p className="text-xs text-muted-foreground mb-1">Exames. Dados. Protocolos individualizados. Acompanhamento contínuo.</p>
            <p className="text-sm font-bold text-foreground mb-5">
              Isso não é promessa. É infraestrutura.
            </p>

            <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
              <Link to="/cadastro" className="w-full">
                <Button size="lg" className="gradient-bg text-primary-foreground w-full font-bold gap-2 rounded-xl">
                  Iniciar minha consultoria <Rocket className="w-4 h-4" />
                </Button>
              </Link>
              <a
                href="https://wa.me/5521998496289?text=Ol%C3%A1!%20Li%20a%20mat%C3%A9ria%20sobre%20o%20cen%C3%A1rio%20fitness%202026%20e%20quero%20entender%20como%20a%20STH%20Method%20funciona%20na%20pr%C3%A1tica."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button size="lg" variant="outline" className="w-full gap-2 rounded-xl">
                  <MessageCircle className="w-4 h-4" />
                  Falar com a equipe STH
                </Button>
              </a>
            </div>
          </motion.div>
        </motion.section>

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">STH News — Edição Especial · Abril 2026</p>
          <p className="text-[9px] text-muted-foreground/30">Consultoria Estratégica em Saúde & Performance</p>
        </div>
      </main>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default FitnessCenario2026;
