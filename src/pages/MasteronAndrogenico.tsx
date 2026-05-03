import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-masteron-glass-1.jpg";
import vialsImg from "@/assets/sthnews-masteron-glass-2.jpg";
import receptorImg from "@/assets/sthnews-masteron-glass-3.jpg";
import bodyImg from "@/assets/sthnews-masteron-glass-4.jpg";
import organsImg from "@/assets/sthnews-masteron-glass-5.jpg";
import labsImg from "@/assets/sthnews-masteron-glass-6.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

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

const MasteronAndrogenico = () => {
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
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">Drostanolona · Masteron</motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          Densidade refinada,<br /><span className="text-muted-foreground">sem retenção.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          Derivado de DHT. Não aromatiza. Performance refinada exige monitoramento clínico rigoroso.
        </motion.p>
      </section>

      <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="max-w-6xl mx-auto px-6 mb-16 md:mb-24">
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]"><img src={heroImg} alt="Estrutura molecular DHT" className="w-full h-full object-cover" /></div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight">
          Emagrecimento e hipertrofia dependem de déficit/superávit, treino bem estruturado e constância. Substâncias androgênicas <span className="text-foreground font-medium">potencializam</span> uma base sólida — não a substituem.
        </motion.p>
      </section>

      <Section number="01" kicker="Os ésteres" title="Curto e longo. Mesma molécula." image={vialsImg} alt="Frascos">
        <div className="grid gap-4">
          <div className="py-5 border-t border-border/40">
            <p className="text-foreground font-medium text-base mb-1">Propionato</p>
            <p className="text-[15px]">Éster curto, meia-vida de 1 a 3 dias. Aplicações frequentes; "limpeza" rápida do organismo.</p>
          </div>
          <div className="py-5 border-t border-border/40">
            <p className="text-foreground font-medium text-base mb-1">Enantato</p>
            <p className="text-[15px]">Éster longo, meia-vida de 7 a 10 dias. Menos aplicações; clearance lento — fator crítico em mulheres.</p>
          </div>
        </div>
      </Section>

      <Section number="02" kicker="Mecanismo" title="Não aromatiza. Alta afinidade." image={receptorImg} alt="Receptor androgênico">
        <p><span className="text-foreground font-medium">Não converte em estrogênio.</span> Propriedades levemente antiestrogênicas — ausência de retenção típica, visual seco, densidade aparente.</p>
        <p>Por ser derivado de DHT, tem altíssima afinidade pelos receptores androgênicos. No corpo feminino, essa característica explica a necessidade de protocolos individualizados.</p>
      </Section>

      <Section number="03" kicker="O que ele faz" title="Densidade e preservação." image={bodyImg} alt="Composição">
        <p><span className="text-foreground font-medium">Não queima gordura por si só.</span> Não constrói músculo magicamente.</p>
        <p>Reduz aspecto de retenção subcutânea e realça o detalhamento muscular — o famoso efeito de "pele fina".</p>
        <p>Em déficit calórico, sinaliza ao corpo para <span className="text-foreground font-medium">poupar tecido muscular</span> em vez de catabolizá-lo.</p>
      </Section>

      <Section number="04" kicker="Pontos de atenção" title="Virilização e impacto sistêmico." image={organsImg} alt="Órgãos de filtração">
        <div className="grid gap-4">
          {[
            ["Virilização", "Hipertrofia clitoriana, engrossamento de voz e hirsutismo — efeitos frequentemente irreversíveis."],
            ["Perfil lipídico", "Redução expressiva do HDL e elevação do LDL — acompanhamento cardiovascular contínuo."],
            ["Hepático e renal", "Toda substância exógena sobrecarrega os órgãos de metabolização e filtração."],
            ["Eixo hormonal", "Supressão da produção natural — ciclos irregulares ou amenorreia."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" kicker="Suporte" title="Monitoramento não é opcional." image={labsImg} alt="Laboratório">
        <p>Hemograma, perfil lipídico, função hepática, função renal e marcadores hormonais antes, durante e depois.</p>
        <p className="text-foreground font-medium">Sem leitura clínica do cenário, qualquer intervenção é tiro no escuro.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">Performance com responsabilidade.</h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">Comece pelo check-up endócrino completo.</p>
          {!isStudent && (
            <Link to="/cadastro">
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">Quero meu check-up</Button>
            </Link>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          Conteúdo informativo técnico. Substâncias ergogênicas devem ser conduzidas sob supervisão estrita de endocrinologista ou médico do esporte.
        </p>
      </footer>
    </div>
  );
};

export default MasteronAndrogenico;
