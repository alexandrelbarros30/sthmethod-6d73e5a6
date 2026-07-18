import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Pull-to-refresh global: arraste o dedo para baixo no topo da página
 * para atualizar dados (dieta, treino, protocolo etc.) via react-query.
 * Oculto em rotas públicas.
 */
const HIDDEN_PREFIXES = ["/login", "/forgot-password", "/reset-password", "/cadastro", "/pagamento"];
const THRESHOLD = 80; // px para disparar
const MAX_PULL = 120;

export default function PullToRefresh() {
  const location = useLocation();
  const qc = useQueryClient();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  const path = location.pathname;
  const disabled = path === "/" || HIDDEN_PREFIXES.some((p) => path.startsWith(p));

  useEffect(() => {
    if (disabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || startY.current == null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      // Resistência
      const eased = Math.min(MAX_PULL, dy * 0.5);
      setPull(eased);
      if (dy > 10) {
        // Impede scroll padrão para gesto ficar fluido
        if (e.cancelable) e.preventDefault();
      }
    };

    const finish = async () => {
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      if (pull >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPull(THRESHOLD);
        try {
          await qc.invalidateQueries();
          await qc.refetchQueries({ type: "active" });
          toast.success("Conteúdo atualizado");
        } catch {
          toast.error("Não foi possível atualizar");
        } finally {
          setTimeout(() => {
            setRefreshing(false);
            setPull(0);
          }, 400);
        }
      } else {
        setPull(0);
      }
    };

    const onTouchEnd = () => { finish(); };
    const onTouchCancel = () => { finish(); };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchCancel);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove as EventListener);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [disabled, pull, refreshing, qc]);

  if (disabled || (pull === 0 && !refreshing)) return null;

  const progress = Math.min(1, pull / THRESHOLD);
  const translate = Math.max(0, pull - 20);

  return (
    <div
      className="fixed left-1/2 z-[70] pointer-events-none"
      style={{
        top: "calc(env(safe-area-inset-top) + 8px)",
        transform: `translate(-50%, ${translate}px)`,
        transition: refreshing ? "transform 200ms ease" : "none",
      }}
      aria-hidden
    >
      <div
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center",
          "bg-background/90 backdrop-blur border border-border shadow-lg"
        )}
        style={{ opacity: Math.max(0.4, progress) }}
      >
        <RefreshCw
          className={cn("h-5 w-5", refreshing && "animate-spin")}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 270}deg)` }}
        />
      </div>
    </div>
  );
}
