import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { usePreviewAs } from "@/hooks/usePreviewAs";
import PreviewAsBanner from "@/components/student/PreviewAsBanner";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import PreviewLockedCard from "@/components/student/PreviewLockedCard";
import { useMealTracking } from "@/hooks/useMealTracking";
import DailyProgressRing from "@/components/student/DailyProgressRing";
import MacroProgressBar from "@/components/student/MacroProgressBar";
import MealCard from "@/components/student/MealCard";
import MealDetailPanel from "@/components/student/MealDetailPanel";
import DietDateNav from "@/components/student/DietDateNav";
import HydrationTracker from "@/components/student/HydrationTracker";
import DietSelector from "@/components/student/DietSelector";
import DietContentRenderer from "@/components/student/DietContentRenderer";
import ScreenWatermark from "@/components/student/ScreenWatermark";
import DietPlanningPanel from "@/components/student/DietPlanningPanel";
import DietMealGuide from "@/components/student/DietMealGuide";
import DietUpdatedBanner from "@/components/student/DietUpdatedBanner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Utensils, Flame, Zap, FileDown, Apple, Droplets } from "lucide-react";
import { toast } from "sonner";
import { generateStudentPDF } from "@/lib/pdfGenerator";

const StudentDiet = () => {
  const { user } = useAuth();
  const { effectiveUserId } = usePreviewAs();
  const targetId = effectiveUserId || user?.id;
  const { isActive, isLoading: subLoading, previewUnlocked } = useSubscriptionGuard();
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const {
    meals,
    completions,
    totalMacros,
    consumedMacros,
    perMealFoodMacros,
    completedCount,
    totalMeals,
    progressPercent,
    nextMeal,
    activeMeal,
    toggleMeal,
    isLoading,
    error,
    isMealCompleted,
    isMealSkipped,
    selectedDate,
    setSelectedDate,
    isToday,
    hydrationGoalL,
    waterConsumedMl,
    addWater,
    removeLastWater,
    availableDiets,
    currentDiet,
    selectedDietId,
    setSelectedDietId,
  } = useMealTracking();

  const hasStructuredMeals = meals.length > 0;
  const fallbackDietContent = !hasStructuredMeals && currentDiet && typeof (currentDiet as any).content === "string"
    ? ((currentDiet as any).content as string).trim()
    : "";

  if (subLoading || isLoading) {
    return (
        <DashboardLayout role="student" title="Seu plano hoje" subtitle="Seu plano alimentar personalizado.">
        <PreviewAsBanner />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isActive) {
    if (meals.length > 0) {
      const previewText = meals
        .slice(0, 2)
        .flatMap((m) => [m.name, ...m.diet_foods.map((f: any) => `${f.quantity} - ${f.item}`)])
        .join("\n");
      return (
        <DashboardLayout role="student" title="Seu plano hoje" subtitle="Pré-estreia da sua dieta personalizada.">
          <PreviewAsBanner />
          <PreviewLockedCard type="diet" previewText={previewText} />
        </DashboardLayout>
      );
    }
    return (
      <DashboardLayout role="student" title="Seu plano hoje" subtitle="Seu plano alimentar personalizado.">
        <PreviewAsBanner />
        <SubscriptionBlock />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
        <DashboardLayout role="student" title="Seu plano hoje" subtitle="Seu plano alimentar personalizado.">
        <PreviewAsBanner />
        <Card className="premium-card">
          <CardContent className="py-8 text-center">
            <p className="text-sm font-semibold text-foreground">Não foi possível carregar sua dieta.</p>
            <p className="text-xs text-muted-foreground mt-1">Tente atualizar a página; se persistir, avise seu consultor.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!hasStructuredMeals && !fallbackDietContent) {
    return (
      <DashboardLayout role="student" title="Seu plano hoje" subtitle="Seu plano alimentar personalizado.">
        <PreviewAsBanner />
        <Card className="premium-card">
          <CardContent className="py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Nenhuma refeição configurada ainda.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Aguarde seu consultor configurar seu plano.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const handleToggle = (mealId: string) => {
    const wasCompleted = isMealCompleted(mealId);
    toggleMeal.mutate({ mealId, skipped: false });
    if (!wasCompleted) {
      toast.success("Refeição concluída! ✅");
    }
  };

  const handleSkip = (mealId: string) => {
    const wasSkipped = isMealSkipped(mealId);
    toggleMeal.mutate({ mealId, skipped: true });
    if (!wasSkipped) {
      toast("Refeição pulada", { description: "Macros redistribuídos automaticamente" });
    }
  };

  const skippedMacros = meals.reduce(
    (acc, meal) => {
      if (isMealSkipped(meal.id)) {
        meal.diet_foods.forEach((f) => {
          acc.kcal += f.energy_kcal || 0;
          acc.protein += f.protein_g || 0;
          acc.carbs += f.carbs_g || 0;
          acc.fat += f.fat_g || 0;
        });
      }
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const remainingMeals = meals.filter((m) => !isMealCompleted(m.id) && !isMealSkipped(m.id)).length;
  const redistributedPerMeal = remainingMeals > 0
    ? {
        kcal: skippedMacros.kcal / remainingMeals,
        protein: skippedMacros.protein / remainingMeals,
        carbs: skippedMacros.carbs / remainingMeals,
        fat: skippedMacros.fat / remainingMeals,
      }
    : { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  const expandedMeal = expandedMealId ? meals.find((m) => m.id === expandedMealId) : null;

  const handleDownloadPdf = async () => {
    if (!hasStructuredMeals && !fallbackDietContent) {
      toast.error("Nenhuma refeição disponível para gerar o PDF.");
      return;
    }

    setIsDownloadingPdf(true);
    try {
      // Fetch profile data for PDF header
      let profileData: { full_name?: string; weight?: number; height?: number; objective?: string; birth_date?: string } | null = null;
      if (targetId) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, weight, height, objective, birth_date")
          .eq("user_id", targetId)
          .single();
        profileData = data;
      }

      // Calculate age from birth_date
      let age: number | undefined;
      if (profileData?.birth_date) {
        const birth = new Date(profileData.birth_date);
        const today = new Date();
        age = today.getFullYear() - birth.getFullYear();
        if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
          age--;
        }
      }

      const content = hasStructuredMeals
        ? meals
            .map((meal) => {
              const heading = meal.sort_order <= 5 ? `REFEIÇÃO ${meal.sort_order + 1} - ${meal.name}` : meal.name;
              const firstNotes = (meal.diet_foods[0] as any)?.notes || "";
              if (typeof firstNotes === "string" && firstNotes.startsWith("__RAW_HTML__")) {
                const html = firstNotes.slice("__RAW_HTML__".length);
                return `${heading}\n__HTML_BLOCK_START__\n${html}\n__HTML_BLOCK_END__`;
              }
              const foods = meal.diet_foods.map((food) => `${food.quantity} - ${food.item}`).join("\n");
              return `${heading}\n${foods}`;
            })
            .join("\n\n")
        : fallbackDietContent;

      const blob = await generateStudentPDF({
        type: "diet",
        title: "Rotina Alimentar",
        content,
        studentInfo: {
          name: profileData?.full_name || (user?.user_metadata?.full_name as string) || user?.email || "Aluno",
          cpf: (profileData as any)?.cpf || undefined,
          age,
          weight: profileData?.weight ?? undefined,
          height: profileData?.height ?? undefined,
          goal: profileData?.objective ?? undefined,
          hydration: hydrationGoalL > 0 ? `${hydrationGoalL} L` : undefined,
          energyTotal: totalMacros.kcal > 0 ? `${Math.round(totalMacros.kcal)} kcal` : undefined,
          carbsTotal: totalMacros.carbs > 0 ? `${Math.round(totalMacros.carbs)} g` : undefined,
          proteinTotal: totalMacros.protein > 0 ? `${Math.round(totalMacros.protein)} g` : undefined,
          fatTotal: totalMacros.fat > 0 ? `${Math.round(totalMacros.fat)} g` : undefined,
        },
        createdAt: new Date().toISOString(),
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dieta-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF da dieta baixado com sucesso.");
    } catch (error) {
      console.error("Erro ao gerar PDF da dieta:", error);
      toast.error("Não foi possível gerar o PDF agora.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <DashboardLayout role="student" title="Seu plano hoje" subtitle="Acompanhe suas refeições do dia.">
      <PreviewAsBanner />
      <div className="space-y-5 max-w-lg mx-auto">
        {/* Identity Header — alinhado ao Protocolo */}
        <div className="text-center space-y-3 pt-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-foreground/10 border border-foreground/15 text-foreground text-xs font-semibold tracking-wider uppercase">
            <Apple className="w-3.5 h-3.5" />
            Cardápio Personalizado
          </div>
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground">
            Estratégia STH Premium · Nutrição
          </p>
        </div>

        {/* Date navigation */}
        <DietDateNav selectedDate={selectedDate} onDateChange={setSelectedDate} />

        <div className="flex justify-end items-center gap-2">
          <DietMealGuide />
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
            <FileDown className="w-4 h-4 mr-1" />
            {isDownloadingPdf ? "Gerando PDF..." : "Baixar PDF"}
          </Button>
        </div>

        {targetId && <DietPlanningPanel targetUserId={targetId} readOnly />}

        <DietUpdatedBanner dietId={currentDiet?.id} userId={targetId} />

        {hasStructuredMeals ? (
          <Tabs defaultValue="refeicoes" className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-white/[0.04] border border-white/10 rounded-2xl p-1 h-auto">
              <TabsTrigger
                value="refeicoes"
                className="rounded-xl text-xs font-semibold uppercase tracking-[0.2em] data-[state=active]:bg-foreground data-[state=active]:text-background py-2"
              >
                <Utensils className="w-3.5 h-3.5 mr-1.5" /> Refeições
              </TabsTrigger>
              <TabsTrigger
                value="hidratacao"
                className="rounded-xl text-xs font-semibold uppercase tracking-[0.2em] data-[state=active]:bg-foreground data-[state=active]:text-background py-2"
              >
                <Droplets className="w-3.5 h-3.5 mr-1.5" /> Hidratação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="refeicoes" className="space-y-5 mt-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden animate-fade-in">
              <div className="py-6 px-6">
                <div className="mb-4">
                  <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground">Hoje</p>
                  <h3 className="text-xl font-display font-bold uppercase text-foreground tracking-tight mt-2">Consistência</h3>
                </div>
                <div className="flex items-center gap-5">
                  <DailyProgressRing
                    percent={progressPercent}
                    size={120}
                    strokeWidth={8}
                    sublabel={isToday ? (nextMeal?.name || "Concluído") : undefined}
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-[28px] font-display font-bold text-foreground tracking-tight tabular-nums leading-none">
                        {completedCount}<span className="text-muted-foreground/60 font-light text-base">/{totalMeals}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1.5 tracking-tight">
                        {progressPercent === 100 ? "Dia completo! 🎉" : `${totalMeals - completedCount} refeições restantes`}
                      </p>
                    </div>

                    {isToday && nextMeal && !isMealCompleted(nextMeal.id) && (
                      <div className="p-3 rounded-2xl border border-white/10 bg-white/[0.02]">
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-[0.3em] flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Próxima Refeição
                        </p>
                        <p className="text-sm font-display font-semibold text-foreground mt-1 tracking-tight">
                          {nextMeal.name} <span className="text-muted-foreground text-xs font-mono ml-1">{nextMeal.time}</span>
                        </p>
                      </div>
                    )}

                    {!isToday && (
                      <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Visualizando histórico</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-4">Macros</p>
              <div className="space-y-3">
                <MacroProgressBar label="Calorias" consumed={consumedMacros.kcal} total={totalMacros.kcal} unit="kcal" color="bg-foreground" />
                <MacroProgressBar label="Proteína" consumed={consumedMacros.protein} total={totalMacros.protein} color="bg-info" />
                <MacroProgressBar label="Carboidrato" consumed={consumedMacros.carbs} total={totalMacros.carbs} color="bg-warning" />
                <MacroProgressBar label="Gordura" consumed={consumedMacros.fat} total={totalMacros.fat} color="bg-[hsl(25,85%,55%)]" />

                {skippedMacros.kcal > 0 && remainingMeals > 0 && (
                  <p className="text-[10px] text-warning mt-1 flex items-center gap-1">
                    ⚠️ +{Math.round(redistributedPerMeal.kcal)} kcal redistribuídos por refeição
                  </p>
                )}
              </div>
            </div>

              <DietSelector
                diets={availableDiets as any}
                selectedId={selectedDietId}
                onSelect={setSelectedDietId}
              />

              {hasStructuredMeals && (
                <div className="space-y-3" style={{ animationDelay: "0.2s" }}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground flex items-center gap-2">
                      <Utensils className="w-3 h-3" /> Refeições do dia
                    </h3>
                    <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground tabular-nums font-mono">
                      {completedCount}/{totalMeals} hoje
                    </span>
                  </div>

                  {meals.map((meal, idx) => (
                    <div key={meal.id} className="animate-slide-up" style={{ animationDelay: `${0.05 * idx}s` }}>
                      <MealCard
                        meal={meal}
                        mealLabel={`Refeição ${meal.sort_order + 1}`}
                        isCompleted={isMealCompleted(meal.id)}
                        isSkipped={isMealSkipped(meal.id)}
                        isActive={activeMeal?.id === meal.id}
                        isNext={nextMeal?.id === meal.id && activeMeal?.id !== meal.id}
                        distributedMacros={(() => { const m = perMealFoodMacros.find(pm => pm.mealId === meal.id); return m ? { kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat } : null; })()}
                        onToggle={() => handleToggle(meal.id)}
                        onSkip={() => handleSkip(meal.id)}
                        onExpand={() => setExpandedMealId(expandedMealId === meal.id ? null : meal.id)}
                        isExpanded={expandedMealId === meal.id}
                      />
                      {expandedMealId === meal.id && expandedMeal && (
                        <MealDetailPanel
                          meal={expandedMeal}
                          mealLabel={`Refeição ${expandedMeal.sort_order + 1}`}
                          onClose={() => setExpandedMealId(null)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="hidratacao" className="mt-4">
              {hydrationGoalL > 0 ? (
                <HydrationTracker
                  goalL={hydrationGoalL}
                  consumedMl={waterConsumedMl}
                  onAdd={(ml) => addWater.mutate(ml)}
                  onRemove={() => removeLastWater.mutate()}
                  isAdding={addWater.isPending}
                  disabled={!isToday}
                />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 text-center">
                  <Droplets className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground">Meta de hidratação não definida</p>
                  <p className="text-xs text-muted-foreground mt-1">Aguarde seu consultor configurar.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 animate-fade-in">
            <div className="mb-4 text-center">
              <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground">Plano alimentar</p>
            </div>
            <DietContentRenderer content={fallbackDietContent} showHeader={false} />
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default StudentDiet;
