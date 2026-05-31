import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-tirzepatida-colaterais-hero.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

type Block = {
  icon: string;
  title: string;
  why: string;
  med: string;
  supp: string;
  behavior: string;
};

const comuns: Block[] = [
  {
    icon: "💨",
    title: "Arrotos sulfúricos (gosto de ovo podre)",
    why: "O esvaziamento gástrico lento faz proteínas fermentarem por mais tempo no estômago, liberando gás sulfídrico (H₂S).",
    med: "Metoclopramida (Plasil) ou Bromoprida para acelerar suavemente o esvaziamento. Simeticona em dose máxima para quebrar bolhas.",
    supp: "Enzimas digestivas completas (bromelina, papaína, protease, lipase) junto às refeições proteicas. Carvão vegetal ativado para adsorver gases.",
    behavior: "Reduzir o volume por refeição e fracionar. Mastigar 30+ vezes cada garfada. Não deitar antes de 2h da última refeição.",
  },
  {
    icon: "🌋",
    title: "Azia, queimação e refluxo",
    why: "O bolo alimentar estagnado aumenta a pressão intragástrica e força a abertura do esfíncter esofágico inferior.",
    med: "Inibidores de bomba (esomeprazol, pantoprazol) em jejum pela manhã. Carbonato de cálcio ou hidróxido de alumínio em crises agudas.",
    supp: "Cloridrato de betaína com pepsina (sem esofagite ativa) ou espinheira-santa em extrato seco antes das grandes refeições.",
    behavior: "Cortar gaseificadas, refrigerantes, pimenta, excesso de café e gorduras saturadas à noite. Elevar a cabeceira da cama 15–20 cm.",
  },
  {
    icon: "🤢",
    title: "Enjoo, náusea e vômito",
    why: "Estímulo dos receptores GLP-1 na área postrema (centro do vômito) somado à distensão das paredes estomacais.",
    med: "Ondansetrona 4–8 mg sublingual (Vonau Flash). Em casos refratários, associar domperidona antes das refeições.",
    supp: "Extrato seco de gengibre 500–1000 mg fracionado no dia — bloqueio natural de receptores 5-HT3.",
    behavior: "Não forçar alimento durante a náusea ativa. Preferir comida fria ou em temperatura ambiente. Evitar líquidos junto às refeições sólidas.",
  },
  {
    icon: "💦",
    title: "Diarreia aguda ou crônica",
    why: "Mudança abrupta no trânsito intestinal e secreção de fluidos no cólon, ou má absorção de gorduras acumuladas.",
    med: "Loperamida (Imosec) em urgência. Racecadotrila (Tiorfan) para regulação fisiológica da secreção intestinal de água.",
    supp: "Probióticos de alta potência (Lactobacillus rhamnosus GG, Saccharomyces boulardii). Reposição imediata de eletrólitos.",
    behavior: "Retirar lactose e polióis (xilitol, eritritol, maltitol) enquanto durar o quadro — eles aumentam a osmolaridade intestinal.",
  },
  {
    icon: "🪨",
    title: "Constipação severa",
    why: "Queda do peristaltismo. As fezes ficam paradas no cólon e sofrem reabsorção excessiva de água, ficando secas e endurecidas.",
    med: "Lactulose ou PEG 4000 diariamente. Óleo mineral em impactação. Evitar laxantes estimulantes viciantes (sene).",
    supp: "Psyllium husk 10–15 g/dia com um copo grande de água. Citrato de magnésio em doses mais altas (efeito osmótico limpo).",
    behavior: "Hidratação mínima de 4,5–5 L/dia — sem água, o psyllium vira cimento. Cardio diário é mandatório para o reflexo peristáltico.",
  },
];

const raros: Block[] = [
  {
    icon: "🧠",
    title: "Fadiga extrema, letargia e brain fog",
    why: "Colateral secundário ao déficit calórico agressivo induzido pela falta de apetite, ou leve hipoglicemia pela otimização da insulina.",
    med: "Ajuste e espaçamento da dose da tirzepatida sob supervisão médica.",
    supp: "Coenzima Q10 (ubiquinol) 200 mg + L-carnitina 2 g + complexo B metilado pela manhã para otimização mitocondrial.",
    behavior: "Mesmo sem fome, atingir a meta mínima de proteínas e carboidratos complexos para não depletar glicogênio cerebral e muscular.",
  },
  {
    icon: "🩸",
    title: "Alteração de humor, ansiedade ou disforia",
    why: "Bloqueio crônico da recompensa dopaminérgica via comida pode reduzir transitoriamente dopamina e serotonina centrais em indivíduos propensos.",
    med: "Avaliação psiquiátrica se houver histórico. Ajuste de neurotransmissores quando necessário.",
    supp: "L-teanina 200 mg + ashwagandha 500 mg à noite para modular cortisol e acalmar o SNC.",
    behavior: "Meditação, higiene do sono rigorosa e canalização da dopamina para metas de treino e evolução estética.",
  },
  {
    icon: "💀",
    title: "Dores musculares ou articulares improváveis",
    why: "Desidratação intracelular crônica e perda rápida de eletrólitos pela baixa ingestão de água e minerais decorrente da supressão alimentar.",
    med: "Analgésicos simples (paracetamol) em crise. Evitar anti-inflamatórios nefrotóxicos.",
    supp: "Reposição de eletrólitos (sódio, potássio, magnésio) em cápsulas ou sachês diluídos ao longo do dia.",
    behavior: "Monitorar a cor da urina (sempre clara). Manter alongamento e aquecimento técnico antes dos treinos de força.",
  },
];

