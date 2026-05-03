import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Salad, ChevronRight, Flame, Clock, Utensils,
  UtensilsCrossed, Beaker, Brain, Layers, Bell, Droplets, Activity, Target
} from "lucide-react";
import cardHormoniosImg from "@/assets/sthnews-subq-glass-1.jpg";
import cardDicasImg from "@/assets/sthnews-triade-thumb.jpg";
import cardReceitasImg from "@/assets/recipe-salmao-aspargos.jpg";
import cardCombinacoesImg from "@/assets/sthnews-masteron-glass-1.jpg";
import sthNewsLatestImg from "@/assets/sthnews-cintura-hero.jpg";
import { useMealTracking } from "@/hooks/useMealTracking";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SubscriptionAlerts from "@/components/student/SubscriptionAlerts";
import AdAutoPopup from "@/components/student/AdAutoPopup";
import PreviewUnlockPopup from "@/components/student/PreviewUnlockPopup";
import recipeMousseWhey from "@/assets/recipe-mousse-whey.jpg";
import recipePatinho from "@/assets/recipe-patinho-grelhado.jpg";
import recipeMexidoOvos from "@/assets/recipe-mexido-ovos.jpg";

const contentSections = [
  { id: "hormonios", tag: "Compostos", title: "Hormônios e Compostos", subtitle: "3 famílias · 15 compostos", img: cardHormoniosImg, icon: Beaker },
  { id: "dicas", tag: "Estratégias", title: "Dicas Essenciais", subtitle: "8 temas · 24 aulas", img: cardDicasImg, icon: Brain },
  { id: "receitas", tag: "Nutrição", title: "Receitas Saudáveis", subtitle: "Pratos inteligentes", img: cardReceitasImg, icon: UtensilsCrossed },
  { id: "combinacoes", tag: "Estratégia", title: "Combinações", subtitle: "Definição · Hipertrofia", img: cardCombinacoesImg, icon: Layers },
];

const recipeHighlights = [
  { id: "39", title: "Mousse Proteico com Morango", image: recipeMousseWhey, kcal: 320, time: 15 },
  { id: "40", title: "Patinho com Batata Doce", image: recipePatinho, kcal: 480, time: 25 },
  { id: "41", title: "Torrada com Ovo e Tomate", image: recipeMexidoOvos, kcal: 250, time: 10 },
];

const greetings = ["Olá", "Oi", "Bom te ver", "Bem-vindo de volta", "Hey"];
const getGreeting = () => greetings[Math.floor(Math.random() * greetings.length)];

const DailyMealWidget = () => {
  const {
    meals, completedCount, totalMeals, progressPercent, nextMeal,
    isLoading, isMealCompleted,
  } = useMealTracking();

  if (isLoading || meals.length === 0) return null;

  return (
    <div className="mb-8 rounded-3xl border border-border/40 bg-background overflow-hidden">
      <div className="p-6">
        <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4 flex items-center gap-1.5">
          <Utensils className="w-3 h-3" /> Progresso do dia
        </div>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[44px] leading-none font-semibold tracking-[-0.04em] text-foreground tabular-nums">{completedCount}</span>
              <span className="text-2xl text-muted-foreground/60 font-light tracking-[-0.02em]">/{totalMeals}</span>
            </div>
            <p className="text-[12px] text-muted-foreground font-light mt-2 tracking-tight">refeições concluídas</p>
          </div>
          <div className="text-right">
            <span className="text-[28px] leading-none font-semibold tabular-nums tracking-[-0.03em] text-foreground">{progressPercent}<span className="text-base text-muted-foreground/60 font-light">%</span></span>
          </div>
        </div>
        <div className="h-px w-full bg-foreground/10 overflow-hidden rounded-full mb-5">
          <div className="h-full bg-foreground rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
        {nextMeal && !isMealCompleted(nextMeal.id) && (
          <div className="flex items-center justify-between py-3 border-t border-border/40">
            <div>
              <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">Próxima</p>
              <p className="text-[14px] font-medium text-foreground mt-1 flex items-center gap-1.5 tracking-tight">
                <Clock className="w-3 h-3 text-muted-foreground" /> {nextMeal.name} · {nextMeal.time}
              </p>
            </div>
          </div>
        )}
        <Link to="/dashboard/diet" className="block mt-4">
          <Button className="w-full rounded-full h-11 bg-foreground text-background hover:bg-foreground/90 text-[13px] font-medium gap-1.5">
            <Salad className="w-3.5 h-3.5" /> Ver refeições
          </Button>
        </Link>
      </div>
    </div>
  );
};

