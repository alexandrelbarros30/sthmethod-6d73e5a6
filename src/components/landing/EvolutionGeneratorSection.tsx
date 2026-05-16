import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Camera, Zap } from "lucide-react";

const EvolutionGeneratorSection = () => {
  return (
    <section id="gerador-evolucao" className="py-24 md:py-32 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden border border-border/40 bg-gradient-to-br from-[hsl(0_0%_6%)] via-[hsl(0_0%_4%)] to-black text-white p-8 sm:p-14 md:p-20 text-center"
        >
          <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--brand))_0%,transparent_60%)]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.25em] uppercase text-brand mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Novo · Gratuito
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] mb-5">
              Veja sua <span className="text-brand">evolução</span><br className="hidden sm:block" /> em segundos.
            </h2>

            <p className="text-base md:text-lg text-white/60 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
              Envie suas fotos antes e depois. Nossa IA gera uma análise visual profissional do seu progresso — instantânea e gratuita.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto mb-10">
              {[
                { icon: Camera, label: "Envie suas fotos" },
                { icon: Zap, label: "Análise por IA" },
                { icon: Sparkles, label: "Resultado em 10s" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 flex flex-col items-center gap-2"
                >
                  <item.icon className="w-5 h-5 text-brand" strokeWidth={1.5} />
                  <span className="text-[12px] text-white/80 font-light tracking-tight">{item.label}</span>
                </div>
              ))}
            </div>

            <Link to="/evolucao">
              <Button
                size="lg"
                className="rounded-full bg-white text-black hover:bg-white/90 px-8 h-12 text-[15px] font-medium"
              >
                Gerar minha evolução
              </Button>
            </Link>

            <p className="text-[11px] text-white/40 font-light mt-6">
              Já utilizado por <span className="text-white/70 font-medium">+1000 pessoas</span> · Sem cadastro
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EvolutionGeneratorSection;