import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Layers, FolderCog } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StudentProgramAssignDialog from "@/components/admin/StudentProgramAssignDialog";

const AdminTraining = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: students } = useQuery({
    queryKey: ["admin-students-training-assign-list"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");
      const userIds = (profiles || []).map((p: any) => p.user_id);
      const { data: assigns } = await supabase
        .from("student_workout_assignments")
        .select("user_id, active")
        .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
      const counts: Record<string, number> = {};
      (assigns || []).forEach((a: any) => {
        if (a.active) counts[a.user_id] = (counts[a.user_id] || 0) + 1;
      });
      return (profiles || []).map((p: any) => ({
        ...p,
        assignedCount: counts[p.user_id] || 0,
        initials:
          p.full_name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "?",
      }));
    },
  });

  useEffect(() => {
    const uid = searchParams.get("uid");
    if (uid && students?.length && !selectedStudent) {
      const found = students.find((s: any) => s.user_id === uid);
      if (found) {
        setSelectedStudent(found);
        setAssignOpen(true);
        searchParams.delete("uid");
        searchParams.delete("return");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [students, searchParams]);

  const openAssign = (student: any) => {
    setSelectedStudent(student);
    setAssignOpen(true);
  };

  return (
    <DashboardLayout
      role="admin"
      title="Gestão de Treinos"
      subtitle="Atribua programas de treino criados na biblioteca a cada aluno."
    >
      <Card className="mb-4">
        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium font-body">Biblioteca de programas</p>
            <p className="text-xs text-muted-foreground">
              Crie e edite programas de treino reutilizáveis para atribuir aos alunos.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/workout-templates")}>
            <FolderCog className="w-3 h-3 mr-1" /> Abrir biblioteca
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Alunos</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {search.trim().length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Digite pelo menos 2 caracteres para buscar alunos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">Aluno</TableHead>
                  <TableHead className="font-body">Treinos atribuídos</TableHead>
                  <TableHead className="font-body text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students
                  ?.filter((s: any) => {
                    const q = search.toLowerCase();
                    return (
                      s.full_name?.toLowerCase().includes(q) ||
                      s.email?.toLowerCase().includes(q)
                    );
                  })
                  .map((s: any) => (
                    <TableRow key={s.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{s.initials}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm font-body">{s.full_name || "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.assignedCount > 0 ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {s.assignedCount > 0
                            ? `${s.assignedCount} treino(s)`
                            : "Sem atribuição"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openAssign(s)}>
                          <Layers className="w-3 h-3 mr-1" /> Atribuir programa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <StudentProgramAssignDialog
        open={assignOpen}
        onOpenChange={(v) => {
          setAssignOpen(v);
          if (!v) setSelectedStudent(null);
        }}
        userId={selectedStudent?.user_id || null}
        userName={selectedStudent?.full_name}
      />
    </DashboardLayout>
  );
};

export default AdminTraining;