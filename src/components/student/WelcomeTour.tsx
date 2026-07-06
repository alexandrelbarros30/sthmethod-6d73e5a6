import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, X, PartyPopper } from "lucide-react";

const STORAGE_KEY = "sth_welcome_tour_v2_done";

type Step = {
  emoji: string;
  title: string;
  body: string;
  // dock target index 0..5 (Início, Atualização, Dieta, Protocolo, Treino, Perfil) — null = welcome/finale
  dockIndex: number | null;
  highlight?: string;
};

const STEPS: Step[] = [
  {
    emoji: "✨",
    title: "Sua estratégia já está em andamento",
    body: "Recebemos seu cadastro e nosso time já está cuidando de você. Enquanto sua estratégia principal é estruturada, vamos te mostrar como navegar pela plataforma.",
    dockIndex: null,
  },
  {
    emoji: "🏠",
    title: "Início",
    body: "Seu hub diário. Progresso, próximas refeições e atalhos para tudo.",
    dockIndex: 0,
    highlight: "Toque aqui para voltar à tela inicial.",
  },
  {
    emoji: "📈",
    title: "Atualização",
    body: "Envie peso, fotos e medidas para evoluir sua estratégia.",
    dockIndex: 1,
    highlight: "A cada 29 dias seu consultor recebe sua atualização.",
  },
  {
    emoji: "🥗",
    title: "Dieta",
    body: "Sua dieta interativa — marque refeições, hidratação e veja macros em tempo real.",
    dockIndex: 2,
    highlight: "O coração do app. Use todos os dias.",
  },
  {
    emoji: "🧪",
    title: "Protocolo",
    body: "Sua estratégia premium gamificada. Confirme cada fase do dia.",
    dockIndex: 3,
    highlight: "Os horários acendem em verde neon para te orientar.",
  },
  {
    emoji: "🏋️",
    title: "Treino",
    body: "Seu programa de treino com vídeos e checklist por exercício.",
    dockIndex: 4,
    highlight: "Bora pra ação.",
  },
  {
    emoji: "🧬",
    title: "Exames, conteúdo & mais",
    body: "No avatar você acessa Bioimpedância, Central de Análise, Conteúdo, STH News e sua Assinatura.",
    dockIndex: 5,
    highlight: "Tudo o que é técnico mora aqui.",
  },
  {
    emoji: "🎉",
    title: "Tudo pronto!",
    body: "Você desbloqueou o STH METHOD. Bora transformar sua rotina.",
    dockIndex: null,
  },
];

const DOCK_COUNT = 6;

