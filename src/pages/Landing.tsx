import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import heroBgFallback from "@/assets/hero-clients.jpg";
import { Button } from "@/components/ui/button";
import { Menu, X, Calculator, Sparkles, Info } from "lucide-react";
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
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import STHNewsSection from "@/components/landing/STHNewsSection";
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
  const [noticeOpen, setNoticeOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("dns-notice-dismissed-v1") !== "1";
  });
  const dismissNotice = () => {
    setNoticeOpen(false);
    try { localStorage.setItem("dns-notice-dismissed-v1", "1"); } catch {}
  };

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
    if (bh) {
      root.style.setProperty("--background", `${bh} ${bs}% ${bl}%`);
    }

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
      {/* Aviso temporário de instabilidade de domínio */}
      {noticeOpen && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] bg-amber-500/95 text-black backdrop-blur-md border-b border-amber-600/50"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
          role="alert"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-start sm:items-center gap-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-xs sm:text-sm font-body leading-snug flex-1">
              <strong className="font-bold">Aviso:</strong> estamos ajustando o domínio <strong>sthmethod.com.br</strong>. Seu acesso, dados e assinatura estão <strong>100% seguros</strong>. Use o link atual <a href="https://sthmethod.lovable.app" className="underline font-semibold">sthmethod.lovable.app</a> normalmente. Tudo voltará ao normal em poucas horas.
            </p>
            <button
              onClick={dismissNotice}
              aria-label="Fechar aviso"
              className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/90 backdrop-blur-xl shadow-lg border-b border-border/50' : 'bg-transparent backdrop-blur-sm'}`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ height: `${logoSize}px` }} className="object-contain" />
            ) : (
              <span className="font-display text-xl font-bold gradient-text">ST&H</span>
            )}
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-5 text-sm text-muted-foreground">
            <Link to="/como-funciona" className="hover:text-foreground transition-colors py-1">Como Funciona</Link>
            <a href="#resultados" className="hover:text-foreground transition-colors py-1">Resultados</a>
            <a href="#planos" className="hover:text-foreground transition-colors py-1">Planos</a>
            <a href="#imc" className="hover:text-foreground transition-colors py-1">IMC</a>
            <a href="#guia-alimentar" className="hover:text-foreground transition-colors py-1">Guia</a>
            <a href="#diagnostico" className="hover:text-foreground transition-colors py-1">Diagnóstico</a>
            <a href="#simulador" className="hover:text-foreground transition-colors py-1">Simulador</a>
            <a href="#sth-news" className="hover:text-foreground transition-colors py-1">STH News</a>
            <Link to="/tendencias/plato-metabolico" className="hover:text-foreground transition-colors py-1">Platô Metabólico</Link>
            <Link to="/tendencias/trembolona" className="hover:text-foreground transition-colors py-1">Trembolona</Link>
            <Link to="/questionario" className="hover:text-foreground transition-colors font-medium gradient-text py-1">Macros</Link>
          </div>

          {/* Right side: CTA + hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/free">
              <Button size="sm" variant="outline" className="text-xs sm:text-sm px-3 sm:px-4 border-primary/30 hover:bg-primary/10">
                Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="gradient-bg text-primary-foreground hover:opacity-90 text-xs sm:text-sm px-3 sm:px-4 cta-glow font-semibold">
                Acessar
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors text-foreground"
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
                  { href: "#sth-news", label: "STH News" },
                  { href: "/tendencias/plato-metabolico", label: "Platô Metabólico" },
                  { href: "/tendencias/trembolona", label: "Trembolona" },
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
                  className="py-2.5 px-3 rounded-lg font-medium gradient-text hover:bg-muted/50 transition-colors"
                >
                  Calcule seus Macros
                </Link>
                <Link
                  to="/free"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-lg font-medium text-primary hover:bg-muted/50 transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Versão Gratuita
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        {bgEnabled && (
          <img
            src={bgSrc}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover mix-blend-lighten"
            style={{ opacity: bgOpacity }}
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-muted-foreground"
          >
            <span className="w-2 h-2 rounded-full gradient-bg animate-pulse" />
            Consultoria Online em Performance &amp; Saúde
          </motion.div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight mb-6">
            {heroTitle}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LinkOrA to={ctaLink}>
              <Button size="lg" className="gradient-bg text-primary-foreground hover:opacity-90 px-8 text-base cta-glow font-semibold">
                {ctaText}
              </Button>
            </LinkOrA>
            <LinkOrA to={cta2Link}>
              <Button size="lg" variant="outline" className="px-8 text-base cta-glow-soft font-semibold">
                {cta2Text}
              </Button>
            </LinkOrA>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <Link to="/free">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2 text-sm">
                <Sparkles className="w-4 h-4" />
                Experimentar versão gratuita
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-6 sm:gap-8 md:gap-16 mt-12 sm:mt-16"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-display font-bold gradient-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Dynamic Sections */}
      {activeSections.map((sec) => sectionComponents[sec.key] ?? null)}

      {/* Static interactive sections */}
      <BMICalculatorSection />
      <FoodGuideSection />
      <NutritionQuizSection />
      <MealPlanSection />
      <BodySimulatorSection />

      {/* STH News */}
      <STHNewsSection />

      {/* Final CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center glass rounded-2xl sm:rounded-3xl p-6 sm:p-12 md:p-16 glow-border"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            {ctaFinalTitle}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-lg">
            {ctaFinalSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LinkOrA to={ctaFinalBtn1Link}>
              <Button size="lg" className="gradient-bg text-primary-foreground hover:opacity-90 px-10 text-base cta-glow font-semibold">
                {ctaFinalBtn1Text}
              </Button>
            </LinkOrA>
            <LinkOrA to={ctaFinalBtn2Link}>
              <Button size="lg" variant="outline" className="px-10 text-base cta-glow-soft font-semibold">
                {ctaFinalBtn2Text}
              </Button>
            </LinkOrA>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground text-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-6 object-contain" />
          ) : (
            <span className="font-display font-bold gradient-text">ST&H</span>
          )}
          <p>© 2026 ST&H — Consultoria Científica em Performance e Saúde. Todos os direitos reservados.</p>
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
              className="relative glass rounded-3xl p-8 sm:p-10 max-w-lg w-full glow-border text-center border-2 border-primary/20"
            >
              <button
                onClick={dismissPopup}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Badge de destaque */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                NOVO — Gratuito
              </motion.div>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring" }}
                className="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-primary/20"
              >
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </motion.div>
              
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
                Veja sua evolução em segundos
              </h3>
              
              <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
                Envie suas fotos (antes e depois) e visualize sua transformação com um comparativo profissional. 
                <span className="text-foreground font-medium">Grátis e instantâneo.</span>
              </p>
              
              <div className="flex flex-col gap-3">
                <Link to="/evolucao" onClick={dismissPopup}>
                  <Button size="lg" className="w-full gradient-bg text-primary-foreground hover:opacity-90 text-base py-6 shadow-xl shadow-primary/20">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Gerar minha evolução agora
                  </Button>
                </Link>
                <button onClick={dismissPopup} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                  Talvez depois
                </button>
              </div>
              
              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-5 pt-5 border-t border-border/50"
              >
              <p className="text-xs text-muted-foreground">
                  Já utilizado por <span className="text-primary font-medium">+1000 pessoas</span>
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <WhatsAppButton />
    </div>
  );
};

export default Landing;
