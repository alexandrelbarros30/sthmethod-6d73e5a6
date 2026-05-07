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

const Row = ({ t, d }: { t: string; d: string }) => (
  <div className="py-5 border-t border-border/40">
    <p className="text-foreground font-medium text-base mb-1">{t}</p>
    <p className="text-[15px]">{d}</p>
  </div>
);

const DrostanolonaTecnica = () => {
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
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">Drostanolona · Análise técnica</motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          Refinamento estético<br /><span className="text-muted-foreground">e modulação androgênica.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          Farmacologia, mecanismo de ação, toxicidade e o veredito STH METHOD sobre o Masteron.
        </motion.p>
      </section>

      <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="max-w-6xl mx-auto px-6 mb-16 md:mb-24">
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]"><img src={heroImg} alt="Drostanolona — análise técnica" className="w-full h-full object-cover" /></div>
      </motion.div>

      <Section number="01" kicker="Nome e classe farmacológica" title="2α-metil-DHT, derivada e blindada." image={vialsImg} alt="Frascos">
        <Row t="Nome químico" d="2α-metildihidrotestosterona (2α-metil-DHT)." />
        <Row t="Classe" d="Esteróide Androgênico Anabólico (EAA)." />
        <Row t="Derivação" d="Derivado sintético da Di-hidrotestosterona (DHT). A metilação na posição C2 aumenta significativamente sua resistência à metabolização enzimática no tecido muscular." />
      </Section>

      <Section number="02" kicker="Farmacodinâmica" title="Receptor androgênico, anti-estrogênio e lipólise." image={receptorImg} alt="Receptor androgênico">
        <p>A Drostanolona atua ligando-se diretamente aos <span className="text-foreground font-medium">receptores androgênicos (AR)</span> nas células musculares e tecidos sensíveis.</p>
        <Row t="Ação genômica" d="Uma vez ligada ao receptor, migra para o núcleo celular, modulando a transcrição de genes que aumentam a síntese proteica e a retenção de nitrogênio." />
        <Row t="Efeito anti-estrogênico" d='Possui leves propriedades inibidoras da aromatase e atua como antagonista do receptor de estrogênio. Compete com o estrogênio, resultando no aspecto visual "seco" e denso, sem retenção hídrica.' />
        <Row t="Lipólise" d="Aumenta a sensibilidade das células adiposas aos sinais lipolíticos, facilitando a mobilização de ácidos graxos durante o déficit calórico." />
      </Section>

      <Section number="03" kicker="Absorção e farmacocinética" title="Éster define o ritmo." image={bodyImg} alt="Composição">
        <Row t="Propionato de Drostanolona" d="Meia-vida curta (≈ 2 a 3 dias). Exige aplicações frequentes (DSDN ou TSD) para manter níveis plasmáticos estáveis." />
        <Row t="Enantato de Drostanolona" d="Meia-vida longa (≈ 7 a 10 dias). Liberação lenta, permitindo aplicações 1 a 2 vezes por semana." />
        <Row t="Absorção" d="Via intramuscular profunda. A liberação do éster na corrente sanguínea ocorre de forma gradual a partir do depósito oleoso no músculo." />
      </Section>

      <Section number="04" kicker="Metabolismo e eliminação" title="Hepático sem aromatização." image={organsImg} alt="Órgãos de filtração">
        <p><span className="text-foreground font-medium">Metabolismo:</span> ocorre principalmente no fígado. Por ser derivado de DHT, não sofre aromatização (conversão em estrogênio) nem redução pela 5-alfa-redutase — já é uma forma reduzida.</p>
        <p><span className="text-foreground font-medium">Eliminação:</span> excreção majoritariamente renal (urina) na forma de metabólitos conjugados.</p>
      </Section>

      <Section number="05" kicker="Toxicidade e efeitos colaterais" title="O preço da densidade." image={organsImg} alt="Toxicidade">
        <Row t="Homens" d="Calvície (alopecia), acne, hipertrofia prostática e supressão do eixo HPT. Risco capilar alto para quem tem predisposição genética." />
        <Row t="Mulheres" d="Virilização: voz rouca, clitoromegalia, hirsutismo, irregularidade menstrual. Droga de alto risco para o público feminino devido ao forte caráter androgênico." />
        <Row t="Geral" d="Dislipidemia (queda drástica do HDL e elevação do LDL) e aumento da pressão arterial. Exige monitoramento cardiovascular constante." />
      </Section>

      <Section number="06" kicker="Convulsões e neurotoxicidade" title="Limiar convulsivo: o detalhe ignorado." image={labsImg} alt="Neurotoxicidade">
        <p>Embora raro, o uso de doses suprafisiológicas de andrógenos — especialmente derivados de DHT como o Masteron — pode <span className="text-foreground font-medium">reduzir o limiar convulsivo</span> em indivíduos predispostos.</p>
        <Row t="Mecanismo" d="Andrógenos podem modular receptores de neurotransmissores excitatórios (Glutamato) e inibitórios (GABA) no cérebro." />
        <Row t="Alerta" d="O abuso pode gerar excitotoxicidade neuronal, aumentando a chance de episódios convulsivos — sobretudo combinado a estimulantes (cafeína, efedrina) ou privação de sono." />
      </Section>

      <Section number="07" kicker="Resumo técnico — modo STH METHOD" title="Finalizador, não construtor." image={heroImg} alt="Veredito STH METHOD">
        <p>A Drostanolona é, tecnicamente, um dos melhores <span className="text-foreground font-medium">finalizadores</span> do arsenal de performance quando o percentual de gordura já está baixo (abaixo de 10–12% para homens).</p>
        <Row t="Dureza muscular" d='Proporciona aspecto "granítico" e denso por reduzir a água subcutânea.' />
        <Row t="Preservação de massa" d="Excelente para manter força e volume celular durante fases de pré-contest ou déficits calóricos agressivos." />
        <Row t="Sinergia" d="Potencializa o efeito de outros esteróides ao reduzir a SHBG (Globulina Ligadora de Hormônios Sexuais), deixando mais testosterona livre no sistema." />
        <Row t="Bem-estar" d="Muitos usuários relatam aumento de libido e vigor físico devido à sua natureza puramente androgênica." />
        <p className="text-foreground font-medium pt-4">Veredito STH METHOD: o Masteron não é uma droga para "ganhar peso", mas para "esculpir o músculo". Sua eficiência brilha quando dieta e cardio já estão impecáveis.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">Performance com responsabilidade.</h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">Comece pelo check-up endócrino completo e por uma blindagem individualizada.</p>
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

export default DrostanolonaTecnica;