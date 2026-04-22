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
      <div className="grid grid-cols-[minmax(0,1fr)_8.25rem] items-start gap-3 pr-12 mb-6 relative sm:flex sm:pr-0">
        <button
          onClick={() => navigate("/dashboard/ads")}
          className="absolute -top-1 right-0 w-9 h-9 rounded-full flex items-center justify-center z-10"
          aria-label="Notificações"
        >
          <Bell className="w-[22px] h-[22px] text-foreground/85" strokeWidth={1.6} />
          <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)),0_0_16px_hsl(var(--primary))]" />
        </button>

        <div className="flex-1 min-w-0 pt-2">
          <p className="text-[14px] text-muted-foreground leading-tight">
            {greeting},
          </p>
          <h1 className="text-[34px] leading-[1] font-extrabold text-foreground font-display tracking-tight mt-1">
            {firstName}! <span className="inline-block">👋</span>
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-3 leading-snug max-w-[200px]">
            Acompanhe seu progresso e conquiste seus objetivos.
          </p>
        </div>

        {/* Progress card — neon bloom real (SVG feGaussianBlur) */}
        <div className="relative w-full max-w-[8.25rem] shrink-0 aspect-square mt-5 sm:mt-7 sm:w-[46%] sm:max-w-none">
          {/* Aura externa multi-camada (cria o "vazamento" de luz pra fora do card) */}
          <div className="absolute -inset-3 sm:-inset-6 rounded-[40px] pointer-events-none" style={{ background: "radial-gradient(60% 60% at 80% 50%, hsl(var(--primary) / 0.55), transparent 70%)", filter: "blur(28px)" }} />
          <div className="absolute -inset-2 sm:-inset-4 rounded-[36px] pointer-events-none animate-pulse-glow" style={{ background: "radial-gradient(50% 50% at 85% 50%, hsl(var(--primary) / 0.45), transparent 65%)", filter: "blur(20px)" }} />

          <div className="relative w-full h-full rounded-[28px] border border-primary/30 bg-[#0a0a0a]/90 backdrop-blur-xl shadow-[0_0_60px_-12px_hsl(var(--primary)/0.7),inset_0_1px_0_hsl(var(--primary)/0.2),inset_0_0_40px_-12px_hsl(var(--primary)/0.35)]">
            {/* Glow radial INTERNO atrás do arco (núcleo de luz quente) */}
            <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
              <div className="absolute inset-0" style={{ background: "radial-gradient(45% 55% at 88% 50%, hsl(150 100% 60% / 0.55), hsl(150 95% 45% / 0.18) 35%, transparent 65%)" }} />
              <div className="absolute inset-0" style={{ background: "radial-gradient(20% 25% at 92% 50%, hsl(0 0% 100% / 0.45), transparent 70%)" }} />
            </div>

            {/* Arco com bloom REAL via feGaussianBlur + feMerge */}
            <svg className="absolute -inset-4 sm:-inset-8 w-[calc(100%+2rem)] h-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] sm:h-[calc(100%+4rem)] pointer-events-none overflow-visible" viewBox="0 0 280 280" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="bigArcGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="8%" stopColor="hsl(150 100% 88%)" />
                  <stop offset="25%" stopColor="hsl(150 100% 60%)" />
                  <stop offset="60%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(150 90% 38%)" />
                </linearGradient>
                {/* Bloom forte: 3 níveis de blur somados ao traço original */}
                <filter id="neonBloomStrong" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="2" result="b1" />
                  <feGaussianBlur stdDeviation="6" result="b2" />
                  <feGaussianBlur stdDeviation="14" result="b3" />
                  <feGaussianBlur stdDeviation="24" result="b4" />
                  <feMerge>
                    <feMergeNode in="b4" />
                    <feMergeNode in="b3" />
                    <feMergeNode in="b3" />
                    <feMergeNode in="b2" />
                    <feMergeNode in="b2" />
                    <feMergeNode in="b1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="tipBloom" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="3" result="t1" />
                  <feGaussianBlur stdDeviation="10" result="t2" />
                  <feGaussianBlur stdDeviation="20" result="t3" />
                  <feMerge>
                    <feMergeNode in="t3" />
                    <feMergeNode in="t2" />
                    <feMergeNode in="t1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Arco principal — uma única path com bloom forte */}
              <g filter="url(#neonBloomStrong)">
                <path
                  d="M 218 62 A 110 110 0 0 1 218 228"
                  fill="none"
                  stroke="url(#bigArcGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </g>
              {/* Núcleo branco quente sobreposto (a "linha viva" no meio do brilho) */}
              <path
                d="M 218 62 A 110 110 0 0 1 218 228"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="1"
              />
              {/* Tip superior com bloom quente */}
              <g filter="url(#tipBloom)">
                <circle cx="218" cy="62" r="5" fill="white" />
                <circle cx="218" cy="62" r="9" fill="hsl(150 100% 70%)" opacity="0.9" />
              </g>
              <circle cx="218" cy="62" r="2.5" fill="white" />
            </svg>

            {/* Conteúdo */}
            <div className="relative h-full flex flex-col justify-between p-3 sm:p-4">
              <div>
                <p className="text-[9px] font-bold tracking-[0.24em] text-primary uppercase" style={{ textShadow: "0 0 12px hsl(var(--primary) / 0.7)" }}>Progresso</p>
                <p className="text-[32px] sm:text-[40px] leading-none font-extrabold text-foreground font-display tracking-tight mt-2 tabular-nums" style={{ textShadow: "0 0 18px hsl(var(--primary) / 0.45), 0 0 36px hsl(var(--primary) / 0.25)" }}>
                  {dayProgress || 72}%
                </p>
                <p className="text-[10px] sm:text-[11px] text-foreground/70 mt-1.5">da meta mensal</p>
              </div>
              <div className="inline-flex w-fit max-w-full items-center gap-1 text-[9px] sm:text-[10px] text-foreground/85 border border-primary/30 rounded-full px-2 py-1.5 sm:px-2.5 bg-primary/10 backdrop-blur-sm shadow-[0_0_18px_-4px_hsl(var(--primary)/0.5),inset_0_0_8px_-2px_hsl(var(--primary)/0.3)]">
                <Target className="w-3 h-3 text-primary" style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }} />
                <span>Faltam 8 dias</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STH NEWS ===== */}
      <Link to="/tendencias/recomposicao-avancada" className="block mb-7">
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.035] backdrop-blur-md hover:border-primary/25 transition-all group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -inset-px rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: "inset 0 0 0 1px hsl(var(--primary) / 0.25), 0 0 24px hsl(var(--primary) / 0.12)" }} />
          <div className="relative flex items-center gap-3 p-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-black tracking-[0.22em] text-primary uppercase">STH News</span>
                <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                  <Sparkles className="w-2 h-2" /> Nova
                </span>
              </div>
              <p className="font-semibold text-foreground text-[13.5px] leading-tight truncate">
                🔥 Reposição Corporal: o guia completo
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                Última matéria em destaque • Toque para ler
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-primary/80 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </Link>

      {/* ===== CONTEÚDO STH METHOD ===== */}
      <div className="mb-7">
        <div className="flex items-end justify-between mb-3.5">
          <div>
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.22em]">STH Method</p>
            <h2 className="text-[19px] font-bold text-foreground font-display tracking-tight leading-tight mt-0.5">
              Conteúdo
            </h2>
          </div>
          <Link to="/dashboard/content" className="text-[12px] text-primary font-medium flex items-center gap-0.5 pb-1">
            Ver tudo <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2">
          {contentSections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => navigate(s.id === "receitas" ? "/dashboard/recipes" : `/dashboard/content?section=${s.id}`)}
                className="snap-start shrink-0 w-[78vw] max-w-[300px] text-left rounded-2xl overflow-hidden relative group border border-white/[0.08] bg-white/[0.03] backdrop-blur-md active:scale-[0.98] transition-transform"
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" width={600} height={352} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.22em] font-bold px-2 py-1 rounded-full backdrop-blur-md bg-primary/12 text-primary border border-primary/25">
                      <Icon className="w-2.5 h-2.5" />
                      {s.tag}
                    </span>
                  </div>
                  {/* progress mini ring */}
                  <div className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" opacity="0.3" />
                      <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - s.progress / 100)} style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.6))" }} />
                    </svg>
                    <span className="relative text-[9px] font-bold text-foreground tabular-nums">{s.progress}%</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3.5 pr-16">
                    <h3 className="text-[15.5px] font-bold tracking-tight leading-tight text-white">{s.title}</h3>
                    <p className="text-[11px] text-white/60 mt-0.5">{s.subtitle}</p>
                  </div>
                </div>
                <div className="px-3.5 py-2.5 flex items-center justify-between bg-white/[0.02] border-t border-white/[0.06]">
                  <span className="text-[10.5px] font-medium text-muted-foreground">{s.meta}</span>
                  <div className="flex items-center gap-0.5 text-primary">
                    <span className="text-[10.5px] font-semibold">Explorar</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== RECEITAS SAUDÁVEIS ===== */}
      <div className="mb-7">
        <div className="flex items-end justify-between mb-3.5">
          <h2 className="text-[17px] font-bold text-foreground font-display tracking-tight">Receitas Saudáveis</h2>
          <Link to="/dashboard/recipes" className="text-[12px] text-primary font-medium flex items-center gap-0.5 pb-0.5">
            Ver todas <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {recipeHighlights.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => navigate("/dashboard/recipes")}
              className="text-left rounded-2xl overflow-hidden relative group border border-white/[0.08] bg-white/[0.03] backdrop-blur-md active:scale-[0.97] transition-transform"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={200} height={250} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                {recipe.isNew && (
                  <span className="absolute top-1.5 left-1.5 text-[8px] font-bold tracking-[0.15em] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    NOVO
                  </span>
                )}
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center"
                  aria-label="Favoritar"
                >
                  <Heart className="w-3 h-3 text-white/85" />
                </button>
                <div className="absolute bottom-1.5 left-1.5 right-9">
                  <p className="text-[10px] font-bold text-white leading-tight line-clamp-2">{recipe.title}</p>
                  <p className="text-[8.5px] text-white/65 mt-0.5 flex items-center gap-1">
                    <Clock className="w-2 h-2" /> {recipe.time} min • {recipe.kcal} kcal
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("/dashboard/recipes"); }}
                  className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                  aria-label="Abrir receita"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ===== RESUMO DO DIA - HORIZONTAL ===== */}
      <div className="mb-4 relative rounded-3xl overflow-hidden border border-primary/15 bg-white/[0.03] backdrop-blur-md p-3.5 shadow-[0_0_30px_-12px_hsl(var(--primary)/0.4),inset_0_1px_0_hsl(var(--primary)/0.08)]">
        <div className="absolute -bottom-20 -left-16 w-48 h-48 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/12 blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-[9px] font-bold tracking-[0.22em] text-primary uppercase mb-2.5">Resumo do dia</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 flex items-start gap-2">
              <Flame className="w-4 h-4 text-primary shrink-0 mt-0.5" style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary))) drop-shadow(0 0 12px hsl(var(--primary)/0.6))" }} />
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-foreground tabular-nums leading-none truncate">
                  {dayMacros?.kcal ? Math.round(dayMacros.kcal).toLocaleString("pt-BR") : "1.842"}
                </p>
                <p className="text-[9px] text-muted-foreground mt-1 leading-tight">kcal consumidas</p>
              </div>
            </div>
            <div className="w-px h-9 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
            <div className="flex-1 min-w-0 flex items-start gap-2">
              <Activity className="w-4 h-4 text-primary shrink-0 mt-0.5" style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary))) drop-shadow(0 0 12px hsl(var(--primary)/0.6))" }} />
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-foreground tabular-nums leading-none">82 min</p>
                <p className="text-[9px] text-muted-foreground mt-1 leading-tight">treino concluído</p>
              </div>
            </div>
            <div className="w-px h-9 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
            <div className="flex-1 min-w-0 flex items-start gap-2">
              <Droplets className="w-4 h-4 text-primary shrink-0 mt-0.5" style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary))) drop-shadow(0 0 12px hsl(var(--primary)/0.6))" }} />
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-foreground tabular-nums leading-none">2,1 L</p>
                <p className="text-[9px] text-muted-foreground mt-1 leading-tight">água ingerida</p>
              </div>
            </div>
            <div className="w-px h-9 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
            <div className="shrink-0 rounded-2xl bg-primary/12 border border-primary/35 px-2.5 py-2 flex items-center gap-1.5 relative overflow-hidden shadow-[0_0_20px_-6px_hsl(var(--primary)/0.6),inset_0_0_12px_-4px_hsl(var(--primary)/0.4)]">
              <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-primary/40 blur-2xl" />
              <div className="w-6 h-6 rounded-full border border-primary/60 flex items-center justify-center relative" style={{ boxShadow: "0 0 10px hsl(var(--primary)/0.6), inset 0 0 6px hsl(var(--primary)/0.4)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)),0_0_14px_hsl(var(--primary))]" />
              </div>
              <p className="text-[10px] font-bold text-foreground leading-tight relative max-w-[60px]">Foco no processo!</p>
              <ChevronRight className="w-3 h-3 text-primary/70 relative" />
            </div>
          </div>
        </div>
      </div>

      <DailyMealWidget />
    </DashboardLayout>
  );
};

export default StudentOverview;
