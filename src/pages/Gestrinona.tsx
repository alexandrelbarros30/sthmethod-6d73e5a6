import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-gestrinona-hero.jpg";
import capsulasImg from "@/assets/sthnews-gestrinona-capsulas.jpg";
import chipImg from "@/assets/sthnews-gestrinona-chip.jpg";
import densidadeImg from "@/assets/sthnews-gestrinona-densidade.jpg";
import moleculaImg from "@/assets/sthnews-gestrinona-molecula.jpg";
import resultadoImg from "@/assets/sthnews-gestrinona-resultado.jpg";

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

const Gestrinona = () => {
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
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
          Gestrinona
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          Densidade, secura<br />
          <span className="text-muted-foreground">e equilíbrio.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Uma molécula. Tripla ação. Endocrinologia aplicada à composição feminina.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Frasco premium de Gestrinona manipulada" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          A Gestrinona não substitui — <span className="text-foreground font-medium">amplifica</span>. Cria o ambiente hormonal ideal para que treino e nutrição se traduzam em resultado visível.
        </motion.p>
      </section>

      <Section number="01" kicker="A molécula" title="Tripla ação em uma única estrutura."
        image={moleculaImg} alt="Visualização molecular">
        <p>Derivada da 19-nortestosterona (etil-nortestosterona), a Gestrinona opera com perfil farmacológico híbrido: três propriedades em sinergia.</p>
        <div className="grid gap-4 pt-4">
          <div className="py-5 border-t border-border/40">
            <p className="text-foreground font-medium text-base mb-1">Antiprogestogênica</p>
            <p className="text-[15px]">Modula a atividade da progesterona, ajustando a homeostase hormonal feminina.</p>
          </div>
          <div className="py-5 border-t border-border/40">
            <p className="text-foreground font-medium text-base mb-1">Androgênica</p>
            <p className="text-[15px]">Aumenta síntese proteica e qualidade do tecido muscular — músculo cheio, denso, definido.</p>
          </div>
          <div className="py-5 border-t border-border/40">
            <p className="text-foreground font-medium text-base mb-1">Antiestrogênica</p>
            <p className="text-[15px]">Reduz a ação do estrogênio livre — combate retenção hídrica e revela o contorno real.</p>
          </div>
        </div>
      </Section>

      <Section number="02" kicker="Cápsulas" title="Flexibilidade e ajuste fino."
        image={capsulasImg} alt="Cápsulas manipuladas">
        <p>A manipulação em cápsulas oferece <span className="text-foreground font-medium">flexibilidade</span> para ajustes frequentes conforme a evolução estética e a resposta individual.</p>
        <p>Permite ao médico monitorar a resposta com precisão clínica — ideal para quem inicia o protocolo.</p>
        <p>Exige <span className="text-foreground font-medium">disciplina absoluta</span> nos horários: a estabilidade metabólica depende dela.</p>
      </Section>

      <Section number="03" kicker="Implante (chip)" title="Constância de elite, zero rotina."
        image={chipImg} alt="Implante subdérmico">
        <p>Os implantes subdérmicos de <span className="text-foreground font-medium">liberação lenta</span> são o padrão-ouro de quem busca performance sem a preocupação da rotina diária.</p>
        <p>Níveis hormonais em platô estável — sem picos, sem vales, sem oscilações de humor.</p>
        <p>Síntese proteica e oxidação lipídica otimizadas <span className="text-foreground font-medium">24h por dia</span>.</p>
      </Section>

      <Section number="04" kicker="Resposta" title="Construção cumulativa."
        image={densidadeImg} alt="Densidade muscular real">
        <p>A Gestrinona é um fármaco de construção cumulativa. As primeiras semanas são de adaptação.</p>
        <p>A partir do <span className="text-foreground font-medium">primeiro mês de constância</span>, a alteração na composição corporal — ganho de massa magra e redução de gordura subcutânea — começa a se tornar visível.</p>
      </Section>

      <Section number="05" kicker="Suporte clínico" title="Potência exige monitoramento."
        image={resultadoImg} alt="Acompanhamento clínico">
        <p>Seu uso deve ser precedido e acompanhado por exames laboratoriais rigorosos.</p>
        <div className="grid gap-4 pt-4">
          {[
            ["Perfil lipídico", "HDL/LDL — pode reduzir o HDL."],
            ["Saúde hepática", "TGO/TGP — monitoramento contínuo."],
            ["Hematócrito", "Acompanhamento da viscosidade sanguínea."],
            ["Sensibilidade androgênica", "Oleosidade, acne, voz, ciclo menstrual."],
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
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Cápsula ou chip?
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Sua escolha define o ritmo. Comece pelo check-up endócrino completo.
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
          Conteúdo informativo técnico. O uso de hormônios e moduladores deve ser orientado e acompanhado por profissional habilitado, com avaliação clínica e laboratorial individualizada.
        </p>
      </footer>
    </div>
  );
};

export default Gestrinona;
