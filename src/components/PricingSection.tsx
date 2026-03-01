import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Essencial",
    price: "297",
    period: "/mês",
    features: [
      "Dieta e treino personalizado",
      "Check-in quinzenal",
      "Acesso à área do aluno",
      "Materiais educativos",
      "Suporte via chat",
    ],
  },
  {
    name: "Performance",
    price: "497",
    period: "/mês",
    popular: true,
    features: [
      "Tudo do Essencial",
      "Check-in semanal",
      "Protocolo de suplementação",
      "Análise de exames",
      "Consultoria em vídeo mensal",
      "Prioridade no suporte",
    ],
  },
  {
    name: "Elite",
    price: "897",
    period: "/mês",
    features: [
      "Tudo do Performance",
      "Acompanhamento diário",
      "Protocolo hormonal",
      "Acesso direto ao consultor",
      "Sessões de vídeo semanais",
      "Plano de periodização anual",
    ],
  },
];

const PricingSection = () => (
  <section className="py-24 px-6 surface">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Planos de <span className="gradient-text">Assinatura</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Pagamento recorrente com renovação automática, controle de inadimplência e gestão de vencimentos integrada.
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
            <h3 className="font-display text-xl font-bold text-foreground mb-2">{plan.name}</h3>
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
            <Button
              className={`w-full ${plan.popular ? "gradient-bg text-primary-foreground hover:opacity-90" : ""}`}
              variant={plan.popular ? "default" : "outline"}
            >
              Começar Agora
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;
