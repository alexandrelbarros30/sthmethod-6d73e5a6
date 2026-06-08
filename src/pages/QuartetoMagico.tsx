import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-triade-glass-1.jpg";
import sinergiaImg from "@/assets/sthnews-triade-glass-2.jpg";
import examesImg from "@/assets/sthnews-triade-glass-3.jpg";
import protocoloImg from "@/assets/sthnews-triade-glass-4.jpg";
import vereditoImg from "@/assets/sthnews-triade-glass-5.jpg";

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

const QuartetoMagico = () => {
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
          Conceito STH Method
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          O Quarteto Mágico <br />
          <span className="text-muted-foreground">da transformação.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Muitas pessoas acreditam que resultados vêm apenas da dieta. Outras apostam tudo no treino. A verdade é que nenhum pilar funciona sozinho.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Quarteto Mágico STH" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          Na STH Method, trabalhamos com aquilo que chamamos de Quarteto Mágico da Transformação: <span className="text-primary font-medium">Protocolo, Dieta, Treino e Exames</span>. Quando esses quatro elementos trabalham em sinergia, o resultado deixa de ser uma aposta e vira matemática.
        </motion.p>
      </section>

      <Section number="01" kicker="Sinergia" title="Por que a dieta sozinha falha."
        image={sinergiaImg} alt="Sinergia entre pilares">
        <p>Você pode ter a melhor dieta do mundo, mas se o seu <span className="text-foreground font-medium">ambiente hormonal</span> estiver desregulado, você vai lutar contra o próprio corpo.</p>
        <p>Se o seu treino não for sinalizado corretamente, você perde massa magra em vez de gordura. O Quarteto Mágico corrige essas falhas de sistema.</p>
      </Section>

      <Section number="02" kicker="Os Pilares" title="As engrenagens do seu projeto."
        image={protocoloImg} alt="Pilares do método">
        <div className="grid gap-4 pt-4">
          {[
            { name: "Protocolo", desc: "A inteligência química e suplementar. Não é sobre 'tomar algo', é sobre otimização de receptores e ambiente anabólico." },
            { name: "Dieta", desc: "O combustível e o material de construção. Ajustada para a sua taxa metabólica real, não para uma fórmula de internet." },
            { name: "Treino", desc: "O estímulo mecânico. Sem ele, a sinalização para hipertrofia não acontece, independentemente do que você consome." },
            { name: "Exames", desc: "O mapa do tesouro. Eles dizem exatamente onde você está e para onde podemos ir com segurança." },
          ].map((e) => (
            <div key={e.name} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{e.name}</p>
              <p className="text-[15px]">{e.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="03" kicker="Manejo de Precisão" title="De Semaglutida a Retatrutida."
        image={vereditoImg} alt="Peptídeos e protocolos">
        <p>A ciência evoluiu. Antigamente falávamos apenas em déficit calórico. Hoje, usamos ferramentas como a <span className="text-foreground font-medium">Retatrutida</span> (triplo agonista GLP-1/GIP/GCG) para controle glicêmico e saciedade sem precedentes.</p>
        <p>Aliamos isso a <span className="text-foreground font-medium">Peptídeos de GH</span> (como Ipamorelin ou CJC-1295) para garantir que a queima de gordura ocorra preservando cada grama de massa muscular.</p>
      </Section>

      <Section number="04" kicker="Segurança" title="Exames não são opcionais."
        image={examesImg} alt="Marcadores laboratoriais">
        <p>A segurança é o que permite a constância. Monitoramos marcadores de inflamação, perfil lipídico e saúde hepática em tempo real.</p>
        <p className="text-foreground font-medium">Na STH Method, não entregamos apenas uma dieta. Entregamos uma estratégia completa de vida.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Pronto para o Quarteto Mágico?
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Pare de tentar a sorte. Comece a usar o método.
          </p>
          {!isStudent && (
            <Link to="/cadastro">
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
                Quero meu projeto
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          STH Method · Ciência, estratégia e constância para transformar vidas. Escolha seu plano e descubra o que o Quarteto Mágico pode fazer pelo seu projeto.
        </p>
      </footer>
    </div>
  );
};

export default QuartetoMagico;