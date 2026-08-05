import { Link } from "react-router-dom";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { Button } from "@/components/ui/button";
import { Salad, Dumbbell, LineChart, ShieldCheck, ArrowRight, Palette, ChevronRight, Sparkles, Activity, Apple } from "lucide-react";
import { AI_PLANS } from "@/hooks/useAiApp";
import AiLogoMark from "@/components/ai/AiLogoMark";
import AiIconOptions from "@/components/ai/AiIconOptions";
import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

const PILLARS = [
  {
    icon: Apple,
    title: "Cardápio Inteligente",
    subtitle: "Nutrição de Precisão",
    text: "Personalizado por objetivo, rotina e preferências. Inclui até 3 revisões por ciclo de 30 dias.",
    color: "text-red-500",
    bg: "bg-red-500/10"
  },
  {
    icon: Dumbbell,
    title: "Treino Periodizado",
    subtitle: "Biomecânica Avançada",
    text: "Musculação estruturada por nível e equipamentos. Inclui até 3 revisões por ciclo de 30 dias.",
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    icon: Activity,
    title: "Central de Análise",
    subtitle: "Metabolismo em Dados",
    text: "Histórico de exames, comparação de marcadores e análise inteligente de evolução.",
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
];

export default function AiLanding() {
  useSthAiTheme();
  const [showIconOptions, setShowIconOptions] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#000000] text-white selection:bg-primary/30">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent py-6"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-12">
          <Link to="/ai" className="group flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src="/logo-master-v1.png" className="relative h-9 w-9 rounded-lg" alt="STH AI Logo" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-lg font-bold tracking-tight">STH AI</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-primary/80 uppercase">Elite Engine</span>
            </div>
          </Link>

          <div className="flex items-center gap-4 lg:gap-8">
            <div className="hidden md:flex items-center gap-6">
              <Link to="/ai/sobre" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Tecnologia</Link>
              <Link to="#planos" onClick={(e) => {
                e.preventDefault();
                document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
              }} className="text-sm font-medium text-white/60 hover:text-white transition-colors">Planos</Link>
            </div>
            
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex text-white/70 hover:text-white hover:bg-white/5 rounded-full">
                <Link to="/ai/login">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-white text-black hover:bg-white/90 px-5 font-bold">
                <Link to="/ai/onboarding">Começar</Link>
              </Button>
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-primary transition-colors h-8 w-8" onClick={() => setShowIconOptions(!showIconOptions)}>
                <Palette className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Identity Study Modal Overlay */}
      <AnimatePresence>
        {showIconOptions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-primary">Identidade Visual Master</h2>
                  <p className="text-sm text-white/40">Conceito: Musculação, Nutrição e Análise integrados por IA</p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/5" onClick={() => setShowIconOptions(false)}>Fechar</Button>
              </div>
              <AiIconOptions />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
          {/* Animated Background Gradients */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
            <div className="absolute -left-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
            <div className="absolute -right-[10%] bottom-[20%] h-[600px] w-[600px] rounded-full bg-orange-500/5 blur-[120px]" />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 text-center"
          >
            <div className="mb-8 flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-tr from-primary/30 to-blue-500/30 blur-2xl opacity-50 transition-all duration-700 group-hover:opacity-80" />
                <div className="relative flex flex-col items-center rounded-[32px] border border-white/10 bg-black/40 p-8 backdrop-blur-xl transition-all duration-500 group-hover:border-primary/30">
                  <img src="/logo-master-v1.svg" className="h-24 w-24 mb-4" alt="STH AI Logo" />
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Neural Active</span>
                  </div>
                </div>
              </div>
            </div>

            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
              Inteligência que <br />
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
                constrói seu corpo.
              </span>
            </h1>
            
            <p className="mx-auto mt-8 max-w-2xl text-xl font-medium text-white/50 leading-relaxed sm:text-2xl">
              O futuro do STH METHOD agora é autônomo. <br className="hidden sm:block" />
              Nutrição, Treino e Análise em um só lugar.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-14 rounded-full bg-primary px-10 text-lg font-bold text-black shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95">
                <Link to="/ai/onboarding">Começar Agora</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-14 rounded-full border border-white/10 bg-white/5 px-10 text-lg font-bold text-white hover:bg-white/10">
                <Link to="/ai/instalar">Baixar o App</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Scroll to explore</span>
              <div className="h-12 w-px bg-gradient-to-b from-primary/50 to-transparent" />
            </div>
          </motion.div>
        </section>

        {/* Product Philosophy */}
        <section className="py-32 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-20 lg:grid-cols-2 lg:items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-4xl font-bold tracking-tight sm:text-6xl mb-8">
                  Sua evolução <br />
                  em tempo real.
                </h2>
                <div className="space-y-6">
                  <div className="group rounded-[32px] border border-white/5 bg-white/2 p-8 transition-all hover:border-white/10">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold">Lógica de Consultoria</h4>
                        <p className="mt-2 text-white/40 leading-relaxed">Não é apenas um gerador. É a metodologia STH METHOD codificada. O app entende seu progresso e recalibra cada variável automaticamente.</p>
                      </div>
                    </div>
                  </div>
                  <div className="group rounded-[32px] border border-white/5 bg-white/2 p-8 transition-all hover:border-white/10">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                        <LineChart className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold">Feedback Loop Contínuo</h4>
                        <p className="mt-2 text-white/40 leading-relaxed">Você responde, a IA aprende. Se o peso estagnar ou o cansaço aumentar, a periodização reage no próximo ciclo.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative aspect-square lg:aspect-auto lg:h-[600px]"
              >
                <div className="absolute inset-0 rounded-[48px] bg-gradient-to-tr from-primary/20 via-blue-500/10 to-transparent blur-3xl opacity-30" />
                <div className="relative h-full w-full rounded-[48px] border border-white/10 bg-[#0a0a0a] overflow-hidden flex items-center justify-center">
                   {/* Abstract Tech Visual */}
                   <div className="relative h-64 w-64">
                      <div className="absolute inset-0 rounded-full border border-primary/20 animate-spin-slow" />
                      <div className="absolute inset-8 rounded-full border border-blue-500/10 animate-spin-reverse" />
                      <div className="absolute inset-16 rounded-full border border-white/5 animate-spin-slow" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img src="/logo-master-v1.svg" className="h-20 w-20 shadow-2xl shadow-primary/40" alt="STH AI Logo" />
                      </div>
                   </div>
                   
                   {/* Floating Info Cards */}
                   <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-12 left-12 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-md"
                   >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500"><Apple className="h-4 w-4" /></div>
                        <div>
                          <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Plano Ativo</div>
                          <div className="text-xs font-bold">Déficit Metabólico</div>
                        </div>
                      </div>
                   </motion.div>

                   <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-12 right-12 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-md"
                   >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500"><Dumbbell className="h-4 w-4" /></div>
                        <div>
                          <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Próximo Treino</div>
                          <div className="text-xs font-bold">Push (Superior A)</div>
                        </div>
                      </div>
                   </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pillars Section */}
        <section className="py-32 bg-white/2">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-20 text-center">
              <motion.span 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-primary"
              >
                Integração Total
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl"
              >
                Três pilares. <br className="sm:hidden" /> Uma inteligência.
              </motion.h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {PILLARS.map((p, idx) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 + 0.2 }}
                  className="group relative overflow-hidden rounded-[40px] border border-white/5 bg-black p-10 transition-all hover:border-white/10"
                >
                  <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-[20px] ${p.bg} ${p.color}`}>
                    <p.icon className="h-7 w-7" />
                  </div>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{p.subtitle}</div>
                  <h3 className="mb-4 text-2xl font-bold">{p.title}</h3>
                  <p className="text-white/40 leading-relaxed">{p.text}</p>
                  
                  <div className="mt-8 flex items-center gap-2 text-sm font-bold text-white opacity-0 transition-all group-hover:opacity-100">
                    Saiba mais <ChevronRight className="h-4 w-4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="planos" className="py-32 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">Escolha seu plano.</h2>
              <p className="mt-6 text-xl text-white/50">Planos flexíveis para todos os objetivos.</p>
              
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="mt-12 inline-flex flex-col items-center gap-3 rounded-[32px] border border-primary/20 bg-primary/5 px-10 py-6 backdrop-blur-md"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Oferta de Lançamento Ativa</span>
                </div>
                <div className="text-4xl font-black tracking-tighter text-white">STH10AI</div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-widest text-center">10% OFF no Pix (Planos Semestral/Anual)</p>
              </motion.div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {AI_PLANS.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative flex flex-col justify-between overflow-hidden rounded-[40px] border p-10 transition-all hover:border-white/20 hover:bg-white/[0.04] ${
                    plan.id.includes('oferta') || plan.id.includes('fundador') 
                    ? 'border-primary/30 bg-primary/[0.04] shadow-2xl shadow-primary/5' 
                    : 'border-white/5 bg-white/2'
                  }`}
                >
                  {plan.id.includes('fundador') && (
                    <div className="absolute -right-14 top-8 rotate-45 bg-primary px-14 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-lg">
                      Founder
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{plan.label}</span>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-5xl font-bold tracking-tighter">{plan.price}</span>
                      <span className="text-sm font-medium text-white/30">/{plan.id.includes('anual') ? 'ano' : plan.id.includes('trimestral') ? 'trim' : 'mês'}</span>
                    </div>
                    <p className="mt-4 text-xs font-medium text-white/50 leading-relaxed uppercase tracking-widest">{plan.note}</p>
                    
                    <div className="mt-10 space-y-4">
                      {["Inteligência Biomecânica", "Nutrição de Precisão", "Central de Análise", "STH FOOD AI", "Suporte Wearables"].map((feat) => (
                        <div key={feat} className="flex items-center gap-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <ChevronRight className="h-3 w-3" />
                          </div>
                          <span className="text-sm font-medium text-white/70">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    asChild 
                    className={`mt-12 h-14 rounded-2xl text-lg font-bold transition-all ${
                      plan.id.includes('fundador') || plan.id.includes('oferta') 
                      ? 'bg-primary text-black hover:bg-primary/90' 
                      : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <Link to={`/ai/assinatura?plan=${plan.id}`}>Selecionar Plano</Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="py-24 px-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col md:flex-row items-center gap-10 rounded-[48px] border border-white/5 bg-white/2 p-12 backdrop-blur-xl">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] bg-primary/10 text-primary">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Compromisso Ético e Profissional</h3>
                <p className="text-white/40 leading-relaxed">
                  O STH METHOD AI foca exclusivamente em Nutrição e Treino. Protocolos terapêuticos e substâncias são discutidos apenas na consultoria personalizada. Segurança e ética acima de tudo.
                </p>
                <div className="mt-6 flex items-center gap-6">
                  <Link to="/ai/legal/termos-de-uso" className="text-xs font-bold text-primary/80 uppercase tracking-widest hover:text-primary transition-colors">Termos de Uso</Link>
                  <Link to="/ai/legal" className="text-xs font-bold text-primary/80 uppercase tracking-widest hover:text-primary transition-colors">Legal Doc</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            <AiLogoMark className="h-6 w-6" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">STH AI · 2026</span>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
            <Link to="/ai/sobre" className="hover:text-white transition-colors">Sobre</Link>
            <Link to="/ai/assinatura" className="hover:text-white transition-colors">Assinatura</Link>
            <Link to="/ai/instalar" className="hover:text-white transition-colors">Instalar</Link>
          </div>
          <p className="text-[10px] text-white/20">Designed for High Performance.</p>
        </div>
      </footer>
    </div>
  );
}