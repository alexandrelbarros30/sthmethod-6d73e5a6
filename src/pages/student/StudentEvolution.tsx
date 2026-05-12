import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Scale, Camera, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";
import DocumentUpload from "@/components/shared/DocumentUpload";
import { calculateAge, calculateMacros } from "@/lib/macro-calculator";
import EvolutionMacroDisplay from "@/components/student/EvolutionMacroDisplay";
import EvolutionWeightHistory from "@/components/student/EvolutionWeightHistory";
import EvolutionImageHistory from "@/components/student/EvolutionImageHistory";
import EvolutionActivityChange, { type ActivityData } from "@/components/student/EvolutionActivityChange";
import StudentBioimpedancePanel from "@/components/student/StudentBioimpedancePanel";
import EvolutionComparison from "@/components/shared/EvolutionComparison";
import { createEvolutionSnapshot } from "@/lib/evolution-snapshot";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GitCompare } from "lucide-react";

const StudentEvolution = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [imagesSaved, setImagesSaved] = useState(false);
  const [activityChange, setActivityChange] = useState<ActivityData | null>(null);
  const canSubmitUpdate = Boolean(weight || activityChange);

  const { data: fullProfile } = useQuery({
    queryKey: ["student-profile-evo", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: currentImages, refetch: refetchImages } = useQuery({
    queryKey: ["body-images-current", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("body_images")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_current", true);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: weightLogs } = useQuery({
    queryKey: ["student-weight-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: allImages } = useQuery({
    queryKey: ["body-images-all", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("body_images")
        .select("*")
        .eq("user_id", user!.id)
        .order("uploaded_at", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const currentWeight = fullProfile?.weight;

  const handleSaveWeight = async () => {
    if (!weight && !activityChange) {
      toast.error("Informe seu peso atual ou registre a mudança na rotina.");
      return;
    }

    setSaving(true);
    try {
      const hasNewWeight = Boolean(weight);
      const currentStoredWeight = fullProfile?.weight ? Number(fullProfile.weight) : null;
      const newWeight = hasNewWeight ? Number(weight) : currentStoredWeight;

      if (weight) {
        const { error } = await supabase.from("weight_logs").insert({
          user_id: user!.id,
          weight: newWeight,
          notes: notes || "",
        });
        if (error) throw error;
      }

      // Use activity change data if provided, otherwise use profile values
      const act = activityChange || {
        physicalActivityLevel: fullProfile?.physical_activity_level || "sedentario",
        activityType: fullProfile?.activity_type || "nenhuma",
        trainingDaysPerWeek: fullProfile?.training_days_per_week ?? undefined,
        trainingDurationMinutes: fullProfile?.training_duration_minutes ?? undefined,
        trainingIntensity: fullProfile?.training_intensity ?? undefined,
        doesCardio: fullProfile?.does_cardio || false,
        cardioDaysPerWeek: fullProfile?.cardio_days_per_week ?? undefined,
        cardioDurationMinutes: fullProfile?.cardio_duration_minutes ?? undefined,
        cardioIntensity: fullProfile?.cardio_intensity ?? undefined,
      };

      let macroUpdate: Record<string, any> = hasNewWeight ? { weight: newWeight } : {};

      // If activity changed, also persist the new activity fields
      if (activityChange) {
        macroUpdate = {
          ...macroUpdate,
          physical_activity_level: activityChange.physicalActivityLevel,
          activity_type: activityChange.activityType,
          training_days_per_week: activityChange.trainingDaysPerWeek,
          training_duration_minutes: activityChange.trainingDurationMinutes,
          training_intensity: activityChange.trainingIntensity,
          does_cardio: activityChange.doesCardio,
          cardio_days_per_week: activityChange.cardioDaysPerWeek,
          cardio_duration_minutes: activityChange.cardioDurationMinutes,
          cardio_intensity: activityChange.cardioIntensity,
        };
      }

      if (fullProfile?.birth_date && fullProfile?.height && fullProfile?.gender && typeof newWeight === "number" && Number.isFinite(newWeight)) {
        const age = calculateAge(fullProfile.birth_date);
        const macros = calculateMacros({
          gender: fullProfile.gender as "masculino" | "feminino",
          age,
          weight: newWeight,
          height: Number(fullProfile.height),
          activityType: act.activityType,
          doesCardio: act.doesCardio,
          objective: fullProfile.objective || "manter_peso",
          physicalActivityLevel: act.physicalActivityLevel,
          trainingDaysPerWeek: act.trainingDaysPerWeek || undefined,
          trainingDurationMinutes: act.trainingDurationMinutes || undefined,
          trainingIntensity: act.trainingIntensity || undefined,
          cardioDaysPerWeek: act.cardioDaysPerWeek || undefined,
          cardioDurationMinutes: act.cardioDurationMinutes || undefined,
          cardioIntensity: act.cardioIntensity || undefined,
        });

        macroUpdate = {
          ...macroUpdate,
          bmr: macros.bmr,
          tdee: macros.tdee,
          daily_calories: macros.dailyCalories,
          protein_g: macros.proteinG,
          carbs_g: macros.carbsG,
          fat_g: macros.fatG,
        };
      }

      await supabase.from("profiles").update(macroUpdate).eq("user_id", user!.id);

      // Anamnesis entry
      const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const prevWeight = currentWeight ? Number(currentWeight) : null;
      const weightDiff = prevWeight ? (newWeight - prevWeight).toFixed(1) : null;
      const weightDirection = weightDiff && Number(weightDiff) > 0 ? "+" : "";

      let anamnesisNote = `📊 ATUALIZAÇÃO DE EVOLUÇÃO — ${timestamp}\n\n`;
      if (hasNewWeight && typeof newWeight === "number" && Number.isFinite(newWeight)) {
        anamnesisNote += `⚖️ Peso: ${newWeight.toFixed(1)} kg`;
      } else {
        anamnesisNote += `⚖️ Peso: sem alteração informada`;
      }
      if (hasNewWeight && prevWeight) {
        anamnesisNote += ` (anterior: ${prevWeight.toFixed(1)} kg | variação: ${weightDirection}${weightDiff} kg)`;
      }
      anamnesisNote += "\n";

      if (activityChange) {
        anamnesisNote += `\n🏃 Rotina de atividade física alterada pelo aluno\n`;
      }

      if (macroUpdate.bmr) {
        anamnesisNote += `\n🔥 Macros recalculados:\n`;
        anamnesisNote += `  • TMB: ${macroUpdate.bmr} kcal\n`;
        anamnesisNote += `  • TDEE: ${macroUpdate.tdee} kcal\n`;
        anamnesisNote += `  • Meta calórica: ${macroUpdate.daily_calories} kcal\n`;
        anamnesisNote += `  • Proteína: ${macroUpdate.protein_g}g | Carbos: ${macroUpdate.carbs_g}g | Gordura: ${macroUpdate.fat_g}g\n`;
      }

      if (notes) {
        anamnesisNote += `\n📝 Observações do aluno: ${notes}\n`;
      }

      if (imagesSaved) {
        anamnesisNote += `\n📸 Novas fotos corporais enviadas.\n`;
      }

      await supabase.from("anamnesis_entries").insert({
        user_id: user!.id,
        notes: anamnesisNote,
      });

      await createEvolutionSnapshot(user!.id, "student", anamnesisNote);

      // Update the evolution notification with photos flag if applicable
      if (imagesSaved) {
        // Get the most recent notification for this user (just created by trigger)
        const { data: recentNotif } = await supabase
          .from("evolution_notifications")
          .select("id")
          .eq("student_user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (recentNotif && recentNotif.length > 0) {
          await supabase
            .from("evolution_notifications")
            .update({ has_photos: true })
            .eq("id", recentNotif[0].id);
        }
      }

      toast.success("Evolução registrada com sucesso! Macros atualizados.");
      setWeight("");
      setNotes("");
      setImagesSaved(false);
      setActivityChange(null);
      qc.invalidateQueries({ queryKey: ["student-weight-logs"] });
      qc.invalidateQueries({ queryKey: ["student-profile-evo"] });
      qc.invalidateQueries({ queryKey: ["student-full-profile"] });
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente."));
    }
    setSaving(false);
  };

  return (
    <DashboardLayout role="student" title="Atualização" subtitle="Registre seu progresso para acompanhamento profissional.">
      {fullProfile && <EvolutionMacroDisplay profile={fullProfile} />}

      <div className="rounded-3xl border border-border/40 bg-background p-6 mb-6 space-y-5">
        <div>
          <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">Atualização</p>
          <h2 className="text-[24px] font-semibold text-foreground tracking-[-0.03em] leading-tight mt-2">Nova evolução</h2>
          <p className="text-[12px] text-muted-foreground font-light mt-2 tracking-tight">
            Envie novas fotos corporais e registre seu peso atual. Os macros serão recalculados automaticamente.
          </p>
        </div>
          {/* Weight */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-foreground" />
              <Label className="font-body font-medium">Peso Atual (kg) *</Label>
            </div>
            <Input
              type="number"
              step="0.1"
              placeholder={currentWeight ? `Último registro: ${currentWeight} kg` : "Ex: 75.5"}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          {/* Activity Change */}
          {fullProfile && (
            <EvolutionActivityChange profile={fullProfile} onChange={setActivityChange} />
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="font-body text-sm">Observações (opcional)</Label>
            <Textarea
              placeholder="Como você está se sentindo? Alguma mudança na rotina?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">
              Se preferir, você já pode salvar esta atualização por aqui.
            </p>
            <Button
              variant="outline"
              className={`w-full transition-colors ${canSubmitUpdate && !saving ? "bg-foreground text-background border-foreground hover:bg-foreground/90 shadow-[0_0_20px_hsl(var(--foreground)/0.2)]" : ""}`}
              onClick={handleSaveWeight}
              disabled={saving || !canSubmitUpdate}
            >
              {saving ? "Salvando..." : "Salvar atualização agora"}
            </Button>
          </div>

          {/* Body images */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Camera className="w-4 h-4 text-foreground" />
              <Label className="font-body font-medium">Novas Fotos Corporais (3 obrigatórias)</Label>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              ⚠️ As fotos anteriores são <strong>preservadas automaticamente</strong> no seu histórico. Envie 3 novas fotos atualizadas.
            </p>
            <BodyImageUpload
              userId={user!.id}
              existingImages={currentImages || []}
              canDeleteExisting={false}
              required={false}
              onComplete={() => {
                setImagesSaved(true);
                refetchImages();
                qc.invalidateQueries({ queryKey: ["body-images-all"] });
                qc.invalidateQueries({ queryKey: ["body-images"] });
                toast.success("Fotos salvas! Agora registre seu peso.");
              }}
            />
          </div>

          {imagesSaved && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="w-4 h-4" />
              Fotos salvas com sucesso
            </div>
          )}

          {/* Exames laboratoriais e receita médica (PDF) */}
          <div className="pt-2 border-t">
            <DocumentUpload userId={user!.id} />
          </div>

          <Button
            className={`w-full transition-colors ${canSubmitUpdate && !saving ? "bg-foreground text-background hover:bg-foreground/90 shadow-[0_0_20px_hsl(var(--foreground)/0.2)]" : ""}`}
            onClick={handleSaveWeight}
            disabled={saving || !canSubmitUpdate}
          >
            {saving ? "Salvando..." : "Registrar Evolução e Atualizar Macros"}
          </Button>
      </div>

      <EvolutionWeightHistory weightLogs={weightLogs || []} />

      {/* Comparação de evolução */}
      <div className="mb-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <GitCompare className="w-4 h-4 mr-2" />
              Comparar evolução (inicial × atual)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitCompare className="w-5 h-5" />
                Histórico de Evolução
              </DialogTitle>
            </DialogHeader>
            <EvolutionComparison userId={user!.id} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Bioimpedance Panel */}
      <div className="mb-6">
        <StudentBioimpedancePanel />
      </div>

      <EvolutionImageHistory allImages={allImages || []} />
    </DashboardLayout>
  );
};

export default StudentEvolution;
