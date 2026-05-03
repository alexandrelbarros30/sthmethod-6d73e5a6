import { motion } from "framer-motion";
import { TrendingUp, Target, ShieldCheck } from "lucide-react";

const pillars = [
  { icon: <Target className="w-6 h-6" />, title: "Método", desc: "Protocolo individualizado, nada genérico." },
  { icon: <TrendingUp className="w-6 h-6" />, title: "Constância", desc: "Acompanhamento contínuo que gera disciplina." },
  { icon: <ShieldCheck className="w-6 h-6" />, title: "Segurança", desc: "Saúde em primeiro lugar, sempre." },
];

const ResultsSection = () => (
  <section id="resultados" className="py-24 md:py-32 px-6 border-t border-border/40">
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16 md:mb-20"
      >
        <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-5">Evolução</div>
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-foreground">
          Resultados são consequência.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground font-light max-w-2xl mx-auto mt-5">
          Método, constância e acompanhamento. Nesta ordem.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="border border-border/40 rounded-2xl p-10 md:p-14 mb-16"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative">
          <div className="hidden md:block absolute top-[28%] left-[12%] right-[12%] h-px bg-border/60" />
          {[
            { month: "Mês 01", label: "Organização & Ritmo" },
            { month: "Mês 03", label: "Evolução Consistente" },
            { month: "Mês 06", label: "Transformação Real" },
          ].map((step, i) => (
            <motion.div
              key={step.month}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center relative z-10 flex-1"
            >
              <div className="w-2 h-2 rounded-full bg-foreground mx-auto mb-5" />
              <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">
                {step.month}
              </div>
              <p className="text-foreground text-lg md:text-xl font-semibold tracking-[-0.02em]">{step.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/40">
        {pillars.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="bg-background text-center p-8"
          >
            <div className="text-foreground mb-4 inline-flex">{p.icon}</div>
            <h3 className="text-foreground text-lg font-semibold tracking-[-0.02em] mb-2">{p.title}</h3>
            <p className="text-muted-foreground text-[14px] font-light leading-relaxed">{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ResultsSection;
