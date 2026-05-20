import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

interface DietUpdatedBannerProps {
  dietId: string | null | undefined;
  userId: string | null | undefined;
}

const SEEN_KEY = (uid: string) => `seen_diet_release_${uid}`;

const DietUpdatedBanner = ({ dietId, userId }: DietUpdatedBannerProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!dietId || !userId || typeof window === "undefined") return;
    const seen = localStorage.getItem(SEEN_KEY(userId));
    if (seen !== dietId) setVisible(true);
  }, [dietId, userId]);

  const dismiss = () => {
    if (userId && dietId) localStorage.setItem(SEEN_KEY(userId), dietId);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:hsl(var(--info))]/30 bg-gradient-to-r from-[hsl(var(--info)/0.12)] via-[hsl(var(--info)/0.06)] to-transparent backdrop-blur-xl p-3.5 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[hsl(var(--info)/0.18)] border border-[hsl(var(--info)/0.3)] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-[hsl(var(--info))]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-[hsl(var(--info))]">Atualizada</p>
          <p className="text-sm font-semibold text-foreground mt-0.5 leading-snug">
            Sua dieta foi atualizada pelo consultor.
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Revise as novas refeições, macros e hidratação abaixo.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors shrink-0"
          aria-label="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default DietUpdatedBanner;