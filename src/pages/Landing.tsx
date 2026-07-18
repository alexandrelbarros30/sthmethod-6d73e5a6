import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import heroBgFallback from "@/assets/hero-clients.jpg";
import marketingLaunchHero from "@/assets/marketing-launch-hero.png";
import { Button } from "@/components/ui/button";
import { Menu, X, Calculator, Sparkles } from "lucide-react";
import { FlaskConical, ArrowUpRight } from "lucide-react";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ResultsSection from "@/components/landing/ResultsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PlansSection from "@/components/landing/PlansSection";
import EthicsSection from "@/components/landing/EthicsSection";
import EvolutionsSection from "@/components/landing/EvolutionsSection";
import BMICalculatorSection from "@/components/landing/BMICalculatorSection";
import FoodGuideSection from "@/components/landing/FoodGuideSection";
import NutritionQuizSection from "@/components/landing/NutritionQuizSection";
import MealPlanSection from "@/components/landing/MealPlanSection";
import BodySimulatorSection from "@/components/landing/BodySimulatorSection";
import EvolutionGeneratorSection from "@/components/landing/EvolutionGeneratorSection";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import AppleHighlightsSection from "@/components/landing/AppleHighlightsSection";
import { useLandingSettings, useLandingSections } from "@/hooks/useLandingData";

const sectionComponents: Record<string, React.ReactNode> = {
  how_it_works: <HowItWorksSection key="how_it_works" />,
  results: <ResultsSection key="results" />,
  evolutions: <EvolutionsSection key="evolutions" />,
  testimonials: <TestimonialsSection key="testimonials" />,
  plans: <PlansSection key="plans" />,
  ethics: <EthicsSection key="ethics" />,
  bmi_calculator: <BMICalculatorSection key="bmi_calculator" />,
  food_guide: <FoodGuideSection key="food_guide" />,
  nutrition_quiz: <NutritionQuizSection key="nutrition_quiz" />,
  meal_plan: <MealPlanSection key="meal_plan" />,
  body_simulator: <BodySimulatorSection key="body_simulator" />,
};

