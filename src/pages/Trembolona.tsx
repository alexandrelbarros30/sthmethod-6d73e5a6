import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-trembolona-hero.jpg";
import moleculaImg from "@/assets/sthnews-trembolona-molecula.jpg";
import esteresImg from "@/assets/sthnews-trembolona-esteres.jpg";
import particionamentoImg from "@/assets/sthnews-trembolona-particionamento.jpg";
import suporteImg from "@/assets/sthnews-trembolona-suporte.jpg";
import vereditoImg from "@/assets/sthnews-trembolona-veredito.jpg";

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
      <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
        {number} — {kicker}
      </p>
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-10 leading-[1.05]">
        {title}
      </h2>
    </div>
    <div className="max-w-4xl mx-auto px-6 mb-10">
      <div className="rounded-3xl overflow-hidden bg-muted aspect-[16/10]">
        <img src={image} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      </div>
    </div>
    <div className="max-w-2xl mx-auto px-6 space-y-6 text-[17px] leading-[1.6] text-muted-foreground font-light">
      {children}
    </div>
  </motion.section>
);

const Trembolona = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
  const backTo = isStudent ? "/dashboard" : "/tendencias";
  const BackIcon = isStudent ? Home : ArrowLeft;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* NAV */}
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

      {/* HERO */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-24 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-primary mb-6">
          Trembolona
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          Arquitetura corporal <br />
          <span className="text-muted-foreground">no patamar de elite.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          O segredo nunca foi a dose. É o manejo.
        </motion.p>
      </section>

      {/* HERO IMAGE */}
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Atleta com hélice de DNA neon" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      {/* LEAD */}
      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          Para quem já dominou treino, dieta e consistência, e atingiu o ponto onde a eficiência metabólica é a prioridade, a Trembolona não é apenas uma escolha — é uma <span className="text-primary">estratégia de precisão</span>.
        </motion.p>
      </section>

      <Section number="01" kicker="A ciência" title="Uma molécula radicalmente diferente."
        image={moleculaImg} alt="Estrutura molecular 3D">
        <p>Derivada da 19-nortestosterona, suas ligações duplas únicas nos carbonos 9 e 11 a tornam radicalmente diferente.</p>
        <p>Sua afinidade ao receptor androgênico supera quase qualquer outro esteroide — densidade muscular extrema, perda de gordura acelerada.</p>
      </Section>

      <Section number="02" kicker="Os ésteres" title="A mesma molécula. Três relógios distintos."
        image={esteresImg} alt="Ésteres da trembolona">
        <p>A diferença está na velocidade de liberação na corrente sanguínea — e isso muda completamente a estratégia.</p>
        <div className="grid gap-4 pt-4">
          {[
            { name: "Acetato", desc: "Ação curta. Controle total. Ajustes semanais possíveis." },
            { name: "Enantato", desc: "Liberação estável. Menos aplicações, mesma potência." },
            { name: "Hexa · Parabolan", desc: "Ação longa e estável. Ambiente anabólico imperturbável." },
          ].map((e) => (
            <div key={e.name} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{e.name}</p>
              <p className="text-[15px]">{e.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="03" kicker="A magia metabólica" title="O corpo é forçado a construir."
        image={particionamentoImg} alt="Particionamento de nutrientes">
        <p><span className="text-foreground font-medium">Particionamento de nutrientes.</span> Proteínas e carboidratos são direcionados à construção de tecido muscular.</p>
        <p><span className="text-foreground font-medium">Oxidação lipídica potencializada.</span> Aspecto seco, vascularizado, com detalhamento que outros compostos escondem.</p>
        <p><span className="text-foreground font-medium">Retenção de nitrogênio.</span> Estado anabólico superior, prevenindo catabolismo mesmo em déficit agressivo.</p>
      </Section>

      <Section number="04" kicker="Suporte clínico" title="A potência exige responsabilidade."
        image={suporteImg} alt="Suporte clínico">
        <p>No STH Method, os colaterais não são ignorados — são gerenciados com precisão clínica.</p>
        <div className="grid gap-4 pt-4">
          {[
            ["Proteção hepática", "NAC e TUDCA para garantir metabolização sem sobrecarga."],
            ["Gestão cardiovascular", "Ômega-3, cardio aeróbico e monitoramento do perfil lipídico."],
            ["Controle da prolactina", "Modulação dopaminérgica sob supervisão médica."],
            ["Gestão psicológica", "Sono regulado e suporte ao sistema nervoso central."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" kicker="O veredito" title="Para quem opera no nível de elite."
        image={vereditoImg} alt="Atleta de elite">
        <p>A Trembolona é para quem já dominou dieta, treino e consistência básica. É uma ferramenta de elite.</p>
        <p className="text-foreground font-medium">O segredo não é a dose — é o manejo.</p>
        <p>Sem a leitura correta do seu cenário hormonal atual, qualquer intervenção é apenas um tiro no escuro.</p>
      </Section>

      {/* CTA */}
      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Pronto para o nível de elite?
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Comece pelo check-up metabólico completo.
          </p>
          {!isStudent && (
            <Link to="/cadastro">
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
                Quero meu check-up
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      {/* FOOTER NOTE */}
      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          Esta análise é estritamente informativa. Substâncias ergogênicas devem ser conduzidas sob supervisão estrita de endocrinologista ou médico do esporte.
        </p>
      </footer>
    </div>
  );
};

export default Trembolona;
