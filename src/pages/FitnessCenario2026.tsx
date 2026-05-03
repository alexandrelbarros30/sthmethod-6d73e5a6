import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import fiboImg from "@/assets/fibo-2026.jpg";
import ifbbMemphisImg from "@/assets/ifbb-memphis-2026.jpg";
import ifbbMercosurImg from "@/assets/ifbb-mercosur-2026.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const Section = ({
  number, kicker, title, image, alt, children,
}: { number: string; kicker: string; title: string; image?: string; alt?: string; children: React.ReactNode }) => (
  <motion.section
    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}
    className="py-20 md:py-32 border-t border-border/40"
  >
    <div className="max-w-2xl mx-auto px-6">
      <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
        {number} — {kicker}
      </p>
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-10 leading-[1.05]">
        {title}
      </h2>
    </div>
    {image && (
      <div className="max-w-4xl mx-auto px-6 mb-10">
        <div className="rounded-3xl overflow-hidden bg-muted aspect-[16/10]">
          <img src={image} alt={alt || ""} className="w-full h-full object-cover" loading="lazy" />
        </div>
      </div>
    )}
    <div className="max-w-2xl mx-auto px-6 space-y-6 text-[17px] leading-[1.6] text-muted-foreground font-light">
      {children}
    </div>
  </motion.section>
);

const FitnessCenario2026 = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
  const backTo = isStudent ? "/dashboard" : "/tendencias";
  const BackIcon = isStudent ? Home : ArrowLeft;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-11 flex items-center justify-between">
          <Link to={backTo} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            <BackIcon className="w-3.5 h-3.5" />
            <span>{isStudent ? "Início" : "STH News"}</span>
          </Link>
          <span className="text-[12px] font-semibold tracking-tight">STH News</span>
          {isStudent ? (
            <Link to="/dashboard"><Button size="sm" variant="ghost" className="text-[11px] h-7 rounded-full">Voltar</Button></Link>
          ) : (
            <Link to="/cadastro"><Button size="sm" className="text-[11px] h-7 rounded-full bg-foreground text-background hover:bg-foreground/90">Começar</Button></Link>
          )}
        </div>
      </header>

      <section className="pt-32 md:pt-40 pb-16 md:pb-24 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-primary mb-6">
          Cenário Global · 2026
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          O fitness não é mais <br />
          <span className="text-muted-foreground">o que você pensa.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          IFBB, FIBO e Bodybuilding.com já operam em outro nível. Este é o cenário real.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={fiboImg} alt="FIBO 2026" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          O fitness deixou de ser uma indústria de produtos e virou uma <span className="text-primary">indústria de sistemas</span>. A pergunta não é mais "qual dieta seguir" — é se você tem dados suficientes para decidir.
        </motion.p>
      </section>

      <Section number="01" kicker="IFBB · Elite global" title="Maturidade biológica é o novo critério."
        image={ifbbMercosurImg} alt="Copa Mercosur IFBB">
        <p>European Championships, Mr. Universe, Copa Mercosur no Brasil e Memphis Championship — todos com protocolos de avaliação cada vez mais técnicos.</p>
        <p>A elite física não é mais avaliada apenas pela simetria e volume muscular. Agora, a <span className="text-foreground font-medium">condição metabólica e a sustentabilidade do preparo</span> são fatores decisivos.</p>
      </Section>

      <Section number="02" kicker="Memphis 2026" title="Longevidade competitiva como tendência."
        image={ifbbMemphisImg} alt="Memphis IFBB Pro 2026">
        <p>Qualifier oficial para o Olympia. Divisões 35+ a 60+ mostram que a longevidade no palco virou métrica de status.</p>
        <p className="text-foreground font-medium">Performance de palco sem performance biológica é insustentável.</p>
      </Section>

      <Section number="03" kicker="FIBO Europe" title="Fitness, medicina e tecnologia se fundem."
        image={fiboImg} alt="FIBO Cologne">
        <p>A maior feira de fitness do mundo, em Colônia. Os destaques de 2026 não foram suplementos ou equipamentos — foram <span className="text-foreground font-medium">plataformas de rastreamento biológico, bioimpedância em tempo real, integração com prontuários médicos</span>.</p>
        <p>A Europa não vende mais fitness. Vende <span className="text-foreground font-medium">gestão biológica</span>.</p>
      </Section>

      <Section number="04" kicker="Mercado digital" title="Bodybuilding.com reposicionou.">
        <p>O que por duas décadas foi sinônimo de treinos prontos hoje opera como hub de conteúdo baseado em evidência, ferramentas de tracking e parcerias com profissionais de saúde.</p>
        <p className="text-foreground font-medium">O fitness genérico morreu.</p>
      </Section>

      <Section number="05" kicker="Palco vs Biologia" title="Dois caminhos. Apenas um é replicável.">
        <div className="grid gap-4">
          {[
            ["Performance Estética", "Simetria visual, % gordura extremo, depleção, peak week. Resultado temporário."],
            ["Performance Biológica", "Biomarcadores otimizados, composição sustentável, protocolos ajustáveis. Resultado contínuo."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
        <p>Os dois caminhos têm valor. Mas só um é <span className="text-foreground font-medium">replicável, mensurável e sustentável a longo prazo</span>.</p>
      </Section>

      <Section number="06" kicker="Conclusão estratégica" title="O fitness virou sistema.">
        <p>As competições mais relevantes cobram maturidade biológica. As feiras mais influentes priorizam tecnologia médica. As maiores plataformas substituíram conteúdo genérico por <span className="text-foreground font-medium">inteligência personalizada</span>.</p>
        <p>Quem ainda opera no modelo "dieta + treino + motivação" está atrasado — não por opinião, mas porque os dados, o mercado e as instituições já mudaram de direção.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Não é promessa. <br />
            <span className="text-muted-foreground">É infraestrutura.</span>
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Exames. Dados. Protocolos individualizados. Acompanhamento contínuo.
          </p>
          {!isStudent && (
            <Link to="/cadastro">
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
                Iniciar minha consultoria
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          STH News — Edição Especial · Abril 2026. Referências: IFBB, FIBO, Bodybuilding.com, ACSM.
        </p>
      </footer>
    </div>
  );
};

export default FitnessCenario2026;
