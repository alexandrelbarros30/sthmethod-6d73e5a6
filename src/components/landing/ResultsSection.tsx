import { motion } from "framer-motion";
import { TrendingUp, Target, ShieldCheck } from "lucide-react";

const pillars = [
  { icon: <Target className="w-6 h-6" />, title: "Método", desc: "Protocolo individualizado, nada genérico." },
  { icon: <TrendingUp className="w-6 h-6" />, title: "Constância", desc: "Acompanhamento contínuo que gera disciplina." },
  { icon: <ShieldCheck className="w-6 h-6" />, title: "Segurança", desc: "Saúde em primeiro lugar, sempre." },
];

const ResultsSection = () => (
  <section id="resultados" className="py-24 px-6 surface">
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Resultados &amp; <span className="gradient-text">Evolução</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Resultados são consequência de método, constância e acompanhamento.
        </p>
      </motion.div>

      {/* Timeline visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass rounded-2xl p-8 md:p-12 mb-12"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
          {[
            { month: "Mês 1", label: "Organização & Ritmo", emoji: "🔄" },
            { month: "Mês 3", label: "Evolução Consistente", emoji: "📈" },
            { month: "Mês 6", label: "Transformação Real", emoji: "🏆" },
          ].map((step, i) => (
            <motion.div
              key={step.month}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center relative z-10 flex-1"
            >
              <div className="text-4xl mb-3">{step.emoji}</div>
              <div className="text-sm font-semibold gradient-text uppercase tracking-wider mb-1">
                {step.month}
              </div>
              <p className="text-foreground font-display font-semibold">{step.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center p-6"
          >
            <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4 text-primary-foreground">
              {p.icon}
            </div>
            <h3 className="font-display font-semibold text-foreground text-lg mb-2">{p.title}</h3>
            <p className="text-muted-foreground text-sm">{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ResultsSection;
