import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, ChevronRight, MessageCircle, ArrowLeft, Flame, Target, Activity, Utensils, BarChart3, Brain, User, X } from "lucide-react";

/* ───────── types ───────── */
type Screen = "hero" | "diagnostic" | "result" | "progress" | "lock" | "dashboard";
type Tab = "receitas" | "macros" | "conteudo" | "perfil";
type Objective = "emagrecimento" | "hipertrofia" | "saude" | "";

interface ProfileData {
  peso: string;
  altura: string;
  objetivo: Objective;
  frequencia: string;
}

/* ───────── constants ───────── */
const WHATSAPP_URL = "https://wa.me/SEUNUMERO?text=Vi%20meu%20perfil%20no%20app%20e%20quero%20ativar%20meu%20plano%20completo.";

const RECIPES = [
  { title: "Bowl proteico de frango", tag: "Hipertrofia", kcal: "420 kcal", time: "15 min" },
  { title: "Omelete fit de espinafre", tag: "Emagrecimento", kcal: "280 kcal", time: "10 min" },
  { title: "Shake pós-treino", tag: "Recuperação", kcal: "350 kcal", time: "5 min" },
  { title: "Salada mediterrânea", tag: "Saúde", kcal: "310 kcal", time: "12 min" },
  { title: "Wrap de atum", tag: "Emagrecimento", kcal: "290 kcal", time: "8 min" },
  { title: "Panqueca de banana", tag: "Energia", kcal: "380 kcal", time: "10 min" },
];

const CONTENT_CARDS = [
  "Você não precisa comer menos. Precisa comer certo.",
  "Seu erro não é esforço. É direção.",
  "Treinar mais não resolve. Treinar certo resolve.",
  "Protocolo sem estratégia é tentativa e erro.",
  "Resultado real começa quando a rotina faz sentido.",
  "Corpo responde a consistência, não a intensidade.",
];

const fade = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.5 } };

/* ───────── helpers ───────── */
function calcCalories(peso: number, altura: number, obj: Objective, freq: number) {
  const tmb = 10 * peso + 6.25 * altura - 5 * 28 + 5; // rough male estimate
  const mult = freq <= 2 ? 1.375 : freq <= 4 ? 1.55 : 1.725;
  const tdee = Math.round(tmb * mult);
  if (obj === "emagrecimento") return { low: tdee - 600, high: tdee - 400, tdee };
  if (obj === "hipertrofia") return { low: tdee + 200, high: tdee + 400, tdee };
  return { low: tdee - 100, high: tdee + 100, tdee };
}

function potentialText(obj: Objective) {
  if (obj === "emagrecimento") return "-3 a -5 kg em 30 dias";
  if (obj === "hipertrofia") return "+1,5 a +2,5 kg de massa em 30 dias";
  return "Melhora metabólica significativa em 30 dias";
}

