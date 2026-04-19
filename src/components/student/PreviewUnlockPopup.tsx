import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, UtensilsCrossed, Pill } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";

const STORAGE_KEY = "preview-unlock-popup-dismissed-at";
const COOLDOWN_HOURS = 8;

const PreviewUnlockPopup = () => {
  const { isActive, isLoading } = useSubscriptionGuard();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isLoading || isActive) return;
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const hours = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60);
      if (hours < COOLDOWN_HOURS) return;
    }
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [isActive, isLoading]);

  const handleClose = (next: boolean) => {
    if (!next) localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setOpen(next);
  };

  if (isActive) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold tracking-[0.18em] text-primary uppercase">
              Pré-estreia
            </span>
            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
              <Sparkles className="w-2 h-2" /> Novo
            </span>
          </div>
          <h2 className="text-lg font-bold font-display text-foreground leading-tight">
            Sua dieta e protocolo já estão prontos 🎯
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            Nosso time montou seu plano personalizado. Libere o acesso completo agora e comece hoje mesmo.
          </p>
        </div>

        <div className="px-6 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border/60 p-3 bg-muted/20 relative overflow-hidden">
              <UtensilsCrossed className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-[11px] font-semibold text-foreground">Dieta</p>
              <p className="text-[10px] text-muted-foreground">Refeições + macros</p>
              <Lock className="w-3 h-3 absolute top-2 right-2 text-muted-foreground" />
            </div>
            <div className="rounded-xl border border-border/60 p-3 bg-muted/20 relative overflow-hidden">
              <Pill className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-[11px] font-semibold text-foreground">Protocolo</p>
              <p className="text-[10px] text-muted-foreground">Suplementação</p>
              <Lock className="w-3 h-3 absolute top-2 right-2 text-muted-foreground" />
            </div>
          </div>

          <Button asChild size="lg" className="w-full" onClick={() => setOpen(false)}>
            <Link to="/dashboard/subscription">
              <Sparkles className="w-4 h-4 mr-2" /> Liberar acesso completo
            </Link>
          </Button>
          <button
            onClick={() => handleClose(false)}
            className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Lembrar mais tarde
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewUnlockPopup;
