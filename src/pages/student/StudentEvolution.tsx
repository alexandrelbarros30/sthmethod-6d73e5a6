import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Scale, Camera, CheckCircle2, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";

const StudentEvolution = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [imagesSaved, setImagesSaved] = useState(false);

  const { data: fullProfile } = useQuery({
    queryKey: ["student-profile-evo", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("weight").eq("user_id", user!.id).single();
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
  const labels: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };

  const handleSaveWeight = async () => {
    if (!weight) {
      toast.error("Informe seu peso atual.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("weight_logs").insert({
        user_id: user!.id,
        weight: Number(weight),
        notes: notes || "",
      });
      if (error) throw error;

      await supabase.from("profiles").update({ weight: Number(weight) }).eq("user_id", user!.id);

      toast.success("Evolução registrada com sucesso!");
      setWeight("");
      setNotes("");
      setImagesSaved(false);
      qc.invalidateQueries({ queryKey: ["student-weight-logs"] });
      qc.invalidateQueries({ queryKey: ["student-profile-evo"] });
      qc.invalidateQueries({ queryKey: ["student-full-profile"] });
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente."));
    }
    setSaving(false);
  };

  // Group images by date
  const imagesByDate = allImages?.reduce((acc: Record<string, any[]>, img: any) => {
    const date = new Date(img.uploaded_at).toLocaleDateString("pt-BR");
    if (!acc[date]) acc[date] = [];
    acc[date].push(img);
    return acc;
  }, {}) || {};

  return (
    <DashboardLayout role="student" title="Atualização" subtitle="Registre seu progresso para acompanhamento profissional.">
      {/* ===== NOVA ATUALIZAÇÃO ===== */}
      <Card className="mb-6 border-primary/20 bg-primary/[0.03]">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Nova Atualização de Evolução
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Envie novas fotos corporais e registre seu peso atual. As fotos e pesos anteriores são preservados para comparação.
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

          {/* Save weight */}
          <Button
            className="w-full"
            onClick={handleSaveWeight}
            disabled={saving || !weight}
          >
            {saving ? "Salvando..." : "Registrar Peso"}
          </Button>
        </CardContent>
      </Card>

      {/* ===== HISTÓRICO DE PESO ===== */}
      {weightLogs && weightLogs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Scale className="w-4 h-4" /> Histórico de Peso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weightLogs.map((log: any, i: number) => (
                <div key={log.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${i === 0 ? "text-primary" : "text-foreground"}`}>
                      {Number(log.weight).toFixed(1)} kg
                    </span>
                    {i === 0 && <Badge variant="secondary" className="text-[10px]">Atual</Badge>}
                    {i > 0 && weightLogs[i - 1] && (
                      <span className={`text-xs ${Number(log.weight) > Number(weightLogs[i - 1].weight) ? "text-destructive" : "text-success"}`}>
                        {Number(log.weight) > Number(weightLogs[i - 1].weight) ? "↑" : "↓"}{" "}
                        {Math.abs(Number(log.weight) - Number(weightLogs[i - 1].weight)).toFixed(1)} kg
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{new Date(log.logged_at).toLocaleDateString("pt-BR")}</p>
                    {log.notes && <p className="text-xs text-muted-foreground/70 max-w-[200px] truncate">{log.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== HISTÓRICO DE IMAGENS ===== */}
      {Object.keys(imagesByDate).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <History className="w-4 h-4" /> Histórico de Fotos Corporais
            </CardTitle>
            <p className="text-xs text-muted-foreground">Todas as suas fotos são preservadas para acompanhamento da evolução.</p>
          </CardHeader>
          <CardContent>
            {Object.entries(imagesByDate).map(([date, imgs]) => (
              <div key={date} className="mb-5 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-muted-foreground">{date}</p>
                  {(imgs as any[])[0]?.is_current && <Badge variant="secondary" className="text-[10px]">Atual</Badge>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["front", "back", "profile"].map((type) => {
                    const img = (imgs as any[]).find((i: any) => i.type === type);
                    return (
                      <div key={type} className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-0.5">{labels[type]}</p>
                        {img ? (
                          <img src={img.image_url} alt={labels[type]} className="w-full aspect-[3/4] object-cover rounded border" />
                        ) : (
                          <div className="w-full aspect-[3/4] bg-muted rounded flex items-center justify-center text-muted-foreground text-[10px]">—</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default StudentEvolution;
