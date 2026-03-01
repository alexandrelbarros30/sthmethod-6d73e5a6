import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Dumbbell, Salad, FlaskConical, BookOpen, Shield, Users } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  { icon: Salad, title: "Dieta Personalizada", description: "Plano alimentar baseado em evidências, ajustado às suas necessidades e objetivos." },
  { icon: Dumbbell, title: "Treino Estruturado", description: "Periodização inteligente com exercícios selecionados para máxima eficiência." },
  { icon: FlaskConical, title: "Protocolo Científico", description: "Suplementação e protocolos baseados nas melhores evidências disponíveis." },
  { icon: BookOpen, title: "Conteúdo Educativo", description: "Artigos, vídeos e materiais para você entender a ciência por trás dos resultados." },
  { icon: Shield, title: "Segurança & Privacidade", description: "Seus dados protegidos com as melhores práticas de segurança." },
  { icon: Users, title: "Acompanhamento Contínuo", description: "Suporte dedicado e ajustes regulares no seu protocolo." },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">ST</span>
            </div>
            <span className="font-display text-xl font-bold text-foreground">ST&H</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Começar agora</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Background científico" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-hero opacity-80" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm text-primary-foreground/80 font-body">Consultoria Científica em Performance</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground leading-tight">
              Ciência a serviço da sua <span className="text-gradient">performance</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto font-body">
              Dieta, treino e protocolos personalizados com base em evidências científicas. Resultados reais, acompanhamento contínuo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/login">
                <Button variant="hero" size="lg" className="gap-2">
                  Acessar plataforma <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="hero-outline" size="lg">Saiba mais</Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Tudo o que você precisa</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">Uma plataforma completa para gerenciar sua jornada de performance e saúde.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 shadow-card hover:shadow-card-hover transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 font-display">{feature.title}</h3>
                <p className="text-muted-foreground text-sm font-body">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Pronto para transformar seus resultados?</h2>
          <p className="text-primary-foreground/70 text-lg mb-8 max-w-xl mx-auto font-body">
            Entre na plataforma e comece sua jornada com acompanhamento científico personalizado.
          </p>
          <Link to="/login">
            <Button variant="hero-outline" size="lg" className="gap-2">
              Começar agora <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm font-body">© 2026 ST&H — Consultoria Científica em Performance e Saúde. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
