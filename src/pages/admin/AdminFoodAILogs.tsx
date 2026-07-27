import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ArrowLeft, Eye, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { normalizeSearch } from "@/lib/utils";

type LogRow = {
  id: string;
  student_id: string | null;
  admin_id: string | null;
  source: string;
  mode: string;
  confidence: number | null;
  quality_score: number | null;
  classification: string | null;
  foods: any;
  totals: any;
  alerts: any;
  notes: string | null;
  ai_source: string | null;
  reconciled_count: number;
  total_count: number;
  status: string;
  needs_review: boolean;
  diary_entry_ids: any;
  meal_type: string | null;
  meal_label: string | null;
  log_date: string | null;
  error_code: string | null;
  error_details: string | null;
  duration_ms: number | null;
  input_text: string | null;
  created_at: string;
  corrections?: any;
  needs_second_evidence?: boolean;
  second_evidence_reason?: string | null;
};

const STATUS_META: Record<string, { label: string; className: string; icon: any }> = {
  saved: { label: "Salvo no diário", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
  analyzed: { label: "Analisado", className: "bg-sky-500/15 text-sky-600 border-sky-500/30", icon: Eye },
  pending_review: { label: "Revisão pendente", className: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: AlertTriangle },
  discarded: { label: "Descartado", className: "bg-muted text-muted-foreground border-border", icon: XCircle },
  error: { label: "Erro", className: "bg-rose-500/15 text-rose-600 border-rose-500/30", icon: XCircle },
};

const AdminFoodAILogs = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LogRow | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["food-ai-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_ai_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as LogRow[];
    },
  });

  const studentIds = useMemo(
    () => Array.from(new Set(logs.map((l) => l.student_id).filter(Boolean))) as string[],
    [logs],
  );

  const { data: profiles = [] } = useQuery({
    queryKey: ["food-ai-logs-profiles", studentIds],
    queryFn: async () => {
      if (!studentIds.length) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", studentIds);
      return data || [];
    },
    enabled: studentIds.length > 0,
  });

  const profileMap = useMemo(() => {
    const m = new Map<string, { full_name: string; email: string }>();
    profiles.forEach((p: any) => m.set(p.user_id, p));
    return m;
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(search);
    return logs.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (modeFilter !== "all" && l.mode !== modeFilter) return false;
      if (q) {
        const p = l.student_id ? profileMap.get(l.student_id) : null;
        const hay = `${p?.full_name || ""} ${p?.email || ""} ${l.notes || ""} ${l.input_text || ""}`;
        if (!normalizeSearch(hay).includes(q)) return false;
      }
      return true;
    });
  }, [logs, statusFilter, modeFilter, search, profileMap]);

  const metrics = useMemo(() => {
    const total = logs.length;
    const saved = logs.filter((l) => l.status === "saved").length;
    const errors = logs.filter((l) => l.status === "error").length;
    const pending = logs.filter((l) => l.status === "pending_review").length;
    const withConf = logs.filter((l) => l.confidence != null);
    const avgConfidence = withConf.length
      ? withConf.reduce((s, l) => s + Number(l.confidence || 0), 0) / withConf.length
      : 0;
    const withQ = logs.filter((l) => l.quality_score != null);
    const avgQuality = withQ.length
      ? withQ.reduce((s, l) => s + Number(l.quality_score || 0), 0) / withQ.length
      : 0;
    return { total, saved, errors, pending, avgConfidence, avgQuality };
  }, [logs]);

  return (
    <DashboardLayout role="admin" title="Histórico STH Food AI">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/food-ai")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao console
          </Button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard label="Total" value={metrics.total} />
          <MetricCard label="Salvos" value={metrics.saved} tone="emerald" />
          <MetricCard label="Pendentes" value={metrics.pending} tone="amber" />
          <MetricCard label="Erros" value={metrics.errors} tone="rose" />
          <MetricCard
            label="Confiança média"
            value={`${Math.round(metrics.avgConfidence * 100)}%`}
            hint={`Qualidade: ${metrics.avgQuality.toFixed(1)}/10`}
          />
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar aluno, notas..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="saved">Salvos</SelectItem>
                <SelectItem value="pending_review">Pendentes de revisão</SelectItem>
                <SelectItem value="analyzed">Analisados</SelectItem>
                <SelectItem value="discarded">Descartados</SelectItem>
                <SelectItem value="error">Erros</SelectItem>
              </SelectContent>
            </Select>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger><SelectValue placeholder="Modo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os modos</SelectItem>
                <SelectItem value="photo">Foto</SelectItem>
                <SelectItem value="label">Rótulo</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader><CardTitle className="text-base">Análises ({filtered.length})</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Refeição</TableHead>
                  <TableHead>Confiança</TableHead>
                  <TableHead>Qualidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow>
                ) : filtered.map((l) => {
                  const p = l.student_id ? profileMap.get(l.student_id) : null;
                  const meta = STATUS_META[l.status] || STATUS_META.analyzed;
                  const conf = l.confidence != null ? Math.round(Number(l.confidence) * 100) : null;
                  const lowConf = conf != null && conf < 70;
                  return (
                    <TableRow key={l.id} className="text-sm">
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(l.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium truncate max-w-[180px]">{p?.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">{p?.email}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{l.mode}</Badge></TableCell>
                      <TableCell className="text-xs">{l.meal_label || "—"}<div className="text-muted-foreground">{l.log_date}</div></TableCell>
                      <TableCell>
                        {conf != null ? (
                          <Badge variant={lowConf ? "destructive" : "default"}>{conf}%</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{l.quality_score != null ? `${l.quality_score}/10` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={meta.className}>
                          <meta.icon className="w-3 h-3 mr-1" />
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.ai_source || l.source}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelected(l)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes da análise</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Data:</span> {format(new Date(selected.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
                <div><span className="text-muted-foreground">Modo:</span> {selected.mode}</div>
                <div><span className="text-muted-foreground">Fonte:</span> {selected.ai_source || selected.source}</div>
                <div><span className="text-muted-foreground">Duração:</span> {selected.duration_ms ? `${selected.duration_ms}ms` : "—"}</div>
                <div><span className="text-muted-foreground">Confiança:</span> {selected.confidence != null ? `${Math.round(Number(selected.confidence) * 100)}%` : "—"}</div>
                <div><span className="text-muted-foreground">Qualidade:</span> {selected.quality_score != null ? `${selected.quality_score}/10` : "—"}</div>
                <div><span className="text-muted-foreground">Reconciliação:</span> {selected.reconciled_count}/{selected.total_count} via FatSecret</div>
                <div><span className="text-muted-foreground">Classificação:</span> {selected.classification || "—"}</div>
              </div>

              {selected.error_code && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                  <div className="font-medium text-rose-600 mb-1">Erro {selected.error_code}</div>
                  <div className="text-xs text-muted-foreground break-all">{selected.error_details}</div>
                </div>
              )}

              {selected.input_text && (
                <div>
                  <div className="font-medium mb-1">Texto original</div>
                  <div className="rounded border p-2 text-xs whitespace-pre-wrap">{selected.input_text}</div>
                </div>
              )}

              {Array.isArray(selected.alerts) && selected.alerts.length > 0 && (
                <div>
                  <div className="font-medium mb-1">Alertas</div>
                  <ul className="list-disc pl-5 text-xs text-muted-foreground">
                    {selected.alerts.map((a: string, i: number) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              {Array.isArray(selected.foods) && selected.foods.length > 0 && (
                <div>
                  <div className="font-medium mb-1">Itens</div>
                  <div className="rounded border divide-y">
                    {selected.foods.map((f: any, i: number) => (
                      <div key={i} className="p-2 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-medium">{f.name}</div>
                          <div className="text-muted-foreground">{f.estimated_weight_g}{f.unit} • {f.calories}kcal • P{f.protein_g} C{f.carbs_g} G{f.fat_g}</div>
                        </div>
                        {f.confidence != null && (
                          <Badge variant={f.confidence < 0.7 ? "destructive" : "outline"}>{Math.round(f.confidence * 100)}%</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.totals && (
                <div className="rounded border p-2 bg-muted/40 text-xs">
                  <span className="font-medium">Totais:</span> {(selected.totals as any).calories}kcal • P{(selected.totals as any).protein_g}g • C{(selected.totals as any).carbs_g}g • G{(selected.totals as any).fat_g}g
                </div>
              )}

              {Array.isArray(selected.diary_entry_ids) && selected.diary_entry_ids.length > 0 && (
                <div className="text-xs text-emerald-600">
                  ✓ {selected.diary_entry_ids.length} item(ns) registrado(s) no diário do aluno
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

function MetricCard({ label, value, tone, hint }: { label: string; value: string | number; tone?: "emerald" | "amber" | "rose"; hint?: string }) {
  const toneClass = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : tone === "rose" ? "text-rose-600" : "";
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
        {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export default AdminFoodAILogs;