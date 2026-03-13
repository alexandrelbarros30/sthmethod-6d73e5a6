import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Scale, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateAge, calculateMacros } from "@/lib/macro-calculator";

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

  const handleSave = async () => {
    if (!weight) {
      toast.error("Informe o peso atual do aluno.");
      return;
    }

    setSaving(true);
    try {
      const newWeight = Number(weight);

      const { error } = await supabase.from("weight_logs").insert({
        user_id: userId,
        weight: newWeight,
        notes: notes || "",
      });
      if (error) throw error;

      let macroUpdate: Record<string, any> = { weight: newWeight };

      if (profile?.birth_date && profile?.height && profile?.gender) {
        const age = calculateAge(profile.birth_date);
        const macros = calculateMacros({
          gender: profile.gender as "masculino" | "feminino",
          age,
          weight: newWeight,
          height: Number(profile.height),
          activityType: profile.activity_type || "nenhuma",
          doesCardio: profile.does_cardio || false,
          objective: profile.objective || "manter_peso",
          physicalActivityLevel: profile.physical_activity_level || "sedentario",
          trainingDaysPerWeek: profile.training_days_per_week || undefined,
          trainingDurationMinutes: profile.training_duration_minutes || undefined,
          trainingIntensity: profile.training_intensity || undefined,
          cardioDaysPerWeek: profile.cardio_days_per_week || undefined,
          cardioDurationMinutes: profile.cardio_duration_minutes || undefined,
          cardioIntensity: profile.cardio_intensity || undefined,
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

      await supabase.from("profiles").update(macroUpdate).eq("user_id", userId);

      const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const prevWeight = currentWeight ? Number(currentWeight) : null;
      const weightDiff = prevWeight ? (newWeight - prevWeight).toFixed(1) : null;
      const weightDirection = weightDiff && Number(weightDiff) > 0 ? "+" : "";

      let anamnesisNote = `📊 ATUALIZAÇÃO DE EVOLUÇÃO (Admin) — ${timestamp}\n\n`;
      anamnesisNote += `👤 Aluno: ${studentName}\n`;
      anamnesisNote += `⚖️ Peso: ${newWeight.toFixed(1)} kg`;
      if (prevWeight) {
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
        anamnesisNote += `\n📝 Observações: ${notes}\n`;
      }

      await supabase.from("anamnesis_entries").insert({
        user_id: userId,
        notes: anamnesisNote,
      });

      toast.success("Evolução registrada e macros atualizados!");
      setWeight("");
      setNotes("");
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
            disabled={saving || !weight}
          >
            {saving ? "Salvando..." : "Registrar Evolução e Atualizar Macros"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

export default AdminEvolutionUpdate;
