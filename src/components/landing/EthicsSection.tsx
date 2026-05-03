import { motion } from "framer-motion";
import { ShieldCheck, BookOpen, HeartPulse } from "lucide-react";

const values = [
  { icon: <HeartPulse className="w-6 h-6" />, title: "Acompanhamento", desc: "Cada aluno é acompanhado de perto, com ajustes constantes e comunicação direta." },
  { icon: <BookOpen className="w-6 h-6" />, title: "Educação em Saúde", desc: "Orientamos e educamos para que você entenda cada decisão do seu protocolo." },
  { icon: <ShieldCheck className="w-6 h-6" />, title: "Ética & Responsabilidade", desc: "Nada genérico. Nada milagroso. Resultados vêm com constância e responsabilidade." },
];

const EthicsSection = () => (
  <section className="py-24 md:py-32 px-6 border-t border-border/40">
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16 md:mb-20"
      >
        <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-5">Compromisso</div>
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-foreground">
          Orientar, acompanhar e educar.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground font-light max-w-2xl mx-auto mt-5">
          Resultados vêm com constância e responsabilidade.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/40">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="bg-background text-center p-8 md:p-10"
          >
            <div className="text-foreground mb-4 inline-flex">{v.icon}</div>
            <h3 className="text-foreground text-lg font-semibold tracking-[-0.02em] mb-2">{v.title}</h3>
            <p className="text-muted-foreground text-[14px] font-light leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default EthicsSection;
