import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-periodizacao-hero.jpg";
import fasesImg from "@/assets/sthnews-periodizacao-fases.jpg";
import precisaoImg from "@/assets/sthnews-periodizacao-precisao.jpg";

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

const PeriodizacaoMedicamentos = () => {
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
          Periodização farmacológica
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          A importância <br />
          <span className="text-muted-foreground">da periodização dos medicamentos e peptídeos.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Mais compostos não significam mais resultados. A sofisticação está em saber quando iniciar, manter, substituir e retirar cada intervenção.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Periodização farmacológica — fases e ciclos" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          No treinamento físico, ninguém espera obter o máximo resultado treinando todas as capacidades ao mesmo tempo. <span className="text-primary">Existem fases de adaptação, hipertrofia, força, definição, recuperação e manutenção.</span> Então, por que tantos acreditam que, na farmacologia, o melhor caminho é utilizar vários medicamentos e peptídeos simultaneamente?
        </motion.p>
      </section>

      <Section number="01" kicker="O problema atual" title="A tendência do 'tudo ao mesmo tempo'.">
        <p>Impulsionada por redes sociais, marketing e protocolos prontos, tornou-se comum iniciar diversos compostos simultaneamente, na expectativa de acelerar resultados.</p>
        <p className="text-foreground font-medium">Essa estratégia raramente é a mais eficiente — e quase nunca é a mais segura.</p>
      </Section>

      <Section number="02" kicker="O conceito" title="Periodização é escolher o que faz sentido agora.">
        <p>A periodização farmacológica consiste em selecionar as intervenções de acordo com o objetivo de cada fase do tratamento.</p>
        <p>Em vez de tentar estimular todos os processos biológicos simultaneamente, utiliza-se apenas <span className="text-foreground font-medium">o que faz sentido naquele momento</span>.</p>
      </Section>

      <Section number="03" kicker="Vantagens" title="Cinco motivos para periodizar." >
        <div className="grid gap-4">
          {[
            ["Identificação precisa", "Permite reconhecer com clareza qual intervenção está gerando benefício ou efeito adverso."],
            ["Menor exposição", "Reduz medicações desnecessárias e diminui a complexidade do protocolo."],
            ["Otimização de custo", "Evita gasto elevado com substâncias que não agregam benefício naquela fase."],
            ["Ajuste individualizado", "Facilita adaptações conforme a evolução clínica e laboratorial."],
            ["Condução lógica", "Favorece um protocolo organizado, sequencial e baseado em objetivos claros."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="04" kicker="As fases" title="Cada objetivo, sua estratégia."
        image={fasesImg} alt="Fases da periodização farmacológica">
        <div className="grid gap-4">
          {[
            ["Redução de gordura", "Priorizar estratégias voltadas ao controle do apetite, adesão alimentar e preservação da massa muscular."],
            ["Construção muscular", "Concentrar intervenções na recuperação, desempenho, síntese proteica e adaptação ao treinamento."],
            ["Recuperação", "Direcionar foco para qualidade do sono, regeneração tecidual, controle do estresse fisiológico e recuperação do organismo."],
            ["Manutenção", "Utilizar apenas o necessário para preservar os resultados conquistados, evitando excesso de medicações."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" kicker="Combinações" title="Quando somar compostos faz sentido.">
        <p>Isso não significa que combinações de medicamentos ou peptídeos nunca sejam indicadas.</p>
        <p>Em determinadas situações, elas são apropriadas — desde que exista <span className="text-foreground font-medium">justificativa clínica clara, objetivos complementares e acompanhamento profissional</span>.</p>
        <p className="text-foreground font-medium">A questão nunca foi quantos compostos usar. É usá-los no momento certo, pelo motivo certo.</p>
      </Section>

      <Section number="06" kicker="A lógica correta" title="Mais medicamentos ≠ melhores resultados."
        image={precisaoImg} alt="Precisão e individualização">
        <p>Assim como um treinamento eficiente depende da escolha correta do estímulo, um protocolo farmacológico eficiente depende da escolha da intervenção adequada para cada fase.</p>
        <p>A medicina moderna caminha cada vez mais para a personalização. E personalizar <span className="text-foreground font-medium">não é adicionar substâncias indefinidamente</span>. É saber quando iniciar, quando manter, quando substituir e quando retirar cada intervenção.</p>
      </Section>

      <Section number="07" kicker="O veredito" title="A verdadeira sofisticação de um protocolo.">
        <p className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight">
          Não está na quantidade de medicamentos que ele contém, mas na <span className="text-primary">inteligência com que cada um deles é utilizado</span> ao longo da jornada do paciente.
        </p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Protocolo é sequência. <br />
            <span className="text-muted-foreground">Não é acúmulo.</span>
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Cada fase pede uma escolha específica. É a inteligência da condução que transforma medicação em resultado.
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
          STH News — Consultoria Estratégica em Saúde & Performance. Medicamentos e peptídeos devem ser conduzidos sob supervisão médica individualizada.
        </p>
      </footer>
    </div>
  );
};

export default PeriodizacaoMedicamentos;