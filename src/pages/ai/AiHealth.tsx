import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HEALTH_PROVIDERS, parseHealthCsv, useAiHealth } from "@/hooks/useAiHealth";
import SamsungWatchSetup from "@/components/ai/SamsungWatchSetup";
import { Activity, Flame, HeartPulse, Loader2, Moon, Upload, Footprints } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AiHealth() {
  const { user, loading, days, sources, connect, disconnect, saveDay, importRows } = useAiHealth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ day: todayISO(), steps: "", active_kcal: "", sleep_minutes: "", resting_hr: "", weight_kg: "" });

  useEffect(() => {
    if (!loading && !user) navigate("/ai/login?next=/ai/app/saude");
  }, [loading, user, navigate]);

  const last7 = useMemo(() => days.slice(0, 7), [days]);
  const avg = (key: "steps" | "active_kcal" | "sleep_minutes" | "resting_hr") => {
    const v = last7.map((d) => d[key]).filter((x): x is number => x != null);
    return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null;
  };

  const chart = [...days]
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-30)
    .map((d) => ({
      date: `${d.day.slice(8, 10)}/${d.day.slice(5, 7)}`,
      passos: d.steps ?? undefined,
      sono: d.sleep_minutes != null ? Number((d.sleep_minutes / 60).toFixed(1)) : undefined,
    }));

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
    setBusy(true);
    try {
      await saveDay({
        day: form.day,
        steps: num(form.steps) as number | null,
        active_kcal: num(form.active_kcal) as number | null,
        sleep_minutes: num(form.sleep_minutes) as number | null,
        resting_hr: num(form.resting_hr) as number | null,
        weight_kg: num(form.weight_kg) as number | null,
        provider: "manual",
      });
      setForm({ day: todayISO(), steps: "", active_kcal: "", sleep_minutes: "", resting_hr: "", weight_kg: "" });
      toast.success("Dia registrado.");
    } catch {
      toast.error("Não foi possível salvar o registro.");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const rows = parseHealthCsv(await file.text());
      if (rows.length === 0) {
        toast.error("Nenhuma linha válida. Use o cabeçalho day,steps,active_kcal,sleep_minutes,resting_hr,weight_kg.");
        return;
      }
      const n = await importRows(rows, "import");
      toast.success(`${n} dias importados.`);
    } catch {
      toast.error("Falha ao importar o arquivo.");
    } finally {
      setBusy(false);
    }
  }

  const stats = [
    { label: "Passos / dia", value: avg("steps")?.toLocaleString("pt-BR") ?? "—", icon: Footprints },
    { label: "Kcal ativas", value: avg("active_kcal")?.toLocaleString("pt-BR") ?? "—", icon: Flame },
    { label: "Sono médio", value: avg("sleep_minutes") ? `${(avg("sleep_minutes")! / 60).toFixed(1)} h` : "—", icon: Moon },
    { label: "FC repouso", value: avg("resting_hr") ? `${avg("resting_hr")} bpm` : "—", icon: HeartPulse },
  ];

  return (
    <AiShell title="Saúde e wearables" subtitle="Passos, sono, calorias e frequência cardíaca alimentando sua inteligência.">
      <div className="grid gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <s.icon className="h-4 w-4" />
              <span className="text-xs">{s.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold leading-none">{s.value}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">média dos últimos 7 registros</p>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Fontes conectadas</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Conecte sua fonte e envie a exportação de dados. Cada dia importado alimenta a leitura preditiva da STHIA.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {HEALTH_PROVIDERS.map((p) => {
            const src = sources.find((s) => s.provider === p.id);
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/40 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    <span className="mr-1.5">{p.icon}</span>
                    {p.label}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {src?.last_sync_at ? `Sincronizado em ${new Date(src.last_sync_at).toLocaleDateString("pt-BR")}` : p.hint}
                  </p>
                </div>
                {src ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Ativa</Badge>
                    <Button variant="ghost" size="sm" onClick={() => disconnect(p.id).catch(() => toast.error("Falha ao desconectar."))}>
                      Remover
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => connect(p.id).catch(() => toast.error("Falha ao conectar."))}>
                    Conectar
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <SamsungWatchSetup
        source={sources.find((s) => s.provider === "samsung_health")}
        onConnect={() => connect("samsung_health")}
        onDisconnect={() => disconnect("samsung_health")}
        onImport={importRows}
      />

      {chart.length > 1 && (
        <Card className="mt-4 p-5">
          <h2 className="text-sm font-semibold">Tendência de atividade</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={44} />
                <Tooltip />
                <Area type="monotone" dataKey="passos" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold">Registro do dia</h2>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="day">Data</Label>
            <Input id="day" type="date" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="steps">Passos</Label>
            <Input id="steps" inputMode="numeric" value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="kcal">Kcal ativas</Label>
            <Input id="kcal" inputMode="numeric" value={form.active_kcal} onChange={(e) => setForm({ ...form, active_kcal: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="sleep">Sono (min)</Label>
            <Input id="sleep" inputMode="numeric" value={form.sleep_minutes} onChange={(e) => setForm({ ...form, sleep_minutes: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="hr">FC repouso</Label>
            <Input id="hr" inputMode="numeric" value={form.resting_hr} onChange={(e) => setForm({ ...form, resting_hr: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="w">Peso (kg)</Label>
            <Input id="w" inputMode="decimal" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={busy} className="w-full sm:w-auto">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
              Salvar dia
            </Button>
          </div>
        </form>
      </Card>

      {days.length > 0 && (
        <Card className="mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  {["Data", "Passos", "Kcal", "Sono", "FC", "Peso"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.slice(0, 14).map((d, i) => (
                  <tr key={d.id} className={i % 2 ? "bg-muted/20" : ""}>
                    <td className="px-4 py-2.5">{d.day.split("-").reverse().join("/")}</td>
                    <td className="px-4 py-2.5">{d.steps?.toLocaleString("pt-BR") ?? "—"}</td>
                    <td className="px-4 py-2.5">{d.active_kcal ?? "—"}</td>
                    <td className="px-4 py-2.5">{d.sleep_minutes != null ? `${(d.sleep_minutes / 60).toFixed(1)} h` : "—"}</td>
                    <td className="px-4 py-2.5">{d.resting_hr ?? "—"}</td>
                    <td className="px-4 py-2.5">{d.weight_kg != null ? `${d.weight_kg} kg` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AiShell>
  );
}
