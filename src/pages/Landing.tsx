import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";
import {
  Dumbbell, Utensils, Camera, MessageCircle, CreditCard, LayoutDashboard,
  Brain, Trophy, Gamepad2, Pill, FileBarChart, Webhook,
} from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import ModuleCard from "@/components/ModuleCard";
import FlowSection from "@/components/FlowSection";
import PricingSection from "@/components/PricingSection";
import AdminPreview from "@/components/AdminPreview";
import { useSiteText } from "@/hooks/useSiteContent";

const coreFeatures = [
  { icon: <Utensils className="w-6 h-6" />, title: "Área do Aluno", description: "Dieta, treino, protocolos e materiais educativos organizados de forma dinâmica e acessível." },
  { icon: <FileBarChart className="w-6 h-6" />, title: "Perfil Clínico", description: "Dados clínicos, objetivos, histórico de evolução e status da assinatura em um só lugar." },
  { icon: <Camera className="w-6 h-6" />, title: "Check-ins", description: "Upload de fotos, medidas corporais, sintomas e feedback subjetivo em períodos configuráveis." },
  { icon: <MessageCircle className="w-6 h-6" />, title: "Comunicação Direta", description: "Chat integrado entre aluno e consultor com notificações e histórico completo." },
  { icon: <CreditCard className="w-6 h-6" />, title: "Pagamentos", description: "Planos recorrentes e avulsos com controle de vencimentos, inadimplência e renovação automática." },
  { icon: <LayoutDashboard className="w-6 h-6" />, title: "Painel Admin", description: "Gestão de alunos, engajamento, retenção e métricas financeiras em tempo real." },
];

const extraModules = [
  { icon: <Brain className="w-5 h-5" />, title: "IA & Automação", badge: "Inovação", items: ["Alertas inteligentes de risco de churn", "Sugestão automática de ajustes de dieta", "Chatbot para dúvidas frequentes", "Análise preditiva de resultados"] },
  { icon: <Trophy className="w-5 h-5" />, title: "Programa de Fidelidade", items: ["Pontos por consistência e check-ins", "Rankings e desafios mensais", "Recompensas e badges de evolução", "Indicação premiada de novos alunos"] },
  { icon: <Gamepad2 className="w-5 h-5" />, title: "Gamificação", badge: "Retenção", items: ["Streaks de adesão ao plano", "Milestones de transformação", "Leaderboard entre alunos", "Desafios semanais com prêmios"] },
  { icon: <Pill className="w-5 h-5" />, title: "Farmácia & Suplementos", items: ["Marketplace integrado de suplementos", "Prescrições com links diretos de compra", "Parcerias com farmácias e labs", "Comissão recorrente por indicação"] },
  { icon: <Dumbbell className="w-5 h-5" />, title: "Conteúdo & Comunidade", items: ["Biblioteca de vídeos por categoria", "Lives e webinars exclusivos", "Fórum de alunos por objetivo", "Stories de transformação"] },
  { icon: <Webhook className="w-5 h-5" />, title: "Integrações", badge: "Escala", items: ["Wearables (Garmin, Apple Watch)", "WhatsApp Business API", "Google Calendar & Agenda", "Zapier / Make para automações"] },
];

