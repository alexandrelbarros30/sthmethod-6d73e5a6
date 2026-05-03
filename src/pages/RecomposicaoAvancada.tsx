import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-tirzepatida-hero.jpg";
import bodyImg from "@/assets/sthnews-recomposicao-corporal.jpg";
import labImg from "@/assets/sthnews-monitoramento-clinico.jpg";

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

const RecomposicaoAvancada = () => {
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
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">Recomposição avançada</motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto text-4xl sm:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          Não é fazer mais.<br /><span className="text-muted-foreground">É fazer com estratégia.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          Tirzepatida e estratégias anabólicas em microdoses — o novo cenário da performance.
        </motion.p>
      </section>

      <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="max-w-6xl mx-auto px-6 mb-16 md:mb-24">
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]"><img src={heroImg} alt="Tirzepatida GLP-1+GIP" className="w-full h-full object-cover" /></div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight">
          O resultado estético não vem da substância. <span className="text-foreground font-medium">Vem da estrutura por trás dela.</span>
        </motion.p>
      </section>

      <Section number="01" kicker="Base metabólica" title="Tirzepatida — GLP-1 + GIP." image={heroImg} alt="Tirzepatida">
        <p>Mais do que reduzir apetite, atua diretamente em sensibilidade à insulina, controle glicêmico, metabolismo lipídico e redução consistente de gordura corporal.</p>
        <p className="text-foreground font-medium">Cria um ambiente altamente favorável para perda de gordura.</p>
      </Section>

      <Section number="02" kicker="Estratégia controlada" title="Anabólico em microdoses." image={bodyImg} alt="Composição corporal">
        <p>Quando bem estruturada, contribui para preservação de massa magra, estímulo à síntese proteica e melhor partição de nutrientes.</p>
        <p className="text-foreground font-medium">O objetivo não é excesso. É precisão.</p>
      </Section>

      <Section number="03" kicker="A lógica" title="Recomposição = ↓ gordura + ↑ massa magra." image={bodyImg} alt="Recomposição visualizada">
        <p>Tirzepatida cria o ambiente para perda de gordura. Microdose anabólica preserva e estimula tecido magro.</p>
        <p>O resultado: <span className="text-foreground font-medium">mais definição, menos perda de massa magra</span>.</p>
      </Section>

      <Section number="04" kicker="Pontos de atenção" title="Sem controle, é risco." image={labImg} alt="Monitoramento">
        <div className="grid gap-4">
          {[
            ["Resposta hormonal individual", "Cada organismo responde diferente — protocolo padrão não existe."],
            ["Impacto cardiovascular", "Acompanhamento de pressão arterial e frequência cardíaca."],
            ["Perfil lipídico", "HDL, LDL e triglicérides em monitoramento contínuo."],
            ["Função hepática e renal", "Sobrecarga dos órgãos de filtração exige avaliação periódica."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" kicker="O que a ciência mostra" title="Evidência sólida — e lacunas." image={labImg} alt="Ciência">
        <p>Tirzepatida tem evidência sólida na perda de peso. Pode haver perda de massa magra sem suporte adequado.</p>
        <p>Estratégias anabólicas em mulheres exigem extrema cautela. Não existem ainda estudos clínicos robustos validando a combinação.</p>
        <p className="text-foreground font-medium">Exames, acompanhamento e ajuste contínuo não são opcionais — separam resultado de risco.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">Direção. Monitoramento.<br />Estratégia aplicada.</h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">Avaliação individual com a consultoria STH METHOD.</p>
          {!isStudent && (
            <Link to="/cadastro"><Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">Começar agora</Button></Link>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          Conteúdo informativo técnico. Substâncias devem ser conduzidas sob supervisão estrita de endocrinologista ou médico do esporte.
        </p>
      </footer>
    </div>
  );
};

export default RecomposicaoAvancada;
