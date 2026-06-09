import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Home, CheckCircle2, Zap, Target, Activity, ClipboardList, TrendingUp, Beaker, ShieldCheck, Microscope, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRef, useEffect, useState } from "react";


// Assets
import heroImg from "@/assets/sthnews-triade-glass-1.jpg";
import sinergiaImg from "@/assets/sthnews-triade-glass-2.jpg";
import examesImg from "@/assets/sthnews-marcadores-hero.jpg";
import protocoloImg from "@/assets/sthnews-subq-hero.jpg";
import vereditoImg from "@/assets/sthnews-recomposicao-corporal.jpg";
import strategyImg from "@/assets/sthnews-triade-glass-6.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1] as any
    } 
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const Section = ({
  number, kicker, title, image, alt, children, reverse = false
}: { number: string; kicker: string; title: string; image: string; alt: string; children: React.ReactNode; reverse?: boolean }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [-100, 100]);

  return (
    <motion.section
      ref={ref}
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
      className="py-24 md:py-40 border-t border-border/40 overflow-hidden"
    >
      <div className={`max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-24 items-center ${reverse ? 'md:flex-row-reverse' : ''}`}>
        <div className={reverse ? 'md:order-2' : ''}>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/45 px-4 py-2 text-[12px] font-extrabold tracking-[0.18em] text-white uppercase mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-md">
            <span className="w-8 h-[1px] bg-primary"></span>
            {number} — {kicker}
          </p>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
            {title}
          </h2>
          <div className="space-y-6 text-lg md:text-xl leading-relaxed text-white font-medium">
            {children}
          </div>
        </div>
        <div className={`${reverse ? 'md:order-1' : ''} relative group h-[500px] md:h-[600px]`}>
          <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
          <div className="relative h-full w-full rounded-[2rem] overflow-hidden bg-muted shadow-2xl shadow-black/20">
            <motion.img 
              src={image} alt={alt} 
              style={{ y }}
              className="absolute inset-0 w-full h-[120%] object-cover" 
              loading="lazy" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

const QuartetoMagico = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
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
  
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const textY = useTransform(scrollYProgress, [0, 0.3], [0, 100]);

  return (
    <div className="min-h-screen bg-[#050505] text-foreground antialiased selection:bg-primary selection:text-white">
      <header className="fixed top-0 inset-x-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md">
            <span className="text-[13px] font-semibold tracking-tight text-white">STH METHOD</span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden lg:flex items-center gap-7 text-[11px] text-zinc-300 uppercase tracking-[0.15em] font-semibold">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`${
                    isActive ? "text-white font-bold" : "hover:text-white/80"
                  } transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-8 rounded-sm`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full">
              <Button size="sm" className="text-[11px] h-7 rounded-full bg-white text-black hover:bg-white/90">Acessar</Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-full hover:bg-white/5 transition-colors text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu-dark"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu-dark"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação mobile"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden border-t border-white/5 overflow-hidden bg-black/95 backdrop-blur-xl"
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
                          ? "bg-white/10 text-white" 
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
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

      <main ref={targetRef}>
        {/* Hero Section */}
        <section className="relative h-[90vh] flex items-center justify-center overflow-hidden pt-20">
          <motion.div 
            style={{ opacity, scale }}
            className="absolute inset-0 z-0"
          >
            <img src={heroImg} alt="Quarteto Mágico Hero" className="w-full h-full object-cover opacity-40 grayscale-[0.5]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#050505]"></div>
          </motion.div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <motion.div
              style={{ y: textY }}
              initial="hidden" animate="visible" variants={staggerContainer}
            >
              <motion.p variants={fadeUp} className="text-[13px] font-bold tracking-[0.4em] uppercase text-primary mb-8 flex items-center justify-center gap-3">
                <span className="w-12 h-[1px] bg-primary"></span>
                Conceito Exclusivo STH Method
                <span className="w-12 h-[1px] bg-primary"></span>
              </motion.p>
              <motion.h1 
                variants={fadeUp}
                className="text-5xl md:text-8xl lg:text-9xl font-black tracking-[-0.05em] leading-[0.9] text-white mb-10"
              >
                O QUARTETO <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary/40">MÁGICO</span>
              </motion.h1>
              <motion.p 
                variants={fadeUp}
                className="max-w-2xl mx-auto text-lg md:text-2xl text-white font-medium leading-relaxed mb-12"
              >
                Muitas pessoas acreditam que resultados vêm apenas da dieta. Outras apostam tudo no treino. Na STH, o resultado é matemática de precisão.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4">
                <div className="min-w-[140px] px-6 py-3 rounded-full bg-black/55 border border-white/20 backdrop-blur-xl text-[14px] font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_12px_32px_rgba(0,0,0,0.34)] text-center">Protocolo</div>
                <div className="min-w-[140px] px-6 py-3 rounded-full bg-black/55 border border-white/20 backdrop-blur-xl text-[14px] font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_12px_32px_rgba(0,0,0,0.34)] text-center">Dieta</div>
                <div className="min-w-[140px] px-6 py-3 rounded-full bg-black/55 border border-white/20 backdrop-blur-xl text-[14px] font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_12px_32px_rgba(0,0,0,0.34)] text-center">Treino</div>
                <div className="min-w-[140px] px-6 py-3 rounded-full bg-black/55 border border-white/20 backdrop-blur-xl text-[14px] font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_12px_32px_rgba(0,0,0,0.34)] text-center">Exames</div>
              </motion.div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">Scroll para explorar</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent"></div>
          </motion.div>
        </section>

        {/* Introduction Quote */}
        <section className="py-24 md:py-40 px-6 bg-[#050505]">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="relative"
            >
              <span className="absolute -top-20 -left-10 text-[200px] font-serif text-white/5 leading-none select-none">"</span>
              <p className="text-3xl md:text-5xl font-medium leading-[1.3] text-white tracking-tight italic">
                Nenhum desses pilares funciona em sua <span className="text-white font-medium not-italic">máxima capacidade sozinho.</span> Quando eles trabalham em sinergia, o resultado deixa de ser uma aposta e vira ciência pura.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pillar 01 - Protocolo */}
        <Section 
          number="01" kicker="Protocolo" title="O Acelerador Inteligente."
          image={protocoloImg} alt="Inteligência Química"
        >
          <p>Não é sobre "tomar algo", é sobre <span className="text-white font-semibold">otimização de receptores</span> e construção de um ambiente anabólico favorável.</p>
          <p>O protocolo STH é desenhado para potencializar cada grama de músculo e acelerar o metabolismo lipídico, garantindo que o seu esforço seja multiplicado pela química da eficiência.</p>
          <div className="flex items-center gap-4 text-white text-sm font-bold uppercase tracking-tighter">
            <Zap className="w-5 h-5 text-primary" />
            Sinergia de Compostos de Alta Performance
          </div>
        </Section>

        {/* Pillar 02 - Dieta */}
        <Section 
          number="02" kicker="Dieta" title="A Fundação Inegociável."
          image={sinergiaImg} alt="Nutrição de Precisão" reverse
        >
          <p>O combustível e o material de construção. Na STH, a dieta é ajustada para a sua <span className="text-white font-semibold">taxa metabólica real</span>, não baseada em fórmulas genéricas de internet.</p>
          <p>Entregamos estratégias de ciclagem de carboidratos e manipulação de insulina que permitem comer com prazer enquanto o corpo derrete gordura.</p>
          <div className="flex items-center gap-4 text-white text-sm font-bold uppercase tracking-tighter">
            <Target className="w-5 h-5 text-primary" />
            Ajuste Metabólico Individualizado
          </div>
        </Section>

        {/* Pillar 03 - Treino */}
        <Section 
          number="03" kicker="Treino" title="O Arquiteto da Estética."
          image={strategyImg} alt="Treinamento Guiado"
        >
          <p>Sem o estímulo mecânico correto, a sinalização para hipertrofia não acontece. O treino é o que diz ao corpo <span className="text-white font-semibold">onde construir</span>.</p>
          <p>Com nosso aplicativo exclusivo e vídeos guiados, garantimos que cada série tenha a intensidade e a técnica necessárias para esculpir o físico dos sonhos.</p>
          <div className="flex items-center gap-4 text-white text-sm font-bold uppercase tracking-tighter">
            <Activity className="w-5 h-5 text-primary" />
            Sinalização Mecânica de Precisão
          </div>
        </Section>

        {/* Pillar 04 - Exames */}
        <Section 
          number="04" kicker="Exames" title="O GPS da sua Saúde."
          image={examesImg} alt="Monitoramento Clínico" reverse
        >
          <p>O mapa do tesouro. Eles dizem exatamente onde você está e para onde podemos ir com total <span className="text-white font-semibold">segurança e controle</span>.</p>
          <p>Monitoramos marcadores de inflamação, perfil lipídico e saúde hepática em tempo real. A saúde é o que permite a constância do seu projeto.</p>
          <div className="flex items-center gap-4 text-white text-sm font-bold uppercase tracking-tighter">
            <ClipboardList className="w-5 h-5 text-primary" />
            Monitoramento Clínico Contínuo
          </div>
        </Section>

        {/* Evolution Section: Retatrutida & Peptides */}
        <section className="py-24 md:py-48 px-6 bg-gradient-to-b from-[#050505] via-zinc-900 to-black relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              >
                <div className="inline-block px-4 py-2 rounded-full bg-black/55 border border-primary/35 text-white text-[11px] font-extrabold uppercase tracking-[0.2em] mb-8 shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-md">
                  Evolução STH Method 2026
                </div>
                <h2 className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-10 leading-[1.05]">
                  De Semaglutida <br />
                  <span className="text-zinc-100 italic">para a</span> <br />
                  <span className="text-white [text-shadow:0_0_22px_rgba(255,255,255,0.18)]">Retatrutida.</span>
                </h2>
                <div className="space-y-6 text-lg md:text-xl text-white font-semibold leading-relaxed">
                  <p>A ciência evoluiu. Antigamente falávamos apenas em déficit calórico. Hoje, usamos ferramentas de <span className="text-white font-extrabold">terceira geração</span>.</p>
                  <p>A <span className="text-white font-extrabold">Retatrutida</span> (triplo agonista GLP-1/GIP/GCG) oferece controle glicêmico e saciedade sem precedentes no mercado atual.</p>
                  <p>Aliamos isso a <span className="text-white font-extrabold">Peptídeos de GH</span> (como Ipamorelin ou CJC-1295) para garantir que a queima de gordura ocorra preservando cada grama de massa muscular.</p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: "easeOut" }}
                className="relative"
              >
                <div className="aspect-square rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl">
                  <img src={vereditoImg} alt="Retatrutida Progress" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
                </div>
                {/* Floating Stats Card */}
                <div className="absolute -bottom-6 -left-6 bg-black/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-[280px]">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="text-primary w-6 h-6" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-100">Performance</span>
                  </div>
                  <p className="text-sm text-white font-medium leading-relaxed">
                    Resultados reais acontecem quando existe método. Ciência, estratégia e constância.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Evidence/Scientific Support Section (Banca) */}
        <section className="py-24 md:py-40 px-6 bg-[#0a0a0a] border-y border-white/5 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white mb-6 uppercase">
                A BANCA <span className="text-primary italic">CIENTÍFICA.</span>
              </h2>
              <p className="max-w-2xl mx-auto text-xl text-white font-medium">
                Não trabalhamos com promessas, trabalhamos com literatura e evidência clínica.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Microscope,
                  title: "Triplo Agonismo",
                  desc: "A transição para a Retatrutida não é moda, é o aproveitamento do efeito sinérgico nos receptores GLP-1, GIP e Glucagon para termogênese máxima."
                },
                {
                  icon: Beaker,
                  title: "Farmacocinética",
                  desc: "Ajustamos a meia-vida dos compostos para garantir estabilidade anabólica, evitando picos que geram colaterais indesejados."
                },
                {
                  icon: ShieldCheck,
                  title: "Segurança Ativa",
                  desc: "Protocolos cardioprotetores e hepatoprotetores integrados. O resultado só é sustentável se a máquina estiver preservada."
                }
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="p-10 rounded-3xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] transition-colors group"
                >
                  <item.icon className="w-12 h-12 text-primary mb-8 group-hover:scale-110 transition-transform duration-500" />
                  <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-white font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>


        {/* Comparison Section: "Apenas Dieta" vs "STH Method" */}
        <section className="py-24 md:py-40 px-6 bg-black">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <motion.h2 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="text-3xl md:text-6xl font-bold tracking-tight text-white mb-6"
            >
              Não entregamos apenas uma dieta.
            </motion.h2>
            <motion.p 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="text-lg text-zinc-300 font-light"
            >
              Entregamos a estratégia completa para a sua transformação.
            </motion.p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="p-10 rounded-[2.5rem] bg-zinc-900/50 border border-white/5 flex flex-col"
            >
              <h3 className="text-2xl font-bold text-zinc-300 mb-8 uppercase tracking-widest">O Caminho Comum</h3>
              <ul className="space-y-6">
                {["Apenas Dieta restritiva", "Treino sem acompanhamento", "Zero monitoramento hormonal", "Protocolos genéricos", "Resultados temporários"].map((item) => (
                  <li key={item} className="flex items-center gap-4 text-zinc-400 line-through decoration-zinc-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="p-10 rounded-[2.5rem] bg-primary/10 border border-primary/20 flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <div className="px-3 py-1 rounded-full bg-primary text-[10px] font-bold text-black uppercase tracking-widest">Premium</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-8 uppercase tracking-widest">STH Method</h3>
              <ul className="space-y-6">
                {[
                  "Estratégia Nutricional Dinâmica", 
                  "Treino guiado por aplicativo", 
                  "Protocolo inteligente e seguro", 
                  "Suporte ativo 24/7", 
                  "Interpretação de exames por especialistas",
                  "Ajustes contínuos mensais"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-4 text-white font-medium">
                    <CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* CTA Conversion Section */}
        <section className="py-32 md:py-56 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -z-10 blur-3xl rounded-full scale-150 opacity-20"></div>
          
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2 variants={fadeUp} className="text-5xl md:text-9xl font-black tracking-[-0.04em] leading-[0.9] text-white mb-10">
              ESCOLHA SEU <br />
              <span className="text-primary italic">PLANO.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="max-w-xl mx-auto text-xl text-white font-medium mb-16 leading-relaxed">
              Descubra o que o Quarteto Mágico pode fazer pelo seu projeto hoje mesmo. Resultados reais não acontecem por acaso.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col md:flex-row items-center justify-center gap-6">
              {!isStudent && (
                <Link to="/cadastro">
                  <Button size="lg" className="rounded-full bg-white text-black hover:scale-105 transition-all duration-300 px-12 h-20 text-xl font-black shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)] group">
                    QUERO MEU PROJETO 
                    <ArrowLeft className="w-6 h-6 ml-3 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
              <Link to="/tendencias">
                <Button variant="outline" size="lg" className="rounded-full border-white/20 hover:bg-white/5 px-10 h-20 text-zinc-100 font-medium">
                  Explorar STH News
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-16 px-6 bg-black">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <h4 className="text-xl font-bold tracking-tight text-white mb-4">STH Method</h4>
            <p className="max-w-md text-sm text-zinc-300 font-light leading-relaxed">
              Ciência, estratégia e constância para transformar vidas. <br />
              Onde o impossível encontra o método.
            </p>
          </div>
          <div className="text-left md:text-right">
             <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
               © 2026 STH Method. Todos os direitos reservados.
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QuartetoMagico;