import { motion } from "framer-motion";
import { ShieldCheck, BookOpen, HeartPulse } from "lucide-react";
import ethicsImg from "@/assets/apple-bw-ethics.jpg";

const values = [
  { icon: <HeartPulse className="w-6 h-6" />, title: "Acompanhamento", desc: "Cada aluno é acompanhado de perto, com ajustes constantes e comunicação direta." },
  { icon: <BookOpen className="w-6 h-6" />, title: "Educação em Saúde", desc: "Orientamos e educamos para que você entenda cada decisão do seu protocolo." },
  { icon: <ShieldCheck className="w-6 h-6" />, title: "Ética & Responsabilidade", desc: "Nada genérico. Nada milagroso. Resultados vêm com constância e responsabilidade." },
];

const EthicsSection = () => (
  <section className="py-24 md:py-32 px-6 bg-[hsl(0_0%_4%)] text-white">
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16 md:mb-20"
      >
        <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-brand mb-5">Compromisso</div>
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-white">
          Orientar, acompanhar e educar.
        </h2>
        <p className="text-base md:text-lg text-white/60 font-light max-w-2xl mx-auto mt-5">
          Resultados vêm com constância e responsabilidade.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden mb-16 border border-white/10"
      >
        <img src={ethicsImg} alt="Ética & saúde" width={1920} height={1080} loading="lazy" className="w-full h-full object-cover grayscale" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(0_0%_4%)] via-transparent to-transparent" />
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 text-right">
          <div className="text-[10px] tracking-[0.25em] uppercase text-brand mb-2">Saúde primeiro</div>
          <p className="text-white text-xl md:text-3xl font-semibold tracking-[-0.02em] max-w-md">Ciência. Cuidado. Verdade.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="bg-[hsl(0_0%_4%)] text-center p-8 md:p-10"
          >
            <div className="text-brand mb-4 inline-flex">{v.icon}</div>
            <h3 className="text-white text-lg font-semibold tracking-[-0.02em] mb-2">{v.title}</h3>
            <p className="text-white/60 text-[14px] font-light leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default EthicsSection;
