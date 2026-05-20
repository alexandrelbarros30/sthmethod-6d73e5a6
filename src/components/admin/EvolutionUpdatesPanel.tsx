import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, MessageSquare, Camera, Ruler, Scale, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface EvolutionNotificationRow {
  id: string;
  student_user_id: string;
  student_name: string;
  new_weight: number | null;
  previous_weight: number | null;
  notes: string | null;
  has_photos: boolean;
  created_at: string;
  waist_cm: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  calf_cm: number | null;
  student_message: string | null;
}

const measurementFields: Array<[keyof EvolutionNotificationRow, string]> = [
  ["waist_cm", "Cintura"],
  ["hip_cm", "Quadril"],
  ["chest_cm", "Busto/Tórax"],
  ["arm_cm", "Braço"],
  ["thigh_cm", "Coxa"],
  ["calf_cm", "Panturrilha"],
];

const EvolutionUpdatesPanel = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: items } = useQuery({
    queryKey: ["admin-evolution-updates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("evolution_notifications")
        .select(
          "id,student_user_id,student_name,new_weight,previous_weight,notes,has_photos,created_at,waist_cm,hip_cm,chest_cm,arm_cm,thigh_cm,calf_cm,student_message"
        )
        .eq("seen", false)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as EvolutionNotificationRow[];
    },
    refetchInterval: 30000,
  });

  const markSeen = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("evolution_notifications").update({ seen: true }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-evolution-updates"] });
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("Atualização marcada como tratada");
    },
  });

  if (!items || items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2 px-1">
        Nenhuma atualização pendente.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((n) => {
        const diff =
          n.new_weight != null && n.previous_weight != null
            ? Number(n.new_weight) - Number(n.previous_weight)
            : null;
        const diffStr = diff != null ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)}kg` : null;
        const measurements = measurementFields.filter(([k]) => n[k] != null);
        return (
          <div
            key={n.id}
            className="rounded-2xl border border-border/50 bg-card/40 p-3.5 space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{n.student_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {n.has_photos && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <Camera className="w-3 h-3" /> Fotos
                  </Badge>
                )}
                {n.student_message && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <MessageSquare className="w-3 h-3" /> Msg
                  </Badge>
                )}
              </div>
            </div>

            {n.new_weight != null && (
              <div className="flex items-center gap-2 text-[13px]">
                <Scale className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium tabular-nums">
                  {Number(n.new_weight).toFixed(1)} kg
                </span>
                {diffStr && (
                  <span
                    className={`text-[11px] tabular-nums ${
                      diff! > 0 ? "text-amber-500" : diff! < 0 ? "text-emerald-500" : "text-muted-foreground"
                    }`}
                  >
                    {diffStr}
                  </span>
                )}
              </div>
            )}

            {measurements.length > 0 && (
              <div className="rounded-xl bg-muted/30 p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Ruler className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Medidas
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                  {measurements.map(([key, label]) => (
                    <div key={key} className="text-[11px]">
                      <span className="text-muted-foreground">{label}: </span>
                      <span className="font-medium tabular-nums">
                        {Number(n[key]).toFixed(1)}cm
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {n.student_message && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5">
                <p className="text-[11px] font-medium text-primary mb-0.5 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Mensagem do aluno
                </p>
                <p className="text-[12px] whitespace-pre-wrap">{n.student_message}</p>
              </div>
            )}

            {n.notes && (
              <p className="text-[11px] text-muted-foreground italic">"{n.notes}"</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[11px] gap-1 flex-1"
                onClick={() => navigate(`/admin/students?uid=${n.student_user_id}`)}
              >
                <ExternalLink className="w-3 h-3" /> Abrir aluno
              </Button>
              <Button
                size="sm"
                className="h-7 px-2 text-[11px] gap-1"
                onClick={() => markSeen.mutate(n.id)}
              >
                <Check className="w-3 h-3" /> Tratado
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EvolutionUpdatesPanel;