const StudentOverview = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [greeting] = useState(getGreeting);

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*, plans(*, duration_days)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const firstName = profile?.full_name?.split(" ")[0] || "Aluno";

  const {
    totalMacros: dayTargetMacros,
    consumedMacros: dayMacros,
    progressPercent: dayProgress,
    waterConsumedMl: dayWaterMl,
    hydrationGoalL: dayHydrationGoalL,
    isLoading: mealsLoading,
  } = useMealTracking();

  // BLACK ELITE palette
  const GOLD = "#D4AF37";
  const BG = "#050508";
  const SURFACE = "#0A0A0F";
  const BORDER = "rgba(212,175,55,0.10)";
  const BORDER_STRONG = "rgba(212,175,55,0.22)";
  const TEXT = "#EAEAEA";
  const SUBTLE = "rgba(234,234,234,0.55)";
  const ULTRA_SUBTLE = "rgba(234,234,234,0.35)";

  const ringSize = 168;
  const stroke = 8;
  const r = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progressVal = mealsLoading ? 0 : (dayProgress || 0);
  const dash = (progressVal / 100) * circumference;

  return (
    <DashboardLayout role="student" title="" subtitle="">
      <SubscriptionAlerts subscription={subscription ? { ...subscription, plans: (subscription as any)?.plans } : null} />
      <AdAutoPopup />
      <PreviewUnlockPopup />

      {/* BLACK ELITE wrapper — overrides parent surface to deep black */}
      <div
        className="-mx-4 -mt-4 px-4 pt-6 pb-10 min-h-[100dvh]"
        style={{ background: BG, color: TEXT }}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between mb-8 relative">
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-[10px] font-medium tracking-[0.3em] uppercase" style={{ color: GOLD }}>
              ◆ Black Elite
            </p>
            <h1
              className="text-[44px] sm:text-[56px] leading-[0.95] font-semibold mt-3 tracking-[-0.045em]"
              style={{ color: TEXT }}
            >
              {firstName}
              <span style={{ color: GOLD }}>.</span>
            </h1>
            <p className="text-[12px] font-light mt-3 tracking-tight max-w-[260px]" style={{ color: SUBTLE }}>
              {greeting}. Sua jornada premium continua.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/ads")}
            className="w-10 h-10 rounded-full flex items-center justify-center relative transition-colors"
            style={{ border: `0.5px solid ${BORDER_STRONG}`, background: SURFACE }}
            aria-label="Notificações"
          >
            <Bell className="w-4 h-4" strokeWidth={1.5} style={{ color: TEXT }} />
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full" style={{ background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />
          </button>
        </div>

        {/* PROGRESSO — anel dourado */}
        <div
          className="mb-8 rounded-[24px] p-7 relative overflow-hidden"
          style={{
            background: `radial-gradient(120% 100% at 0% 0%, rgba(212,175,55,0.06) 0%, ${SURFACE} 55%)`,
            border: `0.5px solid ${BORDER}`,
            boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 20px 40px -20px rgba(0,0,0,0.6)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <p className="text-[10px] font-medium tracking-[0.3em] uppercase mb-3" style={{ color: ULTRA_SUBTLE }}>
                Hoje
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-[44px] leading-none font-semibold tabular-nums tracking-[-0.04em]" style={{ color: TEXT }}>
                  {mealsLoading ? "—" : dayProgress}
                </span>
                <span className="text-xl font-light" style={{ color: SUBTLE }}>%</span>
              </div>
              <p className="text-[11px] font-light mt-3 tracking-tight" style={{ color: SUBTLE }}>
                refeições concluídas
              </p>
              <div className="inline-flex w-fit items-center gap-1.5 text-[10px] mt-4 rounded-full px-3 py-1.5 font-medium tracking-[0.1em] uppercase"
                style={{ background: "rgba(212,175,55,0.08)", border: `0.5px solid ${BORDER_STRONG}`, color: GOLD }}>
                <Target className="w-2.5 h-2.5" strokeWidth={2} /> 8 dias
              </div>
            </div>
            <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <defs>
                  <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F4D77A" />
                    <stop offset="50%" stopColor={GOLD} />
                    <stop offset="100%" stopColor="#9A7B1F" />
                  </linearGradient>
                </defs>
                <circle
                  cx={ringSize / 2} cy={ringSize / 2} r={r}
                  stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} fill="none"
                />
                <circle
                  cx={ringSize / 2} cy={ringSize / 2} r={r}
                  stroke="url(#goldRing)" strokeWidth={stroke} fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                  style={{ transition: "stroke-dasharray 0.8s ease", filter: `drop-shadow(0 0 4px rgba(212,175,55,0.35))` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: ULTRA_SUBTLE }}>Meta</span>
                <span className="text-[28px] font-semibold tabular-nums tracking-[-0.03em] mt-1" style={{ color: TEXT }}>
                  {mealsLoading ? "—" : dayProgress}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STH NEWS */}
        <Link to="/tendencias/cintura-estetica" className="block mb-8 group">
          <div
            className="rounded-[22px] p-4 flex items-center gap-4"
            style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 relative" style={{ border: `0.5px solid ${BORDER_STRONG}` }}>
              <img src={sthNewsLatestImg} alt="STH News" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium tracking-[0.25em] uppercase mb-1.5" style={{ color: GOLD }}>STH News</p>
              <p className="text-[14px] font-semibold tracking-[-0.015em] truncate" style={{ color: TEXT }}>
                A estética da cintura não é só genética
              </p>
              <p className="text-[11px] font-light mt-0.5 tracking-tight" style={{ color: SUBTLE }}>22 Abr 2026</p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} style={{ color: GOLD }} />
          </div>
        </Link>

        {/* CONTEÚDO */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] font-medium tracking-[0.3em] uppercase" style={{ color: GOLD }}>STH Method</p>
              <h2 className="text-[24px] font-semibold tracking-[-0.03em] leading-tight mt-2" style={{ color: TEXT }}>Conteúdo</h2>
            </div>
            <Link to="/dashboard/content" className="text-[12px] font-medium flex items-center gap-0.5 pb-1 tracking-tight" style={{ color: GOLD }}>
              Ver tudo <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2">
            {contentSections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => navigate(s.id === "receitas" ? "/dashboard/recipes" : `/dashboard/content?section=${s.id}`)}
                  className="snap-start shrink-0 w-[78vw] max-w-[300px] text-left rounded-[22px] overflow-hidden relative group active:scale-[0.98] transition-all duration-300"
                  style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={s.img}
                      alt={s.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ filter: "brightness(0.65) contrast(1.05) saturate(0.85)" }}
                      loading="lazy"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.35) 50%, rgba(5,5,8,0.15) 100%)" }} />
                    <div className="absolute top-4 left-4">
                      <span
                        className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.25em] font-medium px-2.5 py-1 rounded-full backdrop-blur-md"
                        style={{ background: "rgba(212,175,55,0.10)", border: `0.5px solid ${BORDER_STRONG}`, color: GOLD }}
                      >
                        <Icon className="w-2.5 h-2.5" strokeWidth={2} />
                        {s.tag}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-[17px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: TEXT }}>{s.title}</h3>
                      <p className="text-[11px] mt-1 tracking-tight font-light" style={{ color: SUBTLE }}>{s.subtitle}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RECEITAS */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] font-medium tracking-[0.3em] uppercase" style={{ color: GOLD }}>Cozinha</p>
              <h2 className="text-[24px] font-semibold tracking-[-0.03em] leading-tight mt-2" style={{ color: TEXT }}>Receitas</h2>
            </div>
            <Link to="/dashboard/recipes" className="text-[12px] font-medium flex items-center gap-0.5 pb-1 tracking-tight" style={{ color: GOLD }}>
              Ver todas <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {recipeHighlights.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => navigate("/dashboard/recipes")}
                className="text-left rounded-2xl overflow-hidden relative group active:scale-[0.97] transition-all duration-300"
                style={{ border: `0.5px solid ${BORDER}`, background: SURFACE }}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" style={{ filter: "brightness(0.75) saturate(0.85)" }} loading="lazy" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,5,8,0.95), rgba(5,5,8,0.2) 60%, transparent)" }} />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[10.5px] font-semibold leading-tight line-clamp-2 tracking-[-0.01em]" style={{ color: TEXT }}>{recipe.title}</p>
                    <p className="text-[8.5px] mt-1 flex items-center gap-1 tracking-tight font-light" style={{ color: SUBTLE }}>
                      <Clock className="w-2 h-2" strokeWidth={2} style={{ color: GOLD }} /> {recipe.time}min · {recipe.kcal}kcal
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RESUMO DO DIA */}
        <div
          className="mb-6 rounded-[24px] overflow-hidden"
          style={{
            background: `radial-gradient(120% 100% at 100% 0%, rgba(212,175,55,0.05) 0%, ${SURFACE} 55%)`,
            border: `0.5px solid ${BORDER}`,
          }}
        >
          <div className="p-6">
            <p className="text-[10px] font-medium tracking-[0.3em] uppercase mb-5" style={{ color: ULTRA_SUBTLE }}>Resumo do dia</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Flame, value: mealsLoading ? "—" : (dayMacros?.kcal ? Math.round(dayMacros.kcal).toLocaleString("pt-BR") : (dayTargetMacros?.kcal ? Math.round(dayTargetMacros.kcal).toLocaleString("pt-BR") : "—")), unit: "kcal", label: "calorias" },
                { icon: Activity, value: "82", unit: "min", label: "treino" },
                { icon: Droplets, value: mealsLoading ? "—" : (dayWaterMl / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }), unit: "L", label: dayHydrationGoalL > 0 ? `de ${dayHydrationGoalL}L` : "água" },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="text-center">
                    <Icon className="w-4 h-4 mx-auto mb-3" strokeWidth={1.6} style={{ color: GOLD }} />
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-[22px] font-semibold tabular-nums tracking-[-0.03em] leading-none" style={{ color: TEXT }}>{s.value}</span>
                      <span className="text-[10px] font-light" style={{ color: SUBTLE }}>{s.unit}</span>
                    </div>
                    <p className="text-[10px] font-light mt-2 tracking-tight" style={{ color: SUBTLE }}>{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA Refeições */}
        <Link to="/dashboard/diet" className="block">
          <button
            className="w-full rounded-full h-12 text-[13px] font-medium tracking-tight inline-flex items-center justify-center gap-2 transition-all"
            style={{
              background: "linear-gradient(180deg, rgba(212,175,55,0.10), rgba(212,175,55,0.04))",
              border: `0.5px solid ${BORDER_STRONG}`,
              color: GOLD,
              boxShadow: "0 8px 24px -12px rgba(212,175,55,0.25)",
            }}
          >
            <Salad className="w-3.5 h-3.5" /> Ver minhas refeições
          </button>
        </Link>
      </div>
    </DashboardLayout>
  );
};

export default StudentOverview;
