import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import heroBgFallback from "@/assets/hero-clients.jpg";
import { Button } from "@/components/ui/button";
import { Menu, X, Calculator, Sparkles } from "lucide-react";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ResultsSection from "@/components/landing/ResultsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PlansSection from "@/components/landing/PlansSection";
import EthicsSection from "@/components/landing/EthicsSection";
import EvolutionsSection from "@/components/landing/EvolutionsSection";
import { useLandingSettings, useLandingSections } from "@/hooks/useLandingData";

const sectionComponents: Record<string, React.ReactNode> = {
  how_it_works: <HowItWorksSection key="how_it_works" />,
  results: <ResultsSection key="results" />,
  evolutions: <EvolutionsSection key="evolutions" />,
  testimonials: <TestimonialsSection key="testimonials" />,
  plans: <PlansSection key="plans" />,
  ethics: <EthicsSection key="ethics" />,
};

const Landing = () => {
  const { data: settings } = useLandingSettings();
  const { data: sections } = useLandingSections();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ height: `${logoSize}px` }} className="object-contain" />
            ) : (
              <span className="font-display text-xl font-bold gradient-text">ST&H</span>
            )}
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#resultados" className="hover:text-foreground transition-colors">Resultados</a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <Link to="/questionario" className="hover:text-foreground transition-colors font-medium gradient-text">Calcule seus Macros</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:block">
              <Button size="sm" className="gradient-bg text-primary-foreground hover:opacity-90">
                Acessar Plataforma
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors text-foreground"
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
              className="md:hidden border-t border-border overflow-hidden"
            >
              <div className="px-4 py-4 flex flex-col gap-3 text-sm">
                <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground transition-colors">Como Funciona</a>
                <a href="#resultados" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground transition-colors">Resultados</a>
                <a href="#depoimentos" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground transition-colors">Depoimentos</a>
                <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground transition-colors">Planos</a>
                <Link to="/questionario" onClick={() => setMobileMenuOpen(false)} className="py-2 font-medium gradient-text">Calcule seus Macros</Link>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="mt-1">
                  <Button size="sm" className="w-full gradient-bg text-primary-foreground hover:opacity-90">
                    Acessar Plataforma
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
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

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight mb-6">
            {heroTitle}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LinkOrA to={ctaLink}>
              <Button size="lg" className="gradient-bg text-primary-foreground hover:opacity-90 px-8 text-base">
                {ctaText}
              </Button>
            </LinkOrA>
            <LinkOrA to={cta2Link}>
              <Button size="lg" variant="outline" className="px-8 text-base">
                {cta2Text}
              </Button>
            </LinkOrA>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 md:gap-16 mt-16"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-display font-bold gradient-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Dynamic Sections */}
      {activeSections.map((sec) => sectionComponents[sec.key] ?? null)}

      {/* Final CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center glass rounded-3xl p-12 md:p-16 glow-border"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            {ctaFinalTitle}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-lg">
            {ctaFinalSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LinkOrA to={ctaFinalBtn1Link}>
              <Button size="lg" className="gradient-bg text-primary-foreground hover:opacity-90 px-10 text-base">
                {ctaFinalBtn1Text}
              </Button>
            </LinkOrA>
            <LinkOrA to={ctaFinalBtn2Link}>
              <Button size="lg" variant="outline" className="px-10 text-base">
                {ctaFinalBtn2Text}
              </Button>
            </LinkOrA>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-6 object-contain" />
          ) : (
            <span className="font-display font-bold gradient-text">ST&H</span>
          )}
          <p>© 2026 ST&H — Consultoria Científica em Performance e Saúde. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
