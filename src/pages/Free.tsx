import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Lock, ChevronRight, MessageCircle, ArrowLeft, Flame, Target, Activity,
  Utensils, BarChart3, Brain, User, X, Clock, Zap, Shield, Award, Unlock,
  Mail, Phone, ChevronDown,
} from "lucide-react";
import { calculateMacros, type MacroInput, type MacroResult } from "@/lib/macro-calculator";

/* ── Recipe images ── */
import recipePoke from "@/assets/recipe-poke.jpg";
import recipeFrango from "@/assets/recipe-frango.jpg";
import recipeAcai from "@/assets/recipe-acai.jpg";
import recipeSmoothie from "@/assets/recipe-smoothie.jpg";
import recipePanqueca from "@/assets/recipe-panqueca.jpg";
import recipeSalada from "@/assets/recipe-salada.jpg";
import recipeMoqueca from "@/assets/recipe-moqueca.jpg";
import recipeTapioca from "@/assets/recipe-tapioca.jpg";
import recipeCuscuz from "@/assets/recipe-cuscuz.jpg";
import recipePureBatata from "@/assets/recipe-pure-batata.jpg";
import recipeOmelete from "@/assets/recipe-omelete.jpg";
import recipeEscondidinho from "@/assets/recipe-escondidinho.jpg";

/* ── Compound images ── */
import imgEnantato from "@/assets/compound-enantato.jpg";
import imgCipionato from "@/assets/compound-cipionato.jpg";
import imgPropionato from "@/assets/compound-propionato.jpg";
import imgDurateston from "@/assets/compound-durateston.jpg";
import imgGel from "@/assets/compound-gel.jpg";
import imgMasteronProp from "@/assets/compound-masteron-prop.jpg";
import imgMasteronEnan from "@/assets/compound-masteron-enan.jpg";
import imgNandrolona from "@/assets/compound-nandrolona.jpg";
import imgGestrinona from "@/assets/compound-gestrinona.jpg";
import imgOxandrolona from "@/assets/compound-oxandrolona.jpg";
import heroImg from "@/assets/content-hero.jpg";

/* ───────── types ───────── */
type Screen = "hero" | "diagnostic" | "result" | "progress" | "lock" | "dashboard";
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

/* ── Recipes data ── */
const RECIPES = [
  { id: "1", title: "Poke Bowl de Salmão", image: recipePoke, time: "20 min", kcal: 420, category: "Almoço", tags: ["Alto em Proteína", "Low Carb"], ingredients: ["150g salmão fresco em cubos", "100g arroz japonês cozido", "½ abacate fatiado", "50g edamame", "Gergelim e molho shoyu light"], instructions: "1. Cozinhe o arroz e reserve.\n2. Corte o salmão em cubos.\n3. Monte o bowl e finalize com gergelim." },
  { id: "2", title: "Frango Grelhado com Batata Doce", image: recipeFrango, time: "30 min", kcal: 380, category: "Almoço", tags: ["Alto em Proteína", "Pré-treino"], ingredients: ["200g peito de frango", "150g batata doce", "100g brócolis", "Azeite, sal e pimenta"], instructions: "1. Tempere e grelhe o frango.\n2. Cozinhe a batata doce no vapor.\n3. Refogue o brócolis com azeite." },
  { id: "3", title: "Açaí Bowl Proteico", image: recipeAcai, time: "10 min", kcal: 350, category: "Lanche", tags: ["Pós-treino", "Rico em Fibras"], ingredients: ["200g polpa de açaí sem açúcar", "1 banana", "30g granola", "Morangos e mirtilos"], instructions: "1. Bata o açaí com a banana.\n2. Decore com granola e frutas." },
  { id: "4", title: "Smoothie Verde Detox", image: recipeSmoothie, time: "5 min", kcal: 180, category: "Café da manhã", tags: ["Detox", "Rico em Vitaminas"], ingredients: ["1 xícara de espinafre", "1 banana", "1 kiwi", "200ml água de coco"], instructions: "1. Bata tudo no liquidificador.\n2. Sirva gelado." },
  { id: "5", title: "Panqueca Proteica", image: recipePanqueca, time: "15 min", kcal: 290, category: "Café da manhã", tags: ["Alto em Proteína"], ingredients: ["2 ovos", "1 banana madura", "30g aveia", "1 scoop whey"], instructions: "1. Bata tudo no liquidificador.\n2. Doure dos dois lados na frigideira." },
  { id: "6", title: "Salada de Salmão e Quinoa", image: recipeSalada, time: "25 min", kcal: 400, category: "Jantar", tags: ["Rico em Ômega-3", "Low Carb"], ingredients: ["150g salmão grelhado", "80g quinoa cozida", "Mix de folhas verdes", "Azeite e limão"], instructions: "1. Grelhe o salmão.\n2. Monte a salada e regue com azeite." },
  { id: "7", title: "Moqueca de Peixe Fit", image: recipeMoqueca, time: "35 min", kcal: 360, category: "Almoço", tags: ["Rico em Ômega-3", "Brasileiro"], ingredients: ["200g filé de peixe branco", "100ml leite de coco light", "Tomate, pimentão, coentro"], instructions: "1. Refogue os vegetais.\n2. Adicione o peixe e leite de coco.\n3. Cozinhe em fogo baixo." },
  { id: "8", title: "Tapioca de Frango", image: recipeTapioca, time: "15 min", kcal: 280, category: "Lanche", tags: ["Sem Glúten", "Brasileiro"], ingredients: ["3 colheres de goma de tapioca", "100g frango desfiado", "Requeijão light"], instructions: "1. Espalhe a goma na frigideira.\n2. Recheie e dobre." },
  { id: "9", title: "Cuscuz com Ovos", image: recipeCuscuz, time: "20 min", kcal: 320, category: "Café da manhã", tags: ["Rico em Fibras", "Brasileiro"], ingredients: ["100g flocos de milho", "2 ovos cozidos", "Tomate e cebola"], instructions: "1. Hidrate e cozinhe o cuscuz.\n2. Sirva com ovos e legumes." },
  { id: "10", title: "Purê de Batata Doce com Frango", image: recipePureBatata, time: "30 min", kcal: 410, category: "Jantar", tags: ["Alto em Proteína", "Brasileiro"], ingredients: ["200g batata doce", "180g peito de frango", "Vagem e cenoura no vapor"], instructions: "1. Cozinhe e amasse a batata doce.\n2. Grelhe o frango.\n3. Monte o prato." },
  { id: "11", title: "Omelete de Claras", image: recipeOmelete, time: "10 min", kcal: 200, category: "Café da manhã", tags: ["Alto em Proteína", "Low Carb"], ingredients: ["4 claras de ovo", "1 ovo inteiro", "Espinafre", "Tomate cereja"], instructions: "1. Bata os ovos.\n2. Adicione espinafre e tomate.\n3. Dobre ao meio." },
  { id: "12", title: "Escondidinho Fit", image: recipeEscondidinho, time: "40 min", kcal: 370, category: "Jantar", tags: ["Comfort Food", "Brasileiro"], ingredients: ["200g batata doce", "150g frango desfiado", "Requeijão light", "Queijo minas"], instructions: "1. Monte camadas: purê, frango, purê.\n2. Cubra com queijo.\n3. Gratine por 15 min." },
];

