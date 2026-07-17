import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw, Timer, Zap, Volume2, VolumeX } from "lucide-react";

const fmt = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
};

const beep = (freq = 880, dur = 180) => {
  try {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur / 1000);
    o.start();
    o.stop(ctx.currentTime + dur / 1000 + 0.05);
  } catch {}
};

const PRESETS = [30, 45, 60, 90, 120, 180];

interface Props {
  open: boolean;
  onClose: () => void;
  workoutTitle?: string;
  defaultRest?: number; // seconds
}

const WorkoutChronometer = ({ open, onClose, workoutTitle, defaultRest = 60 }: Props) => {
  const [totalSec, setTotalSec] = useState(0);
  const [running, setRunning] = useState(true);
  const [restTarget, setRestTarget] = useState<number>(defaultRest);
  const [restLeft, setRestLeft] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [sets, setSets] = useState(0);
  const startRef = useRef<number>(Date.now());
  const pausedAccum = useRef(0);
  const pauseStart = useRef<number | null>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      startRef.current = Date.now();
      pausedAccum.current = 0;
      pauseStart.current = null;
      setTotalSec(0);
      setRunning(true);
      setRestActive(false);
      setRestLeft(0);
      setSets(0);
    }
  }, [open]);

  // Total timer
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      if (!running) return;
      const elapsed = Math.floor((Date.now() - startRef.current - pausedAccum.current) / 1000);
      setTotalSec(elapsed);
    }, 250);
    return () => clearInterval(id);
  }, [open, running]);

  // Rest countdown
  useEffect(() => {
    if (!restActive) return;
    const id = setInterval(() => {
      setRestLeft((v) => {
        if (v <= 1) {
          setRestActive(false);
          if (soundOn) { beep(1200, 160); setTimeout(() => beep(1600, 220), 200); }
          if ("vibrate" in navigator) navigator.vibrate?.([120, 60, 180]);
          return 0;
        }
        if (v <= 4 && soundOn) beep(700, 90);
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [restActive, soundOn]);

  const togglePause = () => {
    if (running) {
      pauseStart.current = Date.now();
      setRunning(false);
    } else {
      if (pauseStart.current) pausedAccum.current += Date.now() - pauseStart.current;
      pauseStart.current = null;
      setRunning(true);
    }
  };

  const startRest = (secs: number) => {
    setRestTarget(secs);
    setRestLeft(secs);
    setRestActive(true);
    setSets((s) => s + 1);
    if (soundOn) beep(520, 120);
  };

  const resetAll = () => {
    startRef.current = Date.now();
    pausedAccum.current = 0;
    pauseStart.current = null;
    setTotalSec(0);
    setRunning(true);
    setRestActive(false);
    setRestLeft(0);
    setSets(0);
  };

  const restProgress = useMemo(() => {
    if (!restTarget) return 0;
    return ((restTarget - restLeft) / restTarget) * 100;
  }, [restLeft, restTarget]);

  const circ = 2 * Math.PI * 88;
  const dash = circ * (1 - restProgress / 100);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black text-white flex flex-col overflow-hidden"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Tech background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/20 blur-3xl" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(circle at 50% 40%, black 40%, transparent 75%)",
            }}
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-5">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/50">Sessão de treino</p>
            <p className="text-sm font-semibold truncate max-w-[60vw]">{workoutTitle || "Cronômetro"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundOn((v) => !v)}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
              aria-label="Som"
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Total time */}
        <div className="relative z-10 flex flex-col items-center mt-6">
          <p className="text-[10px] tracking-[0.35em] uppercase text-white/40 flex items-center gap-1.5">
            <Timer className="w-3 h-3" /> Tempo total
          </p>
          <p className="mt-1 text-5xl font-black tabular-nums tracking-tight font-display">
            {fmt(totalSec)}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
            <span className={`w-1.5 h-1.5 rounded-full ${running ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
            {running ? "Em andamento" : "Pausado"}
            <span className="mx-1 text-white/20">•</span>
            <span>{sets} série(s)</span>
          </div>
        </div>

        {/* Rest ring */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <div className="relative">
            <svg width="220" height="220" className="rotate-[-90deg]">
              <circle cx="110" cy="110" r="88" stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
              <motion.circle
                cx="110" cy="110" r="88"
                stroke="url(#g)" strokeWidth="10" fill="none" strokeLinecap="round"
                strokeDasharray={circ}
                animate={{ strokeDashoffset: restActive ? dash : circ }}
                transition={{ duration: 0.9, ease: "linear" }}
                style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.6))" }}
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Descanso</p>
              <p className="text-6xl font-black tabular-nums tracking-tighter font-display">
                {fmt(restActive ? restLeft : restTarget)}
              </p>
              <p className="text-[11px] text-white/50 mt-1">
                {restActive ? "Recuperando…" : "Escolha o intervalo"}
              </p>
            </div>
          </div>

          {/* Presets */}
          <div className="mt-6 grid grid-cols-3 gap-2 w-full max-w-sm">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => startRest(p)}
                className={`py-2.5 rounded-xl border text-sm font-bold tabular-nums transition-all ${
                  restActive && restTarget === p
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                }`}
              >
                {p < 60 ? `${p}s` : `${p / 60}m${p % 60 ? ` ${p % 60}s` : ""}`}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="relative z-10 px-5 pb-6 pt-3 flex items-center gap-3">
          <button
            onClick={resetAll}
            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
            aria-label="Reiniciar"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={togglePause}
            className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-primary to-emerald-400 text-black font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_hsl(var(--primary)/0.45)]"
          >
            {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {running ? "Pausar" : "Retomar"}
          </button>
          <button
            onClick={() => startRest(restTarget)}
            className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center hover:bg-white/15"
            aria-label="Próxima série"
          >
            <Zap className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WorkoutChronometer;