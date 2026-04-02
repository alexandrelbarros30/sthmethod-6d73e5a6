import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import type { Compound, Family } from "./compoundData";
import { cardFields } from "./compoundData";

const G = {
  card: "hsl(0 0% 6%)",
  border: "hsl(0 0% 14%)",
  borderSoft: "hsl(0 0% 12%)",
  t96: "hsl(0 0% 96%)",
  t80: "hsl(0 0% 80%)",
  t45: "hsl(0 0% 45%)",
  t40: "hsl(0 0% 40%)",
};

interface Props {
  family: Family;
  selected: string | null;
  visited: Set<string>;
  onSelect: (id: string) => void;
}

const CompoundDetail = ({ family, selected, visited, onSelect }: Props) => {
  const accent = `hsl(${family.accentHue} 60% 42%)`;
  const accentBg = `hsl(${family.accentHue} 60% 42% / 0.12)`;
  const accentBorder = `hsl(${family.accentHue} 60% 42% / 0.4)`;
  const accentBorderSoft = `hsl(${family.accentHue} 60% 42% / 0.2)`;
  const accentText06 = `hsl(${family.accentHue} 60% 42% / 0.06)`;
  const compound = family.compounds.find((c) => c.id === selected);

  return (
    <div className="space-y-4">
      {/* Horizontal selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4">
        {family.compounds.map((c, i) => {
          const isActive = selected === c.id;
          const isVisited = visited.has(c.id);
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(c.id)}
              className="snap-center flex-shrink-0 rounded-xl px-3.5 py-2.5 flex flex-col items-center gap-1 min-w-[88px] transition-all duration-200"
              style={{
                background: isActive ? accentBg : G.card,
                border: isActive ? `1px solid ${accentBorder}` : `0.5px solid ${G.border}`,
              }}
            >
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-medium whitespace-nowrap" style={{ color: isActive ? accent : G.t80 }}>
                  {c.name}
                </span>
                {isVisited && !isActive && <Check className="w-3 h-3" style={{ color: "hsl(142 60% 40%)" }} />}
              </div>
              <span className="text-[10px] whitespace-nowrap" style={{ color: G.t45 }}>{c.tag}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Compound content */}
      <AnimatePresence mode="wait">
        {compound && (
          <motion.div
            key={compound.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {/* Image */}
            <div className="rounded-xl overflow-hidden relative" style={{ border: `0.5px solid ${G.border}` }}>
              <img src={compound.image} alt={compound.name} className="w-full h-44 object-cover" loading="lazy" width={800} height={512} />
              <div
                className="absolute inset-0 flex items-end p-4"
                style={{ background: "linear-gradient(to top, hsl(0 0% 3% / 0.85), transparent 60%)" }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold" style={{ color: G.t96 }}>{compound.name}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: accentBg, color: accent, border: `0.5px solid ${accentBorderSoft}` }}
                    >
                      {compound.tag}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: accent }}>{compound.subheadline}</p>
                </div>
              </div>
            </div>

            {/* Fields */}
            {cardFields.map((field, i) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl p-4 space-y-1.5"
                style={{
                  background: field.key === "atencao" ? accentText06 : G.card,
                  border: field.key === "atencao" ? `0.5px solid ${accentBorderSoft}` : `0.5px solid ${G.borderSoft}`,
                }}
              >
                <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: field.key === "atencao" ? accent : G.t40 }}>
                  {field.label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: G.t80 }}>{compound[field.key]}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompoundDetail;
