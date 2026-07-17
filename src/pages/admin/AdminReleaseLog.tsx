import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Apple, Dumbbell, FlaskConical, ClipboardList, Sparkles, ExternalLink, Download, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { normalizeSearch } from "@/lib/utils";

type ReleaseKey =
  | "diet_updated"
  | "training_updated"
  | "protocol_updated"
  | "lab_analysis_ready"
  | "content_all_ready";

const KEY_META: Record<ReleaseKey, { label: string; icon: any; color: string }> = {
  diet_updated: { label: "Dieta", icon: Apple, color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  training_updated: { label: "Treino", icon: Dumbbell, color: "bg-sky-500/15 text-sky-600 border-sky-500/30" },
  protocol_updated: { label: "Protocolo", icon: ClipboardList, color: "bg-violet-500/15 text-violet-600 border-violet-500/30" },
  lab_analysis_ready: { label: "Central de Análise", icon: FlaskConical, color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  content_all_ready: { label: "Projeto Completo", icon: Sparkles, color: "bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/30" },
};

const ALL_KEYS = Object.keys(KEY_META) as ReleaseKey[];

const AdminReleaseLog = () => {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<"all" | ReleaseKey>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "failed">("all");
  const [search, setSearch] = useState("");

  // 1) Templates (para saber IDs dos system_keys de liberação)
  const { data: templates = [] } = useQuery({
    queryKey: ["release-log-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("id, system_key, title")
        .in("system_key", ALL_KEYS as string[]);
      if (error) throw error;
      return data || [];
    },
  });

  const templateIds = useMemo(() => templates.map((t: any) => t.id), [templates]);
  const templateMap = useMemo(() => {
    const m = new Map<string, { system_key: ReleaseKey; title: string }>();
    templates.forEach((t: any) => m.set(t.id, { system_key: t.system_key as ReleaseKey, title: t.title }));
    return m;
  }, [templates]);

  // 2) Histórico
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["release-log-history", templateIds, typeFilter, statusFilter],
    enabled: templateIds.length > 0,
    queryFn: async () => {
      let ids = templateIds;
      if (typeFilter !== "all") {
        ids = templates
          .filter((t: any) => t.system_key === typeFilter)
          .map((t: any) => t.id);
      }
      if (ids.length === 0) return [];
      let q = supabase
        .from("message_history")
        .select("id, user_id, template_id, recipient_name, recipient_phone, content, status, sent_at, created_at, error_message")
        .in("template_id", ids)
        .order("created_at", { ascending: false })
        .limit(500);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  // 3) Nomes dos alunos (decoupled)
  const userIds = useMemo(
    () => Array.from(new Set(history.map((h: any) => h.user_id).filter(Boolean))),
    [history],
  );
  const { data: profiles = [] } = useQuery({
    queryKey: ["release-log-profiles", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      if (error) throw error;
      return data || [];
    },
  });
  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p: any) => m.set(p.user_id, p.full_name || ""));
    return m;
  }, [profiles]);

  const rows = useMemo(() => {
    const s = normalizeSearch(search);
    return history
      .map((h: any) => {
        const meta = templateMap.get(h.template_id);
        return {
          ...h,
          system_key: meta?.system_key,
          template_title: meta?.title,
          full_name: nameMap.get(h.user_id) || h.recipient_name || "—",
        };
      })
      .filter((r: any) => {
        if (!s) return true;
        return (
          normalizeSearch(r.full_name).includes(s) ||
          normalizeSearch(r.recipient_phone).includes(s)
        );
      });
  }, [history, templateMap, nameMap, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { total: rows.length, sent: 0, failed: 0 };
    ALL_KEYS.forEach((k) => (c[k] = 0));
    rows.forEach((r: any) => {
      if (r.status === "sent") c.sent++;
      if (r.status === "failed") c.failed++;
      if (r.system_key) c[r.system_key] = (c[r.system_key] || 0) + 1;
    });
    return c;
  }, [rows]);

  const exportCsv = () => {
    if (rows.length === 0) return;
    const headers = ["Data", "Tipo", "Aluno", "Telefone", "Status", "Erro"];
    const body = rows.map((r: any) => [
      format(new Date(r.created_at), "dd/MM/yyyy HH:mm"),
      KEY_META[r.system_key as ReleaseKey]?.label || r.template_title || "—",
      (r.full_name || "").replace(/[,;\n]/g, " "),
      r.recipient_phone || "",
      r.status,
      (r.error_message || "").replace(/[,;\n]/g, " "),
    ]);
    const csv = [headers, ...body].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-liberacoes-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout role="admin" title="Histórico de Liberações">
      <div className="space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ALL_KEYS.map((k) => {
            const Icon = KEY_META[k].icon;
            return (
              <Card key={k} className={`border ${KEY_META[k].color}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs opacity-80 truncate">{KEY_META[k].label}</p>
                    <p className="text-xl font-bold">{counts[k] || 0}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="text-lg">
              Registros ({counts.total}) · <span className="text-emerald-600">{counts.sent} enviados</span> · <span className="text-destructive">{counts.failed} falhas</span>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8 w-56"
                  placeholder="Buscar aluno ou telefone"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {ALL_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>{KEY_META[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                  <SelectItem value="failed">Falhas</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="whitespace-nowrap">Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Carregando…</TableCell></TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
                  ) : (
                    rows.map((r: any) => {
                      const meta = r.system_key ? KEY_META[r.system_key as ReleaseKey] : null;
                      const Icon = meta?.icon;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {meta ? (
                              <Badge variant="outline" className={`gap-1 ${meta.color}`}>
                                {Icon && <Icon className="w-3 h-3" />}
                                {meta.label}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">{r.template_title || "—"}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{r.full_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.recipient_phone || "—"}</TableCell>
                          <TableCell>
                            {r.status === "sent" ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" variant="outline">Enviado</Badge>
                            ) : r.status === "failed" ? (
                              <Badge variant="destructive" title={r.error_message || ""}>Falha</Badge>
                            ) : (
                              <Badge variant="secondary">{r.status}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {r.user_id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/admin/students?manage=${r.user_id}`)}
                                title="Abrir aluno"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Registra automaticamente os envios de Dieta, Treino, Protocolo, Central de Análise e Projeto Completo (combinado) — inclui liberações manuais via botão "Liberar" e automáticas.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminReleaseLog;