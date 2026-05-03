import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const articles = [
  { to: "/tendencias/trembolona", kicker: "Anabolizantes", title: "Trembolona: arquitetura corporal no patamar de elite.", desc: "O segredo nunca foi a dose. É o manejo." },
  { to: "/tendencias/plato-metabolico", kicker: "Metabolismo", title: "Platô metabólico: por que o corpo para de responder.", desc: "Quando consistência vira repetição." },
  { to: "/tendencias/gestrinona", kicker: "Hormonal feminino", title: "Gestrinona: a molécula de tripla ação.", desc: "Densidade, secura e equilíbrio hormonal." },
  { to: "/tendencias/glow-blend", kicker: "Regeneração", title: "Glow Blend: o trio de peptídeos que faz o corpo brilhar.", desc: "BPC-157 + TB-500 + GHK-Cu." },
  { to: "/tendencias/drostanolona-masteron", kicker: "DHT", title: "Drostanolona (Masteron): densidade e performance.", desc: "Os limites do uso feminino." },
  { to: "/tendencias/triade-intestino-hormonio", kicker: "Eixo intestinal", title: "Tríade SII, SOP e DRGE: o eixo intestino-hormônio.", desc: "Mesma raiz, três expressões." },
  { to: "/tendencias/cintura-estetica", kicker: "Estética", title: "A estética da cintura não é só genética.", desc: "Estrutura, estímulo e estratégia." },
  { to: "/tendencias/subcutanea-estrategia", kicker: "Farmacocinética", title: "IM → SubQ: a estratégia que mudou o jogo.", desc: "Estabilidade sérica e técnica de precisão." },
  { to: "/tendencias/recomposicao-avancada", kicker: "Recomposição", title: "Recomposição corporal avançada.", desc: "Tirzepatida + estratégia anabólica." },
  { to: "/tendencias/cenario-fitness-2026", kicker: "Cenário global", title: "O cenário atual do fitness global.", desc: "IFBB, FIBO Europe e o fim do conteúdo genérico." },
];

const Tendencias = () => {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-11 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Início</span>
          </Link>
          <span className="text-[12px] font-semibold tracking-tight">STH News</span>
          <Link to="/cadastro">
            <Button size="sm" className="text-[11px] h-7 rounded-full bg-foreground text-background hover:bg-foreground/90">Começar</Button>
          </Link>
        </div>
      </header>

      <section className="pt-32 md:pt-40 pb-16 md:pb-24 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-primary mb-6">
          STH News
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          Informação <br />
          <span className="text-muted-foreground">que transforma.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Análises técnicas, tendências globais e estratégias avançadas em saúde e performance.
        </motion.p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid gap-px bg-border/40 rounded-3xl overflow-hidden">
          {articles.map((a, i) => (
            <motion.div
              key={a.to}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
              transition={{ delay: i * 0.04 }}
              className="bg-background"
            >
              <Link to={a.to} className="group block px-6 py-8 md:px-10 md:py-10 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">{a.kicker}</p>
                    <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground leading-[1.2] mb-2">{a.title}</h2>
                    <p className="text-[15px] text-muted-foreground font-light leading-relaxed">{a.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Pronto para aplicar?
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Conhecimento sem estratégia é só conteúdo. Comece sua consultoria.
          </p>
          <Link to="/cadastro">
            <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
              Começar agora
            </Button>
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="text-[12px] text-muted-foreground font-light">STH News — Consultoria Estratégica em Saúde & Performance</p>
      </footer>
    </div>
  );
};

export default Tendencias;
