import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Family } from "./compoundData";

const G = {
  card: "hsl(0 0% 6%)",
  border: "hsl(0 0% 14%)",
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
  const accentBg = `hsl(0 0% 0% / 0.45)`;
  const accentBorder = `hsl(0 0% 100% / 0.25)`;
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
            background: `linear-gradient(to top, hsl(0 0% 0% / 0.85) 0%, hsl(0 0% 0% / 0.3) 55%, transparent 100%)`,
          }}
        />

        {/* Tag badge */}
        <div className="absolute top-3 left-3">
          <span
            className="text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{
              background: accentBg,
              color: G.t96,
              border: `0.5px solid ${accentBorder}`,
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
          <p className="text-[12px] font-medium" style={{ color: G.t80 }}>
            {family.subheadline}
          </p>
        </div>
      </div>

      {/* Content area */}
      <div
        className="p-4 space-y-3 relative z-10"
        style={{
          background: "rgb(255 255 255 / 0.015)",
          borderTop: `1px solid hsl(0 0% 100% / 0.08)`,
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
              style={{ color: accent }}
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
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgb(255 255 255 / 0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: accent,
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
