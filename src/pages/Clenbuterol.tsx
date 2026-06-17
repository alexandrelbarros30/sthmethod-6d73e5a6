import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-clenbuterol-hero.jpg";
import moleculaImg from "@/assets/sthnews-clenbuterol-molecula.jpg";
import coracaoImg from "@/assets/sthnews-clenbuterol-coracao.jpg";
import vereditoImg from "@/assets/sthnews-clenbuterol-veredito.jpg";

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

const Clenbuterol = () => {
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
          Clenbuterol
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          O termogênico <br />
          <span className="text-muted-foreground">mais eficaz do fisiculturismo.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Quando bem conduzido, entrega resultados extraordinários com segurança. O segredo está no protocolo de suporte.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Termogênese e impacto cardiovascular do Clenbuterol" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          A maioria das pessoas conhece os resultados do Clenbuterol. <span className="text-primary">Pouquíssimas entendem como conduzi-lo com segurança.</span> Ele não é hormônio, não é anabolizante, não é peptídeo — e ainda assim produz transformações corporais impressionantes quando acompanhado de um protocolo de suporte inteligente.
        </motion.p>
      </section>

      <Section number="01" kicker="A molécula" title="Agonista beta-2 adrenérgico de longa duração."
        image={moleculaImg} alt="Molécula do Clenbuterol">
        <p>Originalmente desenvolvido como broncodilatador, chamou atenção por outro motivo: sua extraordinária capacidade de aumentar o gasto energético.</p>
        <p>Seu mecanismo se assemelha ao estado de ativação intensa do sistema nervoso simpático. Em termos simples: o organismo passa a funcionar como se estivesse constantemente recebendo um sinal para <span className="text-foreground font-medium">acelerar</span>.</p>
      </Section>

      <Section number="02" kicker="O que ele faz" title="Quatro frentes simultâneas no organismo.">
        <div className="grid gap-4">
          {[
            ["Metabolismo energético", "Aumenta termogênese, gasto basal, mobilização de gordura e consumo em repouso."],
            ["Sistema nervoso", "Estado de alerta elevado, disposição momentânea e redução da sensação de fadiga."],
            ["Sistema cardiovascular", "Eleva frequência cardíaca, pressão arterial e intensifica o trabalho do miocárdio."],
            ["Massa muscular", "Efeito anticatabólico em animais. Em humanos existe — porém muito menor do que se imagina."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="03" kicker="Por que funciona" title="Não reduz fome. Faz o corpo gastar mais.">
        <p>Enquanto muitos recursos atuam reduzindo o apetite, o Clenbuterol atua principalmente <span className="text-foreground font-medium">aumentando o consumo de energia</span>.</p>
        <p>Mais calor produzido. Mais gordura mobilizada. Maior gasto energético diário. Por isso ganhou popularidade entre atletas, fisiculturistas e praticantes avançados.</p>
        <p className="text-foreground font-medium">O Clenbuterol não ensina ninguém a comer menos. Ele faz o organismo gastar mais.</p>
      </Section>

      <Section number="04" kicker="Hipertrofia" title="Não é anabolizante. Não substitui o básico.">
        <p>Apesar de aparecer em estratégias de composição corporal — minimizar ganho de gordura no bulking, melhorar definição, preservar magra no déficit — Clenbuterol <span className="text-foreground font-medium">não substitui testosterona, dieta adequada ou treino eficiente</span>.</p>
      </Section>

      <Section number="05" kicker="Sinais a monitorar" title="O corpo avisa — e o protocolo responde."
        image={coracaoImg} alt="Sobrecarga cardiovascular">
        <p>Como todo recurso potente, o Clenbuterol exige escuta fisiológica. Reconhecer cada sinal precocemente permite ajustar dose, suporte e janela de uso antes que qualquer desconforto evolua.</p>
        <div className="grid gap-4">
          {[
            ["Cardiovasculares", "Taquicardia, palpitações, hipertensão, arritmias, sobrecarga cardíaca."],
            ["Neurológicos", "Tremores, ansiedade, irritabilidade, insônia, inquietação."],
            ["Musculares", "Cãibras, espasmos e fadiga muscular."],
            ["Metabólicos", "Sudorese excessiva, intolerância ao calor, desidratação, alterações eletrolíticas."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="06" kicker="Protocolo de suporte" title="Como atenuar o impacto e usar com segurança.">
        <p>Esse é o capítulo que separa o usuário amador do estrategista. Um suporte bem desenhado neutraliza a maior parte dos efeitos adversos e mantém o ganho de performance intacto.</p>
        <div className="grid gap-4">
          {[
            ["Taurina — 3 a 5 g/dia", "Reduz cãibras, tremores e protege contra a depleção induzida pelo agonismo beta-2. Pilar não negociável do protocolo."],
            ["Potássio e magnésio", "Reposição diária via dieta ou suplementação (cloreto de magnésio, citrato de potássio). Previne arritmias, câimbras e fadiga muscular."],
            ["Hidratação dirigida", "35 a 45 ml/kg/dia + eletrólitos. A termogênese aumenta perdas hídricas e iônicas — repor é obrigatório."],
            ["Ômega-3 (EPA/DHA 2–3 g)", "Cardioprotetor, anti-inflamatório e estabilizador de ritmo cardíaco."],
            ["CoQ10 (100–200 mg) + L-carnitina", "Suporte mitocondrial e proteção do miocárdio frente à demanda energética elevada."],
            ["Cardio de baixa intensidade", "Zona 2 substitui HIIT durante o ciclo. Mantém oxidação de gordura sem somar estresse cardíaco."],
            ["Sono e cortisol", "Última dose até 14h, higiene do sono rigorosa, magnésio glicinato à noite. Recuperação é parte do protocolo."],
            ["Ciclagem inteligente", "2 semanas on / 2 semanas off, ou esquema 2 dias on / 2 dias off. Evita dessensibilização e dá descanso ao sistema cardiovascular."],
            ["Dose progressiva", "Iniciar em 20 mcg e titular conforme tolerância. Teto individual — não comparativo. Mais nunca é melhor."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
        <p className="text-foreground font-medium">Com esse pacote bem aplicado, o Clenbuterol deixa de ser um susto fisiológico e passa a ser uma ferramenta cirúrgica de composição corporal.</p>
      </Section>

      <Section number="07" kicker="Monitoramento" title="Exames fundamentais antes e durante.">
        <div className="grid gap-4">
          {[
            "Pressão arterial e frequência cardíaca",
            "Eletrocardiograma — ecocardiograma quando indicado",
            "Hemograma, glicemia e perfil lipídico",
            "Função tireoidiana e eletrólitos",
          ].map((t) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground text-[15px]">{t}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="08" kicker="O maior erro" title="Mais Clenbuterol não significa mais resultado.">
        <p>Conforme os receptores beta-adrenérgicos sofrem dessensibilização, os resultados diminuem — enquanto os riscos continuam aumentando.</p>
        <p className="text-foreground font-medium">É exatamente nesse ponto que muitos usuários cometem seus maiores erros.</p>
      </Section>

      <Section number="09" kicker="O veredito" title="Entre acelerar e sobrecarregar há uma linha fina."
        image={vereditoImg} alt="Estratégia clínica">
        <p>O Clenbuterol é uma das ferramentas termogênicas mais potentes já utilizadas. Sua capacidade de aumentar o gasto energético é real, amplamente documentada — e, com suporte adequado, segura para o praticante avançado.</p>
        <p>A diferença entre quem colhe resultados extraordinários e quem colhe sustos não está na molécula: está no protocolo que a acompanha.</p>
        <p className="text-foreground font-medium">Taurina, eletrólitos, ômega-3, cardio inteligente, ciclagem e dose individualizada transformam o Clenbuterol em uma ferramenta de elite — não em um risco.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            O estímulo é poderoso. <br />
            <span className="text-muted-foreground">O suporte é o que sustenta o resultado.</span>
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Com ciência, monitoramento e o protocolo de suporte certo, a aceleração se transforma em evolução real.
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
          Referências: Spiller HA et al., J Med Toxicol 2013 · Hoffman RJ, Kirrane BM, Clin Toxicol 2011 · Prather ID et al., Vet Hum Toxicol 1995 · WADA Monitoring Program. Substâncias ergogênicas devem ser conduzidas sob supervisão médica.
        </p>
      </footer>
    </div>
  );
};

export default Clenbuterol;