const RECIPE_CATEGORIES = ["Todos", "Café da manhã", "Almoço", "Lanche", "Jantar"];

/* ── Compounds data ── */
const compounds = [
  { id: "enantato", name: "Enantato", tag: "Estável", image: imgEnantato, essencia: "Éster de liberação gradual e perfil estável.", oQueFaz: "Favorece manutenção hormonal, recuperação e suporte à massa muscular.", comoEntra: "Aplicação intramuscular com liberação lenta.", comoSeComporta: "Resposta previsível ao longo dos dias.", atencao: "Pode causar retenção, acne e aromatização.", resumo: "Estabilidade e leitura mais limpa do protocolo." },
  { id: "cipionato", name: "Cipionato", tag: "Consistente", image: imgCipionato, essencia: "Forma de ação prolongada e comportamento consistente.", oQueFaz: "Atua na força, recuperação e síntese proteica.", comoEntra: "Aplicação intramuscular lenta.", comoSeComporta: "Mantém níveis relativamente estáveis.", atencao: "Pode gerar retenção e elevação estrogênica.", resumo: "Consistência é o principal valor." },
  { id: "propionato", name: "Propionato", tag: "Rápido", image: imgPropionato, essencia: "Éster de ação curta e resposta rápida.", oQueFaz: "Favorece ação mais ágil no organismo.", comoEntra: "Absorção intramuscular rápida.", comoSeComporta: "Exige aplicações mais frequentes.", atencao: "Pode causar irritação local e mais variação hormonal.", resumo: "Rápido, porém menos estável." },
  { id: "durateston", name: "Durateston", tag: "Misto", image: imgDurateston, essencia: "Blend de testosteronas com tempos diferentes de liberação.", oQueFaz: "Combina início mais rápido com sustentação posterior.", comoEntra: "Aplicação intramuscular com liberação em fases.", comoSeComporta: "Pico inicial seguido de manutenção prolongada.", atencao: "Pode oscilar mais e exigir maior controle.", resumo: "Entrega velocidade, mas cobra precisão." },
  { id: "gel", name: "Gel", tag: "Diário", image: imgGel, essencia: "Aplicação transdérmica diária.", oQueFaz: "Promove aumento gradual dos níveis hormonais.", comoEntra: "Absorção pela pele.", comoSeComporta: "Níveis mais lineares dependendo da absorção.", atencao: "Absorção variável e risco de transferência por contato.", resumo: "Praticidade com dependência da absorção individual." },
  { id: "masteron-prop", name: "Masteron P.", tag: "Seco", image: imgMasteronProp, essencia: "Derivado com ação mais rápida e perfil seco.", oQueFaz: "Atua na densidade muscular e estética.", comoEntra: "Aplicação intramuscular rápida.", comoSeComporta: "Resposta ágil com necessidade de maior frequência.", atencao: "Exige controle e acompanhamento.", resumo: "Rápido e sensível a ajustes." },
  { id: "masteron-enan", name: "Masteron E.", tag: "Estável", image: imgMasteronEnan, essencia: "Versão mais estável da drostanolona.", oQueFaz: "Contribui para densidade e estética com estabilidade.", comoEntra: "Aplicação intramuscular prolongada.", comoSeComporta: "Resposta mais linear.", atencao: "Exige estratégia.", resumo: "Estabilidade com controle." },
  { id: "nandrolona", name: "Nandrolona", tag: "Estrutura", image: imgNandrolona, essencia: "Forte ação anabólica e suporte estrutural.", oQueFaz: "Auxilia recuperação e articulações.", comoEntra: "Aplicação intramuscular prolongada.", comoSeComporta: "Ação duradoura e acumulativa.", atencao: "Impacto hormonal relevante.", resumo: "Eficiência com necessidade de precisão." },
  { id: "gestrinona", name: "Gestrinona", tag: "Controle", image: imgGestrinona, essencia: "Atua no controle do ambiente hormonal.", oQueFaz: "Modulação hormonal e composição corporal.", comoEntra: "Oral ou transdérmico.", comoSeComporta: "Resposta dependente do contexto individual.", atencao: "Necessita acompanhamento profissional.", resumo: "Controle exige estratégia." },
  { id: "oxandrolona", name: "Oxandrolona", tag: "Definição", image: imgOxandrolona, essencia: "Perfil controlado com foco em definição.", oQueFaz: "Auxilia definição e manutenção muscular.", comoEntra: "Administração oral.", comoSeComporta: "Resposta progressiva.", atencao: "Controle hepático necessário.", resumo: "Previsível, mas exige cuidado." },
];

