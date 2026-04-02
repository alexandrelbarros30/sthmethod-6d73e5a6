import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Family } from "./compoundData";

const G = {
  card: "hsl(0 0% 6%)",
  border: "hsl(0 0% 14%)",
  t96: "hsl(0 0% 96%)",
  t80: "hsl(0 0% 80%)",
  t55: "hsl(0 0% 55%)",
  t45: "hsl(0 0% 45%)",
  t40: "hsl(0 0% 40%)",
};

interface Props {
  family: Family;
  index: number;
  visitedCount: number;
  onClick: () => void;
}

const FamilyCard = ({ family, index, visitedCount, onClick }: Props) => {
  const accent = `hsl(${family.accentHue} 60% 42%)`;
  const accentBg = `hsl(${family.accentHue} 60% 42% / 0.08)`;
  const accentBorder = `hsl(${family.accentHue} 60% 42% / 0.25)`;
  const total = family.compounds.length;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 space-y-3 transition-all"
      style={{ background: G.card, border: `0.5px solid ${G.border}` }}
    >
      {/* Tag */}
      <span
        className="inline-block text-[10px] uppercase tracking-[0.2em] font-semibold px-2.5 py-1 rounded-full"
        style={{ background: accentBg, color: accent, border: `0.5px solid ${accentBorder}` }}
      >
        {family.id === "testosterona" ? "Base" : family.id === "dht" ? "Estética" : "19-nor"}
      </span>

      {/* Title */}
      <h3 className="text-lg font-bold tracking-tight" style={{ color: G.t96 }}>
        {family.title}
      </h3>

      {/* Subheadline */}
      <p className="text-sm leading-relaxed" style={{ color: accent }}>
        {family.subheadline}
      </p>

      {/* Description */}
      <p className="text-[13px] leading-relaxed" style={{ color: G.t55 }}>
        {family.description}
      </p>

      {/* Compounds preview */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {family.compounds.map((c) => (
          <span key={c.id} className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: "hsl(0 0% 10%)", color: G.t45 }}>
            {c.name}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px]" style={{ color: G.t40 }}>
          {visitedCount}/{total} explorados
        </span>
        <div className="flex items-center gap-1 text-xs font-medium" style={{ color: accent }}>
          Explorar <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Mini progress */}
      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 10%)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: accent }}
          initial={{ width: 0 }}
          animate={{ width: `${(visitedCount / total) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.button>
  );
};

export default FamilyCard;
