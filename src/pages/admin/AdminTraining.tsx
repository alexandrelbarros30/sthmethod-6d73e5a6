import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Layers, FolderCog, Eye, Dumbbell, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StudentProgramAssignDialog from "@/components/admin/StudentProgramAssignDialog";
import ReleaseNotifyButton from "@/components/admin/ReleaseNotifyButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { normalizeSearch } from "@/lib/utils";
import { toast } from "sonner";

const AdminTraining = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [returnToManage, setReturnToManage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const qc = useQueryClient();
  const [confirmUnassign, setConfirmUnassign] = useState<{ userId: string; programId: string; programTitle: string; userName: string } | null>(null);

  const { data: students } = useQuery({
    queryKey: ["admin-students-training-assign-list"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");
      const userIds = (profiles || []).map((p: any) => p.user_id);
      const { data: assigns } = await supabase
        .from("student_workout_assignments")
        .select("user_id, active, template_id")
        .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
      const activeAssigns = (assigns || []).filter((a: any) => a.active);
      const templateIds = Array.from(new Set(activeAssigns.map((a: any) => a.template_id))).filter(Boolean);
      const { data: templates } = templateIds.length
        ? await supabase.from("workout_templates").select("id, program_id").in("id", templateIds as string[])
        : { data: [] as any[] };
      const programIds = Array.from(new Set((templates || []).map((t: any) => t.program_id))).filter(Boolean);
      const { data: programs } = programIds.length
        ? await supabase.from("training_programs").select("id, title").in("id", programIds as string[])
        : { data: [] as any[] };
      const tplToProg: Record<string, string> = {};
      (templates || []).forEach((t: any) => { tplToProg[t.id] = t.program_id; });
      const progTitle: Record<string, string> = {};
      (programs || []).forEach((p: any) => { progTitle[p.id] = p.title; });
      const studentPrograms: Record<string, Set<string>> = {};
      activeAssigns.forEach((a: any) => {
        const progId = tplToProg[a.template_id];
        if (!progId) return;
        if (!studentPrograms[a.user_id]) studentPrograms[a.user_id] = new Set();
        studentPrograms[a.user_id].add(progId);
      });
      return (profiles || []).map((p: any) => ({
        ...p,
        assignedPrograms: Array.from(studentPrograms[p.user_id] || [])
          .map((id) => ({ id, title: progTitle[id] }))
          .filter((x) => x.title),
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

  const unassignMutation = useMutation({
    mutationFn: async ({ userId, programId }: { userId: string; programId: string }) => {
      const { data: tpls, error: tErr } = await supabase
        .from("workout_templates")
        .select("id")
        .eq("program_id", programId);
      if (tErr) throw tErr;
      const tIds = (tpls || []).map((t: any) => t.id);
      if (!tIds.length) return;
      const { error } = await supabase
        .from("student_workout_assignments")
        .delete()
        .eq("user_id", userId)
        .in("template_id", tIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Programa desatribuído do aluno.");
      qc.invalidateQueries({ queryKey: ["admin-students-training-assign-list"] });
      qc.invalidateQueries({ queryKey: ["student-assignments"] });
      setConfirmUnassign(null);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao desatribuir."),
  });

  useEffect(() => {
    const uid = searchParams.get("uid");
    const ret = searchParams.get("return");
    if (uid && students?.length) {
      const found = students.find((s: any) => s.user_id === uid);
      if (found) {
        setSearch(found.full_name || found.email || "");
        setSelectedStudent(found);
        setDialogOpen(true);
        if (ret === "manage") setReturnToManage(uid);
      }
      searchParams.delete("uid");
      searchParams.delete("return");
      setSearchParams(searchParams, { replace: true });
    }
  }, [students, searchParams]);

  const openAssign = (student: any) => {
    setSelectedStudent(student);
    setDialogOpen(true);
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
                  <TableHead className="font-body">Programa atribuído</TableHead>
                  <TableHead className="font-body text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students
                  ?.filter((s: any) => {
                    const q = normalizeSearch(search);
                    return (
                      normalizeSearch(s.full_name).includes(q) ||
                      normalizeSearch(s.email).includes(q)
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
                        {s.assignedPrograms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {s.assignedPrograms.map((p: any) => (
                              <Badge key={p.id} variant="secondary" className="text-xs pl-2 pr-1 gap-1 flex items-center">
                                <span className="truncate max-w-[160px]">{p.title}</span>
                                <button
                                  type="button"
                                  onClick={() => setConfirmUnassign({ userId: s.user_id, programId: p.id, programTitle: p.title, userName: s.full_name || s.email })}
                                  className="ml-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 transition"
                                  title="Desatribuir"
                                  aria-label={`Desatribuir ${p.title}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">Sem atribuição</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button variant="ghost" size="sm" onClick={() => openAssign(s)}>
                            <Layers className="w-3 h-3 mr-1" />
                            {s.assignedPrograms.length > 0 ? "Alterar" : "Atribuir programa"}
                          </Button>
                          {s.assignedPrograms.length > 0 && (
                            <ReleaseNotifyButton userId={s.user_id} type="training" />
                          )}
                        </div>
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

      {/* Training Management Popup (X to close → return to manage) */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o && returnToManage) {
            navigate(`/admin/students?manage=${returnToManage}`);
            setReturnToManage(null);
          }
        }}
      >
        <DialogContent
          className={isMobile
            ? "!inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0 !w-screen !max-w-none !h-[100dvh] !max-h-none rounded-none border-0 p-4 !flex !flex-col overflow-hidden"
            : "w-[calc(100vw-0.75rem)] max-w-lg max-h-[94dvh] min-h-0 overflow-hidden !flex !flex-col p-6"
          }
        >
          <DialogHeader className="pr-8">
            <DialogTitle className="font-display text-base sm:text-lg flex items-center gap-2">
              <Dumbbell className="w-4 h-4" /> Treino — {selectedStudent?.full_name || "Aluno"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Atribua um programa e libere o treino para o aluno.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Programa(s) atribuído(s)</p>
              {selectedStudent?.assignedPrograms?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.assignedPrograms.map((p: any) => (
                    <Badge key={p.id} variant="secondary" className="text-xs pl-2 pr-1 gap-1 flex items-center">
                      <span className="truncate max-w-[180px]">{p.title}</span>
                      <button
                        type="button"
                        onClick={() => setConfirmUnassign({ userId: selectedStudent.user_id, programId: p.id, programTitle: p.title, userName: selectedStudent.full_name || selectedStudent.email })}
                        className="ml-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 transition"
                        title="Desatribuir"
                        aria-label={`Desatribuir ${p.title}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <Badge variant="outline" className="text-xs">Sem atribuição</Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setAssignOpen(true)}>
                <Layers className="w-3.5 h-3.5 mr-1.5" />
                {selectedStudent?.assignedPrograms?.length > 0 ? "Alterar programa" : "Atribuir programa"}
              </Button>
              {selectedStudent?.user_id && (
                <ReleaseNotifyButton userId={selectedStudent.user_id} type="training" />
              )}
            </div>

            {selectedStudent?.user_id && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => window.open(`/dashboard/training?preview_as=${selectedStudent.user_id}`, "_blank", "noopener,noreferrer")}
              >
                <Eye className="w-4 h-4 mr-1" /> Visualizar como aluno
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmUnassign} onOpenChange={(o) => !o && setConfirmUnassign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desatribuir programa?</AlertDialogTitle>
            <AlertDialogDescription>
              Remover <strong>{confirmUnassign?.programTitle}</strong> do aluno <strong>{confirmUnassign?.userName}</strong>? O aluno deixará de ver esse treino.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unassignMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirmUnassign) unassignMutation.mutate({ userId: confirmUnassign.userId, programId: confirmUnassign.programId });
              }}
              disabled={unassignMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unassignMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Desatribuir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminTraining;