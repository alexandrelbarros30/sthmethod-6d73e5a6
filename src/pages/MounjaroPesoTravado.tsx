import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-mounjaro-peso-travado-hero.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const Section = ({
  number,
  kicker,
  title,
  children,
}: {
  number: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
}) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-80px" }}
    variants={fadeUp}
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
    <div className="max-w-2xl mx-auto px-6 space-y-6 text-[17px] leading-[1.6] text-muted-foreground font-light">
      {children}
    </div>
  </motion.section>
);

const HighlightCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.6 }}
    className="rounded-3xl border border-border/40 bg-card p-6 md:p-8"
  >
    <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
      {title}
    </h3>
    <div className="space-y-4 text-[15px] leading-[1.65] text-muted-foreground font-light">
      {children}
    </div>
  </motion.div>
);

const MounjaroPesoTravado = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
  const backTo = isStudent ? "/dashboard" : "/tendencias";
  const BackIcon = isStudent ? Home : ArrowLeft;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-11 flex items-center justify-between">
          <Link
            to={backTo}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackIcon className="w-3.5 h-3.5" />
            <span>{isStudent ? "Início" : "STH News"}</span>
          </Link>
          <span className="text-[12px] font-semibold tracking-tight">STH News</span>
          {isStudent ? (
            <Link to="/dashboard">
              <Button size="sm" variant="ghost" className="text-[11px] h-7 rounded-full">
                Voltar
              </Button>
            </Link>
          ) : (
            <Link to="/cadastro">
              <Button
                size="sm"
                className="text-[11px] h-7 rounded-full bg-foreground text-background hover:bg-foreground/90"
              >
                Começar
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="pt-32 md:pt-40 pb-16 md:pb-24 text-center px-6">
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-[12px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6"
        >
          Tirzepatida — Monitoramento de Resultados
        </motion.p>
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          Peso travado no Mounjaro?
          <br />
          <span className="text-muted-foreground">Entenda por que isso acontece.</span>
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Na maioria dos casos, algumas semanas sem alteração significativa no peso não significam que o tratamento deixou de funcionar.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img
            src={heroImg}
            alt="Balança e caneta Mounjaro — peso estabilizado durante tratamento com tirzepatida"
            className="w-full h-full object-cover"
            width={1920}
            height={1024}
          />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          Uma das dúvidas mais frequentes entre pessoas que utilizam Mounjaro® (tirzepatida) é:{' '}
          <span className="text-foreground font-medium">"Eu estava perdendo peso normalmente e, de repente, a balança parou de descer. O que aconteceu?"</span>{' '}
          A primeira coisa que precisa ser dita é: calma. Isso pode fazer parte do processo.
        </motion.p>
      </section>

      <Section number="01" kicker="Balança vs. Corpo" title="A balança não conta a história completa.">
        <p>
          Muitas pessoas utilizam o peso corporal como único indicador de progresso. Porém, o corpo humano é muito mais complexo do que um simples número.
        </p>
        <p>
          O peso registrado na balança sofre influência de diversos fatores: quantidade de água corporal, consumo de sódio, conteúdo intestinal, oscilações hormonais, ciclo menstrual, nível de estresse e qualidade do sono.
        </p>
        <p className="text-foreground font-medium">
          Por isso, é perfeitamente possível que o indivíduo esteja seguindo o protocolo corretamente e, ainda assim, observe uma estabilização temporária no peso.
        </p>
      </Section>

      <Section number="02" kicker="Fisiologia" title="O corpo não emagrece em linha reta.">
        <p>
          Existe uma expectativa muito comum de que o emagrecimento aconteça de forma contínua semana após semana. Mas a fisiologia humana não funciona assim.
        </p>
        <p>
          O organismo passa por fases de adaptação constantes. Em alguns períodos, a perda de peso é rápida. Em outros, o corpo parece "pausar" antes de continuar avançando. Essas oscilações fazem parte do processo natural de adaptação metabólica.
        </p>
      </Section>

      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
            03 — Retenção hídrica
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
            A retenção de líquidos pode mascarar resultados.
          </h2>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          <HighlightCard title="Fatores que retêm água">
            <p>
              Mudanças hormonais, estresse, aumento do consumo de sódio, noites mal dormidas e até treinos mais intensos podem levar o organismo a reter mais líquidos temporariamente.
            </p>
            <p>
              Nesses casos, a gordura corporal pode continuar diminuindo enquanto a balança permanece estável.
            </p>
          </HighlightCard>
          <HighlightCard title="Composição corporal">
            <p>
              O verdadeiro objetivo não é apenas perder quilos. É melhorar a composição corporal: reduzir gordura, preservar massa muscular, melhorar saúde metabólica e aumentar qualidade de vida.
            </p>
            <p>
              Acompanhar medidas corporais, fotos evolutivas e o caimento das roupas costuma fornecer informações mais valiosas do que olhar apenas para o peso.
            </p>
          </HighlightCard>
        </div>
      </section>

      <Section number="04" kicker="Ação Prática" title="O que fazer quando o peso estabiliza?">
        <p>
          Antes de pensar que existe algum problema, vale revisar os pilares fundamentais: hidratação adequada, consumo adequado de proteínas, boa ingestão de fibras, prática regular de atividade física, qualidade do sono, controle do estresse e adesão ao plano alimentar.
        </p>
        <p className="text-foreground font-medium">
          Na maioria das situações, a continuidade desses hábitos permite que o processo volte a evoluir naturalmente.
        </p>
      </Section>

      <Section number="05" kicker="Mentalidade" title="O maior erro é desistir durante o platô.">
        <p>
          Muitas pessoas abandonam hábitos saudáveis justamente quando estão mais próximas de voltar a progredir. O platô não deve ser encarado como fracasso. Ele deve ser visto como uma fase de adaptação.
        </p>
        <p>
          O sucesso no emagrecimento não é determinado pelo que acontece em uma semana. É determinado pela consistência ao longo de meses.
        </p>
      </Section>

      <Section number="06" kicker="Conclusão" title="Avalie o contexto completo.">
        <p>
          Se você utiliza tirzepatida e percebeu que o peso estabilizou por alguns dias ou semanas, não entre em pânico. Observe medidas corporais, mantenha os hábitos que o levaram até ali e lembre-se: o objetivo não é apenas fazer a balança descer.
        </p>
        <p className="text-foreground font-medium">
          O objetivo é construir um estilo de vida capaz de sustentar os resultados no longo prazo.
        </p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            A balança estabiliza.
            <br />
            <span className="text-muted-foreground">A consistência continua.</span>
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Exames. Dados. Protocolos individualizados. Acompanhamento contínuo.
          </p>
          {!isStudent && (
            <Link to="/cadastro">
              <Button
                size="lg"
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium"
              >
                Iniciar minha consultoria
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          STH News · 22 Mai 2026. ST&amp;H | Consultoria Científica em Performance e Saúde. Ética, resultado e respeito à individualidade.
        </p>
      </footer>
    </div>
  );
};

export default MounjaroPesoTravado;
