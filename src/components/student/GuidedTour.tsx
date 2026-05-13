import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X, ChevronRight, Hand } from "lucide-react";

export type TourStep = {
  selector: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "auto";
};

type Props = {
  /** Unique id used to remember if this user already saw the tour. */
  tourId: string;
  steps: TourStep[];
  /** Optional version: bump to force the tour to show again. */
  version?: number;
};

const PADDING = 10;
const TIP_W = 300;
const TIP_GAP = 16;

export default function GuidedTour({ tourId, steps, version = 1 }: Props) {
  const storageKey = `sth_tour_${tourId}_v${version}`;
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 0);
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 0);

  // Auto-open on first visit
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(storageKey)) {
      const t = setTimeout(() => setOpen(true), 700);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  const step = steps[stepIdx];

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Wait a beat for scroll to settle, then measure
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      setRect(r);
    });
  }, [step]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const t = setTimeout(measure, 350);
    return () => clearTimeout(t);
  }, [open, stepIdx, measure]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
      measure();
    };
    const onScroll = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, measure]);

  // Lock body scroll while tour is active
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const finish = () => {
    localStorage.setItem(storageKey, "1");
    setOpen(false);
    setStepIdx(0);
  };

  const next = () => {
    if (stepIdx >= steps.length - 1) finish();
    else setStepIdx((i) => i + 1);
  };

  const restart = () => {
    setStepIdx(0);
    setOpen(true);
  };

  // Floating help button (always visible)
  const helpBtn = (
    <button
      onClick={restart}
      aria-label="Abrir guia"
      className="fixed z-[60] bottom-24 right-4 w-11 h-11 rounded-full bg-foreground text-background shadow-[0_8px_24px_-6px_rgba(0,0,0,0.6)] flex items-center justify-center border border-foreground/20 hover:scale-105 transition-transform animate-[pulse_2.4s_ease-in-out_infinite]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <HelpCircle className="w-5 h-5" strokeWidth={2} />
    </button>
  );

  if (!open || !step) {
    return createPortal(helpBtn, document.body);
  }

  // Compute spotlight + tooltip position
  const hasRect = !!rect;
  const r = rect ?? new DOMRect(vw / 2 - 40, vh / 2 - 40, 80, 80);
  const sx = Math.max(0, r.left - PADDING);
  const sy = Math.max(0, r.top - PADDING);
  const sw = r.width + PADDING * 2;
  const sh = r.height + PADDING * 2;
  const radius = 14;

  // Decide tooltip position: prefer below; if no room, put above; if target is invisible, center
  const spaceBelow = vh - (sy + sh);
  const placeBelow = step.placement === "bottom" || (step.placement !== "top" && spaceBelow > 200);
  const tipTop = !hasRect
    ? vh / 2 - 100
    : placeBelow
      ? Math.min(sy + sh + TIP_GAP, vh - 220)
      : Math.max(12, sy - 220);
  const tipLeft = !hasRect
    ? vw / 2 - TIP_W / 2
    : Math.min(Math.max(12, sx + sw / 2 - TIP_W / 2), vw - TIP_W - 12);

  // Hand position: pointing toward the spotlight from tooltip side
  const handTop = placeBelow ? sy + sh - 8 : sy - 36;
  const handLeft = sx + sw / 2 - 18;

  const overlay = (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      {/* Spotlight overlay via SVG mask */}
      <svg width={vw} height={vh} className="absolute inset-0 pointer-events-auto">
        <defs>
          <mask id="sth-tour-mask">
            <rect width={vw} height={vh} fill="white" />
            {hasRect && (
              <rect x={sx} y={sy} width={sw} height={sh} rx={radius} ry={radius} fill="black" />
            )}
          </mask>
        </defs>
        <rect
          width={vw}
          height={vh}
          fill="rgba(0,0,0,0.78)"
          mask="url(#sth-tour-mask)"
          onClick={() => { /* swallow */ }}
        />
        {hasRect && (
          <rect
            x={sx}
            y={sy}
            width={sw}
            height={sh}
            rx={radius}
            ry={radius}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
            className="animate-pulse"
            style={{ filter: "drop-shadow(0 0 12px hsl(var(--foreground) / 0.6))" }}
          />
        )}
      </svg>

      {/* Animated hand pointer */}
      {hasRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: handTop,
            left: handLeft,
            animation: "sthHandBounce 1.2s ease-in-out infinite",
          }}
        >
          <div className="relative w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.6)]">
            <Hand className="w-5 h-5" strokeWidth={2} style={{ transform: placeBelow ? "rotate(-10deg)" : "rotate(170deg)" }} />
          </div>
        </div>
      )}

      {/* Tooltip card */}
      <div
        className="absolute rounded-2xl border border-foreground/20 bg-background/95 backdrop-blur-xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-2"
        style={{ top: tipTop, left: tipLeft, width: TIP_W }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground">
              Passo {stepIdx + 1} de {steps.length}
            </span>
          </div>
          <button
            onClick={finish}
            aria-label="Fechar guia"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-[15px] font-semibold text-foreground tracking-tight leading-tight">
          {step.title}
        </h3>
        <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed">
          {step.description}
        </p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mt-4">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === stepIdx ? "w-6 bg-foreground" : i < stepIdx ? "w-3 bg-foreground/60" : "w-3 bg-foreground/15"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 mt-4">
          <button
            onClick={finish}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground tracking-wide uppercase transition-colors"
          >
            Pular
          </button>
          <button
            onClick={next}
            className="inline-flex items-center gap-1 bg-foreground text-background text-xs font-semibold px-4 py-2 rounded-full hover:opacity-90 transition"
          >
            {stepIdx >= steps.length - 1 ? "Concluir" : "Próximo"}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes sthHandBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(${placeBelow ? 8 : -8}px) scale(1.05); }
        }
      `}</style>
    </div>
  );

  return (
    <>
      {createPortal(overlay, document.body)}
      {createPortal(helpBtn, document.body)}
    </>
  );
}
