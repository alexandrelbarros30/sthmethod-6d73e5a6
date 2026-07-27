import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Stethoscope, FlaskConical, Apple, Pencil, FileDown, Search, Filter, Eye, EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { normalizeSearch } from "@/lib/utils";

type Kind = "analise" | "protocolo" | "dieta";

interface Row {
  id: string;
  kind: Kind;
  user_id: string;
  title: string;
  created_at: string;
  released: boolean;
  extra?: string;
  content?: string;
  raw: any;
}

const KIND_META: Record<Kind, { label: string; icon: any; color: string; editPath: (uid: string) => string }> = {
  analise: {
    label: "Análise STHIA",
    icon: Stethoscope,
    color: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    editPath: (uid) => `/admin/analise-aluno?student=${uid}`,
  },
  protocolo: {
    label: "Protocolo IA",
    icon: FlaskConical,
    color: "bg-violet-500/15 text-violet-600 border-violet-500/30",
    editPath: (uid) => `/admin/protocolo-ia?student=${uid}`,
  },
  dieta: {
    label: "Cardápio IA",
    icon: Apple,
    color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    editPath: (uid) => `/admin/dieta-ai?student=${uid}`,
  },
};

const AdminAIHistory = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isConsultor = role === "consultor";
  const displayRole = isConsultor ? "consultor" : "admin";

  const [kindFilter, setKindFilter] = useState<"all" | Kind>("all");
  const [releasedFilter, setReleasedFilter] = useState<"all" | "released" | "draft">("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [studentFilter, setStudentFilter] = useState<string>("all");

  // Alunos vinculados (para filtro) — consultor só vê seus alunos
  const { data: students = [] } = useQuery({
    queryKey: ["ia-hist-students", displayRole, user?.id],
    queryFn: async () => {
      let ids: string[] | null = null;
      if (isConsultor && user?.id) {
        const { data: links } = await supabase
          .from("consultant_students")
          .select("student_id")
          .eq("consultant_id", user.id);
        ids = (links || []).map((l: any) => l.student_id);
        if (ids.length === 0) return [];
      }
      let q = supabase.from("profiles").select("user_id, full_name, email");
      if (ids) q = q.in("user_id", ids);
      const { data } = await q.order("full_name", { ascending: true });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const studentMap = useMemo(() => {
    const m: Record<string, { name: string; email: string }> = {};
    (students as any[]).forEach((s) => {
      m[s.user_id] = { name: s.full_name || "Sem nome", email: s.email || "" };
    });
    return m;
  }, [students]);

  const allowedUserIds = useMemo(
    () => (isConsultor ? (students as any[]).map((s) => s.user_id) : null),
    [isConsultor, students],
  );

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["ia-history", displayRole, user?.id, from, to, allowedUserIds?.length],
    queryFn: async () => {
      const fromIso = from ? new Date(from + "T00:00:00").toISOString() : null;
      const toIso = to ? new Date(to + "T23:59:59").toISOString() : null;

      const buildBase = (q: any) => {
        if (fromIso) q = q.gte("created_at", fromIso);
        if (toIso) q = q.lte("created_at", toIso);
        if (allowedUserIds) q = q.in("user_id", allowedUserIds);
        return q.order("created_at", { ascending: false }).limit(500);
      };

      const [analises, protos, dietas] = await Promise.all([
        buildBase(
          supabase
            .from("student_clinical_analyses")
            .select("id, user_id, title, summary, created_at, released_to_student, model"),
        ),
        buildBase(
          supabase
            .from("student_protocols")
            .select("id, user_id, title, content, created_at, visible"),
        ),
        buildBase(
          supabase
            .from("student_diets")
            .select("id, user_id, title, content, created_at, visible, energy_kcal"),
        ),
      ]);

      const out: Row[] = [];
      (analises.data || []).forEach((r: any) =>
        out.push({
          id: r.id,
          kind: "analise",
          user_id: r.user_id,
          title: r.title || "Análise STHIA",
          created_at: r.created_at,
          released: !!r.released_to_student,
          extra: r.model || undefined,
          content: r.summary || "",
          raw: r,
        }),
      );
      (protos.data || []).forEach((r: any) =>
        out.push({
          id: r.id,
          kind: "protocolo",
          user_id: r.user_id,
          title: r.title || "Protocolo",
          created_at: r.created_at,
          released: !!r.visible,
          content: r.content || "",
          raw: r,
        }),
      );
      (dietas.data || []).forEach((r: any) =>
        out.push({
          id: r.id,
          kind: "dieta",
          user_id: r.user_id,
          title: r.title || "Dieta",
          created_at: r.created_at,
          released: !!r.visible,
          extra: r.energy_kcal ? `${Math.round(r.energy_kcal)} kcal` : undefined,
          content: r.content || "",
          raw: r,
        }),
      );
      return out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },
    enabled: !!user?.id,
  });

  const filtered = useMemo(() => {
    const q = normalizeSearch(search);
    return (rows as Row[]).filter((r) => {
      if (kindFilter !== "all" && r.kind !== kindFilter) return false;
      if (releasedFilter === "released" && !r.released) return false;
      if (releasedFilter === "draft" && r.released) return false;
      if (studentFilter !== "all" && r.user_id !== studentFilter) return false;
      if (!q) return true;
      const s = studentMap[r.user_id];
      return (
        normalizeSearch(r.title).includes(q) ||
        normalizeSearch(s?.name || "").includes(q) ||
        normalizeSearch(s?.email || "").includes(q)
      );
    });
  }, [rows, kindFilter, releasedFilter, studentFilter, search, studentMap]);

  const toggleRelease = async (r: Row, next: boolean) => {
    try {
      if (r.kind === "analise") {
        const { error } = await supabase
          .from("student_clinical_analyses")
          .update({
            released_to_student: next,
            released_at: next ? new Date().toISOString() : null,
          })
          .eq("id", r.id);
        if (error) throw error;
      } else {
        const table = r.kind === "protocolo" ? "student_protocols" : "student_diets";
        const { error } = await supabase.from(table).update({ visible: next }).eq("id", r.id);
        if (error) throw error;
      }
      toast.success(next ? "Disponibilizado para o aluno." : "Ocultado do aluno.");
      qc.invalidateQueries({ queryKey: ["ia-history"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar.");
    }
  };

  const generateReport = () => {
    if (filtered.length === 0) {
      toast.error("Nenhum registro no filtro atual para gerar relatório.");
      return;
    }
    const w = window.open("", "_blank");
    if (!w) return;
    const rowsHtml = filtered
      .map((r) => {
        const s = studentMap[r.user_id];
        return `<tr>
          <td>${format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
          <td>${KIND_META[r.kind].label}</td>
          <td>${escapeHtml(s?.name || r.user_id)}</td>
          <td>${escapeHtml(r.title)}</td>
          <td>${escapeHtml(r.extra || "")}</td>
          <td>${r.released ? "Disponível" : "Rascunho"}</td>
        </tr>`;
      })
      .join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Relatório IA — STH METHOD</title>
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#111;padding:32px;}
        h1{font-size:20px;margin:0 0 4px}
        p.meta{color:#666;font-size:12px;margin:0 0 24px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}
        th{background:#f5f5f7;font-weight:600}
        tr:nth-child(even) td{background:#fafafa}
        @media print{@page{size:A4;margin:14mm}}
      </style></head><body>
      <h1>Relatório de conteúdos gerados por IA</h1>
      <p class="meta">STH METHOD · gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })} · ${filtered.length} registro(s)</p>
      <table><thead><tr>
        <th>Data</th><th>Tipo</th><th>Aluno</th><th>Título</th><th>Detalhes</th><th>Status</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table>
      <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <DashboardLayout
      role={displayRole}
      title="Histórico IA"
      subtitle="Análise STHIA · Protocolo IA · Cardápio IA"
    >
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2 text-base">
            <Filter className="w-4 h-4 text-primary" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por aluno ou título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={kindFilter} onValueChange={(v: any) => setKindFilter(v)}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="analise">Análise STHIA</SelectItem>
                <SelectItem value="protocolo">Protocolo IA</SelectItem>
                <SelectItem value="dieta">Cardápio IA</SelectItem>
              </SelectContent>
            </Select>
            <Select value={releasedFilter} onValueChange={(v: any) => setReleasedFilter(v)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="released">Disponível ao aluno</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
              </SelectContent>
            </Select>
            <Select value={studentFilter} onValueChange={setStudentFilter}>
              <SelectTrigger><SelectValue placeholder="Aluno" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">Todos os alunos</SelectItem>
                {(students as any[]).map((s) => (
                  <SelectItem key={s.user_id} value={s.user_id}>
                    {s.full_name || s.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={generateReport}>
              <FileDown className="w-4 h-4 mr-1" /> Relatório
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">De</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Até</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="font-display text-base">
            {isLoading ? "Carregando..." : `${filtered.length} registro(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Disponível</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const meta = KIND_META[r.kind];
                const Icon = meta.icon;
                const s = studentMap[r.user_id];
                return (
                  <TableRow key={`${r.kind}-${r.id}`}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {format(new Date(r.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={meta.color}>
                        <Icon className="w-3 h-3 mr-1" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium">{s?.name || "—"}</div>
                      <div className="text-muted-foreground truncate max-w-[220px]">{s?.email}</div>
                    </TableCell>
                    <TableCell className="text-xs max-w-[260px] truncate">{r.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.extra || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={r.released}
                          onCheckedChange={(v) => toggleRelease(r, v)}
                        />
                        {r.released ? (
                          <Eye className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(meta.editPath(r.user_id))}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum registro encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

function escapeHtml(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default AdminAIHistory;