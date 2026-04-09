import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users, ChevronRight, Layers, ArrowLeft, Copy, Target, Zap, Search } from "lucide-react";
import { toast } from "sonner";
import ProgramWorkouts from "@/components/admin/ProgramWorkouts";

const OBJECTIVES = [
  { value: "hypertrophy", label: "Hipertrofia" },
  { value: "fat_loss", label: "Emagrecimento" },
  { value: "conditioning", label: "Condicionamento" },
  { value: "strength", label: "Força" },
  { value: "endurance", label: "Resistência" },
  { value: "mobility", label: "Mobilidade" },
  { value: "general", label: "Geral" },
];

const DIFFICULTIES = [
  { value: "beginner", label: "Iniciante", color: "text-green-400" },
  { value: "intermediate", label: "Intermediário", color: "text-yellow-400" },
  { value: "advanced", label: "Avançado", color: "text-red-400" },
];

const STATUSES = [
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicado" },
];

interface ProgramForm {
  title: string;
  details: string;
  objective: string;
  difficulty: string;
  status: string;
}

const emptyForm: ProgramForm = { title: "", details: "", objective: "general", difficulty: "intermediate", status: "published" };

const AdminTrainingPrograms = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [programDialog, setProgramDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramForm>(emptyForm);
  const [assignDialog, setAssignDialog] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
          title: form.title, details: form.details,
          objective: form.objective, difficulty: form.difficulty, status: form.status,
          updated_at: new Date().toISOString(),
        }).eq("id", editingProgram);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("training_programs").insert({
          title: form.title, details: form.details,
          objective: form.objective, difficulty: form.difficulty, status: form.status,
          created_by: user!.id,
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

  const duplicateProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      const original = (programs || []).find((p: any) => p.id === id);
      if (!original) throw new Error("Programa não encontrado");
      // Duplicate program
      const { data: newProgram, error } = await supabase.from("training_programs").insert({
        title: `${original.title} (Cópia)`, details: original.details,
        objective: original.objective || "general", difficulty: original.difficulty || "intermediate",
        status: "draft", created_by: user!.id,
      }).select("id").single();
      if (error) throw error;
      // Duplicate workouts and exercises
      const { data: workouts } = await supabase.from("workout_templates").select("*").eq("program_id", id).order("sort_order");
      for (const w of workouts || []) {
        const { data: newW, error: wErr } = await supabase.from("workout_templates").insert({
          title: w.title, subtitle: w.subtitle, description: w.description,
          weeks: w.weeks, days_per_week: w.days_per_week, minutes_per_day: w.minutes_per_day,
          program_id: newProgram.id, created_by: user!.id, sort_order: w.sort_order, released: w.released,
        }).select("id").single();
        if (wErr) continue;
        const { data: exs } = await supabase.from("workout_template_exercises").select("*").eq("template_id", w.id).order("sort_order");
        if (exs && exs.length > 0) {
          await supabase.from("workout_template_exercises").insert(
            exs.map((e: any) => ({
              template_id: newW.id, exercise_id: e.exercise_id,
              custom_name: e.custom_name, custom_description: e.custom_description,
              sets: e.sets, reps: e.reps, rest_interval: e.rest_interval,
              load_suggestion: e.load_suggestion, video_url: e.video_url, sort_order: e.sort_order,
            }))
          );
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      queryClient.invalidateQueries({ queryKey: ["program-workout-counts"] });
      toast.success("Programa duplicado!");
    },
    onError: () => toast.error("Erro ao duplicar programa."),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ programId, userId }: { programId: string; userId: string }) => {
      const templateIds = programTemplateIds || [];
      if (!templateIds.length) throw new Error("Programa sem treinos para atribuir");
      for (const templateId of templateIds) {
        const { error } = await supabase.from("student_workout_assignments").upsert({
          user_id: userId, template_id: templateId, assigned_by: user!.id, active: true, seen_by_student: false,
        } as any, { onConflict: "user_id,template_id" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
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
    setForm(emptyForm);
  };

  const openEditProgram = (p: any) => {
    setEditingProgram(p.id);
    setForm({
      title: p.title, details: p.details || "",
      objective: p.objective || "general", difficulty: p.difficulty || "intermediate",
      status: p.status || "published",
    });
    setProgramDialog(true);
  };

  const getObjectiveLabel = (v: string) => OBJECTIVES.find(o => o.value === v)?.label || v;
  const getDifficultyInfo = (v: string) => DIFFICULTIES.find(d => d.value === v) || DIFFICULTIES[1];

  const selectedProgram = (programs || []).find((p: any) => p.id === selectedProgramId);

  const filteredPrograms = (programs || []).filter((p: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.details || "").toLowerCase().includes(q);
  });

  if (selectedProgram) {
    return (
      <DashboardLayout role={(role as any) || "admin"} title={selectedProgram.title} subtitle="Gerencie os treinos deste programa.">
        <div className="max-w-5xl">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => setSelectedProgramId(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar aos programas
          </Button>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">{getObjectiveLabel(selectedProgram.objective || "general")}</Badge>
            <Badge variant="outline" className={getDifficultyInfo(selectedProgram.difficulty || "intermediate").color}>
              {getDifficultyInfo(selectedProgram.difficulty || "intermediate").label}
            </Badge>
            {selectedProgram.status === "draft" && <Badge variant="secondary">Rascunho</Badge>}
          </div>
          <ProgramWorkouts programId={selectedProgram.id} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={(role as any) || "admin"} title="Programas de Treino" subtitle="Crie programas com múltiplos treinos e atribua aos alunos.">
      <div className="space-y-4 max-w-5xl">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar programa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => { setForm(emptyForm); setEditingProgram(null); setProgramDialog(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Novo Programa
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : filteredPrograms.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Layers className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">{searchQuery ? "Nenhum resultado." : "Nenhum programa criado."}</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredPrograms.map((p: any) => {
              const wCount = workoutCounts?.[p.id] || 0;
              const diffInfo = getDifficultyInfo(p.difficulty || "intermediate");
              return (
                <Card key={p.id} className="group hover:shadow-md transition-all hover:border-primary/30 cursor-pointer" onClick={() => setSelectedProgramId(p.id)}>
                  <CardContent className="py-5">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 shrink-0">
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">{p.title}</p>
                          {p.status === "draft" && <Badge variant="secondary" className="text-[10px] shrink-0">Rascunho</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <Badge variant="outline" className="text-[10px]">{getObjectiveLabel(p.objective || "general")}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${diffInfo.color}`}>{diffInfo.label}</Badge>
                          <Badge variant="outline" className="text-[10px]">{wCount} treino(s)</Badge>
                        </div>
                        {p.details && <p className="text-xs text-muted-foreground line-clamp-2">{p.details}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex gap-1 mt-3 pt-3 border-t justify-end" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setAssignDialog(p.id)}>
                        <Users className="w-3 h-3 mr-1" /> Atribuir
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => duplicateProgramMutation.mutate(p.id)} disabled={duplicateProgramMutation.isPending}>
                        <Copy className="w-3 h-3 mr-1" /> Duplicar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => openEditProgram(p)}>
                        <Pencil className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive hover:text-destructive">
                            <Trash2 className="w-3 h-3 mr-1" /> Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir programa?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso removerá o programa "{p.title}" e todos os treinos associados. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteProgramMutation.mutate(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Objetivo</Label>
                  <Select value={form.objective} onValueChange={v => setForm(p => ({ ...p, objective: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OBJECTIVES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dificuldade</Label>
                  <Select value={form.difficulty} onValueChange={v => setForm(p => ({ ...p, difficulty: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
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