/* ───────── component ───────── */
const FreePage = () => {
  const [screen, setScreen] = useState<Screen>("hero");
  const [tab, setTab] = useState<Tab>("receitas");
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>({ peso: "", altura: "", objetivo: "", frequencia: "" });
  const [progressPct, setProgressPct] = useState(0);
  const [showConversion, setShowConversion] = useState(false);

  /* progress animation */
  useEffect(() => {
    if (screen !== "progress") return;
    const steps = [72, 85, 93];
    let i = 0;
    const iv = setInterval(() => {
      if (i < steps.length) { setProgressPct(steps[i]); i++; }
      else { clearInterval(iv); setTimeout(() => setScreen("lock"), 800); }
    }, 900);
    return () => clearInterval(iv);
  }, [screen]);

  const goResult = useCallback(() => {
    if (!profile.peso || !profile.altura || !profile.objetivo || !profile.frequencia) return;
    setScreen("result");
  }, [profile]);

  const objLabel = (o: Objective) => o === "emagrecimento" ? "Emagrecimento" : o === "hipertrofia" ? "Hipertrofia" : o === "saude" ? "Saúde" : "";

  /* ───── screens ───── */
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {/* ──── 1. HERO ──── */}
        {screen === "hero" && (
          <motion.div key="hero" {...fade} className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            <p className="text-[10px] uppercase tracking-[.35em] text-emerald-400/70 mb-8">STH Method</p>
            <h1 className="text-3xl sm:text-5xl font-semibold leading-tight tracking-tight max-w-lg">
              Controle seu corpo.<br />Com método.
            </h1>
            <p className="mt-4 text-sm text-white/50 max-w-xs">
              Descubra como seu corpo deveria evoluir com estratégia.
            </p>
            <button onClick={() => setScreen("diagnostic")} className="mt-10 px-8 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition-colors active:scale-95">
              Começar análise
            </button>
          </motion.div>
        )}

        {/* ──── 2. DIAGNOSTIC ──── */}
        {screen === "diagnostic" && (
          <motion.div key="diag" {...fade} className="flex flex-col min-h-screen px-6 pt-16 pb-10">
            <button onClick={() => setScreen("hero")} className="self-start mb-6 text-white/40 flex items-center gap-1 text-xs"><ArrowLeft className="w-3.5 h-3.5" /> Voltar</button>
            <p className="text-[10px] uppercase tracking-[.3em] text-emerald-400/60 mb-2">Diagnóstico</p>
            <h2 className="text-2xl font-semibold tracking-tight mb-1">Seu perfil</h2>
            <p className="text-xs text-white/40 mb-8">Passo {step + 1} de 4</p>

            {/* steps progress */}
            <div className="flex gap-1.5 mb-8">
              {[0,1,2,3].map(i => (
                <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-emerald-400" : "bg-white/10"}`} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="s0" {...fade} className="flex-1 flex flex-col gap-4">
                  <label className="text-xs text-white/50">Peso (kg)</label>
                  <input type="number" inputMode="decimal" value={profile.peso} onChange={e => setProfile(p => ({ ...p, peso: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500/50 transition-colors" placeholder="Ex: 80" />
                  <button disabled={!profile.peso} onClick={() => setStep(1)} className="mt-auto px-8 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold disabled:opacity-30 hover:bg-emerald-400 transition active:scale-95">
                    Próximo
                  </button>
                </motion.div>
              )}
              {step === 1 && (
                <motion.div key="s1" {...fade} className="flex-1 flex flex-col gap-4">
                  <label className="text-xs text-white/50">Altura (cm)</label>
                  <input type="number" inputMode="decimal" value={profile.altura} onChange={e => setProfile(p => ({ ...p, altura: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500/50 transition-colors" placeholder="Ex: 178" />
                  <div className="mt-auto flex gap-3">
                    <button onClick={() => setStep(0)} className="flex-1 py-3.5 rounded-full border border-white/10 text-sm text-white/60">Voltar</button>
                    <button disabled={!profile.altura} onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold disabled:opacity-30 active:scale-95">Próximo</button>
                  </div>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="s2" {...fade} className="flex-1 flex flex-col gap-4">
                  <label className="text-xs text-white/50">Objetivo</label>
                  {(["emagrecimento", "hipertrofia", "saude"] as Objective[]).map(o => (
                    <button key={o} onClick={() => setProfile(p => ({ ...p, objetivo: o }))}
                      className={`text-left px-4 py-3.5 rounded-2xl border text-sm transition-colors ${profile.objetivo === o ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-white/70"}`}>
                      {objLabel(o)}
                    </button>
                  ))}
                  <div className="mt-auto flex gap-3">
                    <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-full border border-white/10 text-sm text-white/60">Voltar</button>
                    <button disabled={!profile.objetivo} onClick={() => setStep(3)} className="flex-1 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold disabled:opacity-30 active:scale-95">Próximo</button>
                  </div>
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="s3" {...fade} className="flex-1 flex flex-col gap-4">
                  <label className="text-xs text-white/50">Frequência de treino (dias/semana)</label>
                  <div className="flex gap-2">
                    {["1","2","3","4","5","6","7"].map(d => (
                      <button key={d} onClick={() => setProfile(p => ({ ...p, frequencia: d }))}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${profile.frequencia === d ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-white/60"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="mt-auto flex gap-3">
                    <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-full border border-white/10 text-sm text-white/60">Voltar</button>
                    <button disabled={!profile.frequencia} onClick={goResult} className="flex-1 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold disabled:opacity-30 active:scale-95">
                      Ver meu resultado
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ──── 3. RESULT ──── */}
        {screen === "result" && (() => {
          const cal = calcCalories(Number(profile.peso), Number(profile.altura), profile.objetivo as Objective, Number(profile.frequencia));
          return (
            <motion.div key="result" {...fade} className="flex flex-col min-h-screen px-6 pt-16 pb-10">
              <p className="text-[10px] uppercase tracking-[.3em] text-emerald-400/60 mb-2">Resultado</p>
              <h2 className="text-2xl font-semibold tracking-tight mb-8">Baseado no seu perfil</h2>

              <div className="space-y-4 flex-1">
                <ResultCard icon={<Flame className="w-5 h-5 text-emerald-400" />} label="Consumo calórico estimado" value={`${cal.low} – ${cal.high} kcal/dia`} />
                <ResultCard icon={<Target className="w-5 h-5 text-emerald-400" />} label="Potencial de evolução" value={potentialText(profile.objetivo as Objective)} />
                <ResultCard icon={<Activity className="w-5 h-5 text-emerald-400" />} label="Status metabólico" value="Ajuste necessário" sub="Seu metabolismo pode render mais com a estratégia certa." />
              </div>

              <button onClick={() => setScreen("progress")} className="mt-8 w-full py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition active:scale-95">
                Gerar meu plano
              </button>
            </motion.div>
          );
        })()}

        {/* ──── 4. PROGRESS ──── */}
        {screen === "progress" && (
          <motion.div key="prog" {...fade} className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            <p className="text-[10px] uppercase tracking-[.3em] text-emerald-400/60 mb-4">Processando</p>
            <h2 className="text-2xl font-semibold tracking-tight mb-8">Seu plano está sendo estruturado...</h2>

            <div className="w-full max-w-xs space-y-4 mb-10">
              {["Dieta personalizada", "Treino ajustado", "Protocolo estratégico"].map((t, i) => (
                <motion.div key={t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.8 + 0.3 }}
                  className="flex items-center gap-3 text-sm text-white/70">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  {t}
                </motion.div>
              ))}
            </div>

            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs text-white/40 mb-1.5">
                <span>Progresso</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full bg-emerald-500 rounded-full" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.6 }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ──── 5. LOCK ──── */}
        {screen === "lock" && (
          <motion.div key="lock" {...fade} className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mb-3">Seu plano completo está pronto.</h2>
            <p className="text-sm text-white/50 max-w-xs mb-10">
              Para liberar o acesso completo com ajustes individuais e acompanhamento, ative seu plano.
            </p>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="w-full max-w-xs py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold text-center block hover:bg-emerald-400 transition active:scale-95 mb-3">
              Liberar acesso completo
            </a>
            <button onClick={() => setScreen("dashboard")} className="text-sm text-white/40 hover:text-white/60 transition">
              Explorar versão gratuita
            </button>
          </motion.div>
        )}

        {/* ──── 6. DASHBOARD ──── */}
        {screen === "dashboard" && (
          <motion.div key="dash" {...fade} className="flex flex-col min-h-screen pb-20">
            {/* header */}
            <div className="px-6 pt-12 pb-4">
              <p className="text-[10px] uppercase tracking-[.3em] text-emerald-400/60">STH Method Free</p>
              <h2 className="text-lg font-semibold tracking-tight mt-1">
                {tab === "receitas" && "Receitas"}
                {tab === "macros" && "Calculadora de Macros"}
                {tab === "conteudo" && "Conteúdo"}
                {tab === "perfil" && "Meu Perfil"}
              </h2>
            </div>

            {/* tab content */}
            <div className="flex-1 px-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {tab === "receitas" && <TabReceitas key="rec" />}
                {tab === "macros" && <TabMacros key="mac" profile={profile} />}
                {tab === "conteudo" && <TabConteudo key="cont" />}
                {tab === "perfil" && <TabPerfil key="perf" profile={profile} onConvert={() => setShowConversion(true)} />}
              </AnimatePresence>
            </div>

            {/* bottom nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/5 flex justify-around py-3 z-50">
              {([
                { id: "receitas" as Tab, icon: Utensils, label: "Receitas" },
                { id: "macros" as Tab, icon: BarChart3, label: "Macros" },
                { id: "conteudo" as Tab, icon: Brain, label: "Conteúdo" },
                { id: "perfil" as Tab, icon: User, label: "Perfil" },
              ]).map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${tab === t.id ? "text-emerald-400" : "text-white/30"}`}>
                  <t.icon className="w-5 h-5" />
                  {t.label}
                </button>
              ))}
            </nav>

            {/* floating CTA */}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 text-black text-xs font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition active:scale-95">
              <MessageCircle className="w-4 h-4" />
              Falar com especialista
            </a>

            {/* conversion modal */}
            <AnimatePresence>
              {showConversion && <ConversionModal onClose={() => setShowConversion(false)} />}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ───────── sub-components ───────── */

const ResultCard = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) => (
  <div className="bg-white/[.03] border border-white/[.06] rounded-2xl p-5">
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <span className="text-xs text-white/40">{label}</span>
    </div>
    <p className="text-lg font-semibold tracking-tight">{value}</p>
    {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
  </div>
);

/* ──── Tab: Receitas ──── */
const TabReceitas = () => (
  <motion.div {...fade} className="space-y-3 pb-6">
    {RECIPES.map((r, i) => (
      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
        className="bg-white/[.03] border border-white/[.06] rounded-2xl p-4 flex justify-between items-center active:scale-[.98] transition-transform">
        <div>
          <p className="text-sm font-medium">{r.title}</p>
          <div className="flex gap-3 mt-1">
            <span className="text-[10px] text-emerald-400/70">{r.tag}</span>
            <span className="text-[10px] text-white/30">{r.kcal}</span>
            <span className="text-[10px] text-white/30">{r.time}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20" />
      </motion.div>
    ))}
  </motion.div>
);

/* ──── Tab: Macros ──── */
const TabMacros = ({ profile }: { profile: ProfileData }) => {
  const [peso, setPeso] = useState(profile.peso);
  const [obj, setObj] = useState<Objective>(profile.objetivo as Objective || "saude");
  const cal = peso ? calcCalories(Number(peso), Number(profile.altura) || 175, obj, Number(profile.frequencia) || 3) : null;

  return (
    <motion.div {...fade} className="space-y-5 pb-6">
      <div className="space-y-3">
        <label className="text-xs text-white/50">Peso (kg)</label>
        <input type="number" inputMode="decimal" value={peso} onChange={e => setPeso(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500/50 transition-colors" />
      </div>
      <div className="space-y-3">
        <label className="text-xs text-white/50">Objetivo</label>
        <div className="flex gap-2">
          {(["emagrecimento", "hipertrofia", "saude"] as Objective[]).map(o => (
            <button key={o} onClick={() => setObj(o)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors ${obj === o ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-white/50"}`}>
              {o === "emagrecimento" ? "Emagrecer" : o === "hipertrofia" ? "Hipertrofia" : "Saúde"}
            </button>
          ))}
        </div>
      </div>

      {cal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[.03] border border-white/[.06] rounded-2xl p-5 mt-4">
          <p className="text-xs text-white/40 mb-2">Seu consumo ideal varia entre</p>
          <p className="text-2xl font-semibold tracking-tight text-emerald-400">{cal.low} – {cal.high} <span className="text-sm text-white/40">kcal/dia</span></p>
          <p className="text-[11px] text-white/30 mt-3 leading-relaxed">
            Valores estimados. Ajustes personalizados liberam maior precisão.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

/* ──── Tab: Conteúdo ──── */
const TabConteudo = () => (
  <motion.div {...fade} className="space-y-3 pb-6">
    {CONTENT_CARDS.map((txt, i) => (
      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
        className="bg-white/[.03] border border-white/[.06] rounded-2xl p-5">
        <p className="text-sm leading-relaxed text-white/80 italic">"{txt}"</p>
      </motion.div>
    ))}
  </motion.div>
);

/* ──── Tab: Perfil ──── */
const TabPerfil = ({ profile, onConvert }: { profile: ProfileData; onConvert: () => void }) => {
  const objLabel = profile.objetivo === "emagrecimento" ? "Emagrecimento" : profile.objetivo === "hipertrofia" ? "Hipertrofia" : "Saúde";
  const locked = [
    "Plano alimentar personalizado",
    "Treino completo",
    "Protocolo estratégico",
  ];

  return (
    <motion.div {...fade} className="space-y-4 pb-6">
      <div className="bg-white/[.03] border border-white/[.06] rounded-2xl p-5 space-y-3">
        <p className="text-xs text-white/40 mb-1">Seus dados</p>
        <Row label="Peso" value={`${profile.peso} kg`} />
        <Row label="Altura" value={`${profile.altura} cm`} />
        <Row label="Objetivo" value={objLabel} />
        <Row label="Treinos/semana" value={`${profile.frequencia}x`} />
      </div>

      <div className="space-y-2">
        {locked.map((item, i) => (
          <button key={i} onClick={onConvert}
            className="w-full flex items-center gap-3 bg-white/[.03] border border-white/[.06] rounded-2xl p-4 text-left active:scale-[.98] transition-transform">
            <Lock className="w-4 h-4 text-white/20 shrink-0" />
            <span className="text-sm text-white/40">{item}</span>
            <ChevronRight className="w-4 h-4 text-white/10 ml-auto" />
          </button>
        ))}
      </div>
    </motion.div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm">
    <span className="text-white/40">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

/* ──── Conversion Modal ──── */
const ConversionModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center px-6 text-center">
    <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white/60"><X className="w-5 h-5" /></button>

    <h2 className="text-2xl font-semibold tracking-tight mb-3 max-w-xs">
      Você já viu o potencial.
    </h2>
    <p className="text-sm text-white/50 mb-10 max-w-xs">
      Agora precisa executar com estratégia.
    </p>

    <div className="flex gap-4 w-full max-w-xs mb-10">
      <div className="flex-1 bg-white/[.03] border border-white/[.06] rounded-2xl p-4 text-center">
        <p className="text-[10px] text-white/30 mb-2">Sem método</p>
        <X className="w-5 h-5 text-red-400/60 mx-auto mb-1" />
        <p className="text-xs text-white/40">Tentativa</p>
      </div>
      <div className="flex-1 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
        <p className="text-[10px] text-emerald-400/60 mb-2">Com método</p>
        <Check className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
        <p className="text-xs text-emerald-300/70">Resultado</p>
      </div>
    </div>

    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
      className="w-full max-w-xs py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold text-center block hover:bg-emerald-400 transition active:scale-95">
      Ativar meu plano
    </a>
    <button onClick={onClose} className="mt-4 text-xs text-white/30 hover:text-white/50">Voltar</button>
  </motion.div>
);

export default FreePage;