const Landing = () => {
  const { data: settings } = useLandingSettings();
  const { data: sections } = useLandingSections();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for navbar background
  useEffect(() => {
    const handleNavScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleNavScroll, { passive: true });
    handleNavScroll();
    return () => window.removeEventListener("scroll", handleNavScroll);
  }, []);



  const showPopup = useCallback(() => {
    if (!popupDismissed) setPopupOpen(true);
  }, [popupDismissed]);

  const dismissPopup = () => {
    setPopupOpen(false);
    setPopupDismissed(true);
  };

  // Timer trigger: 10 seconds
  useEffect(() => {
    const timer = setTimeout(showPopup, 10000);
    return () => clearTimeout(timer);
  }, [showPopup]);

  // Scroll trigger: 40% of page
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent >= 0.4) showPopup();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showPopup]);

  // Exit intent trigger (mouse leaves viewport top)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) showPopup();
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [showPopup]);

  const s = (key: string, fallback = "") => settings?.find((x) => x.key === key)?.value || fallback;

  const logoUrl = s("logo_url");
  const logoSize = parseInt(s("logo_size", "48"));
  const bgImageUrl = s("bg_image_url");
  const bgEnabled = s("bg_enabled", "true") === "true";
  const bgOpacity = parseFloat(s("bg_opacity", "0.25"));

  // Apply dynamic colors
  useEffect(() => {
    const root = document.documentElement;
    const ph = s("color_primary_h"), ps = s("color_primary_s"), pl = s("color_primary_l");
    const ah = s("color_accent_h"), as_ = s("color_accent_s"), al = s("color_accent_l");
    const bh = s("color_background_h"), bs = s("color_background_s"), bl = s("color_background_l");

    if (ph) {
      root.style.setProperty("--primary", `${ph} ${ps}% ${pl}%`);
      root.style.setProperty("--ring", `${ph} ${ps}% ${pl}%`);
      root.style.setProperty("--gradient-start", `${ph} ${ps}% ${pl}%`);
      root.style.setProperty("--glow", `${ph} ${ps}% ${pl}%`);
      root.style.setProperty("--sidebar-primary", `${ph} ${ps}% ${pl}%`);
    }
    if (ah) {
      root.style.setProperty("--accent", `${ah} ${as_}% ${al}%`);
      root.style.setProperty("--gradient-end", `${ah} ${as_}% ${al}%`);
    }
    // NÃO sobrescrever --background: a landing usa o tema Apple light
    // (branco) controlado por usePublicAppleTheme. Cores de fundo do banco
    // são ignoradas para preservar o estilo apple.com.

    return () => {
      // Reset on unmount
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--gradient-start");
      root.style.removeProperty("--glow");
      root.style.removeProperty("--sidebar-primary");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--gradient-end");
      root.style.removeProperty("--background");
    };
  }, [settings]);
  const heroTitle = s("hero_title", "Transforme seu corpo com ciência, estratégia e acompanhamento real.");
  const heroSubtitle = s("hero_subtitle", "Consultoria online personalizada para quem busca emagrecimento, definição, saúde hormonal e evolução no shape.");
  const ctaText = s("hero_cta_text", "Quero evoluir meu shape");
  const ctaLink = s("hero_cta_link", "/login");
  const cta2Text = s("hero_cta2_text", "Conhecer os planos");
  const cta2Link = s("hero_cta2_link", "#planos");

  const stats = [
    { value: s("hero_stat1_value", "12k+"), label: s("hero_stat1_label", "Alunos ativos") },
    { value: s("hero_stat2_value", "98%"), label: s("hero_stat2_label", "Satisfação") },
    { value: s("hero_stat3_value", "340+"), label: s("hero_stat3_label", "Transformações") },
  ];

  const ctaFinalTitle = s("cta_final_title", "Seu corpo não muda sozinho.");
  const ctaFinalSubtitle = s("cta_final_subtitle", "Com método e acompanhamento, muda de verdade.");
  const ctaFinalBtn1Text = s("cta_final_btn1_text", "Começar agora");
  const ctaFinalBtn1Link = s("cta_final_btn1_link", "/login");
  const ctaFinalBtn2Text = s("cta_final_btn2_text", "Falar com a consultoria");
  const ctaFinalBtn2Link = s("cta_final_btn2_link", "https://wa.me/");

  const activeSections = sections?.filter((sec) => sec.active).sort((a, b) => a.sort_order - b.sort_order) ?? [];

  const bgSrc = bgEnabled && bgImageUrl ? bgImageUrl : heroBgFallback;

  const isInternal = (link: string) => link.startsWith("/") || link.startsWith("#");

  const LinkOrA = ({ to, children, ...props }: { to: string; children: React.ReactNode; [k: string]: any }) => {
    if (to.startsWith("#")) return <a href={to} {...props}>{children}</a>;
    if (isInternal(to)) return <Link to={to} {...props}>{children}</Link>;
    return <a href={to} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-background/80 backdrop-blur-2xl border-b border-border/40' : 'bg-transparent'}`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ height: `${logoSize}px` }} className="object-contain" />
            ) : (
              <span className="text-[13px] font-semibold tracking-tight text-foreground">STH METHOD</span>
            )}
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-7 text-[12px] text-muted-foreground uppercase tracking-widest font-semibold">
            <Link to="/como-funciona" className="hover:text-foreground transition-colors">Como Funciona</Link>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <Link to="/tendencias" className="hover:text-foreground transition-colors">STH News</Link>
            <a href="#resultados" className="hover:text-foreground transition-colors">Resultados</a>
            <Link to="/questionario" className="hover:text-foreground transition-colors">Macros</Link>
            <Link to="/triagem-marcadores" className="hover:text-foreground transition-colors">Triagem</Link>
            <Link to="/diario-alimentar" className="hover:text-foreground transition-colors">Diário</Link>
            <Link to="/baixar-app" className="hover:text-foreground transition-colors">Baixar App</Link>
            <Link to="/sobre" className="hover:text-foreground transition-colors">Novidades</Link>
          </div>

          {/* Right side: CTA + hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/free">
              <Button size="sm" variant="ghost" className="text-[11px] h-7 rounded-full hidden sm:inline-flex">Free</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="text-[11px] h-7 rounded-full bg-foreground text-background hover:bg-foreground/90">Acessar</Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-full hover:bg-muted/50 transition-colors text-foreground"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden border-t border-border/50 overflow-hidden bg-background/95 backdrop-blur-xl"
            >
              <div className="px-5 py-4 flex flex-col gap-1 text-sm max-h-[70vh] overflow-y-auto">
                {[
                  { href: "/como-funciona", label: "Como Funciona" },
                  { href: "#resultados", label: "Resultados" },
                  { href: "#planos", label: "Planos" },
                  { href: "#imc", label: "Calculadora IMC" },
                  { href: "#guia-alimentar", label: "Guia Alimentar" },
                  { href: "#diagnostico", label: "Diagnóstico" },
                  { href: "#plano-alimentar", label: "Plano Alimentar" },
                  { href: "#simulador", label: "Simulador Corporal" },
                  { href: "/tendencias", label: "STH News" },
                  { href: "/diario-alimentar", label: "Diário Alimentar" },
                  { href: "/baixar-app", label: "Baixar App" },
                  { href: "/sobre", label: "Novidades & Versão" },
                ].map((item) => (
                  <LinkOrA
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors active:bg-muted"
                  >
                    {item.label}
                  </LinkOrA>
                ))}
                <Link
                  to="/questionario"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  Calcule seus Macros
                </Link>
                <Link
                  to="/triagem-marcadores"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  Triagem de Marcadores
                </Link>
                <Link
                  to="/free"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  Versão Gratuita
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24">
        {bgEnabled && (
          <img
            src={bgSrc}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: Math.min(bgOpacity, 0.12) }}
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/90 to-background" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center max-w-5xl"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[12px] font-medium tracking-[0.25em] uppercase text-brand mb-8"
          >
            STH METHOD
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground mb-8">
            {(() => {
              const words = heroTitle.split(" ");
              const firstTwo = words.slice(0, 2).join(" ");
              const rest = words.slice(2).join(" ");
              return (
                <>
                  <span className="text-brand">{firstTwo}</span>
                  {rest ? " " + rest : ""}
                </>
              );
            })()}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl mx-auto mb-10 leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <LinkOrA to={ctaLink}>
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
                {ctaText}
              </Button>
            </LinkOrA>
            <LinkOrA to={cta2Link}>
              <Button size="lg" variant="ghost" className="rounded-full px-8 h-12 text-[15px] font-medium text-foreground hover:bg-muted/50">
                {cta2Text}
              </Button>
            </LinkOrA>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Link to="/free">
              <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground hover:text-foreground rounded-full">
                Experimentar versão gratuita
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-4 sm:gap-10 md:gap-20 mt-16 sm:mt-20 max-w-md sm:max-w-none mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl sm:text-2xl md:text-4xl font-semibold tracking-[-0.03em] text-foreground whitespace-nowrap">{stat.value}</div>
                <div className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-muted-foreground mt-2">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Apple-style highlights — preço/CTA bar + carrossel */}
      {/* App launch banner */}
      <section className="relative bg-black py-16 sm:py-24 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs tracking-[0.2em] uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Novo · App STH METHOD
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] text-white">
            Dieta. Protocolo. Treino.
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-base sm:text-lg">
            Acompanhamento completo em um só app. Baixe agora e treine, controle sua dieta e siga seu protocolo em qualquer lugar.
          </p>
          <img
            src={marketingLaunchHero}
            alt="STH METHOD app — Dieta, Protocolo e Treino"
            width={1280}
            height={720}
            loading="lazy"
            className="w-full max-w-5xl mx-auto rounded-3xl border border-white/10 shadow-[0_0_120px_-30px_rgba(57,255,20,0.45)]"
          />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/baixar-app">
              <Button size="lg" className="rounded-full px-8 h-12 text-[15px] font-medium">
                Baixar Android
              </Button>
            </Link>
            <Link to="/baixar-app">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-[15px] font-medium border-white/20 text-white hover:bg-white/5">
                Instalar iPhone
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <AppleHighlightsSection />

      {/* Dynamic Sections */}
      {activeSections.map((sec) => sectionComponents[sec.key] ?? null)}

      {/* Static interactive sections */}
      <BMICalculatorSection />
      <FoodGuideSection />
      <NutritionQuizSection />
      <MealPlanSection />
      <BodySimulatorSection />
      <EvolutionGeneratorSection />

      {/* Triagem de Marcadores Laboratoriais — CTA público */}
      <section id="triagem-marcadores" className="py-24 md:py-32 px-6 bg-[hsl(var(--surface))]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium tracking-[0.2em] uppercase mb-6">
              <FlaskConical className="w-3.5 h-3.5" />
              Ferramenta gratuita
            </div>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.05] text-foreground mb-6">
              Triagem de marcadores<br />
              <span className="text-muted-foreground">laboratoriais.</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground font-light max-w-xl mx-auto mb-10 leading-relaxed">
              Responda um formulário rápido e receba uma tabela personalizada de exames sugeridos — com base em compostos, histórico e fatores de risco.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/triagem-marcadores">
                <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
                  Gerar minha tabela
                  <ArrowUpRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link to="/tendencias/marcadores-laboratoriais">
                <Button size="lg" variant="ghost" className="rounded-full px-8 h-12 text-[15px] font-medium text-foreground hover:bg-muted/50">
                  Ler o guia completo
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-6 font-light">
              Menos de 2 minutos · Não substitui consulta médica
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 md:py-40 px-6 text-center bg-[hsl(0_0%_4%)] text-white">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-7xl font-semibold tracking-[-0.04em] leading-[1] text-white mb-6">
            {ctaFinalTitle}
          </h2>
          <p className="text-lg md:text-xl text-white/60 font-light max-w-xl mx-auto mb-10">
            {ctaFinalSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <LinkOrA to={ctaFinalBtn1Link}>
              <Button size="lg" className="rounded-full bg-brand text-brand-foreground hover:opacity-90 px-8 h-12 text-[15px] font-medium">
                {ctaFinalBtn1Text}
              </Button>
            </LinkOrA>
            <LinkOrA to={ctaFinalBtn2Link}>
              <Button size="lg" variant="ghost" className="rounded-full px-8 h-12 text-[15px] font-medium text-white hover:bg-white/10">
                {ctaFinalBtn2Text}
              </Button>
            </LinkOrA>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground font-light text-center">
          <span className="text-[12px] font-semibold tracking-tight text-foreground">STH METHOD</span>
          <p>© 2026 STH METHOD — Consultoria Científica em Performance e Saúde.</p>
        </div>
      </footer>
      {/* Evolution Generator Popup */}
      <AnimatePresence>
        {popupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={dismissPopup} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-background rounded-3xl p-8 sm:p-12 max-w-md w-full text-center border border-border/60"
            >
              <button
                onClick={dismissPopup}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-5">
                Novo · Gratuito
              </div>

              <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] leading-[1.1] text-foreground mb-4">
                Veja sua evolução<br />em segundos.
              </h3>

              <p className="text-[14px] sm:text-[15px] text-muted-foreground font-light leading-relaxed mb-8 max-w-sm mx-auto">
                Envie suas fotos antes e depois. Receba um comparativo profissional, instantâneo.
              </p>

              <div className="flex flex-col gap-3">
                <Link to="/evolucao" onClick={dismissPopup}>
                  <Button className="w-full rounded-full h-12 bg-foreground text-background hover:bg-foreground/90 text-[14px] font-medium">
                    Gerar minha evolução
                  </Button>
                </Link>
                <button onClick={dismissPopup} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors py-1">
                  Talvez depois
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground font-light mt-8 pt-6 border-t border-border/40">
                Já utilizado por <span className="text-foreground font-medium">+1000 pessoas</span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <WhatsAppButton />
    </div>
  );
};

export default Landing;