const compoundFields = [
  { key: "essencia", label: "Essência" },
  { key: "oQueFaz", label: "O que faz" },
  { key: "comoEntra", label: "Como entra no corpo" },
  { key: "comoSeComporta", label: "Como se comporta" },
  { key: "atencao", label: "Pontos de atenção" },
  { key: "resumo", label: "Resumo STH" },
] as const;

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

  const objLabel = (o: Objective) => o === "emagrecimento" ? "Emagrecimento" : o === "hipertrofia" ? "Hipertrofia" : o === "saude" ? "Saúde" : "";

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500/50 transition-colors placeholder:text-white/20";

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
                  <button disabled={!profile.phone || !profile.email} onClick={() => setStep(5)} className="mt-auto px-8 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-semibold disabled:opacity-30 active:scale-95">
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

              {/* Macro bars */}
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
                {tab === "receitas" && "Receitas"}
                {tab === "macros" && "Calculadora de Macros"}
                {tab === "conteudo" && "Hormônios e Compostos"}
                {tab === "perfil" && "Meu Perfil"}
              </h2>
            </div>

            <div className="flex-1 px-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {tab === "receitas" && <TabReceitas key="rec" />}
                {tab === "macros" && <TabMacros key="mac" profile={profile} />}
                {tab === "conteudo" && <TabConteudo key="cont" />}
                {tab === "perfil" && <TabPerfil key="perf" profile={profile} macroResult={macroResult} onConvert={() => setShowConversion(true)} />}
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

