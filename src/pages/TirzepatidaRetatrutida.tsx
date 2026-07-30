import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-tirze-vs-reta-hero.jpg";

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

const TirzepatidaRetatrutida = () => {
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
          Tirzepatida × Retatrutida
        </motion.p>
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          Não são a mesma coisa.
          <br />
          <span className="text-muted-foreground">E não servem ao mesmo perfil.</span>
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Uma controla a fome e ensina novos hábitos. A outra refina a composição corporal de quem já domina o próprio comportamento.
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
            alt="Tirzepatida e retatrutida — perfis diferentes de paciente"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
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
          Quando falamos em perda de peso, é importante entender que tirzepatida e retatrutida não são medicamentos idênticos.{' '}
          <span className="text-foreground font-medium">Eles podem atender perfis diferentes de pacientes.</span>
        </motion.p>
      </section>

      <Section number="01" kicker="Tirzepatida" title="Para quem ainda luta contra a fome.">
        <p>
          Para quem apresenta sobrepeso importante ou obesidade e ainda convive com muita fome, compulsão alimentar e dificuldade em seguir um plano alimentar, a tirzepatida costuma ser uma excelente estratégia.
        </p>
        <p>
          Sua ação sobre os receptores de GLP-1 e GIP promove intensa saciedade, reduz o apetite e facilita a construção de novos hábitos alimentares — permitindo que o paciente aprenda uma nova rotina de forma mais consistente.
        </p>
      </Section>

      <Section number="02" kicker="O que o medicamento não faz" title="Emagrecer não depende apenas do medicamento.">
        <p>
          O processo envolve reeducação alimentar, atividade física, organização dos horários, qualidade do sono e mudança de comportamento.
        </p>
        <p className="text-foreground font-medium">
          O medicamento deve servir como uma ferramenta para facilitar essa transformação — nunca como o projeto inteiro.
        </p>
      </Section>

      <Section number="03" kicker="Retatrutida" title="Um mecanismo diferente: o terceiro receptor.">
        <p>
          A retatrutida possui um mecanismo diferente. Além de atuar nos receptores de GLP-1 e GIP, ela também ativa o receptor de glucagon.
        </p>
        <p>
          Essa característica parece aumentar o gasto energético e favorecer uma maior mobilização das reservas de energia. Ainda existem estudos em andamento para compreender todos os seus efeitos.
        </p>
        <p>
          Mesmo assim, ela pode representar uma alternativa muito interessante para pessoas que já desenvolveram bons hábitos alimentares, apresentam menor percentual de gordura e desejam otimizar a composição corporal e o refinamento estético.
        </p>
      </Section>

      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
            04 — Perfil de indicação
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
            Qual é o seu estágio?
          </h2>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          <HighlightCard title="Tirzepatida — controle e construção">
            <p>Sobrepeso importante ou obesidade.</p>
            <p>Fome elevada, compulsão alimentar e dificuldade em seguir o plano.</p>
            <p>Necessidade de saciedade intensa para consolidar novos hábitos.</p>
            <p className="text-foreground font-medium">Objetivo: vencer a fome e criar rotina.</p>
          </HighlightCard>
          <HighlightCard title="Retatrutida — refinamento e otimização">
            <p>Hábitos alimentares já estabelecidos.</p>
            <p>Menor percentual de gordura e boa aderência ao treino.</p>
            <p>Busca por gasto energético maior e mobilização de reservas.</p>
            <p className="text-foreground font-medium">Objetivo: composição corporal e estética.</p>
          </HighlightCard>
        </div>
      </section>

      <Section number="05" kicker="Resumo" title="A escolha certa depende do estágio, não da moda.">
        <p>
          Para quem ainda precisa controlar a fome, vencer a compulsão alimentar e consolidar novos hábitos, a tirzepatida costuma ser uma excelente escolha.
        </p>
        <p>
          Já para pacientes que conquistaram esse controle e buscam um estágio mais avançado de evolução corporal, a retatrutida pode oferecer vantagens adicionais.
        </p>
        <p className="text-foreground font-medium">
          Sempre com indicação e acompanhamento profissional individualizados.
        </p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            A molécula certa.
            <br />
            <span className="text-muted-foreground">Para o momento certo.</span>
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Exames. Dados. Protocolos individualizados. Orientação plena e suporte contínuo.
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
          STH News — Edição Especial · 2026. ST&amp;H | Consultoria Científica em Performance e Saúde. Ética, resultado e respeito à individualidade.
        </p>
      </footer>
    </div>
  );
};

export default TirzepatidaRetatrutida;