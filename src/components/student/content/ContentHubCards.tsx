import { motion } from "framer-motion";
import { ChevronRight, Beaker, Brain, UtensilsCrossed, Flame, Clock } from "lucide-react";
import cardHormoniosImg from "@/assets/card-hormonios.jpg";
import cardDicasImg from "@/assets/card-dicas.jpg";
import cardReceitasImg from "@/assets/card-receitas.jpg";

export type ContentSection = "hormonios" | "dicas" | "receitas" | "combinacoes";

const G = {
  accent: "hsl(145 60% 42%)",
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
    subtitle: "3 famílias. 15 compostos. A base que define o resultado.",
    img: cardHormoniosImg,
    icon: Beaker,
    accentHue: "145",
    preview: {
      type: "pills" as const,
      items: ["Testosterona", "DHT", "19-nor Nandrolona"],
      meta: "15 compostos • Gamificação interativa",
    },
  },
  {
    id: "dicas" as ContentSection,
    tag: "Estratégia",
    title: "Dicas Estratégicas",
    subtitle: "8 temas que separam quem sabe de quem acha que sabe.",
    img: cardDicasImg,
    icon: Brain,
    accentHue: "210",
    preview: {
      type: "topics" as const,
      items: ["Adaptação Metabólica", "TRH Hormonal", "Treino em Jejum", "Vitamina D3", "+4 temas"],
      meta: "8 temas • Narrativa interativa",
    },
  },
  {
    id: "receitas" as ContentSection,
    tag: "Nutrição",
    title: "Receitas Saudáveis",
    subtitle: "Pratos pensados pra quem treina sério e come com inteligência.",
    img: cardReceitasImg,
    icon: UtensilsCrossed,
    accentHue: "30",
    preview: {
      type: "recipes" as const,
      items: [
        { name: "Poke de Salmão", kcal: 420, time: "20 min" },
        { name: "Moqueca Fit", kcal: 360, time: "35 min" },
        { name: "Panqueca Proteica", kcal: 290, time: "15 min" },
      ],
      meta: "12 receitas • Macros detalhados",
    },
  },
];

interface Props {
  onNavigate: (section: ContentSection) => void;
}

const ContentHubCards = ({ onNavigate }: Props) => (
  <div className="space-y-5">
    {sections.map((s, i) => {
      const accent = `hsl(${s.accentHue} 60% 42%)`;
      const accentSoft = `hsl(${s.accentHue} 50% 55%)`;
      const accentBg = `hsl(${s.accentHue} 60% 42% / 0.12)`;
      const accentBorder = `hsl(${s.accentHue} 60% 42% / 0.3)`;

      return (
        <motion.button
          key={s.id}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * i, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onNavigate(s.id)}
          className="w-full text-left rounded-2xl overflow-hidden relative group"
          style={{ border: `0.5px solid ${G.border}` }}
        >
          {/* Image */}
          <img
            src={s.img}
            alt={s.title}
            className="w-full h-44 object-cover transition-transform duration-700 group-hover:scale-105"
            width={800}
            height={512}
            loading={i === 0 ? undefined : "lazy"}
          />

          {/* Gradient overlay on image */}
          <div
            className="absolute inset-0 h-44"
            style={{
              background: `linear-gradient(to top, hsl(0 0% 4% / 1) 0%, hsl(0 0% 4% / 0.5) 60%, transparent 100%)`,
            }}
          />

          {/* Text on image */}
          <div className="absolute top-0 left-0 right-0 h-44 flex flex-col justify-end p-5 space-y-1.5">
            {/* Tag */}
            <span
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm w-fit"
              style={{ background: accentBg, color: accent, border: `0.5px solid ${accentBorder}` }}
            >
              <s.icon className="w-3 h-3" />
              {s.tag}
            </span>

            <h3 className="text-lg font-bold tracking-tight leading-tight" style={{ color: G.t96 }}>
              {s.title}
            </h3>

            <p className="text-[12px] leading-relaxed" style={{ color: G.t50 }}>
              {s.subtitle}
            </p>
          </div>

          {/* ── Content preview area ── */}
          <div className="p-4 space-y-3" style={{ background: G.card }}>

            {/* Pills preview (hormônios) */}
            {s.preview.type === "pills" && (
              <div className="flex flex-wrap gap-1.5">
                {(s.preview.items as string[]).map((item) => (
                  <span
                    key={item}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                    style={{ background: G.t10, color: G.t80 }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}

            {/* Topics preview (dicas) */}
            {s.preview.type === "topics" && (
              <div className="flex flex-wrap gap-1.5">
                {(s.preview.items as string[]).map((item) => (
                  <span
                    key={item}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                    style={{
                      background: item.startsWith("+") ? accentBg : G.t10,
                      color: item.startsWith("+") ? accent : G.t80,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}

            {/* Recipes preview */}
            {s.preview.type === "recipes" && (
              <div className="space-y-2">
                {(s.preview.items as { name: string; kcal: number; time: string }[]).map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: G.t10 }}
                  >
                    <span className="text-[12px] font-medium" style={{ color: G.t92 }}>{r.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: `hsl(${s.accentHue} 70% 55%)` }}>
                        <Flame className="w-3 h-3" /> {r.kcal}
                      </span>
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: G.t45 }}>
                        <Clock className="w-3 h-3" /> {r.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-medium" style={{ color: G.t40 }}>
                {s.preview.meta}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold" style={{ color: accent }}>
                  Explorar
                </span>
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: accent }} />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.button>
      );
    })}
  </div>
);

export default ContentHubCards;
