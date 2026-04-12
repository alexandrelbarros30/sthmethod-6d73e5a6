import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ClipboardList, Camera, FlaskConical, CreditCard, Rocket,
  Utensils, Dumbbell, Settings, BarChart3, Calendar, TrendingUp,
  ArrowLeft, ChevronDown, ChevronUp, CheckCircle2, Shield, Eye,
  DollarSign, Target, Zap, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const processSteps = [
  {
    icon: ClipboardList,
    emoji: "🧾",
    num: "01",
    title: "Cadastro Inicial",
    desc: "Você preenche seus dados básicos, rotina e nível de atividade física.",
    highlight: "Aqui entendemos seu cenário real.",
  },
  {
    icon: Camera,
    emoji: "📸",
    num: "02",
    title: "Envio de Imagens Corporais",
    desc: "Envie pela plataforma suas fotos: frontal, lateral e costas.",
    highlight: "Leitura visual completa da sua condição atual.",
  },
  {
    icon: FlaskConical,
    emoji: "🧪",
    num: "03",
    title: "Exames Laboratoriais",
    desc: "Caso tenha exames, você pode enviar. Se necessário, fazemos a requisição.",
    highlight: "Análise mais estratégica e precisa.",
    badge: "Opcional / Recomendado",
  },
  {
    icon: CreditCard,
    emoji: "💳",
    num: "04",
    title: "Escolha do Plano e Pagamento",
    desc: "Escolha o plano ideal e realize o pagamento para ativar seu atendimento.",
    highlight: "Ativação imediata da consultoria.",
  },
  {
    icon: Rocket,
    emoji: "🚀",
    num: "05",
    title: "Início da Consultoria",
    desc: "Com tudo validado, você passa a receber toda a estrutura personalizada.",
    highlight: "Método, estratégia e ajuste constante.",
  },
];

const deliverables = [
  {
    icon: Utensils,
    title: "Dieta Personalizada",
    desc: "Montada de acordo com seu objetivo, rotina e realidade. Nada genérico.",
    color: "from-emerald-500/20 to-emerald-600/10",
  },
  {
    icon: Dumbbell,
    title: "Treino Guiado pelo App",
    desc: "Treino estruturado com vídeos explicativos mostrando a execução correta de cada exercício.",
    color: "from-blue-500/20 to-blue-600/10",
  },
  {
    icon: Settings,
    title: "Protocolo Estratégico",
    desc: "Direcionamento sobre suplementos, estratégias e recursos com foco em segurança.",
    color: "from-purple-500/20 to-purple-600/10",
  },
  {
    icon: BarChart3,
    title: "Acompanhamento e Suporte",
    desc: "Acesso direto ao consultor. Suporte conforme a demanda — sem ficar perdido no processo.",
    color: "from-amber-500/20 to-amber-600/10",
  },
];

const plans = [
  {
    days: 30,
    icon: Calendar,
    title: "Plano 30 Dias",
    subtitle: "Execução Imediata",
    features: [
      "Estrutura completa: dieta, treino, protocolo e suporte",
      "Planejamento focado no período de 30 dias",
      "Ideal para quem quer começar agora",
    ],
    highlight: false,
  },
  {
    days: 90,
    icon: TrendingUp,
    title: "Plano 90 Dias",
    subtitle: "Projeto Estruturado",
    features: [
      "Planejamento estratégico completo por fases",
      "Ajustes e novos protocolos ao longo do período",
      "Painel completo de evolução e custos",
      "Muito mais previsibilidade e controle",
    ],
    highlight: true,
    phases: [
      { weeks: "1–4", label: "Definição de estratégia" },
      { weeks: "5–8", label: "Ajuste e novo protocolo" },
      { weeks: "9–12", label: "Refinamento e resultado" },
    ],
  },
  {
    days: 180,
    icon: Target,
    title: "Plano 180 Dias",
    subtitle: "Visão Estratégica Total",
    features: [
      "Tudo do plano 90 dias em escala maior",
      "Projeto de longo prazo com múltiplas fases",
      "Máxima previsibilidade e controle total",
      "Resultados mais sólidos e duradouros",
    ],
    highlight: false,
  },
];

