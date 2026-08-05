import { Link } from "react-router-dom";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { Button } from "@/components/ui/button";
import { ChevronRight, PlayCircle, ShieldCheck, Zap, Heart, Brain, Dumbbell } from "lucide-react";
import AiLogoMark from "@/components/ai/AiLogoMark";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function AiLanding() {
  useSthAiTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showIconOptions, setShowIconOptions] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-primary-foreground font-sans antialiased overflow-x-hidden">
      {/* Global Navigation */}
      <nav className={cn(
        "fixed top-0 z-[100] w-full transition-all duration-300 border-b",
        isScrolled ? "bg-black/80 backdrop-blur-md border-white/10" : "bg-transparent border-transparent"
      )}>
        <div className="mx-auto flex h-12 max-w-[1000px] items-center justify-between px-6">
          <Link to="/ai" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <AiLogoMark className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-tight">STH AI</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/ai/instalar" className="text-[12px] text-white/80 hover:text-white transition-colors">App</Link>
            <Link to="/ai/assinatura" className="text-[12px] text-white/80 hover:text-white transition-colors">Planos</Link>
            <Button variant="ghost" size="sm" onClick={() => setShowIconOptions(!showIconOptions)} className="text-white hover:bg-white/10">
              <Palette className="h-4 w-4" />
            </Button>
            <Link to="/ai/login?next=/ai/app" className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-black transition-transform hover:scale-105 active:scale-95">Entrar</Link>
          </div>
        </div>
      </nav>

      {showIconOptions && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-zinc-900 border border-white/10 p-10 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-primary uppercase">Estudo de Identidade Visual</h2>
                <p className="text-xs text-muted-foreground">Protótipos de Favicon e App Icon para o ecossistema STH AI</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowIconOptions(false)} className="text-white">Fechar</Button>
            </div>
            <AiIconOptions />
          </div>
        </div>
      )}

      {/* Sub-navigation (Product specific) */}
      <div className="sticky top-12 z-[90] h-12 w-full border-b border-white/10 bg-black/60 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1000px] items-center justify-between px-6">
          <h2 className="text-lg font-semibold tracking-tight">STH AI</h2>
          <div className="flex items-center gap-4 text-[11px] font-medium text-white/70">
            <a href="#visao-geral" className="hover:text-primary transition-colors">Visão Geral</a>
            <a href="#recursos" className="hover:text-primary transition-colors">Recursos</a>
            <Link to="/ai/onboarding" className="rounded-full bg-primary px-3 py-1 text-white transition-transform hover:scale-105">Começar</Link>
          </div>
        </div>
      </div>

      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center pt-24 text-center">
          <div className="mx-auto max-w-4xl px-6">
            <span className="mb-4 inline-block animate-fade-in text-sm font-semibold tracking-[0.2em] text-primary uppercase opacity-0 [animation-fill-mode:forwards]">Lançamento 2026</span>
            <h1 className="animate-fade-in-up text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]">
              Inteligência para o <br />
              <span className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">seu corpo.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-xl animate-fade-in-up text-lg text-white/60 opacity-0 [animation-delay:400ms] [animation-fill-mode:forwards] sm:text-xl">
              A metodologia STH METHOD agora é autônoma. Treinos, dieta e análise laboratorial em um único ecossistema movido por IA.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-6 animate-fade-in-up opacity-0 [animation-delay:600ms] [animation-fill-mode:forwards] sm:flex-row">
              <Button asChild size="lg" className="h-14 rounded-full bg-primary px-10 text-lg font-semibold text-white hover:bg-primary/90">
                <Link to="/ai/onboarding">Comprar</Link>
              </Button>
              <div className="flex items-center gap-2 group cursor-pointer">
                <Link to="/ai/instalar" className="text-lg font-medium text-primary group-hover:underline">Saiba mais sobre o App</Link>
                <ChevronRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* Visual Highlight */}
          <div className="mt-20 w-full max-w-[1200px] px-6 animate-fade-in-up opacity-0 [animation-delay:800ms] [animation-fill-mode:forwards]">
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              {/* Fallback pattern if no video */}
              <div className="ai-tech-grid absolute inset-0 opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <AiLogoMark className="h-40 w-40 opacity-20 blur-sm grayscale" />
              </div>
              
              {/* Content overlay */}
              <div className="absolute bottom-12 left-12 z-20 max-w-md text-left">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl">
                  <PlayCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Assista ao futuro.</h3>
                <p className="mt-2 text-white/50">Veja como a IA STHia processa seus dados em milissegundos para criar o protocolo perfeito.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid: Apple-style Bento */}
        <section id="recursos" className="py-32">
          <div className="mx-auto max-w-[1200px] px-6">
            <h2 className="text-center text-4xl font-bold tracking-tight sm:text-6xl mb-20">Conheça o STH AI.</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Large Bento Card */}
              <div className="md:col-span-8 group relative overflow-hidden rounded-[32px] bg-zinc-900 border border-white/5 p-12 transition-all hover:border-white/20">
                <div className="relative z-10">
                  <Zap className="mb-6 h-10 w-10 text-primary" />
                  <h3 className="text-3xl font-bold mb-4">Motor de Decisão 2.5</h3>
                  <p className="max-w-md text-white/50 text-lg">A STHia agora utiliza modelos de 1.5 trilhão de parâmetros para recalibrar sua dieta baseada na sua atividade real diária.</p>
                </div>
                <div className="absolute -right-20 -bottom-20 h-80 w-80 bg-primary/20 blur-[100px] transition-all group-hover:bg-primary/30" />
              </div>

              {/* Square Bento Card */}
              <div className="md:col-span-4 group relative overflow-hidden rounded-[32px] bg-zinc-900 border border-white/5 p-10 transition-all hover:border-white/20">
                <Heart className="mb-6 h-10 w-10 text-red-500" />
                <h3 className="text-2xl font-bold mb-2">Saúde 360°</h3>
                <p className="text-white/50">Sincronização nativa com Apple Health e Samsung Health.</p>
              </div>

              {/* Square Bento Card */}
              <div className="md:col-span-4 group relative overflow-hidden rounded-[32px] bg-zinc-900 border border-white/5 p-10 transition-all hover:border-white/20">
                <Brain className="mb-6 h-10 w-10 text-blue-500" />
                <h3 className="text-2xl font-bold mb-2">Análise Visual</h3>
                <p className="text-white/50">Tire foto dos seus exames e receba uma interpretação laboratorial imediata.</p>
              </div>

              {/* Large Bento Card */}
              <div className="md:col-span-8 group relative overflow-hidden rounded-[32px] bg-zinc-900 border border-white/5 p-12 transition-all hover:border-white/20">
                <div className="relative z-10">
                  <Dumbbell className="mb-6 h-10 w-10 text-orange-500" />
                  <h3 className="text-3xl font-bold mb-4">Treino Adaptativo</h3>
                  <p className="max-w-md text-white/50 text-lg">Seu treino muda conforme você evolui. O volume é ajustado automaticamente pelo seu feedback de RPE.</p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/2 opacity-20">
                   <div className="ai-tech-grid h-full w-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing/Plans: Clean Apple Card Style */}
        <section id="planos" className="bg-zinc-950 py-32">
          <div className="mx-auto max-w-[1000px] px-6 text-center">
            <h2 className="text-5xl font-bold tracking-tight mb-4">Simples assim.</h2>
            <p className="text-xl text-white/50 mb-16">Escolha o plano que melhor se adapta à sua jornada.</p>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { id: 'mensal', name: 'Mensal', price: 'R$ 59,90', period: 'por mês', features: ['IA STHia Full', 'Dieta & Treino', 'Suporte Wearables'] },
                { id: 'anual_fundador', name: 'Fundador', price: 'R$ 399,90', period: 'por ano', popular: true, features: ['Preço Vitalício', 'IA STHia Full', 'Dieta & Treino', 'Suporte Prioritário'] },
                { id: 'anual', name: 'Anual', price: 'R$ 499,90', period: 'por ano', features: ['Parcelamento 12x', 'IA STHia Full', 'Dieta & Treino', 'Acesso APK'] },
              ].map((plan) => (
                <div key={plan.id} className={cn(
                  "relative flex flex-col rounded-[32px] bg-zinc-900/50 p-8 border transition-transform hover:scale-[1.02]",
                  plan.popular ? "border-primary shadow-2xl shadow-primary/10" : "border-white/5"
                )}>
                  {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Mais popular</span>}
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-white/40 text-sm ml-1">{plan.period}</span>
                  </div>
                  <ul className="mb-10 flex-1 space-y-4 text-left text-sm text-white/70">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className={cn("h-12 rounded-full font-bold", plan.popular ? "bg-primary hover:bg-primary/90" : "bg-white text-black hover:bg-white/90")}>
                    <Link to={`/ai/assinatura?plan=${plan.id}`}>Selecionar</Link>
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3">
              <span className="text-sm font-medium text-white/50 uppercase tracking-widest">Cupom de Lançamento:</span>
              <span className="text-sm font-bold text-primary">STH10AI</span>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-32 text-center">
          <div className="mx-auto max-w-4xl px-6">
             <AiLogoMark className="mx-auto h-24 w-24 mb-10 shadow-2xl shadow-primary/20" />
             <h2 className="text-4xl font-bold sm:text-6xl mb-8">Pronto para o próximo nível?</h2>
             <Button asChild size="lg" className="h-16 rounded-full bg-white px-12 text-xl font-bold text-black hover:bg-white/90">
               <Link to="/ai/onboarding">Experimentar agora</Link>
             </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 py-20 text-white/40">
        <div className="mx-auto max-w-[1000px] px-6">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="mb-6 text-sm font-bold text-white uppercase tracking-widest">STH AI</h4>
              <ul className="space-y-4 text-sm">
                <li><Link to="/ai/sobre" className="hover:text-white transition-colors">Sobre o projeto</Link></li>
                <li><Link to="/ai/legal" className="hover:text-white transition-colors">Documentação</Link></li>
                <li><Link to="/ai/instalar" className="hover:text-white transition-colors">Downloads</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-sm font-bold text-white uppercase tracking-widest">Legal</h4>
              <ul className="space-y-4 text-sm">
                <li><Link to="/ai/legal/termos-de-uso" className="hover:text-white transition-colors">Termos de Uso</Link></li>
                <li><Link to="/ai/legal/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-20 border-t border-white/5 pt-10 text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>© 2026 STH METHOD. Todos os direitos reservados.</p>
            <div className="flex items-center gap-6">
              <div className="flex gap-2 items-center">
                <ShieldCheck className="h-4 w-4" />
                <span>Dados Criptografados</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
