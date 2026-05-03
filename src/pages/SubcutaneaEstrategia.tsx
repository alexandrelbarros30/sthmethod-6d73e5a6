import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-subq-glass-1.jpg";
import pkImg from "@/assets/sthnews-subq-glass-2.jpg";
import sitesImg from "@/assets/sthnews-subq-glass-3.jpg";
import vialImg from "@/assets/sthnews-subq-glass-4.jpg";

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

const SubcutaneaEstrategia = () => {
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
          IM → SubQ
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          Estabilidade sérica. <br />
          <span className="text-muted-foreground">Precisão tática.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          A migração para a subcutânea não é conforto — é estratégia farmacocinética.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Aplicação subcutânea" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          Absorção lenta. Curva plana. Menos trauma. A SubQ alcança o santo graal do bodybuilding de alto rendimento — <span className="text-primary">níveis séricos estáveis</span>.
        </motion.p>
      </section>

      <Section number="01" kicker="Diagnóstico" title="Por que a curva plana importa.">
        <p>O objetivo é manter os níveis plasmáticos os mais constantes possíveis para mitigar:</p>
        <div className="grid gap-4 pt-2">
          {[
            ["Picos de estradiol", "Variações abruptas geram efeitos colaterais cumulativos."],
            ["Variações de humor", "Estabilidade hormonal = estabilidade neurológica."],
            ["Hematócrito elevado", "A IM provoca picos desnecessários no perfil sanguíneo."],
            ["Fibrose tecidual", "Anos de IM acumulam cicatrizes invisíveis."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="02" kicker="Construção" title="Farmacocinética validada."
        image={pkImg} alt="Comparação IM vs SubQ">
        <p>O tecido adiposo é altamente vascularizado, mas com fluxo <span className="text-foreground font-medium">menor e mais constante</span> que o músculo esquelético — efeito depot mais eficiente.</p>
        <p>Estudos demonstram que ésteres de testosterona via SubQ produzem níveis séricos equivalentes ou superiores à IM, com menores picos de hematócrito e maior adesão (agulhas de insulina, menos invasivas).</p>
        <p><span className="text-foreground font-medium">Limitante:</span> volume. Idealmente &lt; 0,5 a 1 ml por sítio. Apenas fármacos de alta concentração são viáveis.</p>
      </Section>

      <Section number="03" kicker="Otimização" title="Concentração, técnica e rotação."
        image={vialImg} alt="Frasco oleoso">
        <div className="grid gap-4">
          {[
            ["Regra 01 · Veículo", "Apenas ésteres de testosterona em veículo oleoso de alta pureza. Solventes agressivos podem causar necrose tecidual."],
            ["Regra 02 · Técnica", "Agulhas de insulina (30G/31G), ângulo de 90° na dobra cutânea (abdômen ou glúteos). Não precisa aspirar."],
            ["Regra 03 · Rotação", "Aplicação repetida no mesmo ponto causa lipohipertrofia. Rotacione: abdômen direito, esquerdo, glúteos superiores."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="04" kicker="Filtro de segurança" title="Sinais de alerta inegociáveis."
        image={sitesImg} alt="Mapa de sítios">
        <p>Se ocorrer <span className="text-foreground font-medium">vermelhidão, calor local ou nódulo persistente</span>, interrompa a via.</p>
        <p>Substâncias como Clenbuterol ou hormônios de base aquosa/ácida <span className="text-foreground font-medium">nunca</span> devem ser administrados via subcutânea — apenas ésteres oleosos longos (Cipionato, Enantato, Durateston).</p>
      </Section>

      <Section number="05" kicker="O veredito" title="Refinar é controlar pequenos ganhos.">
        <p>A mudança para SubQ é o refinamento dos pequenos ganhos. Se o paciente apresenta hematócrito subindo agressivamente com IM, a migração para SubQ é a <span className="text-foreground font-medium">primeira manobra tática</span> — sem reduzir a dose androgênica.</p>
        <p className="text-foreground font-medium">Não é a substância. É a via, a dose e o monitoramento.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Pronto para refinar o protocolo?
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

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          Conteúdo informativo técnico para profissionais. Qualquer fármaco deve ser administrado sob protocolo clínico individualizado.
        </p>
      </footer>
    </div>
  );
};

export default SubcutaneaEstrategia;
