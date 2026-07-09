import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Scale, ChevronDown, ChevronUp, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateAge, calculateMacros } from "@/lib/macro-calculator";
import EvolutionActivityChange, { ActivityData } from "@/components/student/EvolutionActivityChange";
import { createEvolutionSnapshot } from "@/lib/evolution-snapshot";

interface AdminEvolutionUpdateProps {
  userId: string;
  studentName: string;
  currentWeight?: number | null;
  profile?: any;
  onComplete: () => void;
}

const AdminEvolutionUpdate = ({ userId, studentName, currentWeight, profile, onComplete }: AdminEvolutionUpdateProps) => {
  const [expanded, setExpanded] = useState(false);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [activityChange, setActivityChange] = useState<ActivityData | null>(null);
  const [recordDate, setRecordDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const handleSave = async () => {
    if (!weight && !activityChange && !notes.trim()) {
      toast.error("Informe peso, alteração de rotina ou observações.");
      return;
    }

    setSaving(true);
    try {
      const hasNewWeight = Boolean(weight);
      const currentStoredWeight = profile?.weight ? Number(profile.weight) : (currentWeight ? Number(currentWeight) : null);
      const newWeight = hasNewWeight ? Number(weight) : currentStoredWeight;

      // Combina a data escolhida com o horário atual, preservando fuso local
      let recordTimestamp = new Date().toISOString();
      if (recordDate) {
        const now = new Date();
        const [y, m, d] = recordDate.split("-").map(Number);
        const dt = new Date(y, (m || 1) - 1, d || 1, now.getHours(), now.getMinutes(), now.getSeconds());
        recordTimestamp = dt.toISOString();
      }

      if (hasNewWeight) {
        const { error } = await supabase.from("weight_logs").insert({
          user_id: userId,
          weight: newWeight,
          notes: notes || "",
          logged_at: recordTimestamp,
          created_at: recordTimestamp,
        });
        if (error) throw error;
      }

      let macroUpdate: Record<string, any> = hasNewWeight ? { weight: newWeight } : {};

      if (profile?.birth_date && profile?.height && profile?.gender && typeof newWeight === "number" && Number.isFinite(newWeight)) {
        const age = calculateAge(profile.birth_date);
        const eff = {
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
          activityType: eff.activityType,
          doesCardio: eff.doesCardio,
          objective: profile.objective || "manter_peso",
          physicalActivityLevel: eff.physicalActivityLevel,
          trainingDaysPerWeek: eff.trainingDaysPerWeek || undefined,
          trainingDurationMinutes: eff.trainingDurationMinutes || undefined,
          trainingIntensity: eff.trainingIntensity || undefined,
          cardioDaysPerWeek: eff.cardioDaysPerWeek || undefined,
          cardioDurationMinutes: eff.cardioDurationMinutes || undefined,
          cardioIntensity: eff.cardioIntensity || undefined,
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
            activity_type: eff.activityType,
            does_cardio: eff.doesCardio,
            physical_activity_level: eff.physicalActivityLevel,
            training_days_per_week: eff.trainingDaysPerWeek ?? null,
            training_duration_minutes: eff.trainingDurationMinutes ?? null,
            training_intensity: eff.trainingIntensity ?? null,
            cardio_days_per_week: eff.cardioDaysPerWeek ?? null,
            cardio_duration_minutes: eff.cardioDurationMinutes ?? null,
            cardio_intensity: eff.cardioIntensity ?? null,
          };
        }
      }

      if (Object.keys(macroUpdate).length > 0) {
        await supabase.from("profiles").update(macroUpdate).eq("user_id", userId);
      }

      const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const prevWeight = currentWeight ? Number(currentWeight) : null;
      const weightDiff = hasNewWeight && prevWeight && typeof newWeight === "number" ? (newWeight - prevWeight).toFixed(1) : null;
      const weightDirection = weightDiff && Number(weightDiff) > 0 ? "+" : "";

      let anamnesisNote = `📊 ATUALIZAÇÃO DE EVOLUÇÃO (Admin) — ${timestamp}\n\n`;
      anamnesisNote += `👤 Aluno: ${studentName}\n`;
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

      if (notes) {
        anamnesisNote += `\n📝 Observações: ${notes}\n`;
      }

      await supabase.from("anamnesis_entries").insert({
        user_id: userId,
        notes: anamnesisNote,
        created_at: recordTimestamp,
      });

      await createEvolutionSnapshot(userId, "admin", anamnesisNote, recordTimestamp);

      toast.success("Evolução registrada e macros atualizados!");
      setWeight("");
      setNotes("");
      setActivityChange(null);
      setRecordDate(new Date().toISOString().slice(0, 10));
      setExpanded(false);
      onComplete();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente."));
    }
    setSaving(false);
  };

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader
        className="cursor-pointer select-none pb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Registrar Evolução do Aluno
          </CardTitle>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground">Registre peso e recalcule macros automaticamente.</p>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <Label className="font-body font-medium text-sm">Peso Atual (kg) *</Label>
            </div>
            <Input
              type="number"
              step="0.1"
              placeholder={currentWeight ? `Último: ${currentWeight} kg` : "Ex: 75.5"}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <EvolutionActivityChange profile={profile} onChange={setActivityChange} />

          <div className="space-y-2">
            <Label className="font-body text-sm">Observações (opcional)</Label>
            <Textarea
              placeholder="Observações sobre a evolução do aluno..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            className="w-full"
            size="sm"
            onClick={handleSave}
            disabled={saving || (!weight && !activityChange && !notes.trim())}
          >
            {saving ? "Salvando..." : "Registrar Evolução e Atualizar Macros"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

export default AdminEvolutionUpdate;
