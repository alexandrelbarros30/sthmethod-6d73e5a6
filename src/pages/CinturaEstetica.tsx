import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-cintura-hero.jpg";
import treinoImg from "@/assets/sthnews-cintura-treino.jpg";
import nutricaoImg from "@/assets/sthnews-cintura-nutricao.jpg";
import composicaoImg from "@/assets/sthnews-cintura-composicao.jpg";
import anatomiaImg from "@/assets/sthnews-cintura-anatomia.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const Section = ({
  number, kicker, title, image, alt, children,
}: { number: string; kicker: string; title: string; image: string; alt: string; children: React.ReactNode }) => (
  <motion.section
    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}
    className="py-20 md:py-32 border-t border-border/40"
  >
    <div className="max-w-2xl mx-auto px-6">
      <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">{number} — {kicker}</p>
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-10 leading-[1.05]">{title}</h2>
    </div>
    <div className="max-w-4xl mx-auto px-6 mb-10">
      <div className="rounded-3xl overflow-hidden bg-muted aspect-[16/10]">
        <img src={image} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      </div>
    </div>
    <div className="max-w-2xl mx-auto px-6 space-y-6 text-[17px] leading-[1.6] text-muted-foreground font-light">{children}</div>
  </motion.section>
);

const CinturaEstetica = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
  const backTo = isStudent ? "/dashboard" : "/tendencias";
  const BackIcon = isStudent ? Home : ArrowLeft;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-11 flex items-center justify-between">
          <Link to={backTo} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            <BackIcon className="w-3.5 h-3.5" /><span>{isStudent ? "Início" : "STH News"}</span>
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
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">Estética da cintura</motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          Não é só genética.<br />
          <span className="text-muted-foreground">É estímulo certo.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          O formato da cintura é resultado da interação entre estrutura, treino e nutrição.
        </motion.p>
      </section>

      <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24">
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Estética da cintura" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:3xl font-light leading-[1.35] text-foreground tracking-tight">
          O corpo responde exatamente ao tipo de estímulo que recebe. <span className="text-foreground font-medium">A cintura é desenhada por estímulo, não por acaso.</span>
        </motion.p>
      </section>

      <Section number="01" kicker="Treino" title="Estímulo errado, adaptação errada." image={treinoImg} alt="Treino estratégico de core">
        <p>Treinos com alta demanda de estabilização e ativação constante do core são importantes para performance e proteção da coluna.</p>
        <p>Mal estruturados, podem gerar adaptações musculares indesejadas na região abdominal lateral, impactando a estética da cintura.</p>
        <p className="text-foreground font-medium">O ponto não é o treino em si — é como ele é aplicado dentro do contexto do objetivo estético.</p>
      </Section>

      <Section number="02" kicker="Alimentação" title="O fator silencioso." image={nutricaoImg} alt="Alimentação estratégica">
        <p>Abdômen estufado nem sempre é gordura. A distensão abdominal pode estar ligada a retenção hídrica, inflamação intestinal, intolerâncias alimentares e desequilíbrios hormonais.</p>
        <p>Condições como SII e SOP exigem ajustes alimentares específicos que impactam diretamente <span className="text-foreground font-medium">volume abdominal, digestão e resposta metabólica</span>.</p>
      </Section>

      <Section number="03" kicker="Os pilares" title="O que realmente define." image={anatomiaImg} alt="Anatomia da cintura">
        <div className="grid gap-4">
          {[
            ["Percentual de gordura", "Controle preciso, sem extremismos."],
            ["Retenção e inflamação", "Gestão hídrica e intestinal."],
            ["Equilíbrio hormonal", "Avaliação contínua de biomarcadores."],
            ["Estrutura muscular", "Distribuição estratégica do volume."],
            ["Estratégia de treino", "Estímulo dirigido ao objetivo."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="04" kicker="O erro comum" title="Buscar solução isolada." image={composicaoImg} alt="Análise integrada">
        <p>Treinar mais sem direção. Cortar alimentos sem critério. Copiar protocolos sem contexto.</p>
        <p className="text-foreground font-medium">Isso gera esforço — mas não necessariamente resultado.</p>
        <p>Quando treino e alimentação trabalham juntos, com estratégia, o corpo responde.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Estratégia sem controle<br />é só tentativa.
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Aplique a abordagem STH METHOD ao seu caso.
          </p>
          {!isStudent && (
            <Link to="/cadastro">
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
                Acessar STH METHOD
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          Conteúdo educativo. Acompanhamento individual com profissional habilitado é essencial para resultados consistentes.
        </p>
      </footer>
    </div>
  );
};

export default CinturaEstetica;