/* ──── Tab: Receitas (with real images) ──── */
const TabReceitas = () => {
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<typeof RECIPES[0] | null>(null);
  const filtered = filter === "Todos" ? RECIPES : RECIPES.filter(r => r.category === filter);

  return (
    <motion.div {...fade} className="space-y-4 pb-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {RECIPE_CATEGORIES.map(cat => (
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

      {/* Recipe detail modal */}
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
                <div>
                  <h4 className="text-sm font-bold mb-2">Ingredientes</h4>
                  <ul className="space-y-1.5">
                    {selected.ingredients.map((ing, i) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />{ing}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-2">Modo de Preparo</h4>
                  <p className="text-xs text-white/60 whitespace-pre-line leading-relaxed">{selected.instructions}</p>
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

/* ──── Tab: Conteúdo (real compounds) ──── */
const TabConteudo = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const progress = visited.size;
  const compound = compounds.find(c => c.id === selectedId);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setVisited(prev => new Set(prev).add(id));
  }, []);

  return (
    <motion.div {...fade} className="space-y-6 pb-6">
      {/* Hero */}
      <div className="rounded-2xl overflow-hidden relative" style={{ border: `0.5px solid ${G.border}` }}>
        <img src={heroImg} alt="STH Method" className="w-full h-44 object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.2))" }}>
          <h3 className="text-base font-semibold text-white">Entenda com clareza</h3>
          <p className="text-[11px] text-white/40 mt-1">Leitura rápida. Interpretação estratégica.</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-white/40">{progress}/{compounds.length} compostos</span>
          {progress === compounds.length && <span className="text-emerald-400 font-semibold">✓ Completo</span>}
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div className="h-full bg-emerald-500 rounded-full" animate={{ width: `${(progress / compounds.length) * 100}%` }} transition={{ duration: 0.6 }} />
        </div>
      </div>

      {/* Selector */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 snap-x">
        {compounds.map((c, i) => {
          const isSelected = selectedId === c.id;
          const isVisited = visited.has(c.id);
          return (
            <motion.button key={c.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.03 }}
              whileTap={{ scale: 0.95 }} onClick={() => handleSelect(c.id)}
              className="snap-center flex-shrink-0 rounded-xl px-3.5 py-2.5 flex flex-col items-center gap-1 min-w-[84px] transition-all"
              style={{ background: isSelected ? G.accentBg : G.card, border: isSelected ? `1px solid ${G.accentBorder}` : `0.5px solid ${G.border}` }}>
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-medium whitespace-nowrap" style={{ color: isSelected ? G.accent : G.t80 }}>{c.name}</span>
                {isVisited && !isSelected && <Check className="w-3 h-3" style={{ color: "hsl(142 60% 40%)" }} />}
              </div>
              <span className="text-[9px] whitespace-nowrap" style={{ color: G.t45 }}>{c.tag}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {compound && (
          <motion.div key={compound.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
            <div className="rounded-xl overflow-hidden relative" style={{ border: `0.5px solid ${G.border}` }}>
              <img src={compound.image} alt={compound.name} className="w-full h-40 object-cover" loading="lazy" />
              <div className="absolute inset-0 flex items-end p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 60%)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{compound.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: G.accentBg, color: G.accent, border: `0.5px solid ${G.accentBorderSoft}` }}>{compound.tag}</span>
                </div>
              </div>
            </div>
            {compoundFields.map((field, i) => (
              <motion.div key={field.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-xl p-4 space-y-1.5"
                style={{ background: field.key === "resumo" ? G.accentText06 : G.card, border: field.key === "resumo" ? `0.5px solid ${G.accentBorderSoft}` : `0.5px solid ${G.borderSoft}` }}>
                <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: field.key === "resumo" ? G.accent : G.t40 }}>{field.label}</p>
                <p className="text-sm leading-relaxed" style={{ color: G.t80 }}>{compound[field.key]}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gamification */}
      {gamificationMessages.map(gm => progress >= gm.min && (
        <motion.div key={gm.min} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl p-4 flex items-center gap-3" style={{ background: G.accentText06, border: `0.5px solid ${G.accentText15}` }}>
          <gm.icon className="w-5 h-5 flex-shrink-0" style={{ color: G.accent }} />
          <p className="text-sm font-medium" style={{ color: G.accentSoft }}>{gm.text}</p>
        </motion.div>
      ))}

      {/* Locked section */}
      <div className="relative rounded-2xl p-5 space-y-3 overflow-hidden" style={{ background: G.card, border: `0.5px solid ${G.border}` }}>
        {progress < compounds.length && (
          <div className="absolute inset-0 z-10 backdrop-blur-md flex flex-col items-center justify-center gap-3" style={{ background: "rgba(0,0,0,0.7)" }}>
            <Lock className="w-6 h-6" style={{ color: G.t30 }} />
            <p className="text-xs font-medium text-center" style={{ color: G.t40 }}>Explore todos os {compounds.length} compostos para desbloquear</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          {progress === compounds.length ? <Unlock className="w-4 h-4" style={{ color: G.accent }} /> : <Lock className="w-4 h-4" style={{ color: G.t30 }} />}
          <h3 className="text-base font-semibold" style={{ color: G.t92 }}>Nível Avançado STH</h3>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: G.t55 }}>Combinação de compostos, ajuste fino e controle real de resultado.</p>
        {progress === compounds.length && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-2 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" style={{ color: G.accent }} />
              <p className="text-xs font-semibold" style={{ color: G.accent }}>Conteúdo desbloqueado!</p>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: G.t65 }}>
              A combinação de compostos exige leitura de meia-vida, janela de aplicação e controle de aromatização.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

/* ──── Tab: Perfil ──── */
const TabPerfil = ({ profile, macroResult, onConvert }: { profile: ProfileData; macroResult: MacroResult | null; onConvert: () => void }) => {
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
