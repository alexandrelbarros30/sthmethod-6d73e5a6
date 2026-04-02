import { motion } from "framer-motion";
import { ChevronRight, Beaker, Brain, UtensilsCrossed } from "lucide-react";
import cardHormoniosImg from "@/assets/card-hormonios.jpg";
import cardDicasImg from "@/assets/card-dicas.jpg";
import cardReceitasImg from "@/assets/card-receitas.jpg";

export type ContentSection = "hormonios" | "dicas" | "receitas";

const G = {
  accent: "hsl(145 60% 42%)",
  card: "hsl(0 0% 6%)",
  border: "hsl(0 0% 14%)",
  t96: "hsl(0 0% 96%)",
  t80: "hsl(0 0% 80%)",
  t50: "hsl(0 0% 50%)",
  t40: "hsl(0 0% 40%)",
};

const sections = [
  {
    id: "hormonios" as ContentSection,
    tag: "Compostos",
    title: "Hormônios e Compostos",
    subtitle: "3 famílias. 15 compostos. A base que define o resultado.",
    img: cardHormoniosImg,
    icon: Beaker,
    accentHue: "145",
  },
  {
    id: "dicas" as ContentSection,
    tag: "Estratégia",
    title: "Dicas Estratégicas",
    subtitle: "8 temas que separam quem sabe de quem acha que sabe.",
    img: cardDicasImg,
    icon: Brain,
    accentHue: "210",
  },
  {
    id: "receitas" as ContentSection,
    tag: "Nutrição",
    title: "Receitas Funcionais",
    subtitle: "Pratos pensados pra quem treina sério e come com inteligência.",
    img: cardReceitasImg,
    icon: UtensilsCrossed,
    accentHue: "30",
  },
];

interface Props {
  onNavigate: (section: ContentSection) => void;
}

const ContentHubCards = ({ onNavigate }: Props) => (
  <div className="space-y-4">
    {sections.map((s, i) => {
      const accent = `hsl(${s.accentHue} 60% 42%)`;
      const accentBg = `hsl(${s.accentHue} 60% 42% / 0.12)`;
      const accentBorder = `hsl(${s.accentHue} 60% 42% / 0.3)`;

      return (
        <motion.button
          key={s.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 * i, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onNavigate(s.id)}
          className="w-full text-left rounded-2xl overflow-hidden relative group"
          style={{ border: `0.5px solid ${G.border}` }}
        >
          {/* Image */}
          <img
            src={s.img}
            alt={s.title}
            className="w-full h-52 object-cover transition-transform duration-700 group-hover:scale-105"
            width={800}
            height={512}
            loading={i === 0 ? undefined : "lazy"}
          />

          {/* Gradient overlay */}
          <div
            className="absolute inset-0 flex flex-col justify-end p-5 space-y-2.5"
            style={{
              background: `linear-gradient(to top, hsl(0 0% 2% / 0.95) 0%, hsl(0 0% 2% / 0.6) 50%, transparent 100%)`,
            }}
          >
            {/* Tag */}
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm"
                style={{ background: accentBg, color: accent, border: `0.5px solid ${accentBorder}` }}
              >
                <s.icon className="w-3 h-3" />
                {s.tag}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold tracking-tight leading-tight" style={{ color: G.t96 }}>
              {s.title}
            </h3>

            {/* Subtitle */}
            <p className="text-[13px] leading-relaxed" style={{ color: G.t50 }}>
              {s.subtitle}
            </p>

            {/* CTA */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs font-semibold" style={{ color: accent }}>
                Explorar
              </span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronRight className="w-3.5 h-3.5" style={{ color: accent }} />
              </motion.div>
            </div>
          </div>
        </motion.button>
      );
    })}
  </div>
);

export default ContentHubCards;