const BlockCard = ({ b }: { b: Block }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.6 }}
    className="rounded-3xl border border-border/40 bg-card p-6 md:p-8"
  >
    <div className="text-3xl mb-3">{b.icon}</div>
    <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
      {b.title}
    </h3>
    <div className="space-y-4 text-[15px] leading-[1.65] text-muted-foreground font-light">
      <p>
        <span className="text-foreground font-medium">Por que acontece. </span>
        {b.why}
      </p>
      <p>
        <span className="text-foreground font-medium">💊 Medicamentoso. </span>
        {b.med}
      </p>
      <p>
        <span className="text-foreground font-medium">🌿 Suplementação. </span>
        {b.supp}
      </p>
      <p>
        <span className="text-foreground font-medium">🧠 Comportamento. </span>
        {b.behavior}
      </p>
    </div>
  </motion.div>
);

const TirzepatidaColaterais = () => {
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
            <Link to="/dashboard">
              <Button size="sm" variant="ghost" className="text-[11px] h-7 rounded-full">Voltar</Button>
            </Link>
          ) : (
            <Link to="/cadastro">
              <Button size="sm" className="text-[11px] h-7 rounded-full bg-foreground text-background hover:bg-foreground/90">
                Começar
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="pt-32 md:pt-40 pb-16 md:pb-24 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
          Tirzepatida — Manejo Clínico
        </motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          Colaterais da Tirzepatida.<br />
          <span className="text-muted-foreground">Mapa tático completo.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          Do mais comum ao mais raro. Cada sintoma cruzado com solução medicamentosa, suplementar e comportamental — no padrão ST&amp;H Method.
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
            alt="Tirzepatida — manejo clínico dos colaterais"
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
          O colateral não é o vilão.{" "}
          <span className="text-foreground font-medium">O manejo amador é.</span>
        </motion.p>
      </section>

      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
            01 — Mecânicos &amp; digestivos
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
            Colaterais comuns e incômodos.
          </h2>
          <p className="mt-5 text-base text-muted-foreground font-light">
            Ocorrem pelo retardo do esvaziamento gástrico e pela modulação central da saciedade — a comida passa mais tempo no estômago, gerando fermentação e rebote ácido.
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          {comuns.map((b) => <BlockCard key={b.title} b={b} />)}
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
            02 — Improváveis, mas possíveis
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
            Colaterais raros que pedem vigilância.
          </h2>
          <p className="mt-5 text-base text-muted-foreground font-light">
            Exigem monitoramento clínico rigoroso — podem sinalizar alterações metabólicas profundas ou necessidade de interrupção do fármaco.
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          {raros.map((b) => <BlockCard key={b.title} b={b} />)}
        </div>
      </section>

      <section className="py-20 md:py-28 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl border border-destructive/40 bg-destructive/5 p-8 md:p-12"
          >
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-destructive">
                Alerta de segurança máxima
              </p>
            </div>
            <h3 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground leading-[1.1] mb-5">
              Dor abdominal aguda que irradia para as costas — suspenda e procure urgência.
            </h3>
            <p className="text-[16px] leading-[1.65] text-muted-foreground font-light">
              Se houver dor abdominal severa e persistente irradiando para as costas, acompanhada ou não de vômitos incoercíveis, suspenda o uso imediatamente e busque atendimento hospitalar. Pode ser sinal de <span className="text-foreground font-medium">pancreatite aguda</span> ou <span className="text-foreground font-medium">crise biliar</span> — raros, mas graves.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 border-t border-border/40 text-center px-6">
        <p className="max-w-2xl mx-auto text-xl md:text-2xl font-light text-muted-foreground leading-[1.4]">
          Sintoma identificado, conduta definida.{" "}
          <span className="text-foreground font-medium">É assim que o ST&amp;H Method opera.</span>
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link to="/tendencias">
            <Button variant="ghost" size="sm" className="rounded-full text-[12px]">Ver outras matérias</Button>
          </Link>
          {!isStudent && (
            <Link to="/cadastro">
              <Button size="sm" className="rounded-full text-[12px] bg-foreground text-background hover:bg-foreground/90">
                Entrar no método
              </Button>
            </Link>
          )}
        </div>
      </section>

      <footer className="py-10 text-center text-[11px] text-muted-foreground border-t border-border/40">
        STH News · Conteúdo clínico-educacional · Não substitui avaliação médica individual.
      </footer>
    </div>
  );
};

export default TirzepatidaColaterais;