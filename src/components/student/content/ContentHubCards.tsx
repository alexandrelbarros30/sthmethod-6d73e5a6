import { motion } from "framer-motion";
import { ChevronRight, Beaker, Brain, UtensilsCrossed, Layers } from "lucide-react";
import cardHormoniosImg from "@/assets/card-hormonios.jpg";
import cardDicasImg from "@/assets/card-dicas.jpg";
import cardReceitasImg from "@/assets/card-receitas.jpg";
import cardCombinacoesImg from "@/assets/card-combinacoes.jpg";

export type ContentSection = "hormonios" | "dicas" | "receitas" | "combinacoes";

const G = {
  accent: "hsl(0 0% 96%)",
  card: "hsl(0 0% 6%)",
  border: "hsl(0 0% 14%)",
  t96: "hsl(0 0% 96%)",
  t92: "hsl(0 0% 92%)",
  t80: "hsl(0 0% 80%)",
  t60: "hsl(0 0% 60%)",
  t50: "hsl(0 0% 50%)",
  t45: "hsl(0 0% 45%)",
  t40: "hsl(0 0% 40%)",
  t10: "hsl(0 0% 10%)",
};

const sections = [
  {
    id: "hormonios" as ContentSection,
    tag: "Compostos",
    title: "Hormônios e Compostos",
    subtitle: "3 famílias · 15 compostos",
    img: cardHormoniosImg,
    icon: Beaker,
    accentHue: "145",
    meta: "Gamificação interativa",
  },
  {
    id: "dicas" as ContentSection,
    tag: "Estratégia",
    title: "Dicas Estratégicas",
    subtitle: "8 temas fundamentais",
    img: cardDicasImg,
    icon: Brain,
    accentHue: "210",
    meta: "Narrativa interativa",
  },
  {
    id: "receitas" as ContentSection,
    tag: "Nutrição",
    title: "Receitas Saudáveis",
    subtitle: "Pratos inteligentes",
    img: cardReceitasImg,
    icon: UtensilsCrossed,
    accentHue: "30",
    meta: "Macros detalhados",
  },
  {
    id: "combinacoes" as ContentSection,
    tag: "Estratégia",
    title: "Combinações Estratégicas",
    subtitle: "Definição · Hipertrofia",
    img: cardCombinacoesImg,
    icon: Layers,
    accentHue: "270",
    meta: "6 combinações",
  },
];

interface Props {
  onNavigate: (section: ContentSection) => void;
}

const ContentHubCards = ({ onNavigate }: Props) => (
  <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 pb-2">
    {sections.map((s, i) => {
      const accent = `hsl(0 0% 96%)`;
      const accentBg = `hsl(0 0% 0% / 0.45)`;
      const accentBorder = `hsl(0 0% 100% / 0.2)`;

      return (
        <motion.button
          key={s.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 * i, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onNavigate(s.id)}
          className="snap-center flex-shrink-0 w-[72vw] max-w-[280px] text-left rounded-[22px] overflow-hidden relative group backdrop-blur-xl"
          style={{
            border: `1px solid hsl(0 0% 100% / 0.12)`,
            background: "rgb(255 255 255 / 0.03)",
            boxShadow: `0 10px 30px -12px rgb(0 0 0 / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.08)`,
          }}
        >
          {/* Diagonal glass sheen */}
          <div
            className="absolute inset-0 pointer-events-none z-20 opacity-40"
            style={{
              background:
                "linear-gradient(115deg, transparent 40%, rgb(255 255 255 / 0.06) 50%, transparent 60%)",
            }}
          />
          {/* Image */}
          <div className="relative h-36 overflow-hidden">
            <img
              src={s.img}
              alt={s.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              width={800}
              height={512}
              loading={i === 0 ? undefined : "lazy"}
            />

            {/* Gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, hsl(0 0% 0% / 0.65) 0%, hsl(0 0% 0% / 0.1) 60%, transparent 100%)`,
              }}
            />

            {/* Tag */}
            <div className="absolute top-2.5 left-2.5">
              <span
                className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] font-bold px-2 py-1 rounded-full backdrop-blur-md"
                style={{
                  background: accentBg,
                  color: G.t96,
                  border: `0.5px solid ${accentBorder}`,
                }}
              >
                <s.icon className="w-2.5 h-2.5" />
                {s.tag}
              </span>
            </div>

            {/* Title over image */}
            <div className="absolute bottom-0 left-0 right-0 p-3.5 space-y-0.5">
              <h3 className="text-[15px] font-bold tracking-tight leading-tight" style={{ color: G.t96 }}>
                {s.title}
              </h3>
              <p className="text-[11px]" style={{ color: G.t50 }}>
                {s.subtitle}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-3.5 py-2.5 flex items-center justify-between relative z-10"
            style={{
              background: "rgb(255 255 255 / 0.015)",
              borderTop: `1px solid hsl(0 0% 100% / 0.08)`,
            }}
          >
            <span className="text-[10px] font-medium" style={{ color: G.t40 }}>
              {s.meta}
            </span>
            <div className="flex items-center gap-0.5">
              <span
                className="text-[10px] font-semibold"
                style={{ color: accent }}
              >
                Explorar
              </span>
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronRight className="w-3 h-3" style={{ color: accent }} />
              </motion.div>
            </div>
          </div>
        </motion.button>
      );
    })}
  </div>
);

export default ContentHubCards;
