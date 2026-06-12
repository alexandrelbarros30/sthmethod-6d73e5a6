import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-atrofia-hero.jpg";
import mionucleosImg from "@/assets/sthnews-atrofia-mionucleos.jpg";
import eixoImg from "@/assets/sthnews-atrofia-eixo.jpg";
import treinoImg from "@/assets/sthnews-atrofia-treino.jpg";
import nutricaoImg from "@/assets/sthnews-atrofia-nutricao.jpg";
import restauracaoImg from "@/assets/sthnews-atrofia-restauracao.jpg";

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

const RestauracaoMuscular = () => {
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
          Restauração Muscular · 10 anos
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          O músculo lembra. <br />
          <span className="text-muted-foreground">O sangue precisa voltar.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Reverter atrofia depois de 10 anos de hormônios não é mito. É engenharia hormonal.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Atleta com hélice de DNA neon representando memória muscular" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          Uma década de uso crônico deixa duas marcas: o eixo hormonal silenciado e o músculo aparentemente apagado. A biologia, no entanto, guarda uma <span className="text-primary">assinatura indelével</span> que pode ser reativada.
        </motion.p>
      </section>

      <Section number="01" kicker="Memória miotonuclear" title="Os mionúcleos não morrem. Eles dormem."
        image={mionucleosImg} alt="Mionúcleos dormentes em fibra muscular">
        <p>Anos de treino pesado e suporte hormonal recrutam células satélites que se fundem à fibra muscular e doam seus núcleos. Esses <span className="text-foreground font-medium">mionúcleos</span> são as fábricas que comandam a síntese proteica.</p>
        <p>Estudos de biologia molecular mostram que, mesmo após anos de atrofia, esses núcleos conquistados <span className="text-foreground font-medium">permanecem dormentes</span> dentro da fibra — por anos, possivelmente por décadas.</p>
        <p>Resultado: quando o estímulo correto volta, a velocidade de reconstrução é incomparavelmente maior do que a de um iniciante construindo do zero.</p>
      </Section>

      <Section number="02" kicker="O verdadeiro gargalo" title="O eixo hormonal pós-10 anos."
        image={eixoImg} alt="Eixo HPT — hipotálamo, hipófise e gônadas">
        <p>O problema raramente está no músculo. Está no <span className="text-foreground font-medium">eixo HPT</span> — hipotálamo, hipófise e gônadas — silenciado por uma década.</p>
        <p>Sem intervenção bioquímica precisa, a testosterona despenca muito abaixo de 310 ng/dL, o cortisol sobe, a miostatina assume o controle e o resultado é catabolismo, fadiga e perda contínua.</p>
        <p className="text-foreground font-medium">A reabilitação começa no sangue, não no ferro.</p>
      </Section>

      <Section number="03" kicker="Caminhos clínicos" title="Reset sistêmico em duas rotas."
        image={restauracaoImg} alt="Atleta maduro restaurado">
        <div className="grid gap-4">
          {[
            ["Rota A · Reinicialização do eixo", "Protocolo agressivo de resgate testicular com hCG em doses de choque, seguido por SERMs (Clomifeno, Tamoxifeno) por meses para forçar a hipófise a produzir LH e FSH novamente."],
            ["Rota B · TRT médica", "Após 10 anos de supressão, parte dos eixos sofre dano permanente. A transição para uma TRT estável (testosterona entre 600 e 800 ng/dL) entrega o suporte biológico que o músculo precisa para responder."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
        <p>A decisão entre as duas rotas é clínica, não emocional — depende de exames, idade biológica e resposta do eixo após semanas de avaliação.</p>
      </Section>

      <Section number="04" kicker="Estímulo mecânico" title="Acordar mionúcleos exige tensão, não volume."
        image={treinoImg} alt="Treino com cadência controlada">
        <p>Os mionúcleos dormentes respondem à <span className="text-foreground font-medium">tensão mecânica progressiva</span>, não ao volume insano dos tempos de ouro.</p>
        <p>Os tendões perdem colágeno e elasticidade durante a atrofia. Voltar com 20 séries semanais por grupo é receita certa para tendinite crônica.</p>
        <p>O caminho é começar com <span className="text-foreground font-medium">10 a 12 séries semanais por agrupamento</span>, exercícios básicos, cadência excêntrica controlada. O músculo cresce, o tendão se reabilita junto.</p>
      </Section>

      <Section number="05" kicker="Nutrição & metabolismo" title="Recomposição, não bulking."
        image={nutricaoImg} alt="Prato de recomposição corporal">
        <p>Anos de atrofia geralmente vêm acompanhados de piora na sensibilidade à insulina. Um bulking sujo só amplifica o problema.</p>
        <div className="grid gap-4 pt-4">
          {[
            ["Recomposição corporal", "Normocalórica ou leve déficit, com 2,2g de proteína por kg. O corpo usa gordura como energia enquanto os mionúcleos captam aminoácidos."],
            ["Creatina · 5g/dia", "Restaura a hidratação intracelular e o estoque de ATP — primeiro ganho visível em semanas."],
            ["Ashwagandha KSM-66", "Adaptógeno que controla cortisol e impede que o estresse do retorno degrade o tecido recém-construído."],
            ["Sono regulado", "GH endógeno e recuperação tendínea acontecem em 7 a 9 horas de sono profundo, sem exceções."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="06" kicker="O veredito" title="A assinatura está no seu DNA."
        image={heroImg} alt="Memória muscular gravada no DNA">
        <p>A estrutura construída em 10 anos deixou uma marca celular que não desaparece com a interrupção. O potencial continua intacto.</p>
        <p className="text-foreground font-medium">Pare de olhar para o músculo. Comece pelo sangue.</p>
        <p>Uma vez que o ambiente hormonal e metabólico esteja regulado — seja via eixo natural reabilitado ou TRT médica —, o músculo responderá com velocidade que surpreende até quem já viveu o auge.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Seu físico antigo <br />
            <span className="text-muted-foreground">ainda está aí dentro.</span>
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            O ponto de partida é um check-up hormonal completo. O resto é engenharia.
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
          Conteúdo estritamente informativo. Qualquer protocolo de reabilitação hormonal exige supervisão de endocrinologista ou médico do esporte.
        </p>
      </footer>
    </div>
  );
};

export default RestauracaoMuscular;