const Spotlight = ({ dockIndex }: { dockIndex: number | null }) => {
  // The dock is centered, max-w-md, 5 itens equally distributed.
  // We approximate the X% of each item: center of slot i = (i + 0.5) / 5.
  const cx = dockIndex == null ? null : ((dockIndex + 0.5) / DOCK_COUNT) * 100;

  return (
    <>
      {/* Dim backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/82 backdrop-blur-[2px]"
      />
      {/* Spotlight ring sobre o dock */}
      {cx !== null && (
        <motion.div
          key={dockIndex}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="absolute pointer-events-none"
          style={{
            left: `calc(50% + (${cx}% - 50%) * min(1, calc((100vw - 2rem) / 28rem)))`,
            transform: "translateX(-50%)",
            bottom: `calc(1.1rem + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          {/* Pulsing ring */}
          <span className="relative flex items-center justify-center w-16 h-16">
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "#14b78033" }}
            />
            <span
              className="absolute inset-2 rounded-full"
              style={{
                border: "2px solid #14b780",
                boxShadow: "0 0 24px 4px #14b78088, inset 0 0 12px #14b78055",
              }}
            />
          </span>
          {/* Mãozinha animada apontando pra baixo */}
          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: [-14, -4, -14], opacity: 1 }}
            transition={{ y: { repeat: Infinity, duration: 1.4, ease: "easeInOut" } }}
            className="absolute left-1/2 -translate-x-1/2 -top-9 text-3xl select-none"
            aria-hidden
          >
            👆
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

const WelcomeTour = () => {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        // Pequeno delay para o dock terminar de animar
        const t = setTimeout(() => setOpen(true), 700);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  // Listener global para reabrir o tour de qualquer lugar
  useEffect(() => {
    const handler = () => {
      setI(0);
      setOpen(true);
    };
    window.addEventListener("sth:open-welcome-tour", handler);
    return () => window.removeEventListener("sth:open-welcome-tour", handler);
  }, []);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {}
    setOpen(false);
  };

  if (!open) return null;
  const step = STEPS[i];
  const isLast = i === STEPS.length - 1;
  const pct = Math.round(((i + 1) / STEPS.length) * 100);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="tour"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] overflow-hidden"
      >
        {/* Backdrop click also closes the tour, para não travar o aluno */}
        <div className="absolute inset-0" onClick={close} aria-hidden />
        <Spotlight dockIndex={step.dockIndex} />

        {/* Skip */}
        <button
          onClick={close}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-white/8 backdrop-blur border border-white/15 text-white/80 hover:text-white active:scale-95 transition"
          style={{ top: `calc(1rem + env(safe-area-inset-top, 0px))` }}
          aria-label="Pular tour"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>

        {/* Card central — rolável para nunca esconder os botões em telas baixas */}
        <div className="absolute inset-0 flex items-center justify-center px-5 py-6 overflow-y-auto">
          <motion.div
            key={i}
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl border border-white/12 bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-7 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: "0 30px 80px -20px rgba(20,183,128,0.35), inset 0 1px 0 rgba(255,255,255,0.06)" }}
          >
            {/* Stepper */}
            <div className="flex items-center gap-1 mb-5">
              {STEPS.map((_, idx) => (
                <span
                  key={idx}
                  className="h-1 rounded-full flex-1 transition-all duration-500"
                  style={{
                    background: idx <= i ? "#14b780" : "rgba(255,255,255,0.12)",
                    boxShadow: idx === i ? "0 0 10px #14b78099" : undefined,
                  }}
                />
              ))}
            </div>

            <div className="flex items-start gap-3 mb-3">
              <motion.span
                key={`emoji-${i}`}
                initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 14 }}
                className="text-4xl leading-none select-none"
                aria-hidden
              >
                {step.emoji}
              </motion.span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-white/50">
                  Passo {i + 1}/{STEPS.length} · {pct}%
                </p>
                <h3 className="mt-1 text-[22px] leading-tight font-semibold tracking-[-0.02em] text-white">
                  {step.title}
                </h3>
              </div>
            </div>

            <p className="text-[14px] leading-relaxed text-white/75 font-light">
              {step.body}
            </p>

            {step.highlight && (
              <div
                className="mt-4 rounded-2xl border px-3.5 py-2.5 text-[12px] leading-relaxed"
                style={{
                  background: "rgba(20,183,128,0.08)",
                  borderColor: "rgba(20,183,128,0.35)",
                  color: "#a7f3d0",
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                  {step.highlight}
                </span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={close}
                className="text-[12px] font-medium text-white/55 hover:text-white/80 tracking-tight transition"
              >
                {isLast ? "Fechar" : "Pular tour"}
              </button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLast) {
                    close();
                  } else {
                    setI((v) => Math.min(v + 1, STEPS.length - 1));
                  }
                }}
                className="relative inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold tracking-tight text-black overflow-hidden"
                style={{
                  background: "#14b780",
                  boxShadow: "0 10px 28px -8px #14b780cc, inset 0 0 12px rgba(255,255,255,0.18)",
                }}
              >
                {/* halo pulsante */}
                <span
                  className="absolute inset-0 rounded-full animate-ping pointer-events-none"
                  style={{ background: "#14b78055" }}
                  aria-hidden
                />
                <span className="relative inline-flex items-center gap-2">
                  {isLast ? (
                    <>
                      <PartyPopper className="w-4 h-4" strokeWidth={2.2} />
                      Bora começar
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="w-4 h-4" strokeWidth={2.4} />
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default WelcomeTour;
