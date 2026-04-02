import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Dumbbell, AlertTriangle, MessageCircle, ChevronDown, Layers } from "lucide-react";

import comboDefIni from "@/assets/combo-def-iniciante.jpg";
import comboDefInt from "@/assets/combo-def-intermediario.jpg";
import comboDefAdv from "@/assets/combo-def-avancado.jpg";
import comboHipIni from "@/assets/combo-hiper-iniciante.jpg";
import comboHipInt from "@/assets/combo-hiper-intermediario.jpg";
import comboHipAdv from "@/assets/combo-hiper-avancado.jpg";

const G = {
  accent: "hsl(145 60% 42%)",
  accentSoft: "hsl(145 50% 55%)",
  accentBg: "hsl(145 60% 42% / 0.10)",
  accentBorder: "hsl(145 60% 42% / 0.2)",
  accentGlow: "hsl(145 60% 42% / 0.25)",
  bg: "hsl(0 0% 3%)",
  card: "hsl(0 0% 6%)",
  border: "hsl(0 0% 14%)",
  t96: "hsl(0 0% 96%)",
  t92: "hsl(0 0% 92%)",
  t80: "hsl(0 0% 80%)",
  t65: "hsl(0 0% 65%)",
  t50: "hsl(0 0% 50%)",
  t45: "hsl(0 0% 45%)",
  t40: "hsl(0 0% 40%)",
  t30: "hsl(0 0% 30%)",
  t10: "hsl(0 0% 10%)",
};

const levelColors = {
  iniciante: { hue: "145", label: "Iniciante" },
  intermediario: { hue: "45", label: "Intermediário" },
  avancado: { hue: "0", label: "Avançado" },
};

interface ComboCard {
  id: string;
  level: keyof typeof levelColors;
  img: string;
  title: string;
  subheadline: string;
  compounds: string[];
  concept: string;
  insight: string;
}

const definicaoCards: ComboCard[] = [
  {
    id: "def-1",
    level: "iniciante",
    img: comboDefIni,
    title: "Base leve de definição",
    subheadline: "Controle e adaptação do corpo",
    compounds: ["Testosterona (base)", "Oxandrolona"],
    concept: "Foco em adaptação metabólica e preservação de massa muscular.",
    insight: "Menos agressivo, mais controlado.",
  },
  {
    id: "def-2",
    level: "intermediario",
    img: comboDefInt,
    title: "Definição com refinamento",
    subheadline: "Mais estética, menos retenção",
    compounds: ["Testosterona", "Oxandrolona", "Stanozolol"],
    concept: "Aumento da densidade muscular e redução de retenção.",
    insight: "Exige maior controle do ambiente hormonal.",
  },
  {
    id: "def-3",
    level: "avancado",
    img: comboDefAdv,
    title: "Estética extrema",
    subheadline: "Alta definição e controle fino",
    compounds: ["Testosterona", "Masteron", "Stanozolol ou Oxandrolona"],
    concept: "Máximo foco em densidade e estética.",
    insight: "Pequenos erros geram grandes impactos.",
  },
];

const hipertrofiaCards: ComboCard[] = [
  {
    id: "hip-1",
    level: "iniciante",
    img: comboHipIni,
    title: "Construção controlada",
    subheadline: "Base sólida de evolução",
    compounds: ["Testosterona", "Dianabol (fase inicial)"],
    concept: "Ganho de força e volume com base hormonal.",
    insight: "Foco em resposta inicial do corpo.",
  },
  {
    id: "hip-2",
    level: "intermediario",
    img: comboHipInt,
    title: "Evolução estrutural",
    subheadline: "Força + recuperação",
    compounds: ["Testosterona", "Nandrolona (Deca ou NPP)"],
    concept: "Aumento de síntese proteica e suporte articular.",
    insight: "Recuperação começa a ser diferencial.",
  },
  {
    id: "hip-3",
    level: "avancado",
    img: comboHipAdv,
    title: "Máxima transformação",
    subheadline: "Massa + recomposição",
    compounds: ["Testosterona", "Trembolona", "(variação com Nandrolona ou outros)"],
    concept: "Alta capacidade de transformação corporal.",
    insight: "Exige leitura precisa do organismo.",
  },
];

const whatsappUrl =
  "https://wa.me/5521998496289?text=Fala,%20quero%20ajustar%20meu%20protocolo%20com%20base%20no%20meu%20objetivo";

