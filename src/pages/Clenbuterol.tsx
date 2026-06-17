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
          <span className="text-muted-foreground">mais poderoso do fisiculturismo.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Ou uma bomba-relógio cardiovascular? Ambos os lados têm motivos para pensar assim.
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
          A maioria das pessoas conhece os resultados do Clenbuterol. <span className="text-primary">Pouquíssimas entendem seus riscos.</span> Ele não é hormônio, não é anabolizante, não é peptídeo — e ainda assim produz transformações corporais impressionantes.
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

      <Section number="05" kicker="Colaterais" title="O preço fisiológico é real."
        image={coracaoImg} alt="Sobrecarga cardiovascular">
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

      <Section number="06" kicker="O coração paga a conta" title="A sobrecarga cardiovascular é o verdadeiro risco.">
        <p>O problema não está apenas nos tremores. Está na <span className="text-foreground font-medium">sobrecarga cardiovascular acumulada</span>.</p>
        <p>A utilização inadequada pode favorecer hipertrofia cardíaca patológica, arritmias, disfunção ventricular e alterações estruturais do miocárdio.</p>
        <p className="text-foreground font-medium">Quanto maior a exposição, maior deve ser o respeito ao risco cardiovascular.</p>
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
        <p>O Clenbuterol é uma das ferramentas termogênicas mais potentes já utilizadas. Sua capacidade de aumentar o gasto energético é real e amplamente documentada.</p>
        <p>Mas, diferentemente de muitos recursos modernos para emagrecimento, ele cobra um preço fisiológico consideravelmente maior.</p>
        <p className="text-foreground font-medium">Entre acelerar o metabolismo e sobrecarregar o coração existe uma linha extremamente fina. E essa linha se chama estratégia.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            O corpo responde ao estímulo. <br />
            <span className="text-muted-foreground">O coração paga a conta.</span>
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Ciência, monitoramento e individualização determinam se a aceleração produz evolução — ou consequências.
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