const ComoFunciona = () => {
  const [expandedPlan, setExpandedPlan] = useState<number | null>(90);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <span className="text-sm font-bold tracking-wider text-foreground">STH METHOD</span>
          <Link to="/cadastro">
            <Button size="sm" className="gradient-bg text-primary-foreground text-xs px-4">
              Começar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" /> Consultoria Estratégica
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            Como Funciona a{" "}
            <span className="gradient-text">Consultoria</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto leading-relaxed">
            Um processo simples, mas extremamente importante. Estratégia e precisão do início ao resultado.
          </p>
        </motion.div>
      </section>

      {/* Process Steps – Vertical Timeline */}
      <section className="pb-20 px-4">
        <div className="max-w-2xl mx-auto relative">
          {/* Timeline line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-border" />

          {processSteps.map((step, i) => (
            <motion.div
              key={step.num}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              className="relative pl-16 md:pl-20 pb-10 last:pb-0"
            >
              {/* Timeline dot */}
              <div className="absolute left-3 md:left-5 w-6 h-6 md:w-7 md:h-7 rounded-full gradient-bg flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg">
                {step.num}
              </div>

              <div className="glass rounded-2xl p-5 relative group hover:shadow-lg transition-shadow duration-300">
                {step.badge && (
                  <span className="absolute -top-2.5 right-3 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {step.badge}
                  </span>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <step.icon className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="font-bold text-foreground text-base">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                  {step.desc}
                </p>
                <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3" />
                  {step.highlight}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What You Receive */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
              O que você <span className="gradient-text">recebe</span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Independente do plano escolhido, você terá acesso a uma estrutura completa.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {deliverables.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="glass rounded-2xl p-5 group hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
                  <item.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Comparison */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
              Escolha o <span className="gradient-text">plano ideal</span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Cada plano entrega resultado. A diferença está na profundidade estratégica.
            </p>
          </motion.div>

          <div className="space-y-4">
            {plans.map((plan, i) => {
              const isExpanded = expandedPlan === plan.days;
              return (
                <motion.div
                  key={plan.days}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className={`glass rounded-2xl overflow-hidden transition-all duration-300 ${
                    plan.highlight ? "ring-2 ring-primary/30 shadow-lg" : ""
                  }`}
                >
                  <button
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.days)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        plan.highlight ? "gradient-bg text-primary-foreground" : "bg-muted text-foreground"
                      }`}>
                        <plan.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-sm md:text-base">{plan.title}</h3>
                          {plan.highlight && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full gradient-bg text-primary-foreground">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="px-5 pb-5"
                    >
                      <div className="border-t border-border/50 pt-4">
                        <ul className="space-y-2.5 mb-4">
                          {plan.features.map((f, j) => (
                            <li key={j} className="flex items-start gap-2.5 text-sm text-foreground">
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>

                        {plan.phases && (
                          <div className="bg-muted/50 rounded-xl p-4 mt-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                              Exemplo de fases
                            </p>
                            <div className="space-y-2">
                              {plan.phases.map((phase, k) => (
                                <div key={k} className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-primary min-w-[4rem]">
                                    Sem. {phase.weeks}
                                  </span>
                                  <div className="h-px flex-1 bg-border" />
                                  <span className="text-xs text-foreground font-medium">
                                    {phase.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Important Info */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-foreground text-sm mb-1">Sem cobrança automática</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Não existe cobrança recorrente. Terminou o período, você decide se quer continuar. Se quiser seguir, é só renovar.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-foreground text-sm mb-1">Transparência total</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tudo é alinhado e definido junto com você. Aqui não é tentativa e erro — é método, estratégia e ajuste constante.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-foreground text-sm mb-1">Organização de custos</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Nos planos 90 e 180 dias, você visualiza a organização completa de custos com suplementos e estratégias.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
            Pronto para <span className="gradient-text">evoluir</span>?
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Resultado não é sorte. É acompanhamento + ajuste estratégico.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/cadastro">
              <Button size="lg" className="gradient-bg text-primary-foreground w-full sm:w-auto font-semibold px-8">
                Começar agora <Rocket className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/#planos">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Ver planos
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          STH Method — Consultoria Estratégica
        </p>
      </footer>
    </div>
  );
};

export default ComoFunciona;
