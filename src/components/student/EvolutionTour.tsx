import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Scale, Camera, Activity, Trophy, X, ChevronRight, ChevronLeft, PlayCircle } from "lucide-react";

interface EvolutionTourProps {
  open: boolean;
  onClose: () => void;
  onOpenVideo: () => void;
}

type Step = {
  target?: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  accent: string;
};

const GREEN = "145 60% 42%";
const BLUE = "210 90% 55%";
const AMBER = "35 90% 55%";

const STEPS: Step[] = [
  {
    title: "Bem-vindo à Missão Evolução",
    body: "3 etapas independentes. Você faz no seu ritmo — cada uma salva sozinha, sem ordem obrigatória. Bora conhecer?",
    icon: <Trophy className="w-5 h-5" style={{ color: `hsl(${GREEN})` }} />,
    accent: GREEN,
  },
  {
    target: "evolution-stage-1",
    title: "Etapa 1 · Peso & Mensagem",
    body: "Registre seu peso atual e escreva uma mensagem ao consultor. Ao confirmar, seus macros são recalculados automaticamente.",
    icon: <Scale className="w-5 h-5" style={{ color: `hsl(${GREEN})` }} />,
    accent: GREEN,
  },
  {
    target: "evolution-stage-2",
    title: "Etapa 2 · Fotos corporais",
    body: "Envie fotos novas — as antigas ficam preservadas para comparação visual. Ao concluir o upload, a etapa é confirmada sozinha.",
    icon: <Camera className="w-5 h-5" style={{ color: `hsl(${BLUE})` }} />,
    accent: BLUE,
  },
  {
    target: "evolution-stage-3",
    title: "Etapa 3 · Rotina",
    body: "Só use se sua rotina mudou de verdade (trabalho, saúde, treino). Alterar sem motivo recalcula seus macros à toa.",
    icon: <Activity className="w-5 h-5" style={{ color: `hsl(${AMBER})` }} />,
    accent: AMBER,
  },
  {
    title: "Prontinho!",
    body: "Confirme cada etapa e complete as 3 conquistas. Se quiser rever, toque em 'Como funciona?' no topo do card ou assista ao vídeo.",
    icon: <Sparkles className="w-5 h-5" style={{ color: `hsl(${GREEN})` }} />,
    accent: GREEN,
  },
];

export const EvolutionTour = ({ open, onClose, onOpenVideo }: EvolutionTourProps) => {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const step = STEPS[i];
    if (!step.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const raf = requestAnimationFrame(() => {
      setRect(el.getBoundingClientRect());
    });
    const onResize = () => setRect(el.getBoundingClientRect());
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [i, open]);

  if (!open) return null;

  const step = STEPS[i];
  const isLast = i === STEPS.length - 1;
  const isFirst = i === 0;

  const padding = 10;
  const spotlightStyle = rect
    ? {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }
    : null;

  // Posicionamento do card: abaixo do target se couber, senão acima; no mobile fica sempre fixo embaixo.
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const cardTop = !rect || isMobile
    ? undefined
    : rect.bottom + padding + 12 + 220 < window.innerHeight
      ? rect.bottom + padding + 12
      : Math.max(16, rect.top - padding - 12 - 220);

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      {/* Overlay com spotlight via box-shadow */}
      {spotlightStyle ? (
        <div
          className="absolute rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            ...spotlightStyle,
            boxShadow: `0 0 0 9999px hsl(0 0% 0% / 0.72), 0 0 0 2px hsl(${step.accent}), 0 0 40px hsl(${step.accent} / 0.6)`,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      )}

      {/* Card do passo */}
      <div
        ref={cardRef}
        className="absolute left-1/2 -translate-x-1/2 w-[92vw] max-w-sm rounded-2xl p-4 shadow-2xl border animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{
          top: cardTop,
          bottom: isMobile || !rect ? 24 : undefined,
          background: "hsl(0 0% 8%)",
          borderColor: `hsl(${step.accent} / 0.5)`,
          boxShadow: `0 20px 60px hsl(${step.accent} / 0.25), 0 0 0 1px hsl(${step.accent} / 0.3)`,
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `hsl(${step.accent} / 0.15)`, border: `1px solid hsl(${step.accent} / 0.4)` }}
          >
            {step.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{step.title}</p>
            <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: `hsl(${step.accent})` }}>
              Passo {i + 1} de {STEPS.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar tutorial"
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-white/85 leading-relaxed mb-4">{step.body}</p>

        {/* Barra de progresso */}
        <div className="flex gap-1 mb-4">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                background:
                  idx <= i ? `hsl(${step.accent})` : "hsl(0 0% 100% / 0.15)",
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10 h-9 px-2"
            onClick={onOpenVideo}
          >
            <PlayCircle className="w-4 h-4 mr-1.5" />
            Vídeo
          </Button>
          <div className="flex gap-2">
            {!isFirst && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10 h-9"
                onClick={() => setI((v) => Math.max(0, v - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="h-9"
              style={{
                background: `hsl(${step.accent})`,
                color: "hsl(0 0% 100%)",
                boxShadow: `0 0 20px hsl(${step.accent} / 0.4)`,
              }}
              onClick={() => (isLast ? onClose() : setI((v) => v + 1))}
            >
              {isLast ? "Concluir" : "Próximo"}
              {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvolutionTour;