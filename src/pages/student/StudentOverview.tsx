import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Salad, Dumbbell, FlaskConical, BookOpen, CalendarDays, CheckCircle,
  AlertCircle, User, FileText, TrendingUp, Activity, Flame, Scale,
  Target, ChevronRight, Zap, Droplets, ListChecks
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SubscriptionAlerts from "@/components/student/SubscriptionAlerts";
import BodyImageUpload from "@/components/shared/BodyImageUpload";
import { calculateAge } from "@/lib/macro-calculator";
import {
  objectiveLabels, activityLabels,
  trainingIntensityOptions, cardioIntensityOptions,
  physicalActivityLevelOptions,
} from "@/lib/form-constants";
import StudentProfileForm, { profileFromDb, getPendingFields, type ProfileFormData } from "@/components/student/StudentProfileForm";
import { getPlanTier, getPlanTierClasses } from "@/lib/plan-colors";

const modules = [
  { to: "/dashboard/diet", icon: Salad, title: "Plano Alimentar", desc: "Sua rotina alimentar personalizada", color: "text-success", bgColor: "bg-success/10" },
  { to: "/dashboard/training", icon: Dumbbell, title: "Treino", desc: "Periodização e exercícios", color: "text-info", bgColor: "bg-info/10" },
  { to: "/dashboard/guided-workout", icon: ListChecks, title: "Treino Guiado", desc: "Execute seu treino passo a passo", color: "text-primary", bgColor: "bg-primary/10" },
  { to: "/dashboard/protocol", icon: FlaskConical, title: "Protocolo", desc: "Suplementação e prescrições", color: "text-warning", bgColor: "bg-warning/10" },
  { to: "/dashboard/content", icon: BookOpen, title: "Conteúdos", desc: "Materiais educativos exclusivos", color: "text-accent-foreground", bgColor: "bg-accent/50" },
];

