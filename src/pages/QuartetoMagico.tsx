import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home, CheckCircle2, Zap, Target, Activity, ClipboardList, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRef } from "react";

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
      ease: [0.16, 1, 0.3, 1] 
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
}: { number: string; kicker: string; title: string; image: string; alt: string; children: React.ReactNode; reverse?: boolean }) => (
  <motion.section
    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
    className="py-24 md:py-40 border-t border-border/40 overflow-hidden"
  >
    <div className={`max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-24 items-center ${reverse ? 'md:flex-row-reverse' : ''}`}>
      <div className={reverse ? 'md:order-2' : ''}>
        <p className="text-[11px] font-bold tracking-[0.3em] text-primary uppercase mb-6 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-primary/30"></span>
          {number} — {kicker}
        </p>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-8 leading-[1.1]">
          {title}
        </h2>
        <div className="space-y-6 text-lg md:text-xl leading-relaxed text-muted-foreground font-light">
          {children}
        </div>
      </div>
      <div className={`${reverse ? 'md:order-1' : ''} relative group`}>
        <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
        <div className="relative rounded-[2rem] overflow-hidden bg-muted aspect-[4/5] md:aspect-square shadow-2xl shadow-black/20">
          <img src={image} alt={alt} className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 ease-out" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
        </div>
      </div>
    </div>
  </motion.section>
);

const QuartetoMagico = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
  const backTo = isStudent ? "/dashboard" : "/tendencias";
  const BackIcon = isStudent ? Home : ArrowLeft;
  
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
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to={backTo} className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-white transition-colors">
            <BackIcon className="w-4 h-4" />
            <span>{isStudent ? "Início" : "STH News"}</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-[13px] font-bold tracking-tight uppercase">STH News Special</span>
          </div>
          {isStudent ? (
            <Link to="/dashboard"><Button size="sm" variant="ghost" className="text-[12px] h-8 rounded-full border border-white/10 hover:bg-white/5">Painel</Button></Link>
          ) : (
            <Link to="/cadastro"><Button size="sm" className="text-[12px] h-8 rounded-full bg-white text-black hover:bg-white/90">Começar Agora</Button></Link>
          )}
        </div>
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
                className="max-w-2xl mx-auto text-lg md:text-2xl text-zinc-400 font-light leading-relaxed mb-12"
              >
                Muitas pessoas acreditam que resultados vêm apenas da dieta. Outras apostam tudo no treino. Na STH, o resultado é matemática de precisão.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4">
                <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[13px] font-bold uppercase tracking-widest text-white">Protocolo</div>
                <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[13px] font-bold uppercase tracking-widest text-white">Dieta</div>
                <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[13px] font-bold uppercase tracking-widest text-white">Treino</div>
                <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[13px] font-bold uppercase tracking-widest text-white">Exames</div>
              </motion.div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Scroll para explorar</span>
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
              <p className="text-3xl md:text-5xl font-light leading-[1.3] text-zinc-200 tracking-tight italic">
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
          <div className="flex items-center gap-4 text-primary text-sm font-bold uppercase tracking-tighter">
            <Zap className="w-5 h-5" />
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
          <div className="flex items-center gap-4 text-primary text-sm font-bold uppercase tracking-tighter">
            <Target className="w-5 h-5" />
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
          <div className="flex items-center gap-4 text-primary text-sm font-bold uppercase tracking-tighter">
            <Activity className="w-5 h-5" />
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
          <div className="flex items-center gap-4 text-primary text-sm font-bold uppercase tracking-tighter">
            <ClipboardList className="w-5 h-5" />
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
                <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-[0.2em] mb-8">
                  Evolução STH Method 2026
                </div>
                <h2 className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-10 leading-[1.05]">
                  De Semaglutida <br />
                  <span className="text-zinc-500 italic">para a</span> <br />
                  <span className="text-primary">Retatrutida.</span>
                </h2>
                <div className="space-y-6 text-lg md:text-xl text-zinc-400 font-light leading-relaxed">
                  <p>A ciência evoluiu. Antigamente falávamos apenas em déficit calórico. Hoje, usamos ferramentas de <span className="text-white font-medium">terceira geração</span>.</p>
                  <p>A <span className="text-white font-medium">Retatrutida</span> (triplo agonista GLP-1/GIP/GCG) oferece controle glicêmico e saciedade sem precedentes no mercado atual.</p>
                  <p>Aliamos isso a <span className="text-white font-medium">Peptídeos de GH</span> (como Ipamorelin ou CJC-1295) para garantir que a queima de gordura ocorra preservando cada grama de massa muscular.</p>
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
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Performance</span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Resultados reais acontecem quando existe método. Ciência, estratégia e constância.
                  </p>
                </div>
              </motion.div>
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
              className="text-lg text-zinc-500 font-light"
            >
              Entregamos a estratégia completa para a sua transformação.
            </motion.p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="p-10 rounded-[2.5rem] bg-zinc-900/50 border border-white/5 flex flex-col"
            >
              <h3 className="text-2xl font-bold text-zinc-500 mb-8 uppercase tracking-widest">O Caminho Comum</h3>
              <ul className="space-y-6">
                {["Apenas Dieta restritiva", "Treino sem acompanhamento", "Zero monitoramento hormonal", "Protocolos genéricos", "Resultados temporários"].map((item) => (
                  <li key={item} className="flex items-center gap-4 text-zinc-600 line-through decoration-zinc-700">
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
                  <li key={item} className="flex items-center gap-4 text-zinc-200">
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
            <motion.p variants={fadeUp} className="max-w-xl mx-auto text-xl text-zinc-400 font-light mb-16 leading-relaxed">
              Descubra o que o Quarteto Mágico pode fazer pelo seu projeto hoje mesmo. Resultados reais não acontecem por acaso.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col md:flex-row items-center justify-center gap-6">
              {!isStudent && (
                <Link to="/cadastro">
                  <Button size="lg" className="rounded-full bg-primary text-black hover:bg-white transition-all duration-300 px-12 h-16 text-lg font-bold shadow-xl shadow-primary/20 group">
                    QUERO MEU PROJETO 
                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
              <Link to="/tendencias">
                <Button variant="outline" size="lg" className="rounded-full border-white/10 hover:bg-white/5 px-10 h-16 text-zinc-400">
                  Ver outros artigos
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
            <p className="max-w-md text-sm text-zinc-500 font-light leading-relaxed">
              Ciência, estratégia e constância para transformar vidas. <br />
              Onde o impossível encontra o método.
            </p>
          </div>
          <div className="text-left md:text-right">
             <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-[0.3em]">
               © 2026 STH Method. Todos os direitos reservados.
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QuartetoMagico;