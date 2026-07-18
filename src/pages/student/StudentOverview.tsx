import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Salad, ChevronRight, Flame, Clock, Utensils,
  UtensilsCrossed, Beaker, Brain, Layers, Bell, Droplets, Target, Plus, Minus, Beef,
  Home as HomeIcon, Compass
} from "lucide-react";
import cardHormoniosImg from "@/assets/sthnews-subq-glass-1.jpg";
import cardDicasImg from "@/assets/sthnews-triade-thumb.jpg";
import cardReceitasImg from "@/assets/recipe-salmao-aspargos.jpg";
import cardCombinacoesImg from "@/assets/sthnews-masteron-glass-1.jpg";
import { useMealTracking } from "@/hooks/useMealTracking";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SubscriptionAlerts from "@/components/student/SubscriptionAlerts";
import AdAutoPopup from "@/components/student/AdAutoPopup";
import PreviewUnlockPopup from "@/components/student/PreviewUnlockPopup";
import WelcomeTour from "@/components/student/WelcomeTour";
import STHFlowCard from "@/components/student/STHFlowCard";
import PaymentTourPopup from "@/components/student/PaymentTourPopup";
import NewTrendNotification from "@/components/student/NewTrendNotification";
import EvolutionUpdateStatusCard from "@/components/student/EvolutionUpdateStatusCard";
import DailyHeroCard from "@/components/student/DailyHeroCard";
import DailyRingsCard from "@/components/student/DailyRingsCard";
import StreakCard from "@/components/student/StreakCard";
import DailyCheckinCard from "@/components/student/DailyCheckinCard";
import QuickActionsFab from "@/components/student/QuickActionsFab";
import { ShieldCheck } from "lucide-react";
import { formatPhoneBR } from "@/lib/phone";
import { getLatestTrend } from "@/data/latest-trends";
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

const DailyMealWidget = ({
  completedCount, totalMeals, progressPercent, nextMeal, isLoading, isMealCompleted, mealsCount,
}: {
  completedCount: number; totalMeals: number; progressPercent: number;
  nextMeal: any; isLoading: boolean; isMealCompleted: (id: string) => boolean; mealsCount: number;
}) => {
  if (isLoading || mealsCount === 0) return null;
  return (
    <div className="mb-6 rounded-3xl border border-border/40 bg-background overflow-hidden">
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

const HydrationWidget = ({
  consumedMl, goalL, onAdd, onRemove,
}: { consumedMl: number; goalL: number; onAdd: (ml: number) => void; onRemove: () => void }) => {
  if (goalL <= 0) return null;
  const goalMl = goalL * 1000;
  const pct = Math.min(100, Math.round((consumedMl / goalMl) * 100));
  const consumedL = (consumedMl / 1000).toFixed(consumedMl >= 1000 ? 1 : 2);
  return (
    <div className="mb-6 rounded-3xl border border-border/40 bg-background p-6">
      <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4 flex items-center gap-1.5">
        <Droplets className="w-3 h-3" /> Hidratação
      </div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-[36px] leading-none font-semibold tracking-[-0.04em] text-foreground tabular-nums">{consumedL}</span>
            <span className="text-lg text-muted-foreground/60 font-light tracking-[-0.02em]">/{goalL}L</span>
          </div>
          <p className="text-[12px] text-muted-foreground font-light mt-2 tracking-tight">{pct}% da meta diária</p>
        </div>
        <button
          onClick={onRemove}
          className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          aria-label="Remover último copo"
        >
          <Minus className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
      <div className="h-px w-full bg-foreground/10 overflow-hidden rounded-full mb-4">
        <div className="h-full bg-foreground rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[200, 250, 500, 750].map((ml) => (
          <button
            key={ml}
            onClick={() => onAdd(ml)}
            className="h-10 rounded-full border border-border/60 text-[12px] font-medium text-foreground hover:bg-foreground hover:text-background transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />{ml}
          </button>
        ))}
      </div>
    </div>
  );
};

