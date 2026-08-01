import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAiProgress } from "@/hooks/useAiProgress";
import AiInsightCard from "@/components/ai/AiInsightCard";
import { Flame, Loader2, Check, Salad, Dumbbell, Droplets, Ruler, TrendingDown, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function AiProgress() {
  const { user, loading, streak, today, last7, checkins, measurements, saveCheckin, saveMeasurement } = useAiProgress();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ weight_kg: "", waist_cm: "", arm_cm: "", thigh_cm: "", notes: "" });

  useEffect(() => {
    if (!loading && !user) navigate("/login?next=/ai/app/progresso");
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function toggle(field: "diet_done" | "workout_done" | "water_done") {
    setSaving(true);
    try {
      await saveCheckin({
        diet_done: today?.diet_done ?? false,
        workout_done: today?.workout_done ?? false,
        water_done: today?.water_done ?? false,
        [field]: !(today?.[field] ?? false),
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitMeasurement(e: React.FormEvent) {
    e.preventDefault();
    const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
    if (!form.weight_kg && !form.waist_cm && !form.arm_cm && !form.thigh_cm) {
      toast.error("Preencha ao menos uma medida.");
      return;
    }
    setSaving(true);
    try {
      await saveMeasurement({
        weight_kg: num(form.weight_kg),
        waist_cm: num(form.waist_cm),
        arm_cm: num(form.arm_cm),
        thigh_cm: num(form.thigh_cm),
        notes: form.notes.trim() || null,
      });
      setForm({ weight_kg: "", waist_cm: "", arm_cm: "", thigh_cm: "", notes: "" });
      toast.success("Medidas registradas.");
    } catch {
      toast.error("Não foi possível salvar suas medidas.");
    } finally {
      setSaving(false);
    }
  }

  const chart = [...measurements]
    .filter((m) => m.weight_kg != null)
    .sort((a, b) => a.measured_on.localeCompare(b.measured_on))
    .map((m) => ({
      date: m.measured_on.slice(8, 10) + "/" + m.measured_on.slice(5, 7),
      peso: Number(m.weight_kg),
      cintura: m.waist_cm != null ? Number(m.waist_cm) : undefined,
    }));

  const first = chart[0]?.peso;
  const last = chart[chart.length - 1]?.peso;
  const delta = first != null && last != null ? last - first : null;
  const adherence7 = last7.filter((d) => d.done).length;

  const items = [
    { key: "diet_done" as const, label: "Alimentação", icon: Salad },
    { key: "workout_done" as const, label: "Treino", icon: Dumbbell },
    { key: "water_done" as const, label: "Hidratação", icon: Droplets },
  ];

  return (
    <AiShell title="Sua evolução" subtitle="Constância diária, medidas e tendência de resultado.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-semibold leading-none">{streak}</p>
            <p className="mt-1 text-xs text-muted-foreground">dias seguidos de check-in</p>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Adesão nos últimos 7 dias</p>
          <p className="mt-1 text-2xl font-semibold leading-none">{adherence7}/7</p>
          <div className="mt-3 flex gap-1.5">
            {last7.map((d, i) => (
              <span
                key={d.iso}
                title={d.iso}
                className={`grid h-7 flex-1 place-items-center rounded-lg text-[10px] font-medium ${
                  d.done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {WEEKDAYS[new Date(`${d.iso}T00:00:00`).getDay()]}
                {i === -1 ? "" : ""}
              </span>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Variação de peso</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-semibold leading-none">
              {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`}
            </p>
            {delta != null && delta !== 0 &&
              (delta < 0 ? <TrendingDown className="h-4 w-4 text-primary" /> : <TrendingUp className="h-4 w-4 text-amber-500" />)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {chart.length > 1 ? `${chart.length} registros no período` : "Registre suas medidas para ver a tendência"}
          </p>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Check-in de hoje</h2>
            <p className="mt-1 text-sm text-muted-foreground">Marque o que você cumpriu — leva 5 segundos.</p>
          </div>
          {today && <Badge variant="secondary">Registrado</Badge>}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {items.map(({ key, label, icon: Icon }) => {
            const done = today?.[key] ?? false;
            return (
              <Button
                key={key}
                type="button"
                variant={done ? "default" : "outline"}
                disabled={saving}
                onClick={() => toggle(key)}
                className="h-14 justify-start gap-3"
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{label}</span>
                {done && <Check className="h-4 w-4" />}
              </Button>
            );
          })}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold">Tendência</h2>
          {chart.length > 1 ? (
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="peso" strokeWidth={2} dot={false} className="stroke-primary" stroke="currentColor" />
                  <Line type="monotone" dataKey="cintura" strokeWidth={2} dot={false} strokeDasharray="4 4" stroke="currentColor" className="stroke-muted-foreground" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Você precisa de pelo menos dois registros de peso para visualizar o gráfico.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Registrar medidas</h2>
          </div>
          <form onSubmit={submitMeasurement} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="weight_kg">Peso (kg)</Label>
              <Input id="weight_kg" inputMode="decimal" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="waist_cm">Cintura (cm)</Label>
              <Input id="waist_cm" inputMode="decimal" value={form.waist_cm} onChange={(e) => setForm({ ...form, waist_cm: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="arm_cm">Braço (cm)</Label>
              <Input id="arm_cm" inputMode="decimal" value={form.arm_cm} onChange={(e) => setForm({ ...form, arm_cm: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="thigh_cm">Coxa (cm)</Label>
              <Input id="thigh_cm" inputMode="decimal" value={form.thigh_cm} onChange={(e) => setForm({ ...form, thigh_cm: e.target.value })} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button type="submit" disabled={saving} className="sm:col-span-2">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar medidas
            </Button>
          </form>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h2 className="text-base font-semibold">Histórico</h2>
        {measurements.length === 0 && checkins.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum registro ainda.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/40 text-sm">
            {measurements.slice(0, 8).map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="text-muted-foreground">{m.measured_on.split("-").reverse().join("/")}</span>
                <span className="flex flex-wrap gap-2 text-xs">
                  {m.weight_kg != null && <Badge variant="secondary">{Number(m.weight_kg)} kg</Badge>}
                  {m.waist_cm != null && <Badge variant="outline">cintura {Number(m.waist_cm)} cm</Badge>}
                  {m.arm_cm != null && <Badge variant="outline">braço {Number(m.arm_cm)} cm</Badge>}
                  {m.thigh_cm != null && <Badge variant="outline">coxa {Number(m.thigh_cm)} cm</Badge>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AiShell>
  );
}
