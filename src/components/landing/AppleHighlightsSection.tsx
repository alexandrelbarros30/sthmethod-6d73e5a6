import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import dietImg from "@/assets/card-dieta.jpg";
import protocoloImg from "@/assets/card-protocolo.jpg";
import treinoImg from "@/assets/card-treino.jpg";
import bioImg from "@/assets/card-bioimpedancia.jpg";

const highlights = [
  {
    eyebrow: "Dieta",
    title: "Sua dieta,\nfeita para você.",
    desc: "Plano alimentar interativo, com macros calculados e ajuste contínuo.",
    img: dietImg,
    to: "/questionario",
  },
  {
    eyebrow: "Protocolo",
    title: "Suplementação\ncom propósito.",
    desc: "Prescrição clínica baseada em ciência. Nada genérico, nada milagroso.",
    img: protocoloImg,
    to: "/login",
  },
  {
    eyebrow: "Treino",
    title: "Periodização\ninteligente.",
    desc: "Treinos guiados que evoluem com você — semana após semana.",
    img: treinoImg,
    to: "/login",
  },
  {
    eyebrow: "Bioimpedância",
    title: "Composição\ncorporal real.",
    desc: "Acompanhamento de gordura, massa magra e hidratação ao longo do tempo.",
    img: bioImg,
    to: "/login",
  },
];

const AppleHighlightsSection = () => (
  <>
    {/* Faixa info estilo Apple — preço + CTA */}
    <div className="border-y border-border/40 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="text-[13px] sm:text-[15px] text-foreground leading-tight">
          <span className="font-medium">Consultoria personalizada</span>
          <span className="text-muted-foreground"> · método clínico</span>
        </div>
        <Link
          to="/login"
          className="shrink-0 inline-flex items-center justify-center h-8 sm:h-9 px-4 sm:px-5 rounded-full bg-primary text-primary-foreground text-[13px] sm:text-[14px] font-medium hover:opacity-90 transition-opacity"
        >
          Começar
        </Link>
      </div>
    </div>

    <section className="bg-background py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-6 mb-10 sm:mb-14">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.02] text-foreground"
        >
          Comece pelos destaques.
        </motion.h2>
      </div>

      {/* Carrossel horizontal scroll-snap (Apple style) */}
      <div
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-6 px-6 sm:px-10
                   [scrollbar-width:none] [-ms-overflow-style:none]
                   [&::-webkit-scrollbar]:hidden"
      >
        {highlights.map((h, i) => (
          <motion.div
            key={h.eyebrow}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            className="snap-start shrink-0 w-[82%] sm:w-[60%] md:w-[44%] lg:w-[34%]"
          >
            <Link
              to={h.to}
              className="group relative block rounded-[28px] overflow-hidden bg-card aspect-[3/4] sm:aspect-[4/5]"
            >
              <img
                src={h.img}
                alt={h.eyebrow}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />

              <div className="absolute top-0 left-0 right-0 p-6 sm:p-8 text-center">
                <p className="text-[11px] sm:text-[12px] font-semibold tracking-[0.18em] uppercase text-white/85 mb-2">
                  {h.eyebrow}
                </p>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.03em] leading-[1.05] text-white whitespace-pre-line">
                  {h.title}
                </h3>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex items-end justify-between gap-3">
                <p className="text-[13px] sm:text-[14px] text-white/85 font-light leading-snug max-w-[80%]">
                  {h.desc}
                </p>
                <span className="shrink-0 w-10 h-10 rounded-full bg-white/95 text-black flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  </>
);

export default AppleHighlightsSection;