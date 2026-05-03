import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-glow-hero.jpg";
import trioImg from "@/assets/sthnews-glow-trio.jpg";
import collagenImg from "@/assets/sthnews-glow-collagen.jpg";
import skinImg from "@/assets/sthnews-glow-skin.jpg";
import recoveryImg from "@/assets/sthnews-glow-recovery.jpg";
import synergyImg from "@/assets/sthnews-glow-synergy.jpg";

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

const GlowBlend = () => {
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
          Glow Blend
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          Reparar por dentro. <br />
          <span className="text-muted-foreground">Brilhar por fora.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          O trio de peptídeos que regenera, repara e revela o corpo por baixo do desgaste.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Frasco premium do Glow Blend" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          Não é mais uma "moda da estética". É um protocolo de <span className="text-primary">modulação regenerativa</span> que une BPC-157, TB-500 e GHK-Cu para reparar tecido, acelerar recuperação e revelar a pele que vive por baixo do desgaste.
        </motion.p>
      </section>

      <Section number="01" kicker="A composição" title="Três peptídeos. Um ecossistema de cura."
        image={trioImg} alt="Trio de frascos">
        <p>Três dos peptídeos mais estudados em <span className="text-foreground font-medium">longevidade e medicina regenerativa</span>. Cada um com função específica — juntos formam um ecossistema de cura.</p>
        <div className="grid gap-4 pt-4">
          {[
            ["BPC-157 · Arquiteto", "O Body Protection Compound organiza a obra: reduz inflamação sistêmica e acelera cicatrização de tecidos moles."],
            ["TB-500 · Mobilizador", "A Timosina Beta-4 mobiliza células regenerativas e promove angiogênese, encurtando o tempo de recuperação."],
            ["GHK-Cu · Escultor", "O tripeptídeo de cobre sinaliza fibroblastos a produzirem colágeno e elastina de alta qualidade."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="02" kicker="Visão microscópica" title="Colágeno e elastina sendo reconstruídos."
        image={collagenImg} alt="Fibras de colágeno regenerando">
        <p>O cobre peptídico atua na matriz extracelular — onde a estrutura da pele é literalmente reescrita.</p>
      </Section>

      <Section number="03" kicker="A sinergia" title="Limpeza, transporte, remodelação."
        image={synergyImg} alt="Sinergia entre peptídeos">
        <p>A verdadeira mágica não está nos peptídeos isolados — está na <span className="text-foreground font-medium">orquestração biológica</span> entre eles.</p>
        <div className="grid gap-4 pt-4">
          {[
            ["Fase 01 · Limpeza", "BPC-157 estabiliza o ambiente e reduz a inflamação de base."],
            ["Fase 02 · Transporte", "TB-500 aumenta o fluxo de reparo: oxigênio e nutrientes chegam onde importa."],
            ["Fase 03 · Remodelação", "GHK-Cu organiza o tecido novo, dá firmeza, viço — e instala o efeito Glow."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="04" kicker="Benefícios" title="O efeito Glow é o ápice de um corpo cuidado por dentro."
        image={skinImg} alt="Pele luminosa">
        <div className="grid gap-4 pt-2">
          {[
            ["Alta performance", "Redução drástica do downtime entre sessões intensas."],
            ["Vitalidade GI", "Otimização da absorção de nutrientes — base essencial para hipertrofia."],
            ["Estética avançada", "Pele com qualidade superior, cicatrização rápida e viço por renovação do colágeno."],
            ["Saúde articular", "Conforto e mobilidade para quem treina pesado."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" kicker="Tempo de resposta" title="Os primeiros sinais surgem em semanas."
        image={recoveryImg} alt="Recuperação">
        <p>Mais disposição e menos dor articular nas primeiras semanas. As mudanças na qualidade da pele e na remodelação tecidual profunda são <span className="text-foreground font-medium">cumulativas</span>.</p>
        <p>Beleza real não nasce da rotina cosmética — nasce da <span className="text-foreground font-medium">saúde celular</span>.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Eleve o padrão.
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Integre o Glow Blend ao seu protocolo com acompanhamento clínico.
          </p>
          {!isStudent && (
            <Link to="/cadastro">
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
                Começar agora
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          Conteúdo informativo técnico. Qualquer uso de peptídeos deve ser orientado e acompanhado por profissional habilitado.
        </p>
      </footer>
    </div>
  );
};

export default GlowBlend;
