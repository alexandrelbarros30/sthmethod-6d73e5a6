import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, AlertTriangle, Users, History, Loader2, ArrowRight, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type LogRow = {
  id: string;
  student_id: string | null;
  mode: string | null;
  quality_score: number | null;
  classification: string | null;
  alerts: any;
  foods: any;
  needs_review: boolean | null;
  needs_second_evidence: boolean | null;
  status: string | null;
  created_at: string;
};

const NOVA_LABELS: Record<number, string> = {
  1: "1 · In natura",
  2: "2 · Ingrediente culinário",
  3: "3 · Processado",
  4: "4 · Ultraprocessado",
  0: "Desconhecido",
};

const NOVA_COLORS: Record<number, string> = {
  1: "hsl(142 76% 45%)",
  2: "hsl(48 96% 55%)",
  3: "hsl(28 92% 58%)",
  4: "hsl(0 84% 60%)",
  0: "hsl(215 15% 55%)",
};

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminFoodAIDashboard() {
  const [days, setDays] = useState<number>(30);

  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [days]);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["food-ai-dashboard", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_ai_logs")
        .select(
          "id,student_id,mode,quality_score,classification,alerts,foods,needs_review,needs_second_evidence,status,created_at",
        )
        .gte("created_at", from)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
  });

  const studentIds = useMemo(() => {
    const s = new Set<string>();
    (logs ?? []).forEach((l) => l.student_id && s.add(l.student_id));
    return Array.from(s);
  }, [logs]);

  const { data: profiles } = useQuery({
    queryKey: ["food-ai-dashboard-profiles", studentIds.join(",")],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", studentIds);
      if (error) throw error;
      const map = new Map<string, { full_name: string | null; email: string | null }>();
      (data ?? []).forEach((p: any) => map.set(p.id, { full_name: p.full_name, email: p.email }));
      return map;
    },
  });

  const metrics = useMemo(() => {
    const rows = logs ?? [];
    const total = rows.length;
    const success = rows.filter((r) => (r.status ?? "success") === "success");
    const errors = rows.filter((r) => r.status && r.status !== "success").length;
    const needsReview = rows.filter((r) => r.needs_review || r.needs_second_evidence).length;

    const scores = success
      .map((r) => (typeof r.quality_score === "number" ? r.quality_score * 10 : null))
      .filter((v): v is number => v !== null && !Number.isNaN(v));
    const avgSthia = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // NOVA distribution across all food items
    const nova: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    let ultraCount = 0;
    let itemsTotal = 0;
    success.forEach((r) => {
      const foods = Array.isArray(r.foods) ? r.foods : [];
      foods.forEach((f: any) => {
        const g = Number.isFinite(f?.nova_group) ? Math.max(0, Math.min(4, Math.round(f.nova_group))) : 0;
        nova[g] = (nova[g] ?? 0) + 1;
        itemsTotal += 1;
        if (g === 4) ultraCount += 1;
      });
    });
    const ultraPct = itemsTotal ? Math.round((ultraCount / itemsTotal) * 100) : 0;

    // Alerts
    const alertCounts = new Map<string, number>();
    success.forEach((r) => {
      const arr = Array.isArray(r.alerts) ? r.alerts : [];
      arr.forEach((a: any) => {
        const k = String(a).trim();
        if (!k) return;
        alertCounts.set(k, (alertCounts.get(k) ?? 0) + 1);
      });
    });
    const topAlerts = Array.from(alertCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => ({ name: k.replace(/_/g, " "), value: v }));

    // Daily series
    const bucket = new Map<string, { day: string; count: number; sum: number; n: number }>();
    success.forEach((r) => {
      const day = r.created_at.slice(0, 10);
      const b = bucket.get(day) ?? { day, count: 0, sum: 0, n: 0 };
      b.count += 1;
      if (typeof r.quality_score === "number") {
        b.sum += r.quality_score * 10;
        b.n += 1;
      }
      bucket.set(day, b);
    });
    // Fill missing days
    const daily: { day: string; count: number; score: number }[] = [];
    const start = new Date(from);
    const end = new Date();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = fmtDate(d);
      const b = bucket.get(key);
      daily.push({
        day: key.slice(5),
        count: b?.count ?? 0,
        score: b && b.n ? Math.round(b.sum / b.n) : 0,
      });
    }

    // Mode distribution
    const modeCounts: Record<string, number> = {};
    success.forEach((r) => {
      const m = r.mode || "unknown";
      modeCounts[m] = (modeCounts[m] ?? 0) + 1;
    });

    // Per-student ranking (top 10 by volume)
    const perStudent = new Map<
      string,
      { student_id: string; count: number; sum: number; n: number; ultra: number; items: number }
    >();
    success.forEach((r) => {
      if (!r.student_id) return;
      const s = perStudent.get(r.student_id) ?? {
        student_id: r.student_id,
        count: 0,
        sum: 0,
        n: 0,
        ultra: 0,
        items: 0,
      };
      s.count += 1;
      if (typeof r.quality_score === "number") {
        s.sum += r.quality_score * 10;
        s.n += 1;
      }
      const foods = Array.isArray(r.foods) ? r.foods : [];
      foods.forEach((f: any) => {
        s.items += 1;
        if (Number(f?.nova_group) === 4) s.ultra += 1;
      });
      perStudent.set(r.student_id, s);
    });
    const students = Array.from(perStudent.values())
      .map((s) => ({
        ...s,
        avg: s.n ? Math.round(s.sum / s.n) : 0,
        ultraPct: s.items ? Math.round((s.ultra / s.items) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    return {
      total,
      errors,
      needsReview,
      avgSthia: Math.round(avgSthia),
      ultraPct,
      itemsTotal,
      nova,
      topAlerts,
      daily,
      modeCounts,
      students,
    };
  }, [logs, from]);

  const novaData = Object.entries(metrics.nova)
    .map(([k, v]) => ({ key: Number(k), name: NOVA_LABELS[Number(k)], value: v as number }))
    .filter((d) => d.value > 0);

  const modeData = Object.entries(metrics.modeCounts).map(([k, v]) => ({ name: k, value: v as number }));

  const scoreLabel = (n: number) =>
    n >= 85 ? "Excelente" : n >= 70 ? "Boa" : n >= 50 ? "Moderada" : "A melhorar";
  const scoreClass = (n: number) =>
    n >= 85
      ? "text-emerald-500"
      : n >= 70
      ? "text-lime-500"
      : n >= 50
      ? "text-amber-500"
      : "text-rose-500";

  return (
    <DashboardLayout
      role="admin"
      title="STHIA Food · Dashboard"
      subtitle="Métricas agregadas do motor multimodal"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Sparkles className="w-4 h-4" />
            Visão agregada · últimos {days} dias
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[160px] rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild variant="outline" className="rounded-2xl">
              <Link to="/admin/food-ai/logs">
                <History className="w-4 h-4 mr-1.5" />
                Logs detalhados
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando métricas...
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="rounded-3xl">
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Análises</div>
                  <div className="text-3xl font-semibold mt-1">{metrics.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {metrics.errors} erros · {metrics.itemsTotal} itens
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-3xl">
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Score STHIA médio</div>
                  <div className={`text-3xl font-semibold mt-1 ${scoreClass(metrics.avgSthia)}`}>
                    {metrics.avgSthia}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{scoreLabel(metrics.avgSthia)}</div>
                </CardContent>
              </Card>
              <Card className="rounded-3xl">
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">% Ultraprocessados</div>
                  <div className={`text-3xl font-semibold mt-1 ${metrics.ultraPct > 30 ? "text-rose-500" : "text-foreground"}`}>
                    {metrics.ultraPct}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">NOVA 4 sobre itens totais</div>
                </CardContent>
              </Card>
              <Card className="rounded-3xl">
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Requer revisão</div>
                  <div className="text-3xl font-semibold mt-1 text-amber-500">{metrics.needsReview}</div>
                  <div className="text-xs text-muted-foreground mt-1">Baixa confiança / 2ª evidência</div>
                </CardContent>
              </Card>
            </div>

            {/* Trend + NOVA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="rounded-3xl lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Volume diário e Score STHIA
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics.daily} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="l" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line
                          yAxisId="l"
                          type="monotone"
                          dataKey="count"
                          name="Análises"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="r"
                          type="monotone"
                          dataKey="score"
                          name="Score STHIA"
                          stroke="hsl(142 76% 45%)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> Classificação NOVA
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                        <Pie data={novaData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                          {novaData.map((d) => (
                            <Cell key={d.key} fill={NOVA_COLORS[d.key]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {novaData.map((d) => (
                      <div key={d.key} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: NOVA_COLORS[d.key] }}
                          />
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="font-medium">{d.value}</span>
                      </div>
                    ))}
                    {novaData.length === 0 && (
                      <div className="text-xs text-muted-foreground">Sem dados NOVA no período.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts + Modes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="rounded-3xl lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas mais frequentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {metrics.topAlerts.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-10 text-center">
                      Sem alertas registrados no período.
                    </div>
                  ) : (
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.topAlerts} layout="vertical" margin={{ left: 24, right: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
                          <Tooltip
                            contentStyle={{
                              background: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                          />
                          <Bar dataKey="value" fill="hsl(38 92% 55%)" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Entradas por modo</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-2">
                  {modeData.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Sem dados.</div>
                  ) : (
                    modeData.map((m) => {
                      const pct = metrics.total ? Math.round((m.value / metrics.total) * 100) : 0;
                      return (
                        <div key={m.name}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize">{m.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {m.value} · {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 mt-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Students */}
            <Card className="rounded-3xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Alunos mais ativos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {metrics.students.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">
                    Nenhum aluno com análises no período.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground border-b">
                          <th className="text-left py-2 font-medium">Aluno</th>
                          <th className="text-right py-2 font-medium">Análises</th>
                          <th className="text-right py-2 font-medium">Score STHIA</th>
                          <th className="text-right py-2 font-medium">% Ultra</th>
                          <th className="text-right py-2 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.students.map((s) => {
                          const p = profiles?.get(s.student_id);
                          const name = p?.full_name || p?.email || s.student_id.slice(0, 8);
                          return (
                            <tr key={s.student_id} className="border-b last:border-0">
                              <td className="py-2.5">
                                <div className="font-medium">{name}</div>
                                {p?.email && (
                                  <div className="text-xs text-muted-foreground">{p.email}</div>
                                )}
                              </td>
                              <td className="py-2.5 text-right tabular-nums">{s.count}</td>
                              <td className="py-2.5 text-right">
                                <span className={`font-semibold ${scoreClass(s.avg)}`}>{s.avg}</span>
                              </td>
                              <td className="py-2.5 text-right">
                                <Badge
                                  variant="outline"
                                  className={s.ultraPct > 30 ? "border-rose-500/40 text-rose-500" : ""}
                                >
                                  {s.ultraPct}%
                                </Badge>
                              </td>
                              <td className="py-2.5 text-right">
                                <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                                  <Link to={`/admin/food-ai/logs?student=${s.student_id}`}>
                                    Ver <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                  </Link>
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}