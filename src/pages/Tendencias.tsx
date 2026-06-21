import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import restauracaoImg from "@/assets/sthnews-atrofia-hero.jpg";
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
import tirzeImg from "@/assets/sthnews-tirzepatida-hero.jpg";
import tirzeDesmameImg from "@/assets/sthnews-tirzepatida-desmame-hero.jpg";
import carbsImg from "@/assets/sthnews-carbs-hero.jpg";
import proteinaImg from "@/assets/sthnews-proteina-hero.jpg";
import oleosImg from "@/assets/sthnews-oleos-sementes-hero.jpg";
import ultraImg from "@/assets/sthnews-ultraprocessados-hero.jpg";
import marcadoresImg from "@/assets/sthnews-marcadores-hero.jpg";
import ghkcuImg from "@/assets/sthnews-ghkcu-hero.jpg";
import hipertensaoImg from "@/assets/sthnews-hipertensao-hero.jpg";
import colateraisImg from "@/assets/sthnews-tirzepatida-colaterais-hero.jpg";
import clenbuterolImg from "@/assets/sthnews-clenbuterol-hero.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const articles = [
  { to: "/tendencias/tirzepatida-desmame", kicker: "Tirzepatida & manutenção", title: "💉 O desmame da tirzepatida: quando a caneta acaba, o verdadeiro desafio começa.", desc: "Emagrecer é apenas a primeira etapa. A manutenção dos resultados depende dos hábitos construídos durante o tratamento.", img: tirzeDesmameImg },
  { to: "/tendencias/clenbuterol", kicker: "Termogênese & risco", title: "🔥 Clenbuterol: o termogênico mais poderoso ou uma bomba-relógio cardiovascular?", desc: "Mecanismo beta-2 adrenérgico, perda de gordura acelerada e o preço fisiológico que o coração paga.", img: clenbuterolImg },
  { to: "/tendencias/restauracao-muscular", kicker: "Reabilitação hormonal", title: "O músculo lembra: restaurando o físico após 10 anos de hormônios", desc: "Memória miotonuclear, reset do eixo HPT e o caminho real para reverter atrofia crônica.", img: restauracaoImg },
  { to: "/tendencias/quarteto-magico", kicker: "Edição Especial 2026", title: "🪄 O Quarteto Mágico: Retatrutida & Peptídeos.", desc: "Por que dieta e treino sozinhos são obsoletos. A nova ciência da sinergia entre Protocolo, GH Peptides e Exames de precisão.", img: triadeImg },
  { to: "/tendencias/hipertensao-arterial", kicker: "Cardiovascular", title: "🫀 Hipertensão Arterial: o tratado tático completo.", desc: "Classificação, fisiopatologia, diagnóstico diferencial e conduta medicamentosa, suplementar e comportamental.", img: hipertensaoImg },
  { to: "/tendencias/tirzepatida-colaterais", kicker: "Tirzepatida & manejo", title: "💊 Tirzepatida: mapa tático completo dos colaterais.", desc: "Do arroto sulfúrico à pancreatite — cada sintoma cruzado com solução medicamentosa, suplementar e comportamental.", img: colateraisImg },
  { to: "/tendencias/ghk-cu", kicker: "Peptídeos", title: "🧬 GHK-Cu: o peptídeo-cobre sem perfume de vendedor.", desc: "O que a literatura sustenta sobre o tripeptídeo-cobre — e onde o marketing força a barra.", img: ghkcuImg },
  { to: "/tendencias/marcadores-laboratoriais", kicker: "Guia técnico", title: "🧪 Marcadores laboratoriais: o guia técnico completo.", desc: "Painéis essenciais, recomendados e avançados — leitura clínica acima do achismo.", img: marcadoresImg },
  { to: "/tendencias/ultraprocessados-saude-mental", kicker: "Mitos nutricionais", title: "🧠 Ultraprocessados não estão destruindo magicamente sua saúde mental.", desc: "Existe associação. Mas associação não é causa — o ecossistema alimentar inteiro é o que pesa.", img: ultraImg },
  { to: "/tendencias/oleos-sementes", kicker: "Mitos nutricionais", title: "🌻 Você foi enganado sobre os óleos de sementes.", desc: "Sozinhos, não são automaticamente inflamatórios. O ecossistema alimentar é o que pesa.", img: oleosImg },
  { to: "/tendencias/proteina-superavit", kicker: "Proteína & superávit", title: "🥩 Proteína em excesso não engorda como você pensa.", desc: "Superávit calórico via proteína em treinados: TEF, NEAT e particionamento de nutrientes reescrevendo a equação.", img: proteinaImg },
  { to: "/tendencias/carboidratos-hipertrofia", kicker: "Nutrição & hipertrofia", title: "🍞 Carboidratos não constroem músculo: o que diz a meta-análise de 2026.", desc: "Proteína e calorias mandam. Carbo é performance, não gatilho direto.", img: carbsImg },
  { to: "/tendencias/tirzepatida-hipertrofia", kicker: "Tirzepatida & hipertrofia", title: "💉 Tirzepatida e hipertrofia: o protocolo que preserva massa magra.", desc: "GLP-1 + GIP, andrógenos como proteção tecidual e o déficit feito do jeito certo.", img: tirzeImg },
  { to: "/tendencias/hormonios-bf-alto", kicker: "Hormonal & metabólico", title: "🧬 Hormônio com BF alto: o fim do mito.", desc: "Não é proibido — é cirúrgico. Exames acima do medo.", img: bfAltoImg },
  { to: "/tendencias/ginecomastia", kicker: "Hormonal masculino", title: "🧬 Ginecomastia: o caroço silencioso que trava sua definição.", desc: "O termômetro do equilíbrio hormonal — e o freio invisível dos seus resultados.", img: ginecoImg },
  { to: "/tendencias/trembolona", kicker: "Anabolizantes", title: "🧬 Trembolona: arquitetura corporal no patamar de elite.", desc: "O segredo nunca foi a dose. É o manejo.", img: trembolonaImg },
  { to: "/tendencias/plato-metabolico", kicker: "Metabolismo", title: "Platô metabólico: por que o corpo para de responder.", desc: "Quando consistência vira repetição.", img: platoImg },
  { to: "/tendencias/gestrinona", kicker: "Hormonal feminino", title: "💊 Gestrinona: a molécula de tripla ação.", desc: "Densidade, secura e equilíbrio hormonal.", img: gestrinonaImg },
  { to: "/tendencias/glow-blend", kicker: "Regeneração", title: "✨ Glow Blend: o trio de peptídeos que faz o corpo brilhar.", desc: "BPC-157 + TB-500 + GHK-Cu.", img: glowImg },
  { to: "/tendencias/drostanolona-masteron", kicker: "DHT", title: "🧬 Drostanolona (Masteron): densidade e performance.", desc: "Os limites do uso feminino.", img: masteronImg },
  { to: "/tendencias/drostanolona-tecnica", kicker: "Análise técnica", title: "🧪 Drostanolona: análise farmacológica completa.", desc: "Mecanismo, farmacocinética, toxicidade e o veredito STH METHOD.", img: masteronImg },
  { to: "/tendencias/triade-intestino-hormonio", kicker: "Eixo intestinal", title: "🧬 Tríade SII, SOP e DRGE: o eixo intestino-hormônio.", desc: "Mesma raiz, três expressões.", img: triadeImg },
  { to: "/tendencias/cintura-estetica", kicker: "Estética", title: "⚡ A estética da cintura não é só genética.", desc: "Estrutura, estímulo e estratégia.", img: cinturaImg },
  { to: "/tendencias/subcutanea-estrategia", kicker: "Farmacocinética", title: "💉 IM → SubQ: a estratégia que mudou o jogo.", desc: "Estabilidade sérica e técnica de precisão.", img: subqImg },
  { to: "/tendencias/recomposicao-avancada", kicker: "Recomposição", title: "Recomposição corporal avançada.", desc: "Tirzepatida + estratégia anabólica.", img: glowImg },
  { to: "/tendencias/cenario-fitness-2026", kicker: "Cenário global", title: "O cenário atual do fitness global.", desc: "IFBB, FIBO Europe e o fim do conteúdo genérico.", img: platoImg },
];

const Tendencias = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/como-funciona", label: "Como Funciona" },
    { href: "/tendencias", label: "STH News" },
    { href: "/questionario", label: "Macros" },
    { href: "/triagem-marcadores", label: "Triagem" },
    { href: "/diario-alimentar", label: "Diário" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md">
            <span className="text-[13px] font-semibold tracking-tight text-foreground">STH METHOD</span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden lg:flex items-center gap-7 text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`${
                    isActive ? "text-primary font-bold" : "hover:text-foreground"
                  } transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-8 rounded-sm`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full">
              <Button size="sm" className="text-[11px] h-7 rounded-full bg-foreground text-background hover:bg-foreground/90">Acessar</Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-full hover:bg-muted/50 transition-colors text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação mobile"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden border-t border-border/50 overflow-hidden bg-background/95 backdrop-blur-xl"
            >
              <nav className="px-5 py-6 flex flex-col gap-2">
                {[
                  ...navLinks,
                  { href: "/login", label: "Acessar Conta" },
                ].map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`py-4 px-4 rounded-xl transition-all duration-200 uppercase tracking-widest text-[11px] font-bold flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {item.label}
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
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
        {/* Grid unificado */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((a, i) => (
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
