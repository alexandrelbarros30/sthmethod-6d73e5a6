import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Lock, ChevronRight, MessageCircle, ArrowLeft, Flame, Target, Activity,
  Utensils, BarChart3, Brain, User, X, Clock, Zap, Shield, Award, Unlock,
  Mail, Phone, LogOut, Beaker, UtensilsCrossed, Layers,
} from "lucide-react";
import { calculateMacros, type MacroInput, type MacroResult } from "@/lib/macro-calculator";
import { recipes as richRecipes, recipeCategories, type Recipe as RichRecipe } from "@/data/recipes";
import { families, type Family } from "@/components/student/content/compoundData";
import CompoundDetail from "@/components/student/content/CompoundDetail";
import InsightCarousel from "@/components/student/content/InsightCarousel";
import CombinationsSection from "@/components/student/content/CombinationsSection";
import heroImg from "@/assets/content-hero.jpg";
import cardHormoniosImg from "@/assets/card-hormonios.jpg";
import cardDicasImg from "@/assets/card-dicas.jpg";
import cardReceitasImg from "@/assets/card-receitas.jpg";
import cardCombinacoesImg from "@/assets/card-combinacoes.jpg";

/* ───────── types ───────── */
type Screen = "login" | "hero" | "diagnostic" | "result" | "progress" | "lock" | "dashboard";
type Tab = "receitas" | "macros" | "conteudo" | "perfil";
type Objective = "emagrecimento" | "hipertrofia" | "saude" | "";

interface ProfileData {
  peso: string;
  altura: string;
  objetivo: Objective;
  frequencia: string;
  gender: "masculino" | "feminino";
  age: string;
  phone: string;
  email: string;
}

const FREE_SESSION_KEY = "sth_free_session";

/* ───────── constants ───────── */
const WHATSAPP_URL = "https://wa.me/5521998496289?text=Vi%20meu%20perfil%20no%20app%20e%20quero%20ativar%20meu%20plano%20completo.";

const fade = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.5 } };

const G = {
  accent: "hsl(145 60% 42%)",
  accentSoft: "hsl(145 50% 55%)",
  accentBg: "hsl(145 60% 42% / 0.12)",
  accentBorder: "hsl(145 60% 42% / 0.4)",
  accentBorderSoft: "hsl(145 60% 42% / 0.2)",
  accentGlow: "hsl(145 60% 42% / 0.25)",
  accentText06: "hsl(145 60% 42% / 0.06)",
  accentText15: "hsl(145 60% 42% / 0.15)",
  card: "hsl(0 0% 6%)",
  border: "hsl(0 0% 14%)",
  borderSoft: "hsl(0 0% 12%)",
  t96: "hsl(0 0% 96%)",
  t92: "hsl(0 0% 92%)",
  t80: "hsl(0 0% 80%)",
  t65: "hsl(0 0% 65%)",
  t60: "hsl(0 0% 60%)",
  t55: "hsl(0 0% 55%)",
  t50: "hsl(0 0% 50%)",
  t45: "hsl(0 0% 45%)",
  t40: "hsl(0 0% 40%)",
  t35: "hsl(0 0% 35%)",
  t30: "hsl(0 0% 30%)",
  t10: "hsl(0 0% 10%)",
};

const gamificationMessages = [
  { min: 3, icon: Brain, text: "Você já está à frente da maioria." },
  { min: 5, icon: Shield, text: "Agora começa o nível estratégico." },
  { min: 8, icon: Zap, text: "A maioria erra na condução aqui." },
];

/* ───────── helpers ───────── */
function potentialText(obj: Objective) {
  if (obj === "emagrecimento") return "-3 a -5 kg em 30 dias";
  if (obj === "hipertrofia") return "+1,5 a +2,5 kg de massa em 30 dias";
  return "Melhora metabólica significativa em 30 dias";
}

function saveSession(profile: ProfileData) {
  localStorage.setItem(FREE_SESSION_KEY, JSON.stringify(profile));
}

