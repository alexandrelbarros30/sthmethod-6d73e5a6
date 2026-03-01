import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useLandingTestimonials } from "@/hooks/useLandingData";

const TestimonialsSection = () => {
  const { data: testimonials } = useLandingTestimonials();
  const active = testimonials?.filter((t) => t.active) ?? [];

  if (active.length === 0) return null;

  return (
    <section id="depoimentos" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            O Que Dizem Nossos <span className="gradient-text">Alunos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Histórias reais de quem decidiu evoluir com método e acompanhamento.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {active.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass rounded-2xl p-6 relative group hover:glow-border transition-all duration-500"
            >
              {t.tag && (
                <span className="absolute -top-3 right-4 gradient-bg text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  {t.tag}
                </span>
              )}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-primary-foreground shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">Aluno(a) ST&H</p>
                </div>
              </div>
              <p className="text-secondary-foreground text-sm leading-relaxed italic">
                "{t.text}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
