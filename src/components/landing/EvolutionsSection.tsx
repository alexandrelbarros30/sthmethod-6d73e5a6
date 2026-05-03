import { motion } from "framer-motion";
import { useLandingEvolutions } from "@/hooks/useLandingData";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const EvolutionsSection = () => {
  const { data: evolutions } = useLandingEvolutions();
  const active = evolutions?.filter((e) => e.active) ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => { checkScroll(); }, [active.length]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    setTimeout(checkScroll, 400);
  };

  if (active.length === 0) return null;

  return (
    <section className="py-24 md:py-32 px-6 bg-[hsl(var(--surface))]">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="text-center mb-16">
          <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-brand mb-5">Transformações</div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-foreground">
            <span className="text-brand">Evoluções</span> reais.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light max-w-2xl mx-auto mt-5">
            Alunos que confiaram no método e no processo.
          </p>
        </motion.div>

        <div className="relative">
          {canScrollLeft && (
            <Button size="icon" variant="outline" className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur border-border/60" onClick={() => scroll("left")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          {canScrollRight && (
            <Button size="icon" variant="outline" className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur border-border/60" onClick={() => scroll("right")}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}

          <div ref={scrollRef} onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {active.map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="snap-center shrink-0 w-72 md:w-80 rounded-2xl overflow-hidden border border-border/40 group"
              >
                <img src={ev.image_url} alt={ev.caption || "Evolução"} className="w-full h-80 object-cover" loading="lazy" />
                {ev.caption && (
                  <div className="p-4 bg-background">
                    <p className="text-[13px] text-muted-foreground font-light">{ev.caption}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EvolutionsSection;
