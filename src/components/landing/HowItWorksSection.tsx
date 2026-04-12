import { motion } from "framer-motion";
import {
  Brain, Utensils, Dumbbell, Pill, FlaskConical, Headphones, FileText,
} from "lucide-react";
import { useLandingSteps } from "@/hooks/useLandingData";

const iconMap: Record<string, React.ReactNode> = {
  Brain: <Brain className="w-7 h-7" />,
  Utensils: <Utensils className="w-7 h-7" />,
  Dumbbell: <Dumbbell className="w-7 h-7" />,
  Pill: <Pill className="w-7 h-7" />,
  FlaskConical: <FlaskConical className="w-7 h-7" />,
  Headphones: <Headphones className="w-7 h-7" />,
  FileText: <FileText className="w-7 h-7" />,
};

const HowItWorksSection = () => {
  const { data: steps } = useLandingSteps();
  const active = steps?.filter((s) => s.active) ?? [];

  if (active.length === 0) return null;

  return (
    <section id="como-funciona" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Como Funciona a <span className="gradient-text">STH METHOD</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Um método completo, do diagnóstico à transformação — cada etapa pensada para o seu resultado.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {active.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="glass rounded-2xl p-6 group hover:glow-border transition-all duration-500 relative"
            >
              {step.is_optional && (
                <span className="absolute -top-3 right-4 text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
                  Opcional
                </span>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-primary-foreground shrink-0">
                  {iconMap[step.icon] || <Brain className="w-7 h-7" />}
                </div>
                <div>
                  <span className="text-xs font-semibold gradient-text uppercase tracking-wider">
                    Etapa {String(i + 1).padStart(2, "0")}
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
};

export default HowItWorksSection;
