import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Salad, Dumbbell, ChevronRight, Flame, Clock, Utensils,
  Play, UtensilsCrossed, Newspaper, Sparkles,
  Beaker, Brain, Layers, Bell, Heart, Plus, Droplets, Activity, Target
} from "lucide-react";
import cardHormoniosImg from "@/assets/card-hormonios.jpg";
import cardDicasImg from "@/assets/card-dicas.jpg";
import cardReceitasImg from "@/assets/card-receitas.jpg";
import cardCombinacoesImg from "@/assets/card-combinacoes.jpg";

const contentSections = [
  { id: "hormonios", tag: "Compostos", title: "Hormônios e Compostos", subtitle: "3 famílias • 15 compostos", img: cardHormoniosImg, icon: Beaker, meta: "Gamificação interativa", progress: 85 },
  { id: "dicas", tag: "Estratégias", title: "Dicas Essenciais", subtitle: "8 temas • 24 aulas", img: cardDicasImg, icon: Brain, meta: "Narrativas práticas", progress: 40 },
  { id: "receitas", tag: "Nutrição", title: "Receitas Saudáveis", subtitle: "Pratos inteligentes", img: cardReceitasImg, icon: UtensilsCrossed, meta: "Macros detalhados", progress: 22 },
  { id: "combinacoes", tag: "Estratégia", title: "Combinações Estratégicas", subtitle: "Definição • Hipertrofia", img: cardCombinacoesImg, icon: Layers, meta: "6 combinações", progress: 10 },
];
import { useMealTracking } from "@/hooks/useMealTracking";
import DailyProgressRing from "@/components/student/DailyProgressRing";
import MacroProgressBar from "@/components/student/MacroProgressBar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SubscriptionAlerts from "@/components/student/SubscriptionAlerts";
import AdAutoPopup from "@/components/student/AdAutoPopup";
import PreviewUnlockPopup from "@/components/student/PreviewUnlockPopup";

import recipePoke from "@/assets/recipe-poke.jpg";
import recipeFrango from "@/assets/recipe-frango.jpg";
import recipeAcai from "@/assets/recipe-acai.jpg";
import recipeMoqueca from "@/assets/recipe-moqueca.jpg";
import recipeTapioca from "@/assets/recipe-tapioca.jpg";
import recipeMousseWhey from "@/assets/recipe-mousse-whey.jpg";
import recipePatinho from "@/assets/recipe-patinho-grelhado.jpg";
import recipeMexidoOvos from "@/assets/recipe-mexido-ovos.jpg";
import recipeGelatina from "@/assets/recipe-gelatina-proteica.jpg";
import recipeAlmondega from "@/assets/recipe-almondega-fit.jpg";

import workoutMale1 from "@/assets/workout-male-1.jpg";
import workoutMale2 from "@/assets/workout-male-2.jpg";
import workoutMale3 from "@/assets/workout-male-3.jpg";
import workoutFemale1 from "@/assets/workout-female-1.jpg";
import workoutFemale2 from "@/assets/workout-female-2.jpg";
import workoutFemale3 from "@/assets/workout-female-3.jpg";

const maleWorkoutImages = [workoutMale1, workoutMale2, workoutMale3];
const femaleWorkoutImages = [workoutFemale1, workoutFemale2, workoutFemale3];

const getDailyWorkoutImage = (gender: string | null | undefined) => {
  const images = gender === "feminino" ? femaleWorkoutImages : maleWorkoutImages;
  const dayIndex = Math.floor(Date.now() / 86400000) % images.length;
  return images[dayIndex];
};

const greetings = [
  "Olá", "Oi", "Seja bem-vindo", "E aí", "Fala", "Bom te ver",
  "Bem-vindo de volta", "Hey"
];

const getGreeting = () => {
  return greetings[Math.floor(Math.random() * greetings.length)];
};

const recipeHighlights = [
  { id: "39", title: "Mousse Proteico com Morango", image: recipeMousseWhey, kcal: 320, time: 15, isNew: true },
  { id: "40", title: "Patinho com Batata Doce", image: recipePatinho, kcal: 480, time: 25, isNew: true },
  { id: "41", title: "Torrada com Ovo e Tomate", image: recipeMexidoOvos, kcal: 250, time: 10, isNew: true },
];

