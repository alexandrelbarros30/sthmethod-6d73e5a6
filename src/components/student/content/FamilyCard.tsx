import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Family } from "./compoundData";

const G = {
  card: "hsl(0 0% 96%)",
  border: "hsl(0 0% 96%)",
  t96: "hsl(0 0% 96%)",
  t92: "hsl(0 0% 92%)",
  t80: "hsl(0 0% 80%)",
  t55: "hsl(0 0% 55%)",
  t45: "hsl(0 0% 45%)",
  t40: "hsl(0 0% 40%)",
  t10: "hsl(0 0% 10%)",
};

interface Props {
  family: Family;
  index: number;
  visitedCount: number;
  onClick: () => void;
}

const FamilyCard = ({ family, index, visitedCount, onClick }: Props) => {
  const accent = `hsl(0 0% 96%)`;
  const accentSoft = `hsl(0 0% 96%)`;
  const accentBg = `hsl(0 0% 96% / 0.12)`;
  const accentBorder = `hsl(0 0% 96% / 0.25)`;
  const total = family.compounds.length;
  const pct = total > 0 ? (visitedCount / total) * 100 : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.5 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full text-left rounded-[22px] overflow-hidden group relative backdrop-blur-xl"
      style={{
        border: `1px solid hsl(0 0% 96% / 0.18)`,
        background: "rgb(255 255 255 / 0.025)",
        boxShadow: `0 8px 28px -10px rgb(0 0 0 / 0.55), 0 0 22px -6px hsl(0 0% 96% / 0.35), inset 0 1px 0 rgb(255 255 255 / 0.06)`,
      }}
    >
      {/* Diagonal glass sheen */}
      <div
        className="absolute inset-0 pointer-events-none z-20 opacity-60"
        style={{
          background:
            "linear-gradient(115deg, transparent 38%, rgb(255 255 255 / 0.08) 50%, transparent 65%)",
        }}
      />
      {/* Cinematic image */}
      <div className="relative h-40 overflow-hidden">
        <motion.img
          src={family.image}
          alt={family.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          width={800}
          height={512}
          loading={index === 0 ? undefined : "lazy"}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, hsl(0 0% 96% / 0.95) 0%, hsl(0 0% 96% / 0.4) 50%, transparent 100%)`,
          }}
        />

        {/* Tag badge */}
        <div className="absolute top-3 left-3">
          <span
            className="text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{
              background: accentBg,
              color: accent,
              border: `0.5px solid ${accentBorder}`,
              boxShadow: `0 0 12px hsl(0 0% 96% / 0.4)`,
            }}
          >
            {family.id === "testosterona" ? "Base" : family.id === "dht" ? "Estética" : "19-nor"}
          </span>
        </div>

        {/* Title over image */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1">
          <h3 className="text-lg font-bold tracking-tight" style={{ color: G.t96 }}>
            {family.title}
          </h3>
          <p className="text-[12px] font-medium" style={{ color: accent }}>
            {family.subheadline}
          </p>
        </div>
      </div>

      {/* Content area */}
      <div
        className="p-4 space-y-3 relative z-10"
        style={{
          background: "rgb(255 255 255 / 0.02)",
          borderTop: `1px solid hsl(0 0% 96% / 0.12)`,
        }}
      >
        <p className="text-[13px] leading-relaxed" style={{ color: G.t55 }}>
          {family.description}
        </p>

        {/* Compounds pills */}
        <div className="flex flex-wrap gap-1.5">
          {family.compounds.map((c) => (
            <span
              key={c.id}
              className="text-[11px] font-medium px-2 py-1 rounded-lg backdrop-blur-md"
              style={{
                background: "rgb(255 255 255 / 0.04)",
                color: G.t80,
                border: "0.5px solid rgb(255 255 255 / 0.06)",
              }}
            >
              {c.name}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-medium" style={{ color: G.t40 }}>
            {visitedCount}/{total} explorados
          </span>
          <div className="flex items-center gap-1">
            <span
              className="text-[11px] font-semibold"
              style={{ color: accent, textShadow: `0 0 8px hsl(0 0% 96% / 0.6)` }}
            >
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

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgb(255 255 255 / 0.05)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${accent}, ${accentSoft})`,
              boxShadow: `0 0 8px hsl(0 0% 96% / 0.7), 0 0 16px hsl(0 0% 96% / 0.4), inset 0 0 4px rgb(255 255 255 / 0.4)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.button>
  );
};

export default FamilyCard;
