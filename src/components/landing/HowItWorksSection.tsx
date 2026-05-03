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
    <section id="como-funciona" className="py-24 md:py-32 px-6 bg-[hsl(var(--surface))]">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="text-center mb-16 md:mb-20">
          <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-5">Método</div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-foreground">
            Como funciona a STH METHOD.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light max-w-2xl mx-auto mt-5">
            Do diagnóstico à transformação. Cada etapa pensada para o seu resultado.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/40">
          {active.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="bg-background p-7 md:p-8 relative"
            >
              {step.is_optional && (
                <span className="absolute top-5 right-5 text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                  Opcional
                </span>
              )}
              <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">
                Etapa {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex items-start gap-3 mb-5">
                <div className="text-foreground shrink-0">
                  {iconMap[step.icon] || <Brain className="w-7 h-7" />}
                </div>
                <h3 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] leading-tight text-foreground">
                  {step.title}
                </h3>
              </div>
              <ul className="space-y-2 mb-4">
                {step.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-[14px] text-muted-foreground font-light leading-relaxed">
                    <span className="text-foreground/40 mt-1.5 text-[8px]">●</span>
                    {item}
                  </li>
                ))}
              </ul>
              {step.footer && (
                <p className="text-[13px] text-foreground/70 font-light border-t border-border/40 pt-3 mt-4">
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