// Daily meal widget sub-component
const DailyMealWidget = () => {
  const {
    meals,
    totalMacros,
    consumedMacros,
    completedCount,
    totalMeals,
    progressPercent,
    nextMeal,
    isLoading,
    isMealCompleted,
  } = useMealTracking();

  if (isLoading || meals.length === 0) return null;

  return (
    <Card className="mb-6 premium-card border-primary/10 overflow-hidden animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-tight">
          <Utensils className="w-4 h-4 text-primary" /> Progresso do Dia
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-4">
          <DailyProgressRing
            percent={progressPercent}
            size={90}
            strokeWidth={7}
            sublabel={nextMeal?.name}
          />
          <div className="flex-1 space-y-2">
            <p className="text-lg font-bold text-foreground tabular-nums">
              {completedCount}<span className="text-muted-foreground font-normal text-sm">/{totalMeals}</span>
              <span className="text-xs text-muted-foreground font-normal ml-1">refeições</span>
            </p>
            {nextMeal && !isMealCompleted(nextMeal.id) && (
              <div className="p-2.5 rounded-xl bg-primary/8 border border-primary/15">
                <p className="text-[9px] text-primary font-bold uppercase tracking-wider">Próxima</p>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  {nextMeal.name} — {nextMeal.time}
                </p>
              </div>
            )}
            <MacroProgressBar label="Calorias" consumed={consumedMacros.kcal} total={totalMacros.kcal} unit="kcal" color="bg-primary" />
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link to="/dashboard/diet">
            <Button size="sm" className="text-xs gap-1.5 premium-btn bg-primary text-primary-foreground hover:bg-primary/90 px-5">
              <Salad className="w-3.5 h-3.5" /> Ver refeições <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

const StudentOverview = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [greeting] = useState(getGreeting);

  const { data: fullProfile } = useQuery({
    queryKey: ["student-full-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("gender").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*, plans(*, duration_days)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: featuredWorkout } = useQuery({
    queryKey: ["featured-workout", user?.id],
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from("student_workout_assignments")
        .select("*, workout_templates(id, title, subtitle, description, days_per_week, minutes_per_day)")
        .eq("user_id", user!.id)
        .eq("active", true)
        .limit(1)
        .maybeSingle();
      return assignments?.workout_templates || null;
    },
    enabled: !!user?.id,
  });

  const p = fullProfile as any;
  const firstName = profile?.full_name?.split(" ")[0] || "Aluno";

  const {
    consumedMacros: dayMacros,
    progressPercent: dayProgress,
  } = useMealTracking();

  return (
    <DashboardLayout role="student" title="" subtitle="">
      <SubscriptionAlerts subscription={subscription ? { ...subscription, plans: (subscription as any)?.plans } : null} />
      <AdAutoPopup />
      <PreviewUnlockPopup />

      {/* ===== HEADER + PROGRESSO LADO A LADO ===== */}
      <div className="grid grid-cols-[minmax(0,1fr)_8.25rem] items-start gap-4 pr-12 mb-9 relative sm:flex sm:pr-0">
        <button
          onClick={() => navigate("/dashboard/ads")}
          className="absolute -top-1 right-0 w-10 h-10 rounded-full flex items-center justify-center z-10 hover:bg-foreground/[0.04] transition-colors"
          aria-label="Notificações"
        >
          <Bell className="w-[21px] h-[21px] text-foreground/80" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-2 w-[7px] h-[7px] rounded-full bg-primary ring-2 ring-background" />
        </button>

        <div className="flex-1 min-w-0 pt-3">
          <p className="text-[13px] text-muted-foreground/90 leading-tight font-medium tracking-tight">
            {greeting},
          </p>
          <h1 className="text-[32px] leading-[1.05] font-bold text-foreground font-display tracking-[-0.025em] mt-1.5">
            {firstName}<span className="text-primary">.</span>
          </h1>
          <p className="text-[12px] text-muted-foreground/80 mt-3.5 leading-relaxed max-w-[200px] tracking-tight">
            Acompanhe sua jornada e supere seus limites.
          </p>
        </div>

        {/* Progress card — Apple-grade: profundidade real, glow contido, tipografia premium */}
        <div className="relative w-full max-w-[8.25rem] shrink-0 aspect-square mt-5 sm:mt-7 sm:w-[46%] sm:max-w-none">
          {/* Aura externa MUITO sutil — apenas insinuação de luz */}
          <div className="absolute -inset-2 rounded-[34px] pointer-events-none opacity-60" style={{ background: "radial-gradient(55% 55% at 78% 50%, hsl(var(--primary) / 0.18), transparent 70%)", filter: "blur(20px)" }} />

          <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-gradient-to-br from-[#141414] via-[#0d0d0d] to-[#080808] border border-white/[0.06] shadow-[0_8px_32px_-8px_rgb(0_0_0_/_0.5),0_2px_8px_-2px_rgb(0_0_0_/_0.3),inset_0_1px_0_rgb(255_255_255_/_0.04)]">
            {/* Highlight superior — vidro fosco premium */}
            <div className="absolute inset-x-0 top-0 h-[55%] pointer-events-none" style={{ background: "linear-gradient(180deg, rgb(255 255 255 / 0.04) 0%, transparent 100%)" }} />

            {/* Glow radial INTERNO sutil atrás do arco */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0" style={{ background: "radial-gradient(40% 50% at 85% 50%, hsl(150 80% 50% / 0.22), transparent 65%)" }} />
            </div>

            {/* Arco com bloom contido e elegante */}
            <svg className="absolute -inset-2 w-[calc(100%+1rem)] h-[calc(100%+1rem)] pointer-events-none overflow-visible" viewBox="0 0 280 280" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="bigArcGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="hsl(150 90% 80%)" />
                  <stop offset="35%" stopColor="hsl(150 75% 55%)" />
                  <stop offset="100%" stopColor="hsl(150 70% 38%)" />
                </linearGradient>
                {/* Bloom sutil — Apple style: presente mas refinado */}
                <filter id="neonBloomStrong" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="b1" />
                  <feGaussianBlur stdDeviation="6" result="b2" />
                  <feMerge>
                    <feMergeNode in="b2" />
                    <feMergeNode in="b1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="tipBloom" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="2" result="t1" />
                  <feGaussianBlur stdDeviation="5" result="t2" />
                  <feMerge>
                    <feMergeNode in="t2" />
                    <feMergeNode in="t1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Trilha de fundo — sutil */}
              <path
                d="M 218 62 A 110 110 0 0 1 218 228"
                fill="none"
                stroke="rgb(255 255 255 / 0.06)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Arco principal — bloom contido */}
              <g filter="url(#neonBloomStrong)">
                <path
                  d="M 218 62 A 110 110 0 0 1 218 228"
                  fill="none"
                  stroke="url(#bigArcGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </g>
              {/* Núcleo brilhante — fina linha viva */}
              <path
                d="M 218 62 A 110 110 0 0 1 218 228"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Tip superior — ponto de luz refinado */}
              <g filter="url(#tipBloom)">
                <circle cx="218" cy="62" r="4" fill="white" />
                <circle cx="218" cy="62" r="7" fill="hsl(150 95% 65%)" opacity="0.7" />
              </g>
              <circle cx="218" cy="62" r="2" fill="white" />
            </svg>

            {/* Conteúdo */}
            <div className="relative h-full flex flex-col justify-between p-3.5 sm:p-4">
              <div>
                <p className="text-[8.5px] font-semibold tracking-[0.28em] text-primary/90 uppercase">Progresso</p>
                <div className="flex items-baseline gap-0.5 mt-2.5">
                  <p className="text-[34px] sm:text-[40px] leading-[0.9] font-bold text-white font-display tracking-[-0.04em] tabular-nums">
                    {dayProgress || 72}
                  </p>
                  <span className="text-[16px] font-semibold text-white/50 tracking-tight">%</span>
                </div>
                <p className="text-[10px] text-white/45 mt-2 tracking-tight font-medium">meta mensal</p>
              </div>
              <div className="inline-flex w-fit max-w-full items-center gap-1.5 text-[9.5px] text-white/85 rounded-full px-2 py-1 bg-white/[0.06] border border-white/[0.08] backdrop-blur-md font-medium tracking-tight">
                <Target className="w-2.5 h-2.5 text-primary" strokeWidth={2.2} />
                <span>8 dias</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STH NEWS ===== */}
      <Link to="/tendencias/recomposicao-avancada" className="block mb-8">
        <div className="relative rounded-[20px] overflow-hidden border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.015] backdrop-blur-xl hover:border-primary/20 transition-all duration-300 group shadow-[0_4px_16px_-4px_rgb(0_0_0_/_0.3),inset_0_1px_0_rgb(255_255_255_/_0.04)]">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3.5 p-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/[0.08] border border-primary/15 flex items-center justify-center shrink-0">
              <Newspaper className="w-[20px] h-[20px] text-primary" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[9px] font-bold tracking-[0.24em] text-primary uppercase">STH News</span>
                <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold uppercase tracking-wider bg-primary/15 text-primary px-1.5 py-0.5 rounded-full border border-primary/20">
                  <Sparkles className="w-2 h-2" strokeWidth={2.5} /> Nova
                </span>
              </div>
              <p className="font-semibold text-foreground text-[13.5px] leading-tight truncate tracking-tight">
                Recomposição Corporal: o guia completo
              </p>
              <p className="text-[11px] text-muted-foreground/80 truncate mt-1 tracking-tight">
                Última matéria em destaque
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-foreground/40 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
          </div>
        </div>
      </Link>

      {/* ===== CONTEÚDO STH METHOD ===== */}
      <div className="mb-9">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[9.5px] text-primary/90 font-semibold uppercase tracking-[0.24em]">STH Method</p>
            <h2 className="text-[20px] font-bold text-foreground font-display tracking-[-0.025em] leading-tight mt-1">
              Conteúdo
            </h2>
          </div>
          <Link to="/dashboard/content" className="text-[12px] text-primary font-medium flex items-center gap-0.5 pb-1 tracking-tight">
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
                className="snap-start shrink-0 w-[78vw] max-w-[300px] text-left rounded-[22px] overflow-hidden relative group border border-white/[0.06] bg-white/[0.025] backdrop-blur-xl active:scale-[0.98] transition-all duration-300 shadow-[0_8px_24px_-8px_rgb(0_0_0_/_0.4),0_2px_6px_-2px_rgb(0_0_0_/_0.2),inset_0_1px_0_rgb(255_255_255_/_0.04)] hover:border-white/[0.1]"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" width={600} height={352} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
                  <div className="absolute top-3.5 left-3.5">
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.24em] font-semibold px-2.5 py-1 rounded-full backdrop-blur-xl bg-white/10 text-white border border-white/15">
                      <Icon className="w-2.5 h-2.5" strokeWidth={2.2} />
                      {s.tag}
                    </span>
                  </div>
                  {/* progress mini ring */}
                  <div className="absolute bottom-3.5 right-3.5 w-11 h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="2.5" />
                      <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - s.progress / 100)} />
                    </svg>
                    <span className="relative text-[9.5px] font-semibold text-white tabular-nums tracking-tight">{s.progress}%</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 pr-16">
                    <h3 className="text-[16px] font-semibold tracking-[-0.02em] leading-tight text-white">{s.title}</h3>
                    <p className="text-[11px] text-white/55 mt-1 tracking-tight">{s.subtitle}</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between bg-white/[0.015] border-t border-white/[0.04]">
                  <span className="text-[10.5px] font-medium text-muted-foreground/80 tracking-tight">{s.meta}</span>
                  <div className="flex items-center gap-0.5 text-primary">
                    <span className="text-[10.5px] font-semibold tracking-tight">Explorar</span>
                    <ChevronRight className="w-3 h-3" strokeWidth={2.2} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== RECEITAS SAUDÁVEIS ===== */}
      <div className="mb-9">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[9.5px] text-primary/90 font-semibold uppercase tracking-[0.24em]">Cozinha</p>
            <h2 className="text-[20px] font-bold text-foreground font-display tracking-[-0.025em] leading-tight mt-1">Receitas</h2>
          </div>
          <Link to="/dashboard/recipes" className="text-[12px] text-primary font-medium flex items-center gap-0.5 pb-1 tracking-tight">
            Ver todas <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {recipeHighlights.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => navigate("/dashboard/recipes")}
              className="text-left rounded-[18px] overflow-hidden relative group border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl active:scale-[0.97] transition-all duration-300 shadow-[0_4px_16px_-4px_rgb(0_0_0_/_0.35),inset_0_1px_0_rgb(255_255_255_/_0.04)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={200} height={250} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                {recipe.isNew && (
                  <span className="absolute top-2 left-2 text-[7.5px] font-semibold tracking-[0.18em] bg-white/15 backdrop-blur-xl text-white px-1.5 py-0.5 rounded-full border border-white/20">
                    NEW
                  </span>
                )}
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/35 backdrop-blur-xl border border-white/15 flex items-center justify-center"
                  aria-label="Favoritar"
                >
                  <Heart className="w-3 h-3 text-white/85" strokeWidth={2} />
                </button>
                <div className="absolute bottom-2 left-2 right-9">
                  <p className="text-[10.5px] font-semibold text-white leading-tight line-clamp-2 tracking-[-0.01em]">{recipe.title}</p>
                  <p className="text-[8.5px] text-white/60 mt-1 flex items-center gap-1 tracking-tight">
                    <Clock className="w-2 h-2" strokeWidth={2.2} /> {recipe.time}min · {recipe.kcal}kcal
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("/dashboard/recipes"); }}
                  className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-[0_2px_8px_rgb(0_0_0_/_0.3)]"
                  aria-label="Abrir receita"
                >
                  <Plus className="w-3 h-3" strokeWidth={2.5} />
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ===== RESUMO DO DIA - HORIZONTAL ===== */}
      <div className="mb-5 relative rounded-[22px] overflow-hidden border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.015] backdrop-blur-xl p-4 shadow-[0_8px_24px_-8px_rgb(0_0_0_/_0.4),inset_0_1px_0_rgb(255_255_255_/_0.04)]">
        <div className="absolute -bottom-24 -left-20 w-52 h-52 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-[9px] font-semibold tracking-[0.26em] text-primary/90 uppercase mb-3.5">Resumo do dia</p>
          <div className="flex items-center gap-2.5">
            <div className="flex-1 min-w-0 flex items-start gap-2">
              <Flame className="w-[15px] h-[15px] text-primary shrink-0 mt-0.5" strokeWidth={1.8} />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-foreground tabular-nums leading-none truncate tracking-[-0.02em]">
                  {dayMacros?.kcal ? Math.round(dayMacros.kcal).toLocaleString("pt-BR") : "1.842"}
                </p>
                <p className="text-[9px] text-muted-foreground/75 mt-1.5 leading-tight tracking-tight">kcal</p>
              </div>
            </div>
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="flex-1 min-w-0 flex items-start gap-2">
              <Activity className="w-[15px] h-[15px] text-primary shrink-0 mt-0.5" strokeWidth={1.8} />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-foreground tabular-nums leading-none tracking-[-0.02em]">82<span className="text-[10px] font-medium text-muted-foreground ml-0.5">min</span></p>
                <p className="text-[9px] text-muted-foreground/75 mt-1.5 leading-tight tracking-tight">treino</p>
              </div>
            </div>
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="flex-1 min-w-0 flex items-start gap-2">
              <Droplets className="w-[15px] h-[15px] text-primary shrink-0 mt-0.5" strokeWidth={1.8} />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-foreground tabular-nums leading-none tracking-[-0.02em]">2,1<span className="text-[10px] font-medium text-muted-foreground ml-0.5">L</span></p>
                <p className="text-[9px] text-muted-foreground/75 mt-1.5 leading-tight tracking-tight">água</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DailyMealWidget />
    </DashboardLayout>
  );
};

export default StudentOverview;
