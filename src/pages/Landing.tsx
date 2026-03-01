import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-clients.jpg";
import { Button } from "@/components/ui/button";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ResultsSection from "@/components/landing/ResultsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PlansSection from "@/components/landing/PlansSection";
import EthicsSection from "@/components/landing/EthicsSection";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-xl font-bold gradient-text">ST&H</span>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#resultados" className="hover:text-foreground transition-colors">Resultados</a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
          </div>
          <Link to="/login">
            <Button size="sm" className="gradient-bg text-primary-foreground hover:opacity-90">
              Acessar Plataforma
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <img
          src={heroBg}
          alt="Transformação corporal"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-lighten"
        />
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
            Transforme seu corpo com{" "}
            <span className="gradient-text">ciência, estratégia e acompanhamento real.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Consultoria online personalizada para quem busca emagrecimento, definição, saúde hormonal e evolução no shape.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="gradient-bg text-primary-foreground hover:opacity-90 px-8 text-base">
                Quero evoluir meu shape
              </Button>
            </Link>
            <a href="#planos">
              <Button size="lg" variant="outline" className="px-8 text-base">
                Conhecer os planos
              </Button>
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 md:gap-16 mt-16"
          >
            {[
              { value: "12k+", label: "Alunos ativos" },
              { value: "98%", label: "Satisfação" },
              { value: "340+", label: "Transformações" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-display font-bold gradient-text">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Sections */}
      <HowItWorksSection />
      <ResultsSection />
      <TestimonialsSection />
      <PlansSection />
      <EthicsSection />

      {/* Final CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center glass rounded-3xl p-12 md:p-16 glow-border"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Seu corpo não muda{" "}
            <span className="gradient-text">sozinho.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-lg">
            Com método e acompanhamento, muda de verdade.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="gradient-bg text-primary-foreground hover:opacity-90 px-10 text-base">
                Começar agora
              </Button>
            </Link>
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="px-10 text-base">
                Falar com a consultoria
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-display font-bold gradient-text">ST&H</span>
          <p>© 2026 ST&H — Consultoria Científica em Performance e Saúde. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
