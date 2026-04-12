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
import { calculateAge, calculateMacros } from "@/lib/macro-calculator";
import EvolutionMacroDisplay from "@/components/student/EvolutionMacroDisplay";
import EvolutionWeightHistory from "@/components/student/EvolutionWeightHistory";
import EvolutionImageHistory from "@/components/student/EvolutionImageHistory";
import EvolutionActivityChange, { type ActivityData } from "@/components/student/EvolutionActivityChange";
import StudentBioimpedancePanel from "@/components/student/StudentBioimpedancePanel";

const StudentEvolution = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [imagesSaved, setImagesSaved] = useState(false);
  const [activityChange, setActivityChange] = useState<ActivityData | null>(null);

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
    if (!weight) {
      toast.error("Informe seu peso atual.");
      return;
    }

    setSaving(true);
    try {
      const newWeight = Number(weight);

      const { error } = await supabase.from("weight_logs").insert({
        user_id: user!.id,
        weight: newWeight,
        notes: notes || "",
      });
      if (error) throw error;

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

      let macroUpdate: Record<string, any> = { weight: newWeight };

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

      if (fullProfile?.birth_date && fullProfile?.height && fullProfile?.gender) {
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
      anamnesisNote += `⚖️ Peso: ${newWeight.toFixed(1)} kg`;
      if (prevWeight) {
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

      <Card className="mb-6 border-primary/20 bg-primary/[0.03]">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Nova Atualização de Evolução
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Envie novas fotos corporais e registre seu peso atual. Os macros serão recalculados automaticamente.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Weight */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
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

          {/* Body images */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Camera className="w-4 h-4 text-primary" />
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
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="w-4 h-4" />
              Fotos salvas com sucesso
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSaveWeight}
            disabled={saving || !weight}
          >
            {saving ? "Salvando..." : "Registrar Evolução e Atualizar Macros"}
          </Button>
        </CardContent>
      </Card>

      <EvolutionWeightHistory weightLogs={weightLogs || []} />

      {/* Bioimpedance Panel */}
      <div className="mb-6">
        <StudentBioimpedancePanel />
      </div>

      <EvolutionImageHistory allImages={allImages || []} />
    </DashboardLayout>
  );
};

export default StudentEvolution;
