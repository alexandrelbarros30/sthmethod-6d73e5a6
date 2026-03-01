import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminStudents = () => {
  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-students-list"],
    queryFn: async () => {
      // Get all profiles with their subscriptions
      const { data: profiles } = await supabase.from("profiles").select("*");
      if (!profiles) return [];

      const { data: subs } = await supabase.from("subscriptions").select("*, plans(name)");

      return profiles.map((p) => {
        const sub = subs?.find((s) => s.user_id === p.user_id);
        return {
          ...p,
          plan: (sub as any)?.plans?.name || "—",
          startDate: sub?.start_date || null,
          endDate: sub?.end_date || null,
          status: sub ? (sub.status === "active" && new Date(sub.end_date) > new Date() ? "active" : "expired") : "none",
          initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        };
      });
    },
  });

  return (
    <DashboardLayout role="admin" title="Gestão de Alunos" subtitle="Visualize e gerencie todos os alunos.">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display">Alunos cadastrados</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground font-body">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">Aluno</TableHead>
                  <TableHead className="font-body">Plano</TableHead>
                  <TableHead className="font-body">Início</TableHead>
                  <TableHead className="font-body">Vencimento</TableHead>
                  <TableHead className="font-body">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{s.initials}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm font-body">{s.full_name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground font-body">{s.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-body text-sm">{s.plan}</TableCell>
                    <TableCell className="font-body text-sm">
                      {s.startDate ? new Date(s.startDate).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {s.endDate ? new Date(s.endDate).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={s.status === "active" ? "secondary" : s.status === "expired" ? "destructive" : "outline"}
                        className="text-xs"
                      >
                        {s.status === "active" ? "Ativo" : s.status === "expired" ? "Vencido" : "Sem plano"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!students || students.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground font-body">
                      Nenhum aluno cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminStudents;