const StudentOverview = () => {
  const { profile, user } = useAuth();
  const location = useLocation();
  const qc = useQueryClient();
  const statusRef = useRef<HTMLDivElement>(null);

  const { data: fullProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["student-full-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
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

  const { data: pendingPayment } = useQuery({
    queryKey: ["pending-payment", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*, plans(name, duration_days)")
        .eq("user_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !subscription,
  });

  const { data: bodyImages, refetch: refetchImages } = useQuery({
    queryKey: ["body-images", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("body_images").select("*").eq("user_id", user!.id).eq("is_current", true);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch diet meals for nutritional summary
  const { data: dietMeals } = useQuery({
    queryKey: ["student-diet-meals", user?.id],
    queryFn: async () => {
      const { data: meals } = await supabase
        .from("diet_meals")
        .select("id, name, diet_foods(energy_kcal, protein_g, carbs_g, fat_g, fiber_g)")
        .eq("user_id", user!.id);
      return meals || [];
    },
    enabled: !!user?.id,
  });

  const p = fullProfile as any;
  const isOnboarded = p?.onboarding_complete;
  const hasImages = bodyImages && bodyImages.length >= 3;

  const [form, setForm] = useState<ProfileFormData>(profileFromDb({}));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (p) setForm(profileFromDb(p));
  }, [p]);

  useEffect(() => {
    if (location.hash === "#status-cadastro" && statusRef.current) {
      setTimeout(() => statusRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [location.hash, fullProfile]);

  const pendingFields = getPendingFields(form, !!hasImages);
  const allComplete = pendingFields.length === 0;

  useEffect(() => {
    if (allComplete && !isOnboarded && p) {
      supabase.from("profiles").update({ onboarding_complete: true }).eq("user_id", user!.id).then(() => {
        refetchProfile();
        qc.invalidateQueries({ queryKey: ["student-profile-onboard"] });
      });
    }
  }, [allComplete, isOnboarded, p]);

  const isActive = subscription?.status === "active" && new Date(subscription.end_date) > new Date();
  const daysLeft = subscription ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86400000)) : 0;
  const totalDays = (subscription as any)?.plans?.duration_days || 30;
  const progressPercent = totalDays > 0 ? Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)) : 0;
  const firstName = profile?.full_name?.split(" ")[0] || "Aluno";
  const planDurationDays = (subscription as any)?.plans?.duration_days || null;
  const tierClasses = getPlanTierClasses(getPlanTier(planDurationDays));

  // Compute nutritional totals from diet
  const nutritionTotals = dietMeals?.reduce((acc, meal: any) => {
    const foods = meal.diet_foods || [];
    foods.forEach((f: any) => {
      acc.kcal += f.energy_kcal || 0;
      acc.protein += f.protein_g || 0;
      acc.carbs += f.carbs_g || 0;
      acc.fat += f.fat_g || 0;
      acc.fiber += f.fiber_g || 0;
    });
    return acc;
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }) || { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

  const weight = p?.weight;
  const tdee = p?.tdee;
  const proteinPerKg = weight && nutritionTotals.protein ? (nutritionTotals.protein / weight).toFixed(2) : null;
  const carbsPerKg = weight && nutritionTotals.carbs ? (nutritionTotals.carbs / weight).toFixed(2) : null;
  const fatPerKg = weight && nutritionTotals.fat ? (nutritionTotals.fat / weight).toFixed(2) : null;

  const calorieDiff = nutritionTotals.kcal && tdee ? nutritionTotals.kcal - tdee : null;
  const strategy = calorieDiff !== null
    ? calorieDiff < -200 ? "Déficit" : calorieDiff > 200 ? "Superávit" : "Manutenção"
    : null;
  const strategyColor = strategy === "Déficit" ? "text-info" : strategy === "Superávit" ? "text-success" : "text-warning";

  const showEditableForm = !isOnboarded || editing;

  return (
    <DashboardLayout role="student" title={`Olá, ${firstName} 👋`} subtitle="Acompanhe seu progresso e acesse seus módulos.">
      <SubscriptionAlerts subscription={subscription ? { ...subscription, plans: (subscription as any)?.plans } : null} />

      {/* ===== STATUS DO CADASTRO ===== */}
      <div ref={statusRef} id="status-cadastro">
        {!allComplete ? (
          <Card className="mb-6 border-destructive/20 bg-destructive/5 animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" /> Status do Cadastro
              </CardTitle>
              <Badge variant="outline" className="border-destructive/30 text-destructive w-fit">Incompleto</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Complete os itens abaixo para liberar totalmente seu acesso:</p>
              <ul className="space-y-1 mb-4">
                {pendingFields.map((f) => (
                  <li key={f} className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : isOnboarded ? (
          <Card className="mb-6 border-primary/20 bg-primary/5 animate-fade-in">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground font-body">Cadastro completo</p>
                <p className="text-sm text-muted-foreground font-body">
                  Concluído em {p?.updated_at ? new Date(p.updated_at).toLocaleDateString("pt-BR") : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* ===== FORMULÁRIO EDITÁVEL ===== */}
      {showEditableForm && (
        <StudentProfileForm
          form={form}
          onChange={setForm}
          userId={user!.id}
          isOnboarded={!!isOnboarded}
          editing={editing}
          email={p?.email || user?.email || ""}
          labExamUrl={p?.lab_exam_url}
          prescriptionUrl={p?.medical_prescription_url}
          onDocumentUploaded={() => refetchProfile()}
          onSaved={() => {
            setEditing(false);
            refetchProfile();
            qc.invalidateQueries({ queryKey: ["student-profile-onboard"] });
          }}
          onCancel={isOnboarded ? () => setEditing(false) : undefined}
        />
      )}

      {/* ===== UPLOAD DE IMAGENS ===== */}
      <div className="mb-6">
        <BodyImageUpload
          userId={user!.id}
          existingImages={bodyImages || []}
          required={!hasImages}
          onComplete={() => {
            refetchImages();
            qc.invalidateQueries({ queryKey: ["body-images"] });
          }}
        />
      </div>

      {/* ===== ASSINATURA + PROGRESSO ===== */}
      {subscription ? (
        <Card className={`mb-6 ${isActive ? `${tierClasses.border} ${tierClasses.bg} ${tierClasses.glow}` : "border-destructive/20 bg-destructive/5"}`}>
          <CardContent className="py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                {isActive ? <CheckCircle className={`w-5 h-5 shrink-0 ${tierClasses.text}`} /> : <AlertCircle className="w-5 h-5 shrink-0 text-destructive" />}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground font-body text-sm sm:text-base">{isActive ? "Assinatura ativa" : "Assinatura vencida"}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-body truncate">
                    Plano {(subscription as any)?.plans?.name} • Vence em {new Date(subscription.end_date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-8 sm:ml-0">
                {isActive && (subscription as any)?.plans?.name && (
                  <Badge variant="outline" className={`${tierClasses.badge} font-medium text-xs`}>
                    {(subscription as any)?.plans?.name}
                  </Badge>
                )}
                {isActive && (
                  <Badge variant="outline" className={`${tierClasses.border} ${tierClasses.text} text-xs`}>
                    <CalendarDays className="w-3 h-3 mr-1" /> {daysLeft} dias
                  </Badge>
                )}
              </div>
            </div>
            {isActive && (
              <div className="ml-8 sm:ml-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progresso do plano</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      ) : pendingPayment ? (
        <Card className="mb-6 border-warning/20 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-warning" />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground font-body text-sm sm:text-base">Pagamento pendente</p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-body">
                    Plano {(pendingPayment as any)?.plans?.name || "selecionado"} • Aguardando confirmação
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-warning/30 text-warning font-medium ml-8 sm:ml-0 w-fit text-xs">Pendente</Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-warning/20 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-warning" />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground font-body text-sm sm:text-base">Nenhum plano ativo</p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-body">Escolha um plano para ativar seu acesso.</p>
                </div>
              </div>
              <Link to="/cadastro" className="ml-8 sm:ml-0">
                <Button size="sm" variant="outline" className="border-warning/30 text-warning hover:bg-warning/10 text-xs">Escolher plano</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== INDICADORES METABÓLICOS ===== */}
      {p && isOnboarded && (weight || tdee || nutritionTotals.kcal > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {weight && (
            <Card className="border-border/50">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Peso</p>
                  <p className="text-lg font-bold text-foreground font-display">{weight} <span className="text-xs font-normal text-muted-foreground">kg</span></p>
                </div>
              </CardContent>
            </Card>
          )}
          {tdee && (
            <Card className="border-border/50">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gasto (TDEE)</p>
                  <p className="text-lg font-bold text-foreground font-display">{Math.round(tdee)} <span className="text-xs font-normal text-muted-foreground">kcal</span></p>
                </div>
              </CardContent>
            </Card>
          )}
          {nutritionTotals.kcal > 0 && (
            <Card className="border-border/50">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Consumo</p>
                  <p className="text-lg font-bold text-foreground font-display">{Math.round(nutritionTotals.kcal)} <span className="text-xs font-normal text-muted-foreground">kcal</span></p>
                </div>
              </CardContent>
            </Card>
          )}
          {strategy && (
            <Card className="border-border/50">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estratégia</p>
                  <p className={`text-base font-bold font-display ${strategyColor}`}>{strategy}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== MACROS POR KG ===== */}
      {p && isOnboarded && nutritionTotals.kcal > 0 && weight && (
        <Card className="mb-6 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Macros por kg de Peso Corporal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl bg-info/5 border border-info/10">
                <p className="text-2xl font-bold text-info font-display">{proteinPerKg}</p>
                <p className="text-xs text-muted-foreground mt-1">Proteína (g/kg)</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-warning/5 border border-warning/10">
                <p className="text-2xl font-bold text-warning font-display">{carbsPerKg}</p>
                <p className="text-xs text-muted-foreground mt-1">Carboidrato (g/kg)</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                <p className="text-2xl font-bold text-destructive font-display">{fatPerKg}</p>
                <p className="text-xs text-muted-foreground mt-1">Gordura (g/kg)</p>
              </div>
            </div>
            {calorieDiff !== null && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Balanço energético: <span className={`font-semibold ${calorieDiff > 0 ? "text-success" : "text-info"}`}>
                  {calorieDiff > 0 ? "+" : ""}{Math.round(calorieDiff)} kcal
                </span> em relação ao TDEE
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== MINHA FICHA ===== */}
      {p && isOnboarded && !editing && (
        <Card className="mb-6">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2"><User className="w-4 h-4" /> Minha Ficha</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Editar</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{p.full_name}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{p.email}</span></div>
              <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{p.phone || "—"}</span></div>
              <div><span className="text-muted-foreground">Nascimento:</span> <span className="font-medium">{p.birth_date ? new Date(p.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}{p.birth_date ? ` (${calculateAge(p.birth_date)} anos)` : ""}</span></div>
              <div><span className="text-muted-foreground">Gênero:</span> <span className="font-medium capitalize">{p.gender || "—"}</span></div>
              <div><span className="text-muted-foreground">Altura:</span> <span className="font-medium">{p.height ? `${p.height} cm` : "—"}</span></div>
              <div><span className="text-muted-foreground">Peso:</span> <span className="font-medium">{p.weight ? `${p.weight} kg` : "—"}</span></div>
              <div><span className="text-muted-foreground">Objetivo:</span> <span className="font-medium">{objectiveLabels[p.objective] || p.objective || "—"}</span></div>
            </div>

            <div className="mt-4 space-y-3 border-t pt-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nível de Atividade Física (NEAT)</p>
                <p className="text-sm">{physicalActivityLevelOptions.find(o => o.value === p.physical_activity_level)?.label || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Atividade Física</p>
                <p className="text-sm">{activityLabels[p.activity_type] || p.physical_activity || "—"}</p>
                {(p.activity_type === "musculacao" || p.activity_type === "crossfit") && p.training_days_per_week && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.training_days_per_week}x/sem • {p.training_duration_minutes} min • {trainingIntensityOptions.find(o => o.value === p.training_intensity)?.label || "—"}
                  </p>
                )}
              </div>
              {p.does_cardio && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cardio</p>
                  <p className="text-sm">Sim</p>
                  {p.cardio_days_per_week && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.cardio_days_per_week}x/sem • {p.cardio_duration_minutes} min • {cardioIntensityOptions.find(o => o.value === p.cardio_intensity)?.label || "—"}
                    </p>
                  )}
                </div>
              )}
              {p.current_protocol && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Protocolo Atual</p><p className="text-sm whitespace-pre-wrap">{p.current_protocol}</p></div>}
              {p.comorbidities && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Comorbidades</p><p className="text-sm whitespace-pre-wrap">{p.comorbidities}</p></div>}
            </div>

            {(p.lab_exam_url || p.medical_prescription_url) && (
              <div className="mt-4 border-t pt-4 flex gap-4">
                {p.lab_exam_url && <a href={p.lab_exam_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1"><FileText className="w-4 h-4" /> Exames</a>}
                {p.medical_prescription_url && <a href={p.medical_prescription_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1"><FileText className="w-4 h-4" /> Receita</a>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== MÓDULOS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {modules.map((mod) => (
          <Link key={mod.to} to={mod.to}>
            <Card className="hover:shadow-card-hover hover:border-primary/20 transition-all duration-300 cursor-pointer group h-full">
              <CardContent className="py-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${mod.bgColor} flex items-center justify-center group-hover:scale-105 transition-transform shrink-0`}>
                  <mod.icon className={`w-6 h-6 ${mod.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground font-display text-sm">{mod.title}</p>
                  <p className="text-xs text-muted-foreground font-body">{mod.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentOverview;
