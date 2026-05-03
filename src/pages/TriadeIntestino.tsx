import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-triade-glass-1.jpg";
import insulinImg from "@/assets/sthnews-triade-glass-2.jpg";
import foodsImg from "@/assets/sthnews-triade-glass-3.jpg";
import ovaryImg from "@/assets/sthnews-triade-glass-4.jpg";
import refluxImg from "@/assets/sthnews-triade-glass-5.jpg";
import brainGutImg from "@/assets/sthnews-triade-glass-6.jpg";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } } };

const Section = ({ number, kicker, title, image, alt, children }: { number: string; kicker: string; title: string; image: string; alt: string; children: React.ReactNode }) => (
  <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="py-20 md:py-32 border-t border-border/40">
    <div className="max-w-2xl mx-auto px-6">
      <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">{number} — {kicker}</p>
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-10 leading-[1.05]">{title}</h2>
    </div>
    <div className="max-w-4xl mx-auto px-6 mb-10"><div className="rounded-3xl overflow-hidden bg-muted aspect-[16/10]"><img src={image} alt={alt} className="w-full h-full object-cover" loading="lazy" /></div></div>
    <div className="max-w-2xl mx-auto px-6 space-y-6 text-[17px] leading-[1.6] text-muted-foreground font-light">{children}</div>
  </motion.section>
);

const TriadeIntestino = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
  const backTo = isStudent ? "/dashboard" : "/tendencias";
  const BackIcon = isStudent ? Home : ArrowLeft;
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-11 flex items-center justify-between">
          <Link to={backTo} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"><BackIcon className="w-3.5 h-3.5" /><span>{isStudent ? "Início" : "STH News"}</span></Link>
          <span className="text-[12px] font-semibold tracking-tight">STH News</span>
          {isStudent ? <Link to="/dashboard"><Button size="sm" variant="ghost" className="text-[11px] h-7 rounded-full">Voltar</Button></Link>
            : <Link to="/cadastro"><Button size="sm" className="text-[11px] h-7 rounded-full bg-foreground text-background hover:bg-foreground/90">Começar</Button></Link>}
        </div>
      </header>

      <section className="pt-32 md:pt-40 pb-16 md:pb-24 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">Tríade da inflamação</motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          SII, SOP e DRGE.<br /><span className="text-muted-foreground">Mesma raiz.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          Não coexistem por acaso. Existe um eixo intestino-hormônio-inflamação.
        </motion.p>
      </section>

      <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="max-w-6xl mx-auto px-6 mb-16 md:mb-24">
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]"><img src={heroImg} alt="Eixo integrado" className="w-full h-full object-cover" /></div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight">
          Inflamação sistêmica. Mesma raiz. <span className="text-foreground font-medium">Três expressões.</span>
        </motion.p>
      </section>

      <Section number="01" kicker="SII" title="Síndrome do Intestino Irritável." image={ovaryImg} alt="SII">
        <p>Distúrbio da interação intestino-cérebro com dor abdominal recorrente, alteração na frequência das fezes, estufamento e gases.</p>
        <p>A fisiopatologia envolve <span className="text-foreground font-medium">hipersensibilidade visceral</span>, motilidade alterada e desequilíbrio da microbiota.</p>
      </Section>

      <Section number="02" kicker="SOP" title="Síndrome dos Ovários Policísticos." image={insulinImg} alt="SOP e insulina">
        <p>Distúrbio endócrino-metabólico marcado por <span className="text-foreground font-medium">hiperandrogenismo, anovulação e resistência à insulina</span>.</p>
        <p>Ciclos irregulares, acne, ganho de peso, hirsutismo. A RI estimula o ovário a produzir excesso de andrógenos.</p>
      </Section>

      <Section number="03" kicker="DRGE" title="Refluxo gastroesofágico." image={refluxImg} alt="DRGE">
        <p>Conteúdo gástrico retorna ao esôfago por incompetência do esfíncter esofágico inferior.</p>
        <p>Agravado por pressão intra-abdominal aumentada — frequentemente associada ao ganho de peso na SOP — e hipersensibilidade esofágica.</p>
      </Section>

      <Section number="04" kicker="A conexão" title="Três pilares. Um único eixo." image={foodsImg} alt="Eixo">
        <div className="grid gap-4">
          {[
            ["Resistência à insulina", "Pilar central da SOP. Altera motilidade GI e agrava SII e DRGE simultaneamente."],
            ["Inflamação de baixo grau", "PCR elevada e marcadores inflamatórios sistêmicos perpetuam a tríade."],
            ["Disbiose intestinal", "A microbiota afeta neurotransmissores e o metabolismo dos estrogênios (estroboloma)."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" kicker="Estratégias" title="Intervenções com evidência." image={brainGutImg} alt="Eixo intestino-cérebro">
        <div className="grid gap-4">
          {[
            ["SII · Low FODMAP", "Reduz carboidratos fermentáveis. Exclusão temporária e reintrodução guiada."],
            ["SOP · Carga glicêmica + treino resistido", "Sensibiliza receptores de insulina. Musculação atua como remédio."],
            ["DRGE · Higiene do sono e refeição", "Evitar grandes volumes antes de deitar; eliminar gatilhos; elevar cabeceira."],
            ["Eixo cérebro-intestino", "Cortisol crônico piora tudo. Sono e regulação autonômica são terapêuticos."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">Tratar o eixo.<br />Não o sintoma.</h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">Avaliação integrada e protocolo individualizado.</p>
          {!isStudent && (
            <Link to="/cadastro"><Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">Começar agora</Button></Link>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          Conteúdo educativo. Diagnóstico e conduta clínica são responsabilidade de profissional habilitado.
        </p>
      </footer>
    </div>
  );
};

export default TriadeIntestino;