const Landing = () => {
  const heroBadge = useSiteText("hero_badge", "Plataforma de Consultoria em Saúde & Performance");
  const heroHeadline = useSiteText("hero_headline", "Transforme vidas. Escale resultados.");
  const heroSubtitle = useSiteText("hero_subtitle", "Ecossistema completo para consultores de saúde: dieta, treino, protocolos, check-ins, pagamentos e gestão — tudo integrado em uma única plataforma.");
  const heroCtaPrimary = useSiteText("hero_cta_primary", "Começar Gratuitamente");
  const heroCtaSecondary = useSiteText("hero_cta_secondary", "Ver Demonstração");
  const featuresTitle = useSiteText("features_title", "Funcionalidades Essenciais");
  const featuresSubtitle = useSiteText("features_subtitle", "Cada módulo foi projetado para maximizar a experiência do aluno e a eficiência operacional da consultoria.");
  const modulesTitle = useSiteText("modules_title", "Módulos Estratégicos");
  const modulesSubtitle = useSiteText("modules_subtitle", "Diferenciais que aumentam retenção, escalabilidade e receita da sua consultoria.");
  const archTitle = useSiteText("arch_title", "Arquitetura Técnica");
  const archSubtitle = useSiteText("arch_subtitle", "Stack moderna, escalável e segura — pronta para crescer com o seu negócio.");
  const ctaTitle = useSiteText("cta_title", "Pronto para transformar sua consultoria?");
  const ctaSubtitle = useSiteText("cta_subtitle", "Junte-se a centenas de profissionais que já escalaram seus resultados com a plataforma ST&H.");
  const ctaButton = useSiteText("cta_button", "Começar Agora — É Grátis");
  const footerText = useSiteText("footer_text", "© 2026 ST&H — Consultoria Científica em Performance e Saúde. Todos os direitos reservados.");

  // Helper to split headline on period for gradient effect
  const headlineParts = heroHeadline.split(".");
  const headlineMain = headlineParts[0] + ".";
  const headlineAccent = headlineParts.slice(1).join(".").trim();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-xl font-bold gradient-text">ST&H</span>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Módulos</a>
            <a href="#flow" className="hover:text-foreground transition-colors">Jornada</a>
            <a href="#admin" className="hover:text-foreground transition-colors">Admin</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
          </div>
          <Link to="/login">
            <Button size="sm" className="gradient-bg text-primary-foreground hover:opacity-90">Acessar Plataforma</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-lighten" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full gradient-bg animate-pulse-glow" />
            {heroBadge}
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight mb-6">
            {headlineMain}{" "}
            {headlineAccent && <span className="gradient-text">{headlineAccent}</span>}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="gradient-bg text-primary-foreground hover:opacity-90 px-8 text-base">{heroCtaPrimary}</Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="px-8 text-base">{heroCtaSecondary}</Button>
            </a>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center justify-center gap-8 md:gap-16 mt-16">
            {[
              { value: "12k+", label: "Alunos ativos" },
              { value: "98%", label: "Satisfação" },
              { value: "340+", label: "Consultores" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-display font-bold gradient-text">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-24 px-6 surface">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              {featuresTitle.includes(" ") ? (
                <>{featuresTitle.split(" ").slice(0, -1).join(" ")} <span className="gradient-text">{featuresTitle.split(" ").pop()}</span></>
              ) : featuresTitle}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{featuresSubtitle}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((f, i) => (<FeatureCard key={f.title} {...f} index={i} />))}
          </div>
        </div>
      </section>

      <div id="flow"><FlowSection /></div>
      <div id="admin"><AdminPreview /></div>

      {/* Extra Modules */}
      <section className="py-24 px-6 surface">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              {modulesTitle.includes(" ") ? (
                <>{modulesTitle.split(" ").slice(0, -1).join(" ")} <span className="gradient-text">{modulesTitle.split(" ").pop()}</span></>
              ) : modulesTitle}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{modulesSubtitle}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {extraModules.map((m, i) => (<ModuleCard key={m.title} {...m} index={i} />))}
          </div>
        </div>
      </section>

      <div id="pricing"><PricingSection /></div>

      {/* Architecture */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              {archTitle.includes(" ") ? (
                <>{archTitle.split(" ").slice(0, -1).join(" ")} <span className="gradient-text">{archTitle.split(" ").pop()}</span></>
              ) : archTitle}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{archSubtitle}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8 space-y-6">
            {[
              { layer: "Frontend", tech: "React + TypeScript + TailwindCSS", desc: "Interface responsiva e performática" },
              { layer: "Backend", tech: "Lovable Cloud", desc: "Auth, Database, Storage, Edge Functions" },
              { layer: "Pagamentos", tech: "Stripe", desc: "Assinaturas, webhooks, gestão financeira" },
              { layer: "Comunicação", tech: "Realtime + WhatsApp API", desc: "Chat nativo e notificações push" },
              { layer: "Inteligência", tech: "AI / Analytics", desc: "Predição de churn, sugestões automáticas" },
            ].map((item, i) => (
              <motion.div key={item.layer} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-start gap-4 p-4 surface rounded-xl border border-border">
                <div className="w-24 shrink-0"><span className="text-xs font-semibold gradient-text uppercase tracking-wider">{item.layer}</span></div>
                <div>
                  <p className="font-display font-semibold text-foreground text-sm">{item.tech}</p>
                  <p className="text-muted-foreground text-xs mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-4xl mx-auto text-center glass rounded-3xl p-12 md:p-16 glow-border">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            {ctaTitle.includes(" ") ? (
              <>{ctaTitle.split(" ").slice(0, -1).join(" ")} <span className="gradient-text">{ctaTitle.split(" ").pop()}</span></>
            ) : ctaTitle}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">{ctaSubtitle}</p>
          <Link to="/login">
            <Button size="lg" className="gradient-bg text-primary-foreground hover:opacity-90 px-10 text-base">{ctaButton}</Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-display font-bold gradient-text">ST&H</span>
          <p>{footerText}</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
