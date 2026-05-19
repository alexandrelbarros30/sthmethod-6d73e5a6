import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bell, Utensils, Clock, Shuffle, Sparkles } from "lucide-react";

const STORAGE_KEY = "sth_diet_meal_guide_seen_v1";

const DietMealGuide = () => {
  const [open, setOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY) === "1";
    setHasSeen(seen);
    if (!seen) {
      // small delay to feel premium
      const t = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) {
      localStorage.setItem(STORAGE_KEY, "1");
      setHasSeen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir guia das refeições"
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
      >
        <Bell className="w-4 h-4 text-foreground" />
        {!hasSeen && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden bg-background border-white/10">
          <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold tracking-[0.2em] uppercase mb-3">
              <Sparkles className="w-3 h-3" />
              Guia rápido
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-display font-bold tracking-tight text-foreground">
                Suas refeições, sua rotina
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed mt-2">
                As refeições são numeradas (Refeição 1, 2, 3...) justamente para que você possa adaptá-las ao seu dia — sem nomes fixos como "café" ou "jantar".
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-4">
            <GuideItem
              icon={<Shuffle className="w-4 h-4 text-primary" />}
              title="Você pode unir refeições"
              text="Se sua rotina não permitir comer 5 ou 6 vezes ao dia, é possível unir refeições: a 1 com a 2, a 2 com a 3, a 4 com a 5 — sempre somando seus alimentos."
            />
            <GuideItem
              icon={<Clock className="w-4 h-4 text-primary" />}
              title="Adapte aos seus horários"
              text="Plantonista, trabalho noturno, acorda ao meio-dia? Sem problema. A Refeição 1 pode ser seu almoço, a Refeição 2 um lanche da tarde, e assim por diante."
            />
            <GuideItem
              icon={<Utensils className="w-4 h-4 text-primary" />}
              title="O que importa é o todo"
              text="O objetivo é cumprir o total de calorias e macros do dia. A distribuição é flexível conforme seu conforto e disponibilidade."
            />

            <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                💡 Quer rever esse guia? Toque no <span className="text-foreground font-semibold">sininho</span> no topo da tela a qualquer momento.
              </p>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={() => handleClose(false)}
              className="w-full py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
            >
              Entendi, vamos lá
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const GuideItem = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <div className="flex gap-3">
    <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground tracking-tight">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{text}</p>
    </div>
  </div>
);

export default DietMealGuide;