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
      <div className="flex items-start gap-3 mb-6 relative">
        <button
          onClick={() => navigate("/dashboard/ads")}
          className="absolute top-0 right-0 w-9 h-9 rounded-full flex items-center justify-center"
          aria-label="Notificações"
        >
          <Bell className="w-[20px] h-[20px] text-foreground/80" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
        </button>

        <div className="flex-1 min-w-0 pt-1 pr-10">
          <p className="text-[15px] text-muted-foreground leading-tight">
            {greeting},
          </p>
          <h1 className="text-[30px] leading-[1.05] font-extrabold text-foreground font-display tracking-tight mt-0.5">
            {firstName}! <span className="inline-block">👋</span>
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-2 leading-snug">
            Acompanhe seu progresso e conquiste seus objetivos.
          </p>
        </div>

        <div className="relative w-[48%] shrink-0 rounded-3xl overflow-hidden border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-3.5 mt-6">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-[8.5px] font-bold tracking-[0.22em] text-primary uppercase">Progresso</p>
            <p className="text-[28px] leading-none font-extrabold text-foreground font-display tracking-tight mt-1.5 tabular-nums">
              {dayProgress || 72}%
            </p>
            <p className="text-[10.5px] text-foreground/70 mt-0.5">da meta mensal</p>
            <div className="mt-2.5 inline-flex items-center gap-1 text-[9.5px] text-muted-foreground border border-white/[0.08] rounded-full px-2 py-1 bg-white/[0.02]">
              <Target className="w-2.5 h-2.5 text-primary/80" /> Faltam 8 dias
            </div>
            {/* Decorative ring arc */}
            <svg className="absolute -top-1 -right-1 w-20 h-20 -rotate-90 pointer-events-none" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 32} strokeDashoffset={2 * Math.PI * 32 * (1 - (dayProgress || 72) / 100)} style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.7))" }} opacity="0.95" />
              <circle cx="40" cy="8" r="2.5" fill="hsl(var(--primary))" style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }} />
            </svg>
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

      {/* ===== RESUMO DO DIA ===== */}
      <div className="mb-4 relative rounded-3xl overflow-hidden border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-5">
        <div className="absolute -bottom-20 -left-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold tracking-[0.22em] text-primary uppercase">Resumo do dia</p>
            <span className="text-[10px] text-muted-foreground">hoje</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-3">
              <Flame className="w-4 h-4 text-primary mb-2" />
              <p className="text-[17px] font-bold text-foreground tabular-nums leading-none">
                {dayMacros?.kcal ? Math.round(dayMacros.kcal).toLocaleString("pt-BR") : "1.842"}
              </p>
              <p className="text-[10.5px] text-muted-foreground mt-1">kcal consumidas</p>
            </div>
            <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-3">
              <Activity className="w-4 h-4 text-primary mb-2" />
              <p className="text-[17px] font-bold text-foreground tabular-nums leading-none">82 min</p>
              <p className="text-[10.5px] text-muted-foreground mt-1">treino concluído</p>
            </div>
            <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-3">
              <Droplets className="w-4 h-4 text-primary mb-2" />
              <p className="text-[17px] font-bold text-foreground tabular-nums leading-none">2,1 L</p>
              <p className="text-[10.5px] text-muted-foreground mt-1">água ingerida</p>
            </div>
            <div className="rounded-2xl bg-primary/10 border border-primary/25 p-3 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-primary/20 blur-2xl" />
              <Sparkles className="w-4 h-4 text-primary mb-2 relative" />
              <p className="text-[14px] font-bold text-foreground leading-tight relative">Foco no processo!</p>
              <p className="text-[10px] text-primary/80 mt-1 relative">Mantenha o ritmo</p>
            </div>
          </div>
        </div>
      </div>

      <DailyMealWidget />
    </DashboardLayout>
  );
};

export default StudentOverview;