const ComboCardComponent = ({ card, index }: { card: ComboCard; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const lc = levelColors[card.level];
  const accent = `hsl(${lc.hue} 60% 42%)`;
  const accentBg = `hsl(${lc.hue} 60% 42% / 0.12)`;
  const accentBorder = `hsl(${lc.hue} 60% 42% / 0.25)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="rounded-2xl overflow-hidden"
      style={{ border: `0.5px solid ${G.border}`, background: G.card }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <motion.img
          src={card.img}
          alt={card.title}
          className="w-full h-full object-cover"
          loading="lazy"
          width={640}
          height={896}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, hsl(0 0% 3% / 0.95) 0%, hsl(0 0% 3% / 0.4) 50%, transparent 100%)`,
          }}
        />

        {/* Level badge */}
        <div className="absolute top-3 left-3">
          <span
            className="text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{ background: accentBg, color: accent, border: `0.5px solid ${accentBorder}` }}
          >
            {lc.label}
          </span>
        </div>

        {/* Title over image */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1">
          <h3 className="text-lg font-bold tracking-tight" style={{ color: G.t96 }}>
            {card.title}
          </h3>
          <p className="text-[12px] font-medium" style={{ color: accent }}>
            {card.subheadline}
          </p>
        </div>
      </div>

      {/* Expandable content */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between"
        style={{ borderTop: `0.5px solid ${G.border}` }}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" style={{ color: accent }} />
          <span className="text-[12px] font-semibold" style={{ color: G.t80 }}>
            {card.compounds.length} compostos na combinação
          </span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-4 h-4" style={{ color: G.t45 }} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Compounds */}
              <div className="flex flex-wrap gap-1.5">
                {card.compounds.map((c) => (
                  <span
                    key={c}
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg"
                    style={{ background: G.t10, color: G.t92 }}
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* Concept */}
              <div className="rounded-xl p-3 space-y-1" style={{ background: G.t10 }}>
                <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: G.t40 }}>
                  Conceito
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: G.t80 }}>
                  {card.concept}
                </p>
              </div>

              {/* Insight */}
              <div
                className="rounded-xl p-3 flex items-start gap-2.5"
                style={{ background: accentBg, border: `0.5px solid ${accentBorder}` }}
              >
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                <p className="text-[12px] leading-relaxed font-medium" style={{ color: accent }}>
                  {card.insight}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CombinationsSection = () => (
  <div className="space-y-8">
    {/* Section 1 — Definição */}
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(15 80% 50% / 0.12)" }}
        >
          <Flame className="w-4 h-4" style={{ color: "hsl(15 80% 55%)" }} />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight" style={{ color: G.t96 }}>
            Emagrecimento / Definição
          </h2>
          <p className="text-[11px]" style={{ color: G.t45 }}>
            Foco em estética, redução e controle
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {definicaoCards.map((card, i) => (
          <ComboCardComponent key={card.id} card={card} index={i} />
        ))}
      </div>
    </div>

    {/* Section 2 — Hipertrofia */}
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(210 70% 50% / 0.12)" }}
        >
          <Dumbbell className="w-4 h-4" style={{ color: "hsl(210 70% 55%)" }} />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight" style={{ color: G.t96 }}>
            Hipertrofia / Construção
          </h2>
          <p className="text-[11px]" style={{ color: G.t45 }}>
            Foco em massa, força e recuperação
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {hipertrofiaCards.map((card, i) => (
          <ComboCardComponent key={card.id} card={card} index={i + 3} />
        ))}
      </div>
    </div>

    {/* Responsible disclaimer */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl p-5 space-y-2"
      style={{ background: G.t10, border: `0.5px solid hsl(45 80% 50% / 0.2)` }}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" style={{ color: "hsl(45 80% 55%)" }} />
        <h3 className="text-sm font-bold" style={{ color: "hsl(45 80% 55%)" }}>
          Isso não é protocolo
        </h3>
      </div>
      <p className="text-[13px] leading-relaxed" style={{ color: G.t65 }}>
        Essas combinações representam padrões observados. O resultado depende do contexto, exames e acompanhamento.
      </p>
    </motion.div>

    {/* CTA */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl p-6 text-center space-y-4"
      style={{
        background: `linear-gradient(160deg, hsl(145 60% 42% / 0.06), ${G.card})`,
        border: `0.5px solid ${G.accentBorder}`,
      }}
    >
      <h3 className="text-lg font-bold" style={{ color: G.t96 }}>
        O resultado não está na combinação. Está no ajuste.
      </h3>
      <p className="text-sm" style={{ color: G.t50 }}>
        Seu corpo responde ao que é feito de forma estratégica.
      </p>
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileTap={{ scale: 0.97 }}
        className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all"
        style={{
          background: `linear-gradient(135deg, ${G.accent}, hsl(150 55% 32%))`,
          color: "hsl(0 0% 100%)",
          boxShadow: `0 4px 20px ${G.accentGlow}`,
        }}
      >
        <MessageCircle className="w-4 h-4" />
        Solicitar ajuste de protocolo
      </motion.a>
    </motion.div>
  </div>
);

export default CombinationsSection;
