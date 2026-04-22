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
  { id: "39", title: "Mousse de Whey", image: recipeMousseWhey, kcal: 180, isNew: true },
  { id: "40", title: "Patinho Grelhado", image: recipePatinho, kcal: 410, isNew: true },
  { id: "41", title: "Mexido de Ovos", image: recipeMexidoOvos, kcal: 320, isNew: true },
  { id: "42", title: "Gelatina Proteica", image: recipeGelatina, kcal: 90, isNew: true },
  { id: "43", title: "Almôndega Fit", image: recipeAlmondega, kcal: 380, isNew: true },
  { id: "7", title: "Moqueca Fit", image: recipeMoqueca, kcal: 360 },
  { id: "1", title: "Poke Bowl", image: recipePoke, kcal: 420 },
  { id: "8", title: "Tapioca", image: recipeTapioca, kcal: 280 },
  { id: "3", title: "Açaí Proteico", image: recipeAcai, kcal: 350 },
  { id: "2", title: "Frango Fit", image: recipeFrango, kcal: 380 },
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

  return (
    <DashboardLayout role="student" title="" subtitle="">
      {/* ===== SAUDAÇÃO ===== */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground font-display">
          {greeting}, {firstName}! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Acompanhe seu progresso e conquiste seus objetivos.</p>
      </div>
      <SubscriptionAlerts subscription={subscription ? { ...subscription, plans: (subscription as any)?.plans } : null} />
      <AdAutoPopup />
      <PreviewUnlockPopup />

      {/* ===== ÚLTIMA MATÉRIA STH NEWS ===== */}
      <Link to="/tendencias/recomposicao-avancada" className="block mb-6">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent hover:shadow-lg transition-all group cursor-pointer relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <CardContent className="py-3.5 px-4 flex items-center gap-3 relative">
            <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Newspaper className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-black tracking-[0.18em] text-primary uppercase">STH News</span>
                <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full animate-pulse">
                  <Sparkles className="w-2 h-2" /> Nova
                </span>
              </div>
              <p className="font-bold text-foreground font-display text-sm leading-tight truncate">
                🔥 Recomposição Corporal Avançada
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Última matéria em destaque · Toque para ler
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>
      </Link>

      {/* ===== CONTEÚDO STH METHOD (CARROSSEL) ===== */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">STH Method</p>
            <h2 className="text-sm font-bold text-foreground font-display">Conteúdo</h2>
          </div>
          <Link to="/dashboard/content">
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
              Ver tudo <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-1 px-1 pb-2">
          {contentSections.map((s) => {
            const accent = `hsl(${s.accentHue} 60% 42%)`;
            const accentBg = `hsl(${s.accentHue} 60% 42% / 0.12)`;
            const accentBorder = `hsl(${s.accentHue} 60% 42% / 0.3)`;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => navigate(s.id === "receitas" ? "/dashboard/recipes" : `/dashboard/content?section=${s.id}`)}
                className="snap-center shrink-0 w-[72vw] max-w-[280px] text-left rounded-2xl overflow-hidden relative group border border-border/50"
              >
                <div className="relative h-36 overflow-hidden">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" width={560} height={288} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] font-bold px-2 py-1 rounded-full backdrop-blur-md" style={{ background: accentBg, color: accent, border: `0.5px solid ${accentBorder}` }}>
                      <Icon className="w-2.5 h-2.5" />
                      {s.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3.5">
                    <h3 className="text-[15px] font-bold tracking-tight leading-tight text-white">{s.title}</h3>
                    <p className="text-[11px] text-white/60">{s.subtitle}</p>
                  </div>
                </div>
                <div className="px-3.5 py-2.5 flex items-center justify-between bg-card">
                  <span className="text-[10px] font-medium text-muted-foreground">{s.meta}</span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px] font-semibold" style={{ color: accent }}>Explorar</span>
                    <ChevronRight className="w-3 h-3" style={{ color: accent }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== RECEITAS SAUDÁVEIS ===== */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground font-display">Receitas Saudáveis</h2>
          <Link to="/dashboard/recipes">
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
              Ver todas <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {recipeHighlights.map((recipe) => (
            <div
              key={recipe.id}
              className="shrink-0 w-28 cursor-pointer group"
              onClick={() => navigate("/dashboard/recipes")}
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-1.5 shadow-md">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  width={112}
                  height={112}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {recipe.isNew && (
                  <span className="absolute top-1.5 left-1.5 text-[8px] font-bold tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full animate-pulse">
                    NOVO
                  </span>
                )}
                <span className="absolute bottom-1.5 left-1.5 text-[9px] text-white/80 flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5" /> {recipe.kcal}
                </span>
              </div>
              <p className="text-[11px] font-medium text-foreground text-center leading-tight truncate">{recipe.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== PROGRESSO DIÁRIO ===== */}
      <DailyMealWidget />
    </DashboardLayout>
  );
};

export default StudentOverview;
