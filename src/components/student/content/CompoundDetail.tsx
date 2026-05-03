import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, Beaker, Activity, Eye } from "lucide-react";
import type { Family } from "./compoundData";
import { cardFields } from "./compoundData";

const G = {
  card: "hsl(0 0% 96%)",
  border: "hsl(0 0% 96%)",
  borderSoft: "hsl(0 0% 96%)",
  t96: "hsl(0 0% 96%)",
  t92: "hsl(0 0% 96%)",
  t80: "hsl(0 0% 96%)",
  t65: "hsl(0 0% 96%)",
  t50: "hsl(0 0% 96%)",
  t45: "hsl(0 0% 96%)",
  t40: "hsl(0 0% 96%)",
  t10: "hsl(0 0% 96%)",
};

const fieldIcons = {
  essencia: Beaker,
  oQueFaz: Activity,
  comportamento: Eye,
  atencao: AlertTriangle,
};

interface Props {
  family: Family;
  selected: string | null;
  visited: Set<string>;
  onSelect: (id: string) => void;
}

const CompoundDetail = ({ family, selected, visited, onSelect }: Props) => {
  const accent = `hsl(0 0% 96%)`;
  const accentSoft = `hsl(0 0% 96%)`;
  const accentBg = `hsl(0 0% 96% / 0.12)`;
  const accentBorder = `hsl(0 0% 96% / 0.4)`;
  const accentBorderSoft = `hsl(0 0% 96% / 0.2)`;
  const accentText06 = `hsl(0 0% 96% / 0.06)`;
  const compound = family.compounds.find((c) => c.id === selected);

  return (
    <div className="space-y-4">
      {/* Horizontal selector — cinematic pills */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4">
        {family.compounds.map((c, i) => {
          const isActive = selected === c.id;
          const isVisited = visited.has(c.id);
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => onSelect(c.id)}
              className="snap-center flex-shrink-0 rounded-xl overflow-hidden relative min-w-[100px] h-[72px] transition-all duration-200"
              style={{
                border: isActive ? `1.5px solid ${accentBorder}` : `0.5px solid ${G.border}`,
                boxShadow: isActive ? `0 0 16px ${accentText06}` : "none",
              }}
            >
              {/* Mini image */}
              <img
                src={c.image}
                alt={c.name}
                className="w-full h-full object-cover"
                loading="lazy"
                width={200}
                height={144}
              />
              <div
                className="absolute inset-0 flex flex-col items-center justify-end pb-2"
                style={{
                  background: isActive
                    ? `linear-gradient(to top, hsl(0 0% 96% / 0.9), transparent 70%)`
                    : "linear-gradient(to top, hsl(0 0% 96% / 0.85), transparent 60%)",
                }}
              >
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: isActive ? accent : G.t92 }}
                >
                  {c.name}
                </span>
                <span className="text-[9px]" style={{ color: isActive ? accentSoft : G.t45 }}>
                  {c.tag}
                </span>
              </div>

              {/* Visited check */}
              {isVisited && !isActive && (
                <div
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(0 0% 96% / 0.9)" }}
                >
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
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
            transition={{ duration: 0.35 }}
            className="space-y-3"
          >
            {/* Hero image */}
            <div
              className="rounded-2xl overflow-hidden relative h-52"
              style={{ border: `0.5px solid ${G.border}` }}
            >
              <motion.img
                src={compound.image}
                alt={compound.name}
                className="w-full h-full object-cover"
                loading="lazy"
                width={800}
                height={512}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6 }}
              />
              <div
                className="absolute inset-0 flex items-end p-5"
                style={{
                  background: `linear-gradient(to top, hsl(0 0% 96% / 0.92) 0%, hsl(0 0% 96% / 0.3) 50%, transparent 100%)`,
                }}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl font-bold" style={{ color: G.t96 }}>
                      {compound.name}
                    </span>
                    <span
                      className="text-[10px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm"
                      style={{
                        background: accentBg,
                        color: accent,
                        border: `0.5px solid ${accentBorderSoft}`,
                      }}
                    >
                      {compound.tag}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: accentSoft }}>
                    {compound.subheadline}
                  </p>
                </div>
              </div>
            </div>

            {/* Info cards */}
            {cardFields.map((field, i) => {
              const Icon = fieldIcons[field.key] || Beaker;
              const isWarning = field.key === "atencao";

              return (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl p-4 space-y-2"
                  style={{
                    background: isWarning ? accentText06 : G.card,
                    border: isWarning
                      ? `0.5px solid ${accentBorderSoft}`
                      : `0.5px solid ${G.borderSoft}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className="w-3.5 h-3.5"
                      style={{ color: isWarning ? accent : G.t45 }}
                    />
                    <p
                      className="text-[11px] uppercase tracking-widest font-semibold"
                      style={{ color: isWarning ? accent : G.t40 }}
                    >
                      {field.label}
                    </p>
                  </div>
                  <p className="text-[13px] leading-relaxed pl-5.5" style={{ color: G.t80 }}>
                    {compound[field.key]}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompoundDetail;
