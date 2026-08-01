import { useCallback, useEffect, useMemo, useState } from "react";
import AiShell from "@/components/ai/AiShell";
import AiFoodAnalyzer from "@/components/ai/AiFoodAnalyzer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MEAL_TYPES } from "@/lib/food-diary-storage";
import { Loader2, Trash2 } from "lucide-react";

interface Entry {
  id: string;
  meal_type: string;
  meal_label: string | null;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AiFood() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("food_diary_entries")
      .select("id, meal_type, meal_label, item_name, quantity, unit, energy_kcal, protein_g, carbs_g, fat_g")
      .eq("user_id", user.id)
      .eq("log_date", date)
      .order("created_at", { ascending: true });
    setEntries(((data ?? []) as unknown) as Entry[]);
    setLoading(false);
  }, [user?.id, date]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(
    () =>
      entries.reduce(
        (acc, e) => ({
          kcal: acc.kcal + Number(e.energy_kcal || 0),
          p: acc.p + Number(e.protein_g || 0),
          c: acc.c + Number(e.carbs_g || 0),
          f: acc.f + Number(e.fat_g || 0),
        }),
        { kcal: 0, p: 0, c: 0, f: 0 },
      ),
    [entries],
  );

  const grouped = useMemo(
    () => MEAL_TYPES.map((m) => ({ ...m, items: entries.filter((e) => e.meal_type === m.key) })).filter((g) => g.items.length),
    [entries],
  );

  async function remove(id: string) {
    const { error } = await supabase.from("food_diary_entries").delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <AiShell title="Diário Alimentar" subtitle="Registre pela câmera, pelo rótulo, por texto ou por voz.">
      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Total do dia</p>
            <p className="text-3xl font-semibold tracking-tight">{Math.round(totals.kcal)} <span className="text-base font-normal text-muted-foreground">kcal</span></p>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">Proteína {Math.round(totals.p)}g</Badge>
          <Badge variant="outline">Carboidrato {Math.round(totals.c)}g</Badge>
          <Badge variant="outline">Gordura {Math.round(totals.f)}g</Badge>
          <Badge variant="secondary">{entries.length} item(ns)</Badge>
        </div>
      </Card>

      <AiFoodAnalyzer onSaved={load} />

      <div className="mt-5 space-y-4">
        {loading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : grouped.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhum registro nesta data. Comece fotografando sua próxima refeição.
          </Card>
        ) : (
          grouped.map((g) => (
            <Card key={g.key} className="p-5">
              <p className="text-sm font-semibold">{g.icon} {g.label}</p>
              <ul className="mt-3 space-y-2">
                {g.items.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate">{e.item_name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {Math.round(Number(e.quantity || 0))}{e.unit || "g"} · {Math.round(Number(e.energy_kcal || 0))} kcal
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => remove(e.id)} aria-label="Excluir item">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          ))
        )}
      </div>
    </AiShell>
  );
}
