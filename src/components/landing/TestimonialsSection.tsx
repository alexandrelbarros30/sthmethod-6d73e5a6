import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useLandingTestimonials } from "@/hooks/useLandingData";

const TestimonialsSection = () => {
  const { data: testimonials } = useLandingTestimonials();
  const active = testimonials?.filter((t) => t.active) ?? [];

  if (active.length === 0) return null;

  return (
    <section id="depoimentos" className="py-24 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="text-center mb-16 md:mb-20">
          <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-brand mb-5">Depoimentos</div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-foreground">
            <span className="text-brand">O que dizem</span> nossos alunos.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light max-w-2xl mx-auto mt-5">
            Histórias reais de quem decidiu evoluir com método.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/40">
          {active.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="bg-background p-8 md:p-10 relative"
            >
              {t.tag && (
                <span className="absolute top-6 right-6 text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                  {t.tag}
                </span>
              )}
              <p className="text-foreground text-lg md:text-xl font-light leading-relaxed tracking-[-0.01em] mb-6">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{t.name}</p>
                  <p className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground">Aluno STH</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
