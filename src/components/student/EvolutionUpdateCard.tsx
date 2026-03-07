import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Scale, Camera, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";

interface EvolutionUpdateCardProps {
  userId: string;
  currentWeight?: number | null;
  existingImages: { type: string; image_url: string; id: string }[];
  onComplete: () => void;
}

const EvolutionUpdateCard = ({ userId, currentWeight, existingImages, onComplete }: EvolutionUpdateCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [imagesSaved, setImagesSaved] = useState(false);

  const handleSaveWeight = async () => {
    if (!weight) {
      toast.error("Informe seu peso atual.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("weight_logs").insert({
        user_id: userId,
        weight: Number(weight),
        notes: notes || "",
      });

      if (error) throw error;

      // Also update profile weight
      await supabase.from("profiles").update({ weight: Number(weight) }).eq("user_id", userId);

      toast.success("Peso registrado com sucesso!");
      setWeight("");
      setNotes("");
      setImagesSaved(false);
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
          <CardTitle className="text-base font-display flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Atualização de Evolução
          </CardTitle>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
        <p className="text-sm text-muted-foreground">Registre seu peso atual e envie novas fotos para acompanhamento.</p>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-5">
          {/* Weight input */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
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
              <Label className="font-body font-medium">Novas Fotos Corporais</Label>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              As fotos anteriores são preservadas para comparação. Envie novas fotos atualizadas.
            </p>
            <BodyImageUpload
              userId={userId}
              existingImages={existingImages}
              canDeleteExisting={false}
              required={false}
              onComplete={() => {
                setImagesSaved(true);
                toast.success("Fotos salvas! Agora registre seu peso.");
              }}
            />
          </div>

          {/* Save weight button */}
          <Button
            className="w-full"
            onClick={handleSaveWeight}
            disabled={saving || !weight}
          >
            {saving ? "Salvando..." : "Registrar Evolução"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

export default EvolutionUpdateCard;
