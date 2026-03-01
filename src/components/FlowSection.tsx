import { motion } from "framer-motion";

const steps = [
  { num: "01", title: "Onboarding", desc: "Anamnese completa, objetivos e exames" },
  { num: "02", title: "Prescrição", desc: "Dieta, treino e protocolos personalizados" },
  { num: "03", title: "Acompanhamento", desc: "Check-ins, métricas e ajustes contínuos" },
  { num: "04", title: "Evolução", desc: "Resultados visíveis, retenção e escala" },
];

const FlowSection = () => (
  <section className="py-24 px-6">
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Fluxo da <span className="gradient-text">Jornada</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Do primeiro contato à transformação completa — cada etapa foi desenhada para maximizar resultados e engajamento.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />

        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="text-center relative"
          >
            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4 text-primary-foreground font-display font-bold text-lg relative z-10">
              {step.num}
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">{step.title}</h3>
            <p className="text-muted-foreground text-sm">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FlowSection;
