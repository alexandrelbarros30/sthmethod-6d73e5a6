import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Ruler, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const FIELDS: { key: string; label: string; hint: string }[] = [
  { key: "waist_cm", label: "Cintura", hint: "Ponto mais estreito, 1-2 dedos acima do umbigo" },
  { key: "hip_cm", label: "Quadril", hint: "Maior circunferência das nádegas" },
  { key: "chest_cm", label: "Busto / Tórax", hint: "Passando a fita sobre os mamilos" },
  { key: "arm_cm", label: "Braço", hint: "Maior circunferência (relaxado ou contraído)" },
  { key: "thigh_cm", label: "Coxa", hint: "Região superior, logo abaixo do glúteo" },
  { key: "calf_cm", label: "Panturrilha", hint: "Maior circunferência abaixo do joelho" },
];

const CircumferenceTracker = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: logs } = useQuery({
    queryKey: ["circumference-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bioimpedance_logs")
        .select("id, logged_at, waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm, calf_cm")
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: false })
        .limit(20);
      return (data || []) as any[];
    },
    enabled: !!user?.id,
  });

  const latest = useMemo(
    () => logs?.find((l) => FIELDS.some((f) => l[f.key] != null)) || null,
    [logs]
  );
  const previous = useMemo(
    () => logs?.find((l) => l !== latest && FIELDS.some((f) => l[f.key] != null)) || null,
    [logs, latest]
  );

  const handleSave = async () => {
    const payload: Record<string, number | null> = {};
    let hasAny = false;
    for (const f of FIELDS) {
      const v = values[f.key];
      if (v && !isNaN(Number(v))) {
        payload[f.key] = Number(v);
        hasAny = true;
      }
    }
    if (!hasAny) {
      toast.error("Informe ao menos uma medida.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("bioimpedance_logs").insert({
        user_id: user!.id,
        notes: "Medidas de circunferência registradas pelo aluno",
        ...payload,
      });
      if (error) throw error;
      toast.success("Medidas salvas com sucesso!");
      setValues({});
      qc.invalidateQueries({ queryKey: ["circumference-logs"] });
      qc.invalidateQueries({ queryKey: ["bioimpedance-logs"] });
    } catch (e: any) {
      toast.error("Erro ao salvar: " + (e.message || ""));
    }
    setSaving(false);
  };

  const delta = (k: string) => {
    if (!latest || !previous || latest[k] == null || previous[k] == null) return null;
    return Number((Number(latest[k]) - Number(previous[k])).toFixed(1));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Ruler className="w-4 h-4 text-foreground" />
          Principais Circunferências (cm)
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Registro opcional. Use uma fita métrica e siga as referências abaixo.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {latest && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FIELDS.map((f) => {
              const v = latest[f.key];
              if (v == null) return null;
              const d = delta(f.key);
              return (
                <div key={f.key} className="bg-muted/40 rounded-lg p-2 text-center border border-border/30">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-bold text-foreground">{Number(v).toFixed(1)} cm</p>
                  {d != null && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${d < 0 ? "text-emerald-500" : d > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                      {d > 0 ? <TrendingUp className="w-3 h-3" /> : d < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {d > 0 ? "+" : ""}{d}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-3 pt-2 border-t border-border/40">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Nova medição
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs font-medium">{f.label} (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  placeholder={latest?.[f.key] ? `Última: ${Number(latest[f.key]).toFixed(1)}` : "Ex: 78.5"}
                  value={values[f.key] || ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground/80 leading-tight">{f.hint}</p>
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Salvar medidas"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CircumferenceTracker;