import { motion } from "framer-motion";
import {
  Brain, Utensils, Dumbbell, Pill, FlaskConical, Headphones, FileText,
} from "lucide-react";

const steps = [
  {
    icon: <Brain className="w-7 h-7" />,
    num: "01",
    title: "Avaliação Completa",
    items: [
      "Preenchimento de formulário",
      "Envio de imagens corporais",
      "Diálogo individual",
      "Análise de exames (quando houver)",
    ],
    footer: "Avaliação profunda, personalizada e respeitando sua individualidade.",
  },
  {
    icon: <Utensils className="w-7 h-7" />,
    num: "02",
    title: "Dieta Personalizada e Periodizada",
    items: [
      "Plano alimentar exclusivo",
      "Ajustes metabólicos contínuos",
      "Atualizações mínimas a cada 30 dias",
    ],
    footer: "Nada genérico. Tudo alinhado ao seu objetivo.",
  },
  {
    icon: <Dumbbell className="w-7 h-7" />,
    num: "03",
    title: "Treino Guiado por Aplicativo",
    items: [
      "Treinos estruturados",
      "Vídeos de execução",
      "Progressão planejada",
      "Controle de cargas",
    ],
    footer: "Segurança, eficiência e constância.",
  },
  {
    icon: <Pill className="w-7 h-7" />,
    num: "04",
    title: "Protocolo Individualizado",
    items: [
      "Suplementação",
      "Medicamentos (quando indicados)",
      "Canetas emagrecedoras",
      "Estimulantes e peptídeos",
    ],
    footer: "Sempre com base técnica, ética e acompanhamento.",
  },
  {
    icon: <FlaskConical className="w-7 h-7" />,
    num: "05",
    title: "Interpretação de Exames",
    items: [
      "Identificação de desequilíbrios",
      "Otimização de resultados",
      "Prevenção de riscos",
    ],
    footer: "Saúde sempre vem antes da estética.",
  },
  {
    icon: <Headphones className="w-7 h-7" />,
    num: "06",
    title: "Suporte Ativo",
    items: [
      "Acesso direto ao suporte",
      "Atendimento dentro do horário estabelecido",
      "Acompanhamento contínuo",
    ],
    footer: "Você não fica sozinho no processo.",
  },
  {
    icon: <FileText className="w-7 h-7" />,
    num: "07",
    title: "Requisição de Exames",
    items: ["Orientação e educação em saúde fazem parte do método."],
    footer: "",
    optional: true,
  },
];

const HowItWorksSection = () => (
  <section id="como-funciona" className="py-24 px-6">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Como Funciona a <span className="gradient-text">Consultoria</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Um método completo, do diagnóstico à transformação — cada etapa pensada para o seu resultado.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="glass rounded-2xl p-6 group hover:glow-border transition-all duration-500 relative"
          >
            {step.optional && (
              <span className="absolute -top-3 right-4 text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
                Opcional
              </span>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-primary-foreground shrink-0">
                {step.icon}
              </div>
              <div>
                <span className="text-xs font-semibold gradient-text uppercase tracking-wider">
                  Etapa {step.num}
                </span>
                <h3 className="font-display text-lg font-semibold text-foreground leading-tight">
                  {step.title}
                </h3>
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              {step.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1 text-xs">●</span>
                  {item}
                </li>
              ))}
            </ul>
            {step.footer && (
              <p className="text-sm font-medium text-foreground/80 italic border-t border-border/50 pt-3">
                {step.footer}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