function loadSession(): ProfileData | null {
  try {
    const raw = localStorage.getItem(FREE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function clearSession() {
  localStorage.removeItem(FREE_SESSION_KEY);
}

/* ───────── component ───────── */
const FreePage = () => {
  const [screen, setScreen] = useState<Screen>("hero");
  const [tab, setTab] = useState<Tab>("receitas");
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>({
    peso: "", altura: "", objetivo: "", frequencia: "", gender: "masculino", age: "28", phone: "", email: "",
  });
  const [progressPct, setProgressPct] = useState(0);
  const [showConversion, setShowConversion] = useState(false);
  const [macroResult, setMacroResult] = useState<MacroResult | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  /* Check for existing session on mount */
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.email && saved.phone) {
      setProfile(saved);
      setScreen("dashboard");
    }
  }, []);

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

  /* calc macros on result */
  useEffect(() => {
    if (screen !== "result" || !profile.peso || !profile.altura) return;
    const input: MacroInput = {
      gender: profile.gender,
      age: Number(profile.age) || 28,
      weight: Number(profile.peso),
      height: Number(profile.altura),
      activityType: "musculacao",
      doesCardio: false,
      objective: profile.objetivo === "emagrecimento" ? "perder_gordura" : profile.objetivo === "hipertrofia" ? "hipertrofia" : "manter_peso",
      physicalActivityLevel: Number(profile.frequencia) <= 2 ? "levemente_ativo" : Number(profile.frequencia) <= 4 ? "moderadamente_ativo" : "bastante_ativo",
      trainingDaysPerWeek: Number(profile.frequencia),
      trainingDurationMinutes: 60,
      trainingIntensity: "moderado",
    };
    setMacroResult(calculateMacros(input));
  }, [screen, profile]);

  const goResult = useCallback(() => {
    if (!profile.peso || !profile.altura || !profile.objetivo || !profile.frequencia || !profile.phone || !profile.email) return;
    setScreen("result");
  }, [profile]);

  const handleSignupAndNext = useCallback(() => {
    // Save lead to database
    supabase.from("free_leads").insert({
      email: profile.email,
      phone: profile.phone,
      gender: profile.gender,
      age: Number(profile.age) || null,
      weight: Number(profile.peso) || null,
      height: Number(profile.altura) || null,
      objective: profile.objetivo,
      frequency: Number(profile.frequencia) || null,
    }).then(() => {});
    // Save session locally
    saveSession(profile);
    setStep(5);
  }, [profile]);

  const handleLogin = useCallback(async () => {
    setLoginError("");
    setLoginLoading(true);
    const { data, error } = await supabase
      .from("free_leads")
      .select("email, phone, gender, age, weight, height, objective, frequency")
      .eq("email", loginEmail.trim().toLowerCase())
      .eq("phone", loginPhone.trim())
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      setLoginError("E-mail ou telefone não encontrado. Faça seu cadastro primeiro.");
      setLoginLoading(false);
      return;
    }
    const restored: ProfileData = {
      email: data.email,
      phone: data.phone,
      gender: (data.gender as "masculino" | "feminino") || "masculino",
      age: String(data.age || 28),
      peso: String(data.weight || ""),
      altura: String(data.height || ""),
      objetivo: (data.objective as Objective) || "",
      frequencia: String(data.frequency || ""),
    };
    setProfile(restored);
    saveSession(restored);
    setScreen("dashboard");
    setLoginLoading(false);
  }, [loginEmail, loginPhone]);

  const handleLogout = useCallback(() => {
    clearSession();
    setProfile({ peso: "", altura: "", objetivo: "", frequencia: "", gender: "masculino", age: "28", phone: "", email: "" });
    setScreen("hero");
    setTab("receitas");
  }, []);

  const objLabel = (o: Objective) => o === "emagrecimento" ? "Emagrecimento" : o === "hipertrofia" ? "Hipertrofia" : o === "saude" ? "Saúde" : "";

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500/50 transition-colors placeholder:text-white/20";

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {/* ──── LOGIN ──── */}
        {screen === "login" && (
          <motion.div key="login" {...fade} className="flex flex-col items-center justify-center min-h-screen px-6">
            <p className="text-[10px] uppercase tracking-[.35em] text-emerald-400/70 mb-6">STH Method Free</p>
            <h2 className="text-2xl font-semibold tracking-tight mb-2">Entrar na plataforma</h2>
            <p className="text-sm text-white/40 mb-8 text-center max-w-xs">Use o e-mail e telefone que você cadastrou.</p>

            <div className="w-full max-w-xs space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="email" inputMode="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  className={`${inputClass} pl-10`} placeholder="seu@email.com" />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="tel" inputMode="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value)}
                  className={`${inputClass} pl-10`} placeholder="(11) 99999-9999" />
              </div>
              {loginError && <p className="text-xs text-red-400 text-center">{loginError}</p>}
              <button disabled={!loginEmail || !loginPhone || loginLoading} onClick={handleLogin}
                className="w-full py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold disabled:opacity-30 active:scale-95 transition">
                {loginLoading ? "Verificando..." : "Entrar"}
              </button>
              <button onClick={() => setScreen("hero")} className="w-full text-sm text-white/30 hover:text-white/50 transition">
                Ainda não tenho conta
              </button>
            </div>
          </motion.div>
        )}

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
            <button onClick={() => setScreen("login")} className="mt-4 text-sm text-white/40 hover:text-white/60 transition">
              Já tenho conta — Entrar
            </button>
          </motion.div>
        )}

        {/* ──── 2. DIAGNOSTIC (6 steps) ──── */}
        {screen === "diagnostic" && (
          <motion.div key="diag" {...fade} className="flex flex-col min-h-screen px-6 pt-16 pb-10">
            <button onClick={() => step === 0 ? setScreen("hero") : setStep(s => s - 1)} className="self-start mb-6 text-white/40 flex items-center gap-1 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>
            <p className="text-[10px] uppercase tracking-[.3em] text-emerald-400/60 mb-2">Diagnóstico</p>
            <h2 className="text-2xl font-semibold tracking-tight mb-1">Seu perfil</h2>
            <p className="text-xs text-white/40 mb-8">Passo {step + 1} de 6</p>

            <div className="flex gap-1.5 mb-8">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-emerald-400" : "bg-white/10"}`} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="s0" {...fade} className="flex-1 flex flex-col gap-4">
                  <label className="text-xs text-white/50">Sexo</label>
                  <div className="flex gap-3">
                    {(["masculino", "feminino"] as const).map(g => (
                      <button key={g} onClick={() => setProfile(p => ({ ...p, gender: g }))}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${profile.gender === g ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-white/60"}`}>
                        {g === "masculino" ? "Masculino" : "Feminino"}
                      </button>
                    ))}
                  </div>
                  <label className="text-xs text-white/50 mt-2">Idade</label>
                  <input type="number" inputMode="numeric" value={profile.age} onChange={e => setProfile(p => ({ ...p, age: e.target.value }))}
                    className={inputClass} placeholder="Ex: 28" />
                  <button disabled={!profile.age} onClick={() => setStep(1)} className="mt-auto px-8 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold disabled:opacity-30 active:scale-95">
                    Próximo
                  </button>
                </motion.div>
              )}
              {step === 1 && (
                <motion.div key="s1" {...fade} className="flex-1 flex flex-col gap-4">
                  <label className="text-xs text-white/50">Peso (kg)</label>
                  <input type="number" inputMode="decimal" value={profile.peso} onChange={e => setProfile(p => ({ ...p, peso: e.target.value }))}
                    className={inputClass} placeholder="Ex: 80" />
                  <label className="text-xs text-white/50 mt-2">Altura (cm)</label>
                  <input type="number" inputMode="decimal" value={profile.altura} onChange={e => setProfile(p => ({ ...p, altura: e.target.value }))}
                    className={inputClass} placeholder="Ex: 178" />
                  <button disabled={!profile.peso || !profile.altura} onClick={() => setStep(2)} className="mt-auto px-8 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold disabled:opacity-30 active:scale-95">
                    Próximo
                  </button>
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
                  <button disabled={!profile.objetivo} onClick={() => setStep(3)} className="mt-auto px-8 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold disabled:opacity-30 active:scale-95">
                    Próximo
                  </button>
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
                  <button disabled={!profile.frequencia} onClick={() => setStep(4)} className="mt-auto px-8 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold disabled:opacity-30 active:scale-95">
                    Próximo
                  </button>
                </motion.div>
              )}
              {step === 4 && (
                <motion.div key="s4" {...fade} className="flex-1 flex flex-col gap-4">
                  <label className="text-xs text-white/50">WhatsApp / Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="tel" inputMode="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                      className={`${inputClass} pl-10`} placeholder="(11) 99999-9999" />
                  </div>
                  <label className="text-xs text-white/50 mt-2">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="email" inputMode="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      className={`${inputClass} pl-10`} placeholder="seu@email.com" />
                  </div>
                  <p className="text-[10px] text-white/25 leading-relaxed">
                    Seus dados são usados apenas para personalizar sua experiência e enviar seu resultado.
                  </p>
                  <button disabled={!profile.phone || !profile.email} onClick={handleSignupAndNext}
                    className="mt-auto px-8 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold disabled:opacity-30 active:scale-95">
                    Próximo
                  </button>
                </motion.div>
              )}
              {step === 5 && (
                <motion.div key="s5" {...fade} className="flex-1 flex flex-col gap-6">
                  <div className="bg-white/[.03] border border-white/[.06] rounded-2xl p-5 space-y-3">
                    <p className="text-xs text-white/40 mb-1">Confirme seus dados</p>
                    <SummaryRow label="Sexo" value={profile.gender === "masculino" ? "Masculino" : "Feminino"} />
                    <SummaryRow label="Idade" value={`${profile.age} anos`} />
                    <SummaryRow label="Peso" value={`${profile.peso} kg`} />
                    <SummaryRow label="Altura" value={`${profile.altura} cm`} />
                    <SummaryRow label="Objetivo" value={objLabel(profile.objetivo)} />
                    <SummaryRow label="Treinos/semana" value={`${profile.frequencia}x`} />
                    <SummaryRow label="WhatsApp" value={profile.phone} />
                    <SummaryRow label="E-mail" value={profile.email} />
                  </div>
                  <button onClick={goResult} className="mt-auto px-8 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold active:scale-95">
                    Ver meu resultado
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ──── 3. RESULT ──── */}
        {screen === "result" && macroResult && (
          <motion.div key="result" {...fade} className="flex flex-col min-h-screen px-6 pt-16 pb-10">
            <p className="text-[10px] uppercase tracking-[.3em] text-emerald-400/60 mb-2">Resultado</p>
            <h2 className="text-2xl font-semibold tracking-tight mb-8">Baseado no seu perfil</h2>

            <div className="space-y-4 flex-1">
              <ResultCard icon={<Flame className="w-5 h-5 text-emerald-400" />} label="TMB (Taxa Metabólica Basal)" value={`${macroResult.bmr} kcal`} />
              <ResultCard icon={<Activity className="w-5 h-5 text-emerald-400" />} label="TDEE (Gasto Diário Total)" value={`${macroResult.tdee} kcal`} />
              <ResultCard icon={<Target className="w-5 h-5 text-emerald-400" />} label="Meta Calórica Diária" value={`${macroResult.dailyCalories} kcal`}
                sub={profile.objetivo === "emagrecimento" ? "Déficit de 500 kcal aplicado" : profile.objetivo === "hipertrofia" ? "Superávit de 350 kcal aplicado" : "Manutenção"} />

              <div className="bg-white/[.03] border border-white/[.06] rounded-2xl p-5 space-y-4">
                <p className="text-xs text-white/40">Distribuição de Macronutrientes</p>
                <MacroBar label="Proteína" value={macroResult.proteinG} unit="g" color="bg-emerald-500" detail="2g/kg" />
                <MacroBar label="Carboidratos" value={macroResult.carbsG} unit="g" color="bg-blue-500" detail="restante" />
                <MacroBar label="Gorduras" value={macroResult.fatG} unit="g" color="bg-amber-500" detail="1g/kg" />
              </div>

              <ResultCard icon={<Target className="w-5 h-5 text-emerald-400" />} label="Potencial de evolução" value={potentialText(profile.objetivo as Objective)} />
            </div>

            <button onClick={() => setScreen("progress")} className="mt-8 w-full py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition active:scale-95">
              Gerar meu plano completo
            </button>
          </motion.div>
        )}

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
                <span>Progresso</span><span>{progressPct}%</span>
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
            <div className="px-6 pt-12 pb-4">
              <p className="text-[10px] uppercase tracking-[.3em] text-emerald-400/60">STH Method Free</p>
              <h2 className="text-lg font-semibold tracking-tight mt-1">
                {tab === "receitas" && "Receitas Saudáveis"}
                {tab === "macros" && "Calculadora de Macros"}
                {tab === "conteudo" && "Conteúdo"}
                {tab === "perfil" && "Meu Perfil"}
              </h2>
            </div>

            <div className="flex-1 px-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {tab === "receitas" && <TabReceitas key="rec" />}
                {tab === "macros" && <TabMacros key="mac" profile={profile} />}
                {tab === "conteudo" && <TabConteudo key="cont" />}
                {tab === "perfil" && <TabPerfil key="perf" profile={profile} macroResult={macroResult} onConvert={() => setShowConversion(true)} onLogout={handleLogout} />}
              </AnimatePresence>
            </div>

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

            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 text-black text-xs font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition active:scale-95">
              <MessageCircle className="w-4 h-4" />
              Falar com especialista
            </a>

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

const MacroBar = ({ label, value, unit, color, detail }: { label: string; value: number; unit: string; color: string; detail: string }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-xs">
      <span className="text-white/60">{label}</span>
      <span className="font-semibold text-white">{value}{unit} <span className="text-white/30 font-normal">({detail})</span></span>
    </div>
    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1, delay: 0.3 }} className={`h-full rounded-full ${color}`} />
    </div>
  </div>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm">
    <span className="text-white/40">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

/* ──── Tab: Receitas (using rich recipe data) ──── */
const objectiveColor: Record<string, string> = {
  Emagrecimento: "text-green-400",
  Hipertrofia: "text-blue-400",
  Manutenção: "text-amber-400",
  Definição: "text-purple-400",
};

const TabReceitas = () => {
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<RichRecipe | null>(null);
  const filtered = filter === "Todos" ? richRecipes : richRecipes.filter(r => r.category === filter);

  return (
    <motion.div {...fade} className="space-y-4 pb-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {recipeCategories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${filter === cat ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-white/50"}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            onClick={() => setSelected(r)}
            className="bg-white/[.03] border border-white/[.06] rounded-2xl overflow-hidden cursor-pointer active:scale-[.97] transition-transform">
            <div className="relative aspect-square overflow-hidden">
              <img src={r.image} alt={r.title} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-bold leading-tight">{r.title}</p>
              </div>
              <span className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white/80">{r.category}</span>
            </div>
            <div className="px-2.5 py-2 flex items-center justify-between text-[10px] text-white/40">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.time}</span>
              <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {r.kcal} kcal</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rich Recipe detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 overflow-y-auto" onClick={() => setSelected(null)}>
            <div className="max-w-md mx-auto" onClick={e => e.stopPropagation()}>
              <div className="relative">
                <img src={selected.image} alt={selected.title} className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-bold">{selected.title}</h3>
                  <div className="flex gap-3 mt-1 text-xs text-white/60">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selected.time}</span>
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {selected.kcal} kcal</span>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{tag}</span>
                  ))}
                </div>

                {/* Objetivo */}
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.accent }}>📌 Objetivo</p>
                  <div className="flex gap-2">
                    {selected.objetivo.split("/").map(obj => (
                      <span key={obj.trim()} className={`text-sm font-bold ${objectiveColor[obj.trim()] || "text-emerald-400"}`}>{obj.trim()}</span>
                    ))}
                  </div>
                </div>

                {/* Ingredientes */}
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.accent }}>🍽️ Composição Base</p>
                  <ul className="space-y-1.5">
                    {selected.ingredients.map((ing, i) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />{ing}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Preparo */}
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.accent }}>⚙️ Preparo</p>
                  <p className="text-xs text-white/60 whitespace-pre-line leading-relaxed">{selected.instructions}</p>
                </div>

                {/* Substituições */}
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.accent }}>🔄 Substituições Inteligentes</p>
                  <ul className="space-y-1.5">
                    {selected.substituicoes.map((sub, i) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                        <span className="text-emerald-400">→</span>{sub}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Ajuste Estratégico */}
                <div className="rounded-xl p-4 space-y-1.5" style={{ background: G.accentText06, border: `0.5px solid ${G.accentBorderSoft}` }}>
                  <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.accent }}>💡 Ajuste Estratégico</p>
                  <p className="text-xs leading-relaxed" style={{ color: G.t80 }}>{selected.ajusteEstrategico}</p>
                </div>

                {/* Dica Prática */}
                <div className="rounded-xl p-4 space-y-1.5" style={{ background: G.card, border: `0.5px solid ${G.border}` }}>
                  <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.accent }}>🚀 Dica Prática</p>
                  <p className="text-xs leading-relaxed" style={{ color: G.t80 }}>{selected.dicaPratica}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ──── Tab: Macros (real calculator) ──── */
