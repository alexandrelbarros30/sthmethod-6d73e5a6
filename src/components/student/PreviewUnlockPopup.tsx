import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, UtensilsCrossed, Pill, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "preview-unlock-popup-dismissed-at";
const COOLDOWN_HOURS = 8;

const stripToLines = (html?: string | null, max = 2): string[] => {
  if (!html) return [];
  return html
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, max);
};

const PreviewUnlockPopup = () => {
  const { isActive, isLoading } = useSubscriptionGuard();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: previews } = useQuery({
    queryKey: ["preview-popup-snippets", user?.id],
    queryFn: async () => {
      const [{ data: diet }, { data: protocol }] = await Promise.all([
        supabase
          .from("student_diets")
          .select("content")
          .eq("user_id", user!.id)
          .eq("visible", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("student_protocols")
          .select("content")
          .eq("user_id", user!.id)
          .eq("visible", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      return {
        diet: stripToLines(diet?.content, 2),
        protocol: stripToLines(protocol?.content, 2),
      };
    },
    enabled: !!user?.id && !isActive,
  });

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

  const dietLines = previews?.diet ?? [];
  const protocolLines = previews?.protocol ?? [];
  const hasDiet = dietLines.length > 0;
  const hasProtocol = protocolLines.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
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
            Veja uma amostra abaixo. Toque em <span className="font-semibold text-foreground">Dieta</span> ou <span className="font-semibold text-foreground">Protocolo</span> para ver mais.
          </p>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {/* DIETA */}
            <Link
              to="/dashboard/diet"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border/60 p-3 bg-muted/20 relative overflow-hidden hover:border-primary/50 transition-colors block"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-[12px] font-semibold text-foreground leading-tight">Dieta</p>
                    <p className="text-[10px] text-muted-foreground">Refeições + macros</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow-[0_0_12px_hsl(var(--primary)/0.6)] animate-pulse">
                  Ver <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              {hasDiet ? (
                <div className="relative rounded-lg bg-background/60 border border-border/40 p-2 overflow-hidden">
                  {dietLines.map((l, i) => (
                    <p
                      key={i}
                      className="text-[11px] text-foreground leading-snug truncate"
                      style={{
                        filter: i === 1 ? "blur(2.5px)" : "none",
                        opacity: i === 1 ? 0.7 : 1,
                        userSelect: "none",
                      }}
                    >
                      {l}
                    </p>
                  ))}
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background/95 to-transparent pointer-events-none" />
                  <Lock className="w-3 h-3 absolute top-1.5 right-1.5 text-muted-foreground" />
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">Aguardando liberação do consultor.</p>
              )}
            </Link>

            {/* PROTOCOLO */}
            <Link
              to="/dashboard/protocol"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border/60 p-3 bg-muted/20 relative overflow-hidden hover:border-primary/50 transition-colors block"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-[12px] font-semibold text-foreground leading-tight">Protocolo</p>
                    <p className="text-[10px] text-muted-foreground">Suplementação</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow-[0_0_12px_hsl(var(--primary)/0.6)] animate-pulse">
                  Ver <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              {hasProtocol ? (
                <div className="relative rounded-lg bg-background/60 border border-border/40 p-2 overflow-hidden">
                  {protocolLines.map((l, i) => (
                    <p
                      key={i}
                      className="text-[11px] text-foreground leading-snug truncate"
                      style={{
                        filter: i === 1 ? "blur(2.5px)" : "none",
                        opacity: i === 1 ? 0.7 : 1,
                        userSelect: "none",
                      }}
                    >
                      {l}
                    </p>
                  ))}
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background/95 to-transparent pointer-events-none" />
                  <Lock className="w-3 h-3 absolute top-1.5 right-1.5 text-muted-foreground" />
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">Aguardando liberação do consultor.</p>
              )}
            </Link>
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
