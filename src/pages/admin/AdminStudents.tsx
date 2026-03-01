import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockStudents } from "@/lib/mock-data";
import { Eye, MoreHorizontal } from "lucide-react";

const AdminStudents = () => {
  return (
    <DashboardLayout role="admin" title="Gestão de Alunos" subtitle="Visualize e gerencie todos os alunos.">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display">Alunos cadastrados</CardTitle>
            <Button size="sm">+ Novo aluno</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Aluno</TableHead>
                <TableHead className="font-body">Plano</TableHead>
                <TableHead className="font-body">Início</TableHead>
                <TableHead className="font-body">Vencimento</TableHead>
                <TableHead className="font-body">Status</TableHead>
                <TableHead className="font-body text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStudents.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{s.avatarInitials}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm font-body">{s.name}</p>
                        <p className="text-xs text-muted-foreground font-body">{s.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-body text-sm">{s.plan}</TableCell>
                  <TableCell className="font-body text-sm">{new Date(s.startDate).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-body text-sm">{new Date(s.endDate).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "active" ? "secondary" : "destructive"} className="text-xs">
                      {s.status === "active" ? "Ativo" : "Vencido"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminStudents;
