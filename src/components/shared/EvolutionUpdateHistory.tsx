import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import type { EvolutionSnapshot } from "@/lib/evolution-snapshot";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  userId: string;
}

const sourceLabel: Record<string, string> = {
  student: "Aluno",
  admin: "Admin",
  consultor: "Consultor",
};

const fmt = (n: number | null | undefined, suffix = "", digits = 1) =>
  n === null || n === undefined ? "—" : `${Number(n).toFixed(digits)}${suffix}`;

const EvolutionUpdateHistory = ({ userId }: Props) => {
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["evolution-snapshots-history", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evolution_snapshots")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EvolutionSnapshot[];
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">Carregando histórico…</p>
        </CardContent>
      </Card>
    );
  }

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <History className="w-4 h-4" /> Histórico de Atualizações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Nenhuma atualização arquivada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-display flex items-center gap-2">
          <History className="w-4 h-4" /> Histórico de Atualizações
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Cada atualização (peso, macros, NEAT, fotos) fica arquivada permanentemente para comparação.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {snapshots.map((s, idx) => {
          const prev = snapshots[idx + 1]; // mais antigo
          const weightDiff =
            prev?.weight != null && s.weight != null ? Number(s.weight) - Number(prev.weight) : null;
          return (
            <div
              key={s.id}
              className="rounded-md border border-border/50 bg-muted/10 p-3 space-y-2"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold">
                    {format(new Date(s.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <Badge variant="secondary" className="text-[10px]">
                    {sourceLabel[s.source] ?? s.source}
                  </Badge>
                  {idx === 0 && (
                    <Badge variant="default" className="text-[10px]">Mais recente</Badge>
                  )}
                </div>
                {weightDiff !== null && Math.abs(weightDiff) >= 0.05 && (
                  <span
                    className={`text-[10px] font-medium ${
                      weightDiff < 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {weightDiff > 0 ? "+" : ""}
                    {weightDiff.toFixed(1)} kg vs anterior
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Peso</p>
                  <p className="font-medium">{fmt(s.weight, " kg")}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Calorias</p>
                  <p className="font-medium">{fmt(s.daily_calories, " kcal", 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Proteína</p>
                  <p className="font-medium">{fmt(s.protein_g, " g", 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Carbo / Gord.</p>
                  <p className="font-medium">
                    {fmt(s.carbs_g, "g", 0)} / {fmt(s.fat_g, "g", 0)}
                  </p>
                </div>
              </div>

              {(s.physical_activity_level || s.activity_type || s.does_cardio !== null) && (
                <div className="text-[11px] text-muted-foreground border-t border-border/30 pt-2">
                  <span className="mr-3">
                    <span className="opacity-70">NEAT:</span> {s.physical_activity_level ?? "—"}
                  </span>
                  <span className="mr-3">
                    <span className="opacity-70">Treino:</span>{" "}
                    {s.activity_type ?? "—"}
                    {s.training_days_per_week ? ` (${s.training_days_per_week}x/sem)` : ""}
                  </span>
                  <span>
                    <span className="opacity-70">Cardio:</span>{" "}
                    {s.does_cardio
                      ? `sim${s.cardio_days_per_week ? ` (${s.cardio_days_per_week}x/sem)` : ""}`
                      : "não"}
                  </span>
                </div>
              )}

              {(s.body_fat_pct !== null || s.lean_mass_kg !== null) && (
                <div className="text-[11px] text-muted-foreground border-t border-border/30 pt-2">
                  <span className="mr-3">
                    <span className="opacity-70">% Gord.:</span> {fmt(s.body_fat_pct, "%")}
                  </span>
                  <span className="mr-3">
                    <span className="opacity-70">Massa magra:</span> {fmt(s.lean_mass_kg, " kg")}
                  </span>
                  <span>
                    <span className="opacity-70">Massa gorda:</span> {fmt(s.fat_mass_kg, " kg")}
                  </span>
                </div>
              )}

              {s.notes && (
                <details className="text-[11px] text-muted-foreground border-t border-border/30 pt-2">
                  <summary className="cursor-pointer select-none">Ver observações</summary>
                  <pre className="whitespace-pre-wrap font-sans mt-1 text-[11px]">{s.notes}</pre>
                </details>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default EvolutionUpdateHistory;