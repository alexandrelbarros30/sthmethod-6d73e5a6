import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Scale, Camera, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";
import { calculateAge, calculateMacros } from "@/lib/macro-calculator";
import EvolutionActivityChange, { ActivityData } from "@/components/student/EvolutionActivityChange";
import { createEvolutionSnapshot } from "@/lib/evolution-snapshot";
import { notifyStudentSelfUpdate } from "@/lib/notify-student-self-update";

interface EvolutionUpdateCardProps {
  userId: string;
  currentWeight?: number | null;
  existingImages: { type: string; image_url: string; id: string }[];
  onComplete: () => void;
  profile?: any;
}

const EvolutionUpdateCard = ({ userId, currentWeight, existingImages, onComplete, profile }: EvolutionUpdateCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [imagesSaved, setImagesSaved] = useState(false);
  const [activityChange, setActivityChange] = useState<ActivityData | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const draftKey = `sth:evolution-card-draft:v2:${userId}`;
  const imageDraftKey = `sth:evolution-card-images:v2:${userId}`;
  const canSubmitUpdate = Boolean(weight || activityChange || notes.trim() || imagesSaved);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        setExpanded(Boolean(draft.expanded));
        setWeight(draft.weight || "");
        setNotes(draft.notes || "");
        setImagesSaved(Boolean(draft.imagesSaved));
        setActivityChange(draft.activityChange || null);
        if (draft.weight || draft.notes || draft.imagesSaved || draft.activityChange) {
          toast.info("Rascunho da evolução restaurado.");
        }
      }
    } catch (err) {
      console.warn("[evolution-card-draft] restore failed", err);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady) return;
    const draft = { expanded, weight, notes, imagesSaved, activityChange, updatedAt: new Date().toISOString() };
    if (expanded || canSubmitUpdate) localStorage.setItem(draftKey, JSON.stringify(draft));
    else localStorage.removeItem(draftKey);
  }, [draftKey, draftReady, expanded, weight, notes, imagesSaved, activityChange, canSubmitUpdate]);

  const handleSaveWeight = async () => {
    if (!weight && !activityChange && !notes.trim() && !imagesSaved) {
      toast.error("Informe peso, observações, mudança de rotina ou envie fotos.");
      return;
    }

    setSaving(true);
    try {
      const hasNewWeight = Boolean(weight);
      const currentStoredWeight = profile?.weight ? Number(profile.weight) : null;
      const newWeight = hasNewWeight ? Number(weight) : currentStoredWeight;

      if (weight) {
        const { error } = await supabase.from("weight_logs").insert({
          user_id: userId,
          weight: newWeight,
          notes: notes || "",
        });
        if (error) throw error;
        void notifyStudentSelfUpdate(userId, "weight");
      }

      // Recalculate macros
      let macroUpdate: Record<string, any> = hasNewWeight ? { weight: newWeight } : {};

      if (profile?.birth_date && profile?.height && profile?.gender && typeof newWeight === "number" && Number.isFinite(newWeight)) {
        const age = calculateAge(profile.birth_date);
        const effectiveActivity = {
          activityType: activityChange?.activityType ?? (profile.activity_type || "nenhuma"),
          doesCardio: activityChange?.doesCardio ?? (profile.does_cardio || false),
          physicalActivityLevel: activityChange?.physicalActivityLevel ?? (profile.physical_activity_level || "sedentario"),
          trainingDaysPerWeek: activityChange?.trainingDaysPerWeek ?? profile.training_days_per_week ?? undefined,
          trainingDurationMinutes: activityChange?.trainingDurationMinutes ?? profile.training_duration_minutes ?? undefined,
          trainingIntensity: activityChange?.trainingIntensity ?? profile.training_intensity ?? undefined,
          cardioDaysPerWeek: activityChange?.cardioDaysPerWeek ?? profile.cardio_days_per_week ?? undefined,
          cardioDurationMinutes: activityChange?.cardioDurationMinutes ?? profile.cardio_duration_minutes ?? undefined,
          cardioIntensity: activityChange?.cardioIntensity ?? profile.cardio_intensity ?? undefined,
        };
        const macros = calculateMacros({
          gender: profile.gender as "masculino" | "feminino",
          age,
          weight: newWeight,
          height: Number(profile.height),
          activityType: effectiveActivity.activityType,
          doesCardio: effectiveActivity.doesCardio,
          objective: profile.objective || "manter_peso",
          physicalActivityLevel: effectiveActivity.physicalActivityLevel,
          trainingDaysPerWeek: effectiveActivity.trainingDaysPerWeek || undefined,
          trainingDurationMinutes: effectiveActivity.trainingDurationMinutes || undefined,
          trainingIntensity: effectiveActivity.trainingIntensity || undefined,
          cardioDaysPerWeek: effectiveActivity.cardioDaysPerWeek || undefined,
          cardioDurationMinutes: effectiveActivity.cardioDurationMinutes || undefined,
          cardioIntensity: effectiveActivity.cardioIntensity || undefined,
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

        if (activityChange) {
          macroUpdate = {
            ...macroUpdate,
            activity_type: effectiveActivity.activityType,
            does_cardio: effectiveActivity.doesCardio,
            physical_activity_level: effectiveActivity.physicalActivityLevel,
            training_days_per_week: effectiveActivity.trainingDaysPerWeek ?? null,
            training_duration_minutes: effectiveActivity.trainingDurationMinutes ?? null,
            training_intensity: effectiveActivity.trainingIntensity ?? null,
            cardio_days_per_week: effectiveActivity.cardioDaysPerWeek ?? null,
            cardio_duration_minutes: effectiveActivity.cardioDurationMinutes ?? null,
            cardio_intensity: effectiveActivity.cardioIntensity ?? null,
          };
        }
      }

      await supabase.from("profiles").update(macroUpdate).eq("user_id", userId);

      // Create anamnesis entry
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

      if (activityChange) {
        anamnesisNote += `\n🏋️ Alteração na rotina de atividades:\n`;
        anamnesisNote += `  • NEAT: ${activityChange.physicalActivityLevel}\n`;
        anamnesisNote += `  • Tipo: ${activityChange.activityType}`;
        if (activityChange.activityType !== "nenhuma") {
          anamnesisNote += ` (${activityChange.trainingDaysPerWeek ?? "?"}x/sem, ${activityChange.trainingDurationMinutes ?? "?"}min, ${activityChange.trainingIntensity ?? "?"})`;
        }
        anamnesisNote += `\n  • Cardio: ${activityChange.doesCardio ? "sim" : "não"}`;
        if (activityChange.doesCardio) {
          anamnesisNote += ` (${activityChange.cardioDaysPerWeek ?? "?"}x/sem, ${activityChange.cardioDurationMinutes ?? "?"}min, ${activityChange.cardioIntensity ?? "?"})`;
        }
        anamnesisNote += `\n`;
      }

      if (imagesSaved) {
        anamnesisNote += `\n📸 Novas fotos corporais enviadas.\n`;
      }

      await supabase.from("anamnesis_entries").insert({
        user_id: userId,
        notes: anamnesisNote,
      });

      // Snapshot completo para histórico/comparação
      await createEvolutionSnapshot(userId, "student", anamnesisNote);

      toast.success("Evolução registrada! Macros atualizados.");
      localStorage.removeItem(draftKey);
      setWeight("");
      setNotes("");
      setImagesSaved(false);
      setActivityChange(null);
      setExpanded(false);
      onComplete();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente."));
    }
    setSaving(false);
  };

  return (
    <Card className="border-foreground/15 bg-foreground/[0.03]">
      <CardHeader
        className="cursor-pointer select-none pb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-foreground" />
            Atualização de Evolução
          </CardTitle>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
        <p className="text-sm text-muted-foreground">Registre seu peso e envie novas fotos. Dados anteriores são sempre preservados.</p>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-foreground" />
              <Label className="font-body font-medium">Peso Atual (kg) *</Label>
            </div>
            <Input
              type="number"
              step="0.1"
              placeholder={currentWeight ? `Último: ${currentWeight} kg` : "Ex: 75.5"}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <EvolutionActivityChange profile={profile} value={activityChange} onChange={setActivityChange} />

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

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Camera className="w-4 h-4 text-foreground" />
              <Label className="font-body font-medium">Novas Fotos Corporais</Label>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              As fotos anteriores são preservadas para comparação.
            </p>
            <BodyImageUpload
              userId={userId}
              existingImages={existingImages}
              canDeleteExisting={false}
              required={false}
              draftKey={imageDraftKey}
              onComplete={() => {
                setImagesSaved(true);
                toast.success("Fotos salvas! Toque em 'Registrar Evolução' para enviar suas observações ao seu consultor.");
              }}
            />
          </div>

          <Button
            className={`w-full transition-colors ${canSubmitUpdate && !saving ? "bg-foreground text-background hover:bg-foreground/90 shadow-[0_0_20px_hsl(var(--foreground)/0.2)]" : ""}`}
            onClick={handleSaveWeight}
            disabled={saving || !canSubmitUpdate}
          >
            {saving ? "Salvando..." : "Registrar Evolução e Atualizar Macros"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

export default EvolutionUpdateCard;