const TabMacros = ({ profile }: { profile: ProfileData }) => {
  const [peso, setPeso] = useState(profile.peso);
  const [altura, setAltura] = useState(profile.altura || "175");
  const [age, setAge] = useState(profile.age || "28");
  const [gender, setGender] = useState<"masculino" | "feminino">(profile.gender);
  const [obj, setObj] = useState(profile.objetivo || "saude");
  const [freq, setFreq] = useState(profile.frequencia || "3");

  const result = peso && altura ? calculateMacros({
    gender,
    age: Number(age) || 28,
    weight: Number(peso),
    height: Number(altura),
    activityType: "musculacao",
    doesCardio: false,
    objective: obj === "emagrecimento" ? "perder_gordura" : obj === "hipertrofia" ? "hipertrofia" : "manter_peso",
    physicalActivityLevel: Number(freq) <= 2 ? "levemente_ativo" : Number(freq) <= 4 ? "moderadamente_ativo" : "bastante_ativo",
    trainingDaysPerWeek: Number(freq),
    trainingDurationMinutes: 60,
    trainingIntensity: "moderado",
  }) : null;

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 transition-colors";

  return (
    <motion.div {...fade} className="space-y-5 pb-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] text-white/40">Sexo</label>
          <div className="flex gap-1.5">
            {(["masculino", "feminino"] as const).map(g => (
              <button key={g} onClick={() => setGender(g)}
                className={`flex-1 py-2 rounded-xl text-[11px] font-medium transition-colors ${gender === g ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-white/40"}`}>
                {g === "masculino" ? "M" : "F"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-white/40">Idade</label>
          <input type="number" inputMode="numeric" value={age} onChange={e => setAge(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] text-white/40">Peso (kg)</label>
          <input type="number" inputMode="decimal" value={peso} onChange={e => setPeso(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-white/40">Altura (cm)</label>
          <input type="number" inputMode="decimal" value={altura} onChange={e => setAltura(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] text-white/40">Objetivo</label>
        <div className="flex gap-2">
          {(["emagrecimento", "hipertrofia", "saude"] as const).map(o => (
            <button key={o} onClick={() => setObj(o)}
              className={`flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-colors ${obj === o ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-white/40"}`}>
              {o === "emagrecimento" ? "Emagrecer" : o === "hipertrofia" ? "Hipertrofia" : "Saúde"}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] text-white/40">Treinos/semana</label>
        <div className="flex gap-1.5">
          {["1","2","3","4","5","6","7"].map(d => (
            <button key={d} onClick={() => setFreq(d)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${freq === d ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-white/40"}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mt-2">
          <div className="bg-white/[.03] border border-white/[.06] rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-white/40">TMB</p>
                <p className="text-lg font-bold text-white">{result.bmr}</p>
                <p className="text-[9px] text-white/25">kcal</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40">TDEE</p>
                <p className="text-lg font-bold text-emerald-400">{result.tdee}</p>
                <p className="text-[9px] text-white/25">kcal</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40">Meta</p>
                <p className="text-lg font-bold text-emerald-300">{result.dailyCalories}</p>
                <p className="text-[9px] text-white/25">kcal</p>
              </div>
            </div>
          </div>

          <div className="bg-white/[.03] border border-white/[.06] rounded-2xl p-5 space-y-4">
            <p className="text-xs text-white/40">Macronutrientes</p>
            <MacroBar label="Proteína" value={result.proteinG} unit="g" color="bg-emerald-500" detail="2g/kg" />
            <MacroBar label="Carboidratos" value={result.carbsG} unit="g" color="bg-blue-500" detail="restante" />
            <MacroBar label="Gorduras" value={result.fatG} unit="g" color="bg-amber-500" detail="1g/kg" />
          </div>

          <p className="text-[10px] text-white/25 text-center leading-relaxed px-4">
            Valores estimados pela fórmula Mifflin-St Jeor + NEAT. Ajustes personalizados com acompanhamento profissional liberam maior precisão.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

/* ──── Tab: Conteúdo (full compound families from student) ──── */
type ContentView = "hub" | "hormonios" | "dicas" | "receitas_section" | "combinacoes";

const contentSections = [
  { id: "hormonios" as ContentView, tag: "Compostos", title: "Hormônios e Compostos", subtitle: "3 famílias · 15 compostos", img: cardHormoniosImg, icon: Beaker, accentHue: "145" },
  { id: "dicas" as ContentView, tag: "Estratégia", title: "Dicas Estratégicas", subtitle: "8 temas fundamentais", img: cardDicasImg, icon: Brain, accentHue: "210" },
  { id: "receitas_section" as ContentView, tag: "Nutrição", title: "Receitas Saudáveis", subtitle: "Pratos inteligentes", img: cardReceitasImg, icon: UtensilsCrossed, accentHue: "30" },
  { id: "combinacoes" as ContentView, tag: "Estratégia", title: "Combinações Estratégicas", subtitle: "Definição · Hipertrofia", img: cardCombinacoesImg, icon: Layers, accentHue: "270" },
];

const TabConteudo = () => {
  const [view, setView] = useState<ContentView>("hub");
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [selectedCompoundId, setSelectedCompoundId] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [recipeFilter, setRecipeFilter] = useState("Todos");
  const [selectedRecipe, setSelectedRecipe] = useState<RichRecipe | null>(null);

  const totalCompounds = families.flatMap(f => f.compounds).length;
  const progress = visited.size;

  const handleSelectCompound = useCallback((id: string) => {
    setSelectedCompoundId(id);
    setVisited(prev => new Set(prev).add(id));
  }, []);

  const handleBack = () => {
    if (selectedFamily) {
      setSelectedFamily(null);
      setSelectedCompoundId(null);
    } else {
      setView("hub");
    }
  };

  const filteredRecipes = recipeFilter === "Todos" ? richRecipes : richRecipes.filter(r => r.category === recipeFilter);

  // ── Hub view
  if (view === "hub") {
    return (
      <motion.div {...fade} className="space-y-4 pb-6">
        <p className="text-sm leading-relaxed" style={{ color: G.t50 }}>
          Escolha uma trilha. Cada módulo entrega clareza e resultado.
        </p>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-1 px-1 pb-2">
          {contentSections.map((s, i) => {
            const accent = `hsl(${s.accentHue} 60% 42%)`;
            const accentBg = `hsl(${s.accentHue} 60% 42% / 0.12)`;
            const accentBorder = `hsl(${s.accentHue} 60% 42% / 0.3)`;
            return (
              <motion.button key={s.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i }}
                whileTap={{ scale: 0.96 }} onClick={() => setView(s.id)}
                className="snap-center flex-shrink-0 w-[72vw] max-w-[280px] text-left rounded-2xl overflow-hidden relative group"
                style={{ border: `0.5px solid ${G.border}` }}>
                <div className="relative h-36 overflow-hidden">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading={i === 0 ? undefined : "lazy"} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(0 0% 4% / 1) 0%, hsl(0 0% 4% / 0.4) 55%, transparent 100%)" }} />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] font-bold px-2 py-1 rounded-full backdrop-blur-md"
                      style={{ background: accentBg, color: accent, border: `0.5px solid ${accentBorder}` }}>
                      <s.icon className="w-2.5 h-2.5" />{s.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3.5 space-y-0.5">
                    <h3 className="text-[15px] font-bold tracking-tight leading-tight" style={{ color: G.t96 }}>{s.title}</h3>
                    <p className="text-[11px]" style={{ color: G.t50 }}>{s.subtitle}</p>
                  </div>
                </div>
                <div className="px-3.5 py-2.5 flex items-center justify-between" style={{ background: G.card }}>
                  <span className="text-[10px] font-medium" style={{ color: G.t40 }}>Explorar</span>
                  <ChevronRight className="w-3 h-3" style={{ color: accent }} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // ── Back button (always visible inside any section)
  const BackButton = () => (
    <button onClick={handleBack} className="flex items-center gap-1.5 text-xs font-medium mb-3" style={{ color: G.t60 }}>
      <ArrowLeft className="w-3.5 h-3.5" />
      {selectedFamily ? "Famílias" : "Conteúdo"}
    </button>
  );

  // ── Hormônios
  if (view === "hormonios") {
    if (selectedFamily) {
      return (
        <motion.div {...fade} className="space-y-4 pb-6">
          <BackButton />
          <h3 className="text-base font-bold" style={{ color: G.t96 }}>{selectedFamily.title}</h3>
          <p className="text-xs" style={{ color: `hsl(${selectedFamily.accentHue} 50% 55%)` }}>{selectedFamily.subheadline}</p>
          <CompoundDetail family={selectedFamily} selected={selectedCompoundId} visited={visited} onSelect={handleSelectCompound} />
        </motion.div>
      );
    }

    return (
      <motion.div {...fade} className="space-y-4 pb-6">
        <BackButton />
        <h3 className="text-base font-bold" style={{ color: G.t96 }}>Hormônios e Compostos</h3>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span style={{ color: G.t40 }}>{progress}/{totalCompounds} compostos</span>
            {progress === totalCompounds && <span className="font-semibold" style={{ color: G.accent }}>✓ Completo</span>}
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: G.t10 }}>
            <motion.div className="h-full rounded-full" style={{ background: G.accent }} animate={{ width: `${(progress / totalCompounds) * 100}%` }} transition={{ duration: 0.6 }} />
          </div>
        </div>

        {/* Family cards */}
        <div className="space-y-3">
          {families.map((family, i) => (
            <motion.div key={family.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={() => setSelectedFamily(family)}
              className="rounded-2xl overflow-hidden relative cursor-pointer active:scale-[.98] transition-transform"
              style={{ border: `0.5px solid ${G.border}` }}>
              <img src={family.image} alt={family.title} className="w-full h-28 object-cover" />
              <div className="absolute inset-0 flex items-end p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent 60%)" }}>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">{family.title}</h4>
                  <p className="text-[10px] text-white/40 mt-0.5">{family.compounds.length} compostos</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gamification */}
        {gamificationMessages.map(gm => progress >= gm.min && (
          <motion.div key={gm.min} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-4 flex items-center gap-3" style={{ background: G.accentText06, border: `0.5px solid ${G.accentText15}` }}>
            <gm.icon className="w-5 h-5 flex-shrink-0" style={{ color: G.accent }} />
            <p className="text-sm font-medium" style={{ color: G.accentSoft }}>{gm.text}</p>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // ── Dicas
  if (view === "dicas") {
    return (
      <motion.div {...fade} className="space-y-4 pb-6">
        <BackButton />
        <h3 className="text-base font-bold" style={{ color: G.t96 }}>Dicas Estratégicas</h3>
        <InsightCarousel />
      </motion.div>
    );
  }

  // ── Receitas (inside content hub)
  if (view === "receitas_section") {
    return (
      <motion.div {...fade} className="space-y-4 pb-6">
        <BackButton />
        <h3 className="text-base font-bold" style={{ color: G.t96 }}>Receitas Saudáveis</h3>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {recipeCategories.map(cat => (
            <button key={cat} onClick={() => setRecipeFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${recipeFilter === cat ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-white/50"}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredRecipes.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedRecipe(r)}
              className="bg-white/[.03] border border-white/[.06] rounded-2xl overflow-hidden cursor-pointer active:scale-[.97] transition-transform">
              <div className="relative aspect-square overflow-hidden">
                <img src={r.image} alt={r.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-bold leading-tight">{r.title}</p>
                </div>
              </div>
              <div className="px-2.5 py-2 flex items-center justify-between text-[10px] text-white/40">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.time}</span>
                <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {r.kcal} kcal</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recipe detail modal */}
        <AnimatePresence>
          {selectedRecipe && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 overflow-y-auto" onClick={() => setSelectedRecipe(null)}>
              <div className="max-w-md mx-auto" onClick={e => e.stopPropagation()}>
                <div className="relative">
                  <img src={selectedRecipe.image} alt={selectedRecipe.title} className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                  <button onClick={() => setSelectedRecipe(null)} className="absolute top-4 left-4 text-white/50 hover:text-white flex items-center gap-1 text-xs">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-lg font-bold">{selectedRecipe.title}</h3>
                    <div className="flex gap-3 mt-1 text-xs text-white/60">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedRecipe.time}</span>
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {selectedRecipe.kcal} kcal</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRecipe.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{tag}</span>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.accent }}>📌 Objetivo</p>
                    <div className="flex gap-2">
                      {selectedRecipe.objetivo.split("/").map(obj => (
                        <span key={obj.trim()} className={`text-sm font-bold ${objectiveColor[obj.trim()] || "text-emerald-400"}`}>{obj.trim()}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.accent }}>🍽️ Composição Base</p>
                    <ul className="space-y-1.5">
                      {selectedRecipe.ingredients.map((ing, i) => (
                        <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />{ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.accent }}>⚙️ Preparo</p>
                    <p className="text-xs text-white/60 whitespace-pre-line leading-relaxed">{selectedRecipe.instructions}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.accent }}>🔄 Substituições</p>
                    <ul className="space-y-1.5">
                      {selectedRecipe.substituicoes.map((sub, i) => (
                        <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                          <span className="text-emerald-400">→</span>{sub}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl p-4 space-y-1.5" style={{ background: G.accentText06, border: `0.5px solid ${G.accentBorderSoft}` }}>
                    <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.accent }}>💡 Ajuste Estratégico</p>
                    <p className="text-xs leading-relaxed" style={{ color: G.t80 }}>{selectedRecipe.ajusteEstrategico}</p>
                  </div>
                  <div className="rounded-xl p-4 space-y-1.5" style={{ background: G.card, border: `0.5px solid ${G.border}` }}>
                    <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.accent }}>🚀 Dica Prática</p>
                    <p className="text-xs leading-relaxed" style={{ color: G.t80 }}>{selectedRecipe.dicaPratica}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── Combinações
  if (view === "combinacoes") {
    return (
      <motion.div {...fade} className="space-y-4 pb-6">
        <BackButton />
        <h3 className="text-base font-bold" style={{ color: G.t96 }}>Combinações Estratégicas</h3>
        <CombinationsSection />
      </motion.div>
    );
  }

  return null;

/* ──── Tab: Perfil (with logout) ──── */
const TabPerfil = ({ profile, macroResult, onConvert, onLogout }: { profile: ProfileData; macroResult: MacroResult | null; onConvert: () => void; onLogout: () => void }) => {
  const objLabel = profile.objetivo === "emagrecimento" ? "Emagrecimento" : profile.objetivo === "hipertrofia" ? "Hipertrofia" : "Saúde";
  const locked = ["Plano alimentar personalizado", "Treino completo", "Protocolo estratégico"];

  return (
    <motion.div {...fade} className="space-y-4 pb-6">
      <div className="bg-white/[.03] border border-white/[.06] rounded-2xl p-5 space-y-3">
        <p className="text-xs text-white/40 mb-1">Seus dados</p>
        <SummaryRow label="Sexo" value={profile.gender === "masculino" ? "Masculino" : "Feminino"} />
        <SummaryRow label="Idade" value={`${profile.age} anos`} />
        <SummaryRow label="Peso" value={`${profile.peso} kg`} />
        <SummaryRow label="Altura" value={`${profile.altura} cm`} />
        <SummaryRow label="Objetivo" value={objLabel} />
        <SummaryRow label="Treinos/semana" value={`${profile.frequencia}x`} />
        <SummaryRow label="WhatsApp" value={profile.phone} />
        <SummaryRow label="E-mail" value={profile.email} />
      </div>

      {macroResult && (
        <div className="bg-white/[.03] border border-white/[.06] rounded-2xl p-5 space-y-2">
          <p className="text-xs text-white/40 mb-1">Seus macros calculados</p>
          <SummaryRow label="Meta Calórica" value={`${macroResult.dailyCalories} kcal`} />
          <SummaryRow label="Proteína" value={`${macroResult.proteinG}g`} />
          <SummaryRow label="Carboidratos" value={`${macroResult.carbsG}g`} />
          <SummaryRow label="Gorduras" value={`${macroResult.fatG}g`} />
        </div>
      )}

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

      {/* Logout button */}
      <button onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-medium mt-4 active:scale-[.98] transition-transform">
        <LogOut className="w-4 h-4" />
        Sair da plataforma
      </button>
    </motion.div>
  );
};

/* ──── Conversion Modal ──── */
const ConversionModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center px-6 text-center">
    <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white/60"><X className="w-5 h-5" /></button>
    <h2 className="text-2xl font-semibold tracking-tight mb-3 max-w-xs">Você já viu o potencial.</h2>
    <p className="text-sm text-white/50 mb-10 max-w-xs">Agora precisa executar com estratégia.</p>
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
