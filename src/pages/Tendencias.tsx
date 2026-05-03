import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ginecoImg from "@/assets/sthnews-gineco-hero.jpg";
import bfAltoImg from "@/assets/sthnews-bfalto-hero.jpg";
import trembolonaImg from "@/assets/sthnews-trembolona-hero.jpg";
import platoImg from "@/assets/sthnews-plato-hero.jpg";
import gestrinonaImg from "@/assets/sthnews-gestrinona-hero.jpg";
import glowImg from "@/assets/sthnews-glow-hero.jpg";
import masteronImg from "@/assets/sthnews-masteron-glass-1.jpg";
import triadeImg from "@/assets/sthnews-triade-thumb.jpg";
import cinturaImg from "@/assets/sthnews-subq-glass-2.jpg";
import subqImg from "@/assets/sthnews-subq-glass-1.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const articles = [
  { to: "/tendencias/hormonios-bf-alto", kicker: "Hormonal & metabólico", title: "🧬 Hormônio com BF alto: o fim do mito.", desc: "Não é proibido — é cirúrgico. Exames acima do medo.", img: bfAltoImg },
  { to: "/tendencias/ginecomastia", kicker: "Hormonal masculino", title: "🧬 Ginecomastia: o caroço silencioso que trava sua definição.", desc: "O termômetro do equilíbrio hormonal — e o freio invisível dos seus resultados.", img: ginecoImg },
  { to: "/tendencias/trembolona", kicker: "Anabolizantes", title: "🧬 Trembolona: arquitetura corporal no patamar de elite.", desc: "O segredo nunca foi a dose. É o manejo.", img: trembolonaImg },
  { to: "/tendencias/plato-metabolico", kicker: "Metabolismo", title: "Platô metabólico: por que o corpo para de responder.", desc: "Quando consistência vira repetição.", img: platoImg },
  { to: "/tendencias/gestrinona", kicker: "Hormonal feminino", title: "💊 Gestrinona: a molécula de tripla ação.", desc: "Densidade, secura e equilíbrio hormonal.", img: gestrinonaImg },
  { to: "/tendencias/glow-blend", kicker: "Regeneração", title: "✨ Glow Blend: o trio de peptídeos que faz o corpo brilhar.", desc: "BPC-157 + TB-500 + GHK-Cu.", img: glowImg },
  { to: "/tendencias/drostanolona-masteron", kicker: "DHT", title: "🧬 Drostanolona (Masteron): densidade e performance.", desc: "Os limites do uso feminino.", img: masteronImg },
  { to: "/tendencias/triade-intestino-hormonio", kicker: "Eixo intestinal", title: "🧬 Tríade SII, SOP e DRGE: o eixo intestino-hormônio.", desc: "Mesma raiz, três expressões.", img: triadeImg },
  { to: "/tendencias/cintura-estetica", kicker: "Estética", title: "⚡ A estética da cintura não é só genética.", desc: "Estrutura, estímulo e estratégia.", img: cinturaImg },
  { to: "/tendencias/subcutanea-estrategia", kicker: "Farmacocinética", title: "💉 IM → SubQ: a estratégia que mudou o jogo.", desc: "Estabilidade sérica e técnica de precisão.", img: subqImg },
  { to: "/tendencias/recomposicao-avancada", kicker: "Recomposição", title: "Recomposição corporal avançada.", desc: "Tirzepatida + estratégia anabólica.", img: glowImg },
  { to: "/tendencias/cenario-fitness-2026", kicker: "Cenário global", title: "O cenário atual do fitness global.", desc: "IFBB, FIBO Europe e o fim do conteúdo genérico.", img: platoImg },
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
        {/* Duas capas em destaque */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {articles.slice(0, 2).map((a, i) => (
            <motion.div
              key={a.to}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
            >
              <Link
                to={a.to}
                className="group relative block rounded-3xl overflow-hidden bg-card border border-border/40 hover:border-border transition-all duration-500 h-full"
              >
                <div className="aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-muted relative">
                  <img src={a.img} alt={a.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <p className="text-[10px] font-semibold tracking-[0.25em] text-primary uppercase mb-3">Em destaque</p>
                  <h3 className="text-lg sm:text-2xl font-semibold text-foreground tracking-tight leading-tight mb-2">{a.title}</h3>
                  <p className="text-sm text-muted-foreground font-light mb-4 line-clamp-2">{a.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
                    Ler matéria
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Grid secundário */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.slice(2).map((a, i) => (
            <motion.div
              key={a.to}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
            >
              <Link to={a.to} className="group block rounded-2xl overflow-hidden bg-card border border-border/40 hover:border-border transition-all duration-500">
                <div className="aspect-[16/10] overflow-hidden bg-muted">
                  <img src={a.img} alt={a.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" loading="lazy" />
                </div>
                <div className="p-5 sm:p-6">
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-2">{a.kicker}</p>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug tracking-tight mb-2 group-hover:text-primary transition-colors">{a.title}</h3>
                  <p className="text-sm text-muted-foreground font-light line-clamp-2">{a.desc}</p>
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
