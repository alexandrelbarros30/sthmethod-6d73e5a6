import { motion } from "framer-motion";
import { Check, Zap, Rocket, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    icon: <Zap className="w-6 h-6" />,
    name: "Turbo 30D",
    tagline: "Para iniciar, organizar e ganhar ritmo",
    price: "297",
    period: "/mês",
    features: [
      "Dieta personalizada",
      "Treino estruturado",
      "Check-in quinzenal",
      "Acesso à área do aluno",
      "Suporte via chat",
    ],
  },
  {
    icon: <Rocket className="w-6 h-6" />,
    name: "Impulso 90D",
    tagline: "Ajustes estratégicos e evolução consistente",
    price: "497",
    period: "/mês",
    popular: true,
    features: [
      "Tudo do Turbo 30D",
      "Check-in semanal",
      "Protocolo de suplementação",
      "Análise de exames",
      "Consultoria em vídeo mensal",
      "Prioridade no suporte",
    ],
  },
  {
    icon: <Crown className="w-6 h-6" />,
    name: "Projeto 6M",
    tagline: "Transformação profunda, física e comportamental",
    price: "897",
    period: "/mês",
    features: [
      "Tudo do Impulso 90D",
      "Acompanhamento diário",
      "Protocolo hormonal",
      "Acesso direto ao consultor",
      "Sessões de vídeo semanais",
      "Plano de periodização completo",
    ],
  },
];

const PlansSection = () => (
  <section id="planos" className="py-24 px-6 surface">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Planos de <span className="gradient-text">Acompanhamento</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Escolha o plano ideal para o seu momento e objetivo. Todos incluem acompanhamento real e personalizado.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-2xl p-8 border transition-all duration-500 ${
              plan.popular
                ? "border-primary glow-border bg-card"
                : "border-border bg-card/50"
            } relative`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-bg text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                Mais Popular
              </span>
            )}
            <div className="flex items-center gap-2 mb-1 text-primary">
              {plan.icon}
              <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">{plan.tagline}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-sm text-muted-foreground">R$</span>
              <span className="text-4xl font-display font-bold gradient-text">{plan.price}</span>
              <span className="text-muted-foreground text-sm">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-secondary-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/login">
              <Button
                className={`w-full ${plan.popular ? "gradient-bg text-primary-foreground hover:opacity-90" : ""}`}
                variant={plan.popular ? "default" : "outline"}
              >
                Quero esse plano
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PlansSection;
