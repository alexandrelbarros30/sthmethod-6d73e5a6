import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Salad, Dumbbell, ChevronRight, Flame, Clock, Utensils,
  Play, UtensilsCrossed, Newspaper, Sparkles
} from "lucide-react";
import { useMealTracking } from "@/hooks/useMealTracking";
import DailyProgressRing from "@/components/student/DailyProgressRing";
import MacroProgressBar from "@/components/student/MacroProgressBar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SubscriptionAlerts from "@/components/student/SubscriptionAlerts";

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

      {/* ===== ÚLTIMA MATÉRIA STH NEWS ===== */}
      <Link to="/tendencias/cenario-fitness-2026" className="block mb-6">
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
                Fitness — Cenário 2026
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Última matéria em destaque · Toque para ler
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>
      </Link>

      {/* ===== SEU TREINO DE HOJE ===== */}
      <Card
        className="mb-6 overflow-hidden cursor-pointer group border-border/50"
        onClick={() => navigate("/dashboard/training")}
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={getDailyWorkoutImage(p?.gender)}
            alt="Treino do dia"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            width={640}
            height={512}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Seu Treino de Hoje</p>
            {featuredWorkout ? (
              <>
                <h3 className="text-lg font-bold text-white font-display leading-tight">{featuredWorkout.title}</h3>
                {featuredWorkout.subtitle && (
                  <p className="text-xs text-white/70 mt-0.5">{featuredWorkout.subtitle}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {featuredWorkout.days_per_week && (
                    <span className="text-[10px] text-white/60">{featuredWorkout.days_per_week}x/sem</span>
                  )}
                  {featuredWorkout.minutes_per_day && (
                    <span className="text-[10px] text-white/60">{featuredWorkout.minutes_per_day} min</span>
                  )}
                </div>
              </>
            ) : (
              <h3 className="text-lg font-bold text-white font-display leading-tight">Acesse seu treino</h3>
            )}
          </div>
          <div className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
      </Card>

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
