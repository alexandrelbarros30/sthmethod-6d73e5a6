import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowLeft, ExternalLink, ChevronRight } from "lucide-react";
import { performethCategories, type PerformethCategory, type PerformethProduct } from "@/data/performeth-products";
import { useNavigate } from "react-router-dom";

const BLUE = {
  primary: "hsl(210 100% 56%)",
  soft: "hsl(210 80% 65%)",
  glow: "hsl(210 100% 56% / 0.20)",
  bg: "hsl(210 100% 56% / 0.08)",
  border: "hsl(210 100% 56% / 0.18)",
};

const C = {
  bg: "#09090b",
  card: "#111113",
  cardHover: "#161618",
  border: "hsl(0 0% 12%)",
  t96: "hsl(0 0% 96%)",
  t80: "hsl(0 0% 80%)",
  t55: "hsl(0 0% 55%)",
  t40: "hsl(0 0% 40%)",
  t25: "hsl(0 0% 25%)",
};

/* ── Animated wrapper ── */
const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ── Product Card ── */
const ProductCard = ({ product, index }: { product: PerformethProduct; index: number }) => (
  <FadeUp delay={index * 0.08}>
    <div
      className="group rounded-2xl p-6 space-y-4 transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: C.card,
        border: `0.5px solid ${C.border}`,
        boxShadow: `0 0 0 0 transparent`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = C.cardHover;
        e.currentTarget.style.borderColor = BLUE.border;
        e.currentTarget.style.boxShadow = `0 8px 40px ${BLUE.glow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = C.card;
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = `0 0 0 0 transparent`;
      }}
    >
      {/* Product image placeholder */}
      <div
        className="w-full aspect-square rounded-xl flex items-center justify-center"
        style={{ background: BLUE.bg }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
          style={{ background: `linear-gradient(135deg, ${BLUE.primary}, ${BLUE.soft})`, color: "#fff" }}
        >
          {product.name.charAt(0)}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-base font-bold tracking-wide" style={{ color: C.t96 }}>
        {product.name}
      </h3>

      {/* Headline */}
      <p className="text-sm leading-relaxed" style={{ color: C.t55 }}>
        {product.headline}
      </p>

      {/* Benefits */}
      <ul className="space-y-2">
        {product.benefits.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.t80 }}>
            <span className="mt-0.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: BLUE.primary }} />
            {b}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200"
        style={{
          background: `linear-gradient(135deg, ${BLUE.primary}, hsl(215 90% 48%))`,
          color: "#fff",
          boxShadow: `0 4px 20px ${BLUE.glow}`,
        }}
      >
        Ver produto
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  </FadeUp>
);

/* ── Category Section ── */
const CategorySection = ({ category, index }: { category: PerformethCategory; index: number }) => (
  <section className="space-y-6">
    <FadeUp delay={0.05}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="text-xl">{category.icon}</span>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: C.t96 }}>
            {category.title}
          </h2>
        </div>
        <p className="text-sm pl-9" style={{ color: C.t40 }}>
          {category.subtitle}
        </p>
      </div>
    </FadeUp>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {category.products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  </section>
);

/* ── Main Page ── */
const PerformethCatalog = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* ── HERO ── */}
      <header className="relative overflow-hidden">
        {/* Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: BLUE.primary }}
        />

        <div className="relative max-w-5xl mx-auto px-5 pt-12 pb-16 space-y-6 text-center">
          <FadeUp>
            <p
              className="text-[11px] uppercase tracking-[0.35em] font-semibold"
              style={{ color: BLUE.primary }}
            >
              Performeth Labs
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
              style={{ color: C.t96 }}
            >
              Suplementação
              <br />
              <span style={{ color: BLUE.primary }}>de precisão.</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.18}>
            <p
              className="text-base sm:text-lg max-w-md mx-auto leading-relaxed"
              style={{ color: C.t55 }}
            >
              Cada produto selecionado para entregar resultado real. Sem excesso. Sem marketing vazio.
            </p>
          </FadeUp>

          {/* Scroll indicator */}
          <FadeUp delay={0.3}>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="flex justify-center pt-4"
            >
              <ChevronRight className="w-5 h-5 rotate-90" style={{ color: C.t25 }} />
            </motion.div>
          </FadeUp>
        </div>
      </header>

      {/* ── CATALOG ── */}
      <main className="max-w-5xl mx-auto px-5 pb-20 space-y-16">
        {performethCategories.map((cat, i) => (
          <CategorySection key={cat.id} category={cat} index={i} />
        ))}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t py-10 text-center" style={{ borderColor: C.border }}>
        <FadeUp>
          <p className="text-xs" style={{ color: C.t40 }}>
            PERFORMETH LABS — Suplementação estratégica para quem leva resultado a sério.
          </p>
        </FadeUp>
      </footer>
    </div>
  );
};

export default PerformethCatalog;
