import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
  const circumference = 2 * Math.PI * 16; // r=16
  const dashOffset = circumference * (1 - progress);

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
          "relative h-11 w-11 rounded-full flex items-center justify-center",
          "backdrop-blur-xl"
        )}
        style={{
          opacity: refreshing ? 1 : Math.max(0.5, progress),
          background:
            "radial-gradient(circle at 50% 40%, hsl(0 0% 12% / 0.92), hsl(0 0% 6% / 0.9))",
          border: "0.5px solid hsl(145 60% 42% / 0.35)",
          boxShadow:
            "0 8px 28px hsl(0 0% 0% / 0.45), 0 0 0 1px hsl(0 0% 100% / 0.03) inset, 0 0 18px hsl(145 60% 42% / 0.18)",
        }}
      >
        <svg
          className={cn("h-9 w-9", refreshing && "animate-spin")}
          viewBox="0 0 40 40"
          style={{ animationDuration: refreshing ? "900ms" : undefined }}
        >
          <defs>
            <linearGradient id="ptr-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(145 80% 55%)" />
              <stop offset="100%" stopColor="hsl(145 60% 38%)" />
            </linearGradient>
          </defs>
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="hsl(0 0% 100% / 0.06)"
            strokeWidth="2"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="url(#ptr-grad)"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeDasharray={refreshing ? `${circumference * 0.28} ${circumference}` : circumference}
            strokeDashoffset={refreshing ? 0 : dashOffset}
            transform="rotate(-90 20 20)"
            style={{
              transition: refreshing ? "none" : "stroke-dashoffset 120ms linear",
              filter: "drop-shadow(0 0 4px hsl(145 80% 50% / 0.55))",
            }}
          />
        </svg>
        <div
          className="absolute h-1 w-1 rounded-full"
          style={{
            background: "hsl(145 90% 60%)",
            boxShadow: "0 0 8px hsl(145 90% 55% / 0.9)",
            opacity: refreshing ? 1 : progress,
          }}
        />
      </div>
    </div>
  );
}
