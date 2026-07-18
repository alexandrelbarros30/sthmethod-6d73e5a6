import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACTION_LABEL: Record<string, string> = {
  view_student_profile: "Visualizou perfil do aluno",
  view_student_diet: "Visualizou dieta",
  view_student_protocol: "Visualizou protocolo",
  update_student_email: "Alterou e-mail do aluno",
  update_student_pii: "Alterou dados sensíveis do aluno",
  reset_student_password: "Resetou senha do aluno",
  delete_student: "Excluiu aluno",
};

export default function AdminAccessAudit() {
  const [action, setAction] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [days, setDays] = useState<string>("30");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-access-audit", days],
    queryFn: async () => {
      const since = new Date(Date.now() - Number(days) * 86400_000).toISOString();
      const { data, error } = await supabase
        .from("admin_access_audit")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r: any) => {
      if (action !== "all" && r.action !== action) return false;
      if (role !== "all" && r.actor_role !== role) return false;
      if (!q) return true;
      return (
        r.actor_email?.toLowerCase().includes(q) ||
        r.target_label?.toLowerCase().includes(q) ||
        r.action?.toLowerCase().includes(q)
      );
    });
  }, [data, action, role, search]);

  const actionOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r: any) => r.action && set.add(r.action));
    return Array.from(set).sort();
  }, [data]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-heading font-semibold">Auditoria de acesso admin</h1>
            <p className="text-sm text-muted-foreground">Registro de visualizações e alterações sensíveis por admins e consultores.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por e-mail, aluno ou ação…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue placeholder="Ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {actionOptions.map((a) => (
                  <SelectItem key={a} value={a}>{ACTION_LABEL[a] ?? a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder="Papel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="consultor">Consultor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Últimas 24h</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento registrado neste período.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Quem</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Reauth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(new Date(r.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{r.actor_email ?? "—"}</div>
                        <Badge variant="outline" className="mt-0.5 text-[10px]">{r.actor_role ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{ACTION_LABEL[r.action] ?? r.action}</TableCell>
                      <TableCell className="text-xs">{r.target_label ?? "—"}</TableCell>
                      <TableCell>
                        {r.reauth_used ? (
                          <Badge className="bg-primary/15 text-primary border-primary/30">Sim</Badge>
                        ) : (
                          <Badge variant="outline">Não</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}