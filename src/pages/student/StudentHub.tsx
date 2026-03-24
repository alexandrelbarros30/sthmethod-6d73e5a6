import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, Salad, FlaskConical, TrendingUp, Activity, Dumbbell } from "lucide-react";
import cardDieta from "@/assets/card-dieta.jpg";
import cardProtocolo from "@/assets/card-protocolo.jpg";
import cardAtualizacao from "@/assets/card-atualizacao.jpg";
import cardBioimpedancia from "@/assets/card-bioimpedancia.jpg";
import cardTreino from "@/assets/card-treino.jpg";

const cards = [
  { id: "dieta", title: "Dieta", subtitle: "Seu plano alimentar", icon: Salad, image: cardDieta, route: "/dashboard/diet", color: "from-emerald-500/80" },
  { id: "protocolo", title: "Protocolo", subtitle: "Suplementação e prescrições", icon: FlaskConical, image: cardProtocolo, route: "/dashboard/protocol", color: "from-amber-500/80" },
  { id: "atualizacao", title: "Atualização", subtitle: "Evolução e progresso", icon: TrendingUp, image: cardAtualizacao, route: "/dashboard/evolution", color: "from-violet-500/80" },
  { id: "bioimpedancia", title: "Bioimpedância", subtitle: "Composição corporal", icon: Activity, image: cardBioimpedancia, route: "/dashboard/bioimpedance", color: "from-cyan-500/80" },
  { id: "treino", title: "Treino", subtitle: "Periodização e exercícios", icon: Dumbbell, image: cardTreino, route: "/dashboard/training", color: "from-blue-500/80" },
];

const CARD_WIDTH_PERCENT = 70;
const GAP = 16;

const StudentHub = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [containerWidth, setContainerWidth] = useState(360);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const cardW = containerWidth * (CARD_WIDTH_PERCENT / 100);
  const sideOffset = (containerWidth - cardW) / 2;

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = cardW * 0.2;
    if (info.offset.x < -threshold && activeIndex < cards.length - 1) {
      setActiveIndex((i) => i + 1);
    } else if (info.offset.x > threshold && activeIndex > 0) {
      setActiveIndex((i) => i - 1);
    }
  }, [activeIndex, cardW]);

  const targetX = -activeIndex * (cardW + GAP) + sideOffset;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 relative z-10">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Escolha seu módulo</p>
          <h1 className="text-lg font-bold text-foreground font-display">Sua jornada</h1>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Dots indicator */}
      <div className="flex items-center justify-center gap-2 py-3">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Cards carousel */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center">
        <motion.div
          className="flex items-center h-full"
          style={{ x, paddingLeft: 0 }}
          animate={{ x: targetX }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
        >
          {cards.map((card, i) => {
            const distance = Math.abs(i - activeIndex);
            const isActive = i === activeIndex;
            const Icon = card.icon;

            return (
              <motion.div
                key={card.id}
                className="shrink-0 cursor-pointer"
                style={{
                  width: cardW,
                  marginRight: i < cards.length - 1 ? GAP : 0,
                }}
                animate={{
                  scale: isActive ? 1 : 0.85,
                  opacity: isActive ? 1 : 0.5,
                  rotateY: i < activeIndex ? 15 : i > activeIndex ? -15 : 0,
                  z: isActive ? 0 : -100,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={() => {
                  if (isActive) {
                    navigate(card.route);
                  } else {
                    setActiveIndex(i);
                  }
                }}
              >
                <div
                  className="relative rounded-3xl overflow-hidden shadow-2xl"
                  style={{ height: "calc(100dvh - 180px)", perspective: "1000px" }}
                >
                  {/* Image */}
                  <img
                    src={card.image}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={i <= 1 ? "eager" : "lazy"}
                    draggable={false}
                  />

                  {/* Dark gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${card.color} via-black/40 to-transparent`} />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-between p-6">
                    {/* Top icon */}
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Bottom info */}
                    <div>
                      <h2 className="text-3xl font-bold text-white font-display tracking-tight mb-1">{card.title}</h2>
                      <p className="text-white/70 text-sm font-medium">{card.subtitle}</p>

                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="mt-4"
                        >
                          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold">
                            Toque para acessar
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Glow effect for active */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-3xl ring-1 ring-white/20 pointer-events-none" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default StudentHub;