const StudentOverview = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [greeting] = useState(getGreeting);
  const [activeTab, setActiveTab] = useState<"home" | "discover">(() => {
    if (typeof window === "undefined") return "home";
    return (localStorage.getItem("student-home-tab") as "home" | "discover") || "home";
  });

  const switchTab = (t: "home" | "discover") => {
    setActiveTab(t);
    try { localStorage.setItem("student-home-tab", t); } catch {}
  };

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*, plans(*, duration_days)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: authorizedContacts = [] } = useQuery({
    queryKey: ["my-authorized-contacts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("authorized_contacts")
        .select("id, holder_name, phone, relationship, status, created_at, identity_verified_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Existe treino atribuído ativo? — usado pela ação-do-dia.
  const { data: hasTraining = false } = useQuery({
    queryKey: ["has-training", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("student_workout_assignments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return (count || 0) > 0;
    },
  });

  // Latest STH News = última tendência publicada
  const latestTrend = getLatestTrend();

  const firstName = profile?.full_name?.split(" ")[0] || "Aluno";

  const {
    meals,
    completedCount,
    totalMeals,
    progressPercent,
    nextMeal,
    isMealCompleted,
    totalMacros: dayTargetMacros,
    consumedMacros: dayMacros,
    waterConsumedMl: dayWaterMl,
    hydrationGoalL: dayHydrationGoalL,
    isLoading: mealsLoading,
    addWater,
    removeLastWater,
  } = useMealTracking();

  return (
    <DashboardLayout role="student" title="" subtitle="">
      <SubscriptionAlerts subscription={subscription ? { ...subscription, plans: (subscription as any)?.plans } : null} />
      <AdAutoPopup />
      <PreviewUnlockPopup />
      <WelcomeTour />
      <PaymentTourPopup />

      <NewTrendNotification />
      <QuickActionsFab />

      {/* HEADER */}
      <div className="flex items-start justify-between mb-10 relative">
        <div className="flex-1 min-w-0 pt-2">
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground">{greeting}</p>
          <h1 className="text-[42px] sm:text-[56px] leading-[0.95] font-semibold text-foreground tracking-[-0.045em] mt-3">
            {firstName}.
          </h1>
          <p className="text-[13px] text-muted-foreground font-light mt-4 tracking-tight max-w-[260px]">
            Acompanhe sua jornada e supere seus limites.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/ads")}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/40 transition-colors relative"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5 text-foreground" strokeWidth={1.5} />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-foreground" />
        </button>
      </div>

      <STHFlowCard />

      {/* CICLO DE ATUALIZAÇÃO — só aparece quando há ação pendente */}
      <EvolutionUpdateStatusCard />

      {/* AÇÃO DO DIA — card contextual acima de tudo */}
      <DailyHeroCard
        nextMeal={nextMeal as any}
        isMealCompleted={isMealCompleted}
        waterConsumedMl={dayWaterMl}
        waterGoalL={dayHydrationGoalL}
        hasTraining={hasTraining}
      />

      {/* ANÉIS DO DIA — estilo Apple Activity */}
      <DailyRingsCard
        kcalConsumed={dayMacros?.kcal || 0}
        kcalGoal={dayTargetMacros?.kcal || 0}
        proteinConsumed={dayMacros?.protein || 0}
        proteinGoal={dayTargetMacros?.protein || 0}
        waterMl={dayWaterMl}
        waterGoalL={dayHydrationGoalL}
      />

      {/* STREAK — dias consecutivos com refeição registrada */}
      <StreakCard />

      {/* TELEFONES AUTORIZADOS */}
      {authorizedContacts.length > 0 && (
        <div className="mb-6 rounded-3xl border border-border/40 bg-background overflow-hidden">
          <div className="p-5">
            <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> Telefones autorizados
            </div>
            <div className="space-y-2">
              {authorizedContacts.map((c: any) => {
                const label =
                  c.status === "approved" ? "Autorizado"
                  : c.status === "awaiting_student" ? "Aguardando você confirmar por e-mail"
                  : c.status === "pending" ? "Em análise"
                  : "Rejeitado";
                const color =
                  c.status === "approved" ? "text-emerald-500"
                  : c.status === "awaiting_student" ? "text-sky-500"
                  : c.status === "pending" ? "text-amber-500"
                  : "text-rose-500";
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3 text-[13px]">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.holder_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {formatPhoneBR(c.phone)} · {c.relationship}
                        {c.identity_verified_at ? " · verificado por e-mail" : ""}
                      </p>
                    </div>
                    <span className={`text-[11px] font-medium ${color}`}>{label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10.5px] text-muted-foreground mt-3 leading-relaxed">
              Estes contatos foram autorizados por você (por e-mail ou WhatsApp) a tratar do seu acompanhamento com a equipe STH METHOD.
            </p>
          </div>
        </div>
      )}

      {/* CHECK-IN DIÁRIO — humor + energia (1 tap) */}
      <DailyCheckinCard />

      {/* HIDRATAÇÃO ACIONÁVEL */}
      <HydrationWidget
        consumedMl={dayWaterMl}
        goalL={dayHydrationGoalL}
        onAdd={(ml) => addWater.mutate(ml)}
        onRemove={() => removeLastWater.mutate()}
      />

      {/* STH NEWS — última tendência publicada (destaque grande) */}
      <Link to={latestTrend.path} className="block mb-10 group">
        <div className="rounded-3xl border border-border/40 hover:border-border transition-colors overflow-hidden relative">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={latestTrend.img}
              alt="STH News"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute top-4 left-4">
              <span
                className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.25em] font-medium px-2.5 py-1 rounded-full backdrop-blur-md text-white"
                style={{
                  background: "hsl(0 0% 100% / 0.16)",
                  border: "0.5px solid hsl(0 0% 100% / 0.22)",
                }}
              >
                STH News
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="text-[20px] font-semibold tracking-[-0.02em] leading-tight text-white" style={{ textShadow: "0 2px 14px rgb(0 0 0 / 0.5)" }}>
                {latestTrend.title}
              </h3>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-white/70 font-light tracking-tight">
                  {new Date(latestTrend.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* CONTEÚDO STH METHOD */}
      <div className="mb-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">STH Method</p>
            <h2 className="text-[26px] font-semibold text-foreground tracking-[-0.03em] leading-tight mt-2">Conteúdo</h2>
          </div>
          <Link to="/dashboard/content" className="text-[12px] text-foreground font-medium flex items-center gap-0.5 pb-1 tracking-tight">
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
                className="snap-start shrink-0 w-[55vw] max-w-[220px] text-left rounded-2xl overflow-hidden relative group border border-border/40 bg-background active:scale-[0.98] transition-all duration-300"
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={s.img}
                    alt={s.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: "brightness(1.2) contrast(1.03) saturate(0.9)" }}
                    loading="lazy"
                  />
                  {/* Liquid glass overlays */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, hsl(0 0% 0% / 0.18) 0%, transparent 38%, hsl(0 0% 100% / 0.2) 100%)",
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(0 0% 100% / 0.24) 0%, transparent 30%, transparent 68%, hsl(0 0% 100% / 0.1) 100%)",
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                      background:
                        "linear-gradient(115deg, transparent 40%, rgb(255 255 255 / 0.06) 50%, transparent 60%)",
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className="inline-flex items-center gap-1 text-[8px] uppercase tracking-[0.22em] font-medium px-2 py-0.5 rounded-full backdrop-blur-md text-white"
                      style={{
                        background: "hsl(0 0% 100% / 0.16)",
                        border: "0.5px solid hsl(0 0% 100% / 0.22)",
                      }}
                    >
                      <Icon className="w-2.5 h-2.5" strokeWidth={2} />
                      {s.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-[13px] font-semibold tracking-[-0.02em] leading-tight text-white" style={{ textShadow: "0 2px 14px rgb(0 0 0 / 0.5)" }}>{s.title}</h3>
                    <p className="text-[10px] text-white/80 mt-0.5 tracking-tight font-light line-clamp-1" style={{ textShadow: "0 2px 10px rgb(0 0 0 / 0.4)" }}>{s.subtitle}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RECEITAS */}
      <div className="mb-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">Cozinha</p>
            <h2 className="text-[26px] font-semibold text-foreground tracking-[-0.03em] leading-tight mt-2">Receitas</h2>
          </div>
          <Link to="/dashboard/recipes" className="text-[12px] text-foreground font-medium flex items-center gap-0.5 pb-1 tracking-tight">
            Ver todas <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {recipeHighlights.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => navigate("/dashboard/recipes")}
              className="text-left rounded-2xl overflow-hidden relative group border border-border/40 active:scale-[0.97] transition-all duration-300"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-[10.5px] font-semibold text-white leading-tight line-clamp-2 tracking-[-0.01em]">{recipe.title}</p>
                  <p className="text-[8.5px] text-white/60 mt-1 flex items-center gap-1 tracking-tight font-light">
                    <Clock className="w-2 h-2" strokeWidth={2} /> {recipe.time}min · {recipe.kcal}kcal
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

    </DashboardLayout>
  );
};

export default StudentOverview;
