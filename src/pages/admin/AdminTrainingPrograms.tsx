import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Dumbbell, Users, ChevronRight, Layers, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import ProgramWorkouts from "@/components/admin/ProgramWorkouts";

const AdminTrainingPrograms = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [programDialog, setProgramDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", details: "" });
  const [assignDialog, setAssignDialog] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const { data: programs, isLoading } = useQuery({
    queryKey: ["training-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_programs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: students } = useQuery({
    queryKey: ["all-students-for-assign"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email");
      return data || [];
    },
  });

  const { data: workoutCounts } = useQuery({
    queryKey: ["program-workout-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("workout_templates").select("program_id").not("program_id", "is", null);
      const counts: Record<string, number> = {};
      (data || []).forEach((w: any) => {
        counts[w.program_id] = (counts[w.program_id] || 0) + 1;
      });
      return counts;
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["workout-assignments-all"],
    queryFn: async () => {
      const { data } = await supabase.from("student_workout_assignments").select("*").eq("active", true);
      return data || [];
    },
  });

  const { data: programTemplateIds } = useQuery({
    queryKey: ["program-template-ids", assignDialog],
    queryFn: async () => {
      if (!assignDialog) return [];
      const { data } = await supabase.from("workout_templates").select("id").eq("program_id", assignDialog);
      return (data || []).map((d: any) => d.id);
    },
    enabled: !!assignDialog,
  });

  const saveProgramMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Título obrigatório");
      if (editingProgram) {
        const { error } = await supabase.from("training_programs").update({
          title: form.title, details: form.details, updated_at: new Date().toISOString(),
        }).eq("id", editingProgram);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("training_programs").insert({
          title: form.title, details: form.details, created_by: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      toast.success(editingProgram ? "Programa atualizado!" : "Programa criado!");
      closeProgramDialog();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar."),
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      if (selectedProgramId) setSelectedProgramId(null);
      toast.success("Programa removido!");
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ programId, userId }: { programId: string; userId: string }) => {
      // Assign all workouts of the program to the student
      const templateIds = programTemplateIds || [];
      if (!templateIds.length) throw new Error("Programa sem treinos para atribuir");
      for (const templateId of templateIds) {
        const { error } = await supabase.from("student_workout_assignments").upsert({
          user_id: userId, template_id: templateId, assigned_by: user!.id, active: true,
        }, { onConflict: "user_id,template_id" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-assignments-all"] });
      toast.success("Programa atribuído ao aluno!");
      setAssignDialog(null);
      setSelectedStudent("");
      setStudentSearch("");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atribuir."),
  });

  const closeProgramDialog = () => {
    setProgramDialog(false);
    setEditingProgram(null);
    setForm({ title: "", details: "" });
  };

  const openEditProgram = (p: any) => {
    setEditingProgram(p.id);
    setForm({ title: p.title, details: p.details || "" });
    setProgramDialog(true);
  };

  const selectedProgram = (programs || []).find((p: any) => p.id === selectedProgramId);

  if (selectedProgram) {
    return (
      <DashboardLayout role={(role as any) || "admin"} title={selectedProgram.title} subtitle="Gerencie os treinos deste programa.">
        <div className="max-w-5xl">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => setSelectedProgramId(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar aos programas
          </Button>
          <ProgramWorkouts programId={selectedProgram.id} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={(role as any) || "admin"} title="Programas de Treino" subtitle="Crie programas com múltiplos treinos e atribua aos alunos.">
      <div className="space-y-4 max-w-5xl">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{(programs || []).length} programa(s)</p>
          <Button onClick={() => { setForm({ title: "", details: "" }); setEditingProgram(null); setProgramDialog(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Novo Programa
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : (programs || []).length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Layers className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum programa criado.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {(programs || []).map((p: any) => {
              const wCount = workoutCounts?.[p.id] || 0;
              return (
                <Card key={p.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <button className="flex-1 text-left flex items-center gap-3" onClick={() => setSelectedProgramId(p.id)}>
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                          <Layers className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{p.title}</p>
                          <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                            <Badge variant="outline">{wCount} treino(s)</Badge>
                          </div>
                          {p.details && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.details}</p>}
                        </div>
                      </button>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setAssignDialog(p.id)}>
                          <Users className="w-3.5 h-3.5 mr-1" /> Atribuir
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setSelectedProgramId(p.id)}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEditProgram(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteProgramMutation.mutate(p.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Program Create/Edit Dialog */}
        <Dialog open={programDialog} onOpenChange={v => { if (!v) closeProgramDialog(); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProgram ? "Editar Programa" : "Novo Programa de Treino"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Programa Hipertrofia 12 semanas" />
              </div>
              <div>
                <Label>Detalhes</Label>
                <Textarea value={form.details} onChange={e => setForm(p => ({ ...p, details: e.target.value }))} rows={3} placeholder="Descrição do programa..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={closeProgramDialog}>Cancelar</Button>
                <Button onClick={() => saveProgramMutation.mutate()} disabled={saveProgramMutation.isPending}>
                  {saveProgramMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Dialog */}
        <Dialog open={!!assignDialog} onOpenChange={v => { if (!v) { setAssignDialog(null); setSelectedStudent(""); setStudentSearch(""); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Atribuir Programa ao Aluno</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Buscar Aluno</Label>
                <Input placeholder="Filtrar por nome ou email..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="mb-2" />
                <Label>Selecionar Aluno</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger><SelectValue placeholder="Escolha um aluno..." /></SelectTrigger>
                  <SelectContent>
                    {(students || [])
                      .filter((s: any) => {
                        if (!studentSearch) return true;
                        const q = studentSearch.toLowerCase();
                        return (s.full_name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q);
                      })
                      .map((s: any) => (
                        <SelectItem key={s.user_id} value={s.user_id}>{s.full_name || s.email}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setAssignDialog(null); setSelectedStudent(""); }}>Cancelar</Button>
                <Button disabled={!selectedStudent || assignMutation.isPending}
                  onClick={() => assignDialog && assignMutation.mutate({ programId: assignDialog, userId: selectedStudent })}>
                  {assignMutation.isPending ? "Atribuindo..." : "Atribuir"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminTrainingPrograms;
