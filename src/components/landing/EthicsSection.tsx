import { motion } from "framer-motion";
import { ShieldCheck, BookOpen, HeartPulse } from "lucide-react";

const values = [
  { icon: <HeartPulse className="w-6 h-6" />, title: "Acompanhamento", desc: "Cada aluno é acompanhado de perto, com ajustes constantes e comunicação direta." },
  { icon: <BookOpen className="w-6 h-6" />, title: "Educação em Saúde", desc: "Orientamos e educamos para que você entenda cada decisão do seu protocolo." },
  { icon: <ShieldCheck className="w-6 h-6" />, title: "Ética & Responsabilidade", desc: "Nada genérico. Nada milagroso. Resultados vêm com constância e responsabilidade." },
];

const EthicsSection = () => (
  <section className="py-24 px-6">
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Nosso <span className="gradient-text">Compromisso</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Nosso trabalho é orientar, acompanhar e educar. Resultados vêm com constância e responsabilidade.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-6 text-center"
          >
            <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4 text-primary-foreground">
              {v.icon}
            </div>
            <h3 className="font-display font-semibold text-foreground text-lg mb-2">{v.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default EthicsSection;
