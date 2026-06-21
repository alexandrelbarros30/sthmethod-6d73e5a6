import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-tirzepatida-desmame-hero.jpg";

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

const TirzepatidaDesmame = () => {
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
          Tirzepatida — Manutenção de Resultados
        </motion.p>
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          O desmame da tirzepatida.
          <br />
          <span className="text-muted-foreground">O verdadeiro desafio começa depois.</span>
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Emagrecer é apenas a primeira etapa. A manutenção dos resultados depende dos hábitos construídos durante o tratamento.
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
            alt="Tirzepatida — o desafio começa quando a caneta acaba"
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
          As canetas emagrecedoras revolucionaram o tratamento da obesidade e do excesso de peso. Medicamentos como a tirzepatida entregam redução de apetite, controle da fome e perda de peso corporal. Mas existe uma pergunta que precisa ser feita:{' '}
          <span className="text-foreground font-medium">o que acontece quando o tratamento termina?</span>
        </motion.p>
      </section>

      <Section number="01" kicker="Ferramenta vs. Projeto" title="A tirzepatida não deve ser o projeto. Ela deve ser a ferramenta.">
        <p>
          Muitas pessoas enxergam a caneta como a responsável pelo emagrecimento. Na realidade, ela deve ser vista como uma oportunidade: uma janela de tempo onde o organismo responde melhor ao processo de mudança.
        </p>
        <p>
          Durante esse período, o indivíduo possui uma chance única de reconstruir sua relação com a alimentação, com o exercício físico, com o sono e com o próprio estilo de vida. O medicamento ajuda. Mas os hábitos são os verdadeiros responsáveis pela manutenção dos resultados.
        </p>
      </Section>

      <Section number="02" kicker="Desmame Precoce" title="O desmame começa muito antes da última aplicação.">
        <p>
          Um erro comum é acreditar que a preocupação com a manutenção do peso deve começar apenas quando o medicamento for suspenso. Na verdade, o processo de desmame começa desde o primeiro dia de tratamento.
        </p>
        <p>
          Cada refeição organizada. Cada sessão de treinamento realizada. Cada melhoria na qualidade do sono. Cada escolha saudável repetida. Tudo isso está construindo a base que sustentará o resultado futuramente.
        </p>
        <p className="text-foreground font-medium">
          Quem utiliza a tirzepatida sem desenvolver novos hábitos corre o risco de depender exclusivamente do efeito farmacológico. E quando o medicamento sai de cena, os antigos comportamentos costumam retornar.
        </p>
      </Section>

      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
            03 — Treinamento mental
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
            O cérebro também precisa ser treinado.
          </h2>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          <HighlightCard title="Consciência alimentar">
            <p>
              O emagrecimento não acontece apenas no corpo. Ele acontece também na mente. Muitos dos comportamentos que contribuíram para o ganho de peso foram construídos ao longo de anos.
            </p>
            <p>
              Comer por ansiedade. Beliscar constantemente. Utilizar a comida como recompensa emocional. Ignorar sinais de saciedade. Esses padrões não desaparecem automaticamente.
            </p>
          </HighlightCard>
          <HighlightCard title="Nova versão mental">
            <p>
              Por isso, o tratamento precisa envolver consciência, educação e mudança de comportamento. A nova versão física precisa ser acompanhada por uma nova versão mental.
            </p>
            <p>
              A autonomia começa quando o indivíduo consegue identificar seus gatilhos e responder a eles sem recorrer ao medicamento.
            </p>
          </HighlightCard>
        </div>
      </section>

      <Section number="04" kicker="Ambiente Social" title="O ambiente tem poder sobre os resultados.">
        <p>
          Outro fator frequentemente ignorado é o ambiente. Família. Amigos. Trabalho. Rotina social. Tudo influencia diretamente os hábitos diários.
        </p>
        <p>
          Quando uma pessoa transforma seu estilo de vida, ela não está apenas mudando a própria saúde. Ela está criando um exemplo, uma referência, uma inspiração para aqueles que convivem com ela.
        </p>
        <p className="text-foreground font-medium">
          A mudança individual muitas vezes desencadeia mudanças coletivas.
        </p>
      </Section>

      <Section number="05" kicker="Objetivo Real" title="O objetivo não é apenas emagrecer.">
        <p>
          O verdadeiro objetivo não é atingir um número específico na balança. O objetivo é construir uma rotina capaz de sustentar esse resultado.
        </p>
        <p>
          A manutenção do peso saudável exige continuidade. Exige consistência. Exige uma identidade alinhada com as escolhas diárias. Quando isso acontece, o indivíduo deixa de depender exclusivamente da motivação ou do medicamento. Ele passa a depender dos hábitos que construiu.
        </p>
      </Section>

      <Section number="06" kicker="Autonomia" title="A maior vitória é a autonomia.">
        <p>
          A tirzepatida pode iniciar a transformação. Mas a autonomia é o que garante sua permanência. O sucesso do tratamento não deve ser medido apenas pelos quilos perdidos.
        </p>
        <p className="text-foreground font-medium">
          Deve ser medido pela capacidade de manter os resultados mesmo após o encerramento do protocolo.
        </p>
        <p>
          Porque a verdadeira mudança acontece quando os hábitos permanecem, mesmo quando a caneta não faz mais parte da rotina.
        </p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            A caneta acaba.
            <br />
            <span className="text-muted-foreground">Os hábitos permanecem.</span>
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
          STH News — Edição Especial · 2026. ST&amp;H | Consultoria Científica em Performance e Saúde. Ética, resultado e respeito à individualidade.
        </p>
      </footer>
    </div>
  );
};

export default TirzepatidaDesmame;
