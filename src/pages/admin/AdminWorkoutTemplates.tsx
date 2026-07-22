import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Dumbbell, Users, Video, Layers, X } from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import SortableExerciseRow, { ExerciseRow } from "@/components/admin/SortableExerciseRow";
import { normalizeSearch } from "@/lib/utils";
import ExerciseMediaPreview from "@/components/admin/ExerciseMediaPreview";
import ImportFromSuperCoachDialog from "@/components/admin/ImportFromSuperCoachDialog";

interface TemplateForm {
  title: string;
  description: string;
  weeks: string;
  days_per_week: string;
  minutes_per_day: string;
}

const emptyTemplate: TemplateForm = { title: "", description: "", weeks: "", days_per_week: "", minutes_per_day: "" };

const AdminWorkoutTemplates = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyTemplate);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exerciseRows, setExerciseRows] = useState<ExerciseRow[]>([]);
  const [selectedRowUids, setSelectedRowUids] = useState<Set<string>>(new Set());
  const [assignDialog, setAssignDialog] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["workout-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("workout_templates").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: libraryExercises } = useQuery({
    queryKey: ["exercise-library"],
    queryFn: async () => {
      const { data } = await supabase.from("exercise_library").select("*").order("name");
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

  const { data: templateExercisesMap } = useQuery({
    queryKey: ["template-exercises-all"],
    queryFn: async () => {
      const { data } = await supabase.from("workout_template_exercises").select("*").order("sort_order");
      return (data || []).reduce((acc: Record<string, any[]>, ex: any) => {
        (acc[ex.template_id] = acc[ex.template_id] || []).push(ex);
        return acc;
      }, {});
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["workout-assignments-all"],
    queryFn: async () => {
      const { data } = await supabase.from("student_workout_assignments").select("*");
      return data || [];
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Título obrigatório");
      const weeks = form.weeks ? Number(form.weeks) : null;
      const days_per_week = form.days_per_week ? Number(form.days_per_week) : null;
      const minutes_per_day = form.minutes_per_day ? Number(form.minutes_per_day) : null;
      let templateId = editingTemplate;
      if (editingTemplate) {
        const { error } = await supabase.from("workout_templates").update({
          title: form.title, description: form.description,
          weeks, days_per_week, minutes_per_day, updated_at: new Date().toISOString(),
        }).eq("id", editingTemplate);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("workout_templates").insert({
          title: form.title, description: form.description,
          weeks, days_per_week, minutes_per_day, created_by: user!.id,
        }).select("id").single();
        if (error) throw error;
        templateId = data.id;
      }
      // Save exercises
      if (templateId) {
        await supabase.from("workout_template_exercises").delete().eq("template_id", templateId);
        if (exerciseRows.length > 0) {
          const rows = exerciseRows.map((r, i) => ({
            template_id: templateId!,
            exercise_id: r.exercise_id || null,
            custom_name: r.custom_name, custom_description: r.custom_description,
            sets: r.sets, reps: r.reps, rest_interval: r.rest_interval,
            load_suggestion: r.load_suggestion, video_url: r.video_url, sort_order: i,
            group_id: r.group_id || null,
            group_name: r.group_name || "",
            group_color: r.group_color || "",
          }));
          const { error: exErr } = await supabase.from("workout_template_exercises").insert(rows);
          if (exErr) throw exErr;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
      queryClient.invalidateQueries({ queryKey: ["template-exercises-all"] });
      toast.success(editingTemplate ? "Modelo atualizado!" : "Modelo criado!");
      closeTemplateDialog();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar modelo."),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workout_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
      toast.success("Modelo removido!");
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ templateId, userId }: { templateId: string; userId: string }) => {
      const { error } = await supabase.from("student_workout_assignments").upsert({
        user_id: userId, template_id: templateId, assigned_by: user!.id, active: true, seen_by_student: false,
      } as any, { onConflict: "user_id,template_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-assignments-all"] });
      toast.success("Treino atribuído ao aluno!");
      setAssignDialog(null);
      setSelectedStudent("");
    },
    onError: () => toast.error("Erro ao atribuir treino."),
  });

  const closeTemplateDialog = () => {
    setTemplateDialog(false);
    setEditingTemplate(null);
    setForm(emptyTemplate);
    setExerciseRows([]);
    setSelectedRowUids(new Set());
  };

  const openEditTemplate = (t: any) => {
    setEditingTemplate(t.id);
    setForm({ title: t.title, description: t.description || "", weeks: t.weeks?.toString() || "", days_per_week: t.days_per_week?.toString() || "", minutes_per_day: t.minutes_per_day?.toString() || "" });
    const exs = (templateExercisesMap?.[t.id] || []).map((e: any) => ({
      id: e.id, exercise_id: e.exercise_id, custom_name: e.custom_name || "",
      custom_description: e.custom_description || "", sets: e.sets || "", reps: e.reps || "",
      rest_interval: e.rest_interval || "", load_suggestion: e.load_suggestion || "",
      video_url: e.video_url || "", sort_order: e.sort_order,
      group_id: e.group_id || null, group_name: e.group_name || "", group_color: e.group_color || "",
      _uid: e.id || crypto.randomUUID(),
    }));
    setExerciseRows(exs);
    setSelectedRowUids(new Set());
    setTemplateDialog(true);
  };

  const addExerciseRow = () => {
    setExerciseRows(prev => [...prev, {
      exercise_id: null, custom_name: "", custom_description: "",
      sets: "", reps: "", rest_interval: "", load_suggestion: "", video_url: "", sort_order: prev.length,
      group_id: null, group_name: "", group_color: "",
      _uid: crypto.randomUUID(),
    }]);
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setExerciseRows(prev => {
      const oldIndex = prev.findIndex(r => r._uid === active.id);
      const newIndex = prev.findIndex(r => r._uid === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const removeExerciseRow = (idx: number) => setExerciseRows(prev => prev.filter((_, i) => i !== idx));

  const toggleSelected = (idx: number) => {
    const uid = exerciseRows[idx]?._uid;
    if (!uid) return;
    setSelectedRowUids(prev => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };

  const quickGroup = (name: string, color: string, minCount: number) => {
    if (selectedRowUids.size < minCount) {
      toast.error(`Selecione pelo menos ${minCount} exercícios para ${name}.`);
      return;
    }
    const groupId = crypto.randomUUID();
    setExerciseRows(prev => prev.map(r =>
      selectedRowUids.has(r._uid)
        ? { ...r, group_id: groupId, group_name: name, group_color: color }
        : r
    ));
    const count = selectedRowUids.size;
    setSelectedRowUids(new Set());
    toast.success(`${name} criado com ${count} exercícios!`);
  };

  const ungroupSelected = () => {
    if (!selectedRowUids.size) return;
    setExerciseRows(prev => prev.map(r =>
      selectedRowUids.has(r._uid)
        ? { ...r, group_id: null, group_name: "", group_color: "" }
        : r
    ));
    setSelectedRowUids(new Set());
    toast.success("Desagrupado!");
  };

  const updateExerciseRow = (idx: number, field: keyof ExerciseRow, value: string | null) => {
    setExerciseRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const selectFromLibrary = (idx: number, exerciseId: string) => {
    const lib = libraryExercises?.find((e: any) => e.id === exerciseId);
    if (!lib) return;
    setExerciseRows(prev => prev.map((r, i) => i === idx ? {
      ...r, exercise_id: exerciseId, custom_name: lib.name,
      custom_description: lib.description || "", video_url: lib.video_url || lib.image_url || "",
    } : r));
  };

  const getAssignedCount = (templateId: string) =>
    (assignments || []).filter((a: any) => a.template_id === templateId && a.active).length;

  return (
    <DashboardLayout role={(role as any) || "admin"} title="Modelos de Treino" subtitle="Crie treinos reutilizáveis e atribua aos alunos.">
      <div className="space-y-4 max-w-5xl">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{(templates || []).length} modelo(s)</p>
          <div className="flex gap-2">
          <ImportFromSuperCoachDialog libraryExercises={libraryExercises || []} onImported={() => queryClient.invalidateQueries({ queryKey: ["workout-templates"] })} />
          <Dialog open={templateDialog} onOpenChange={v => { if (!v) closeTemplateDialog(); else { setForm(emptyTemplate); setEditingTemplate(null); setExerciseRows([]); setTemplateDialog(true); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-1" /> Novo Modelo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Editar Modelo" : "Novo Modelo de Treino"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Treino Hipertrofia A" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Semanas</Label>
                    <Input type="number" min={1} value={form.weeks} onChange={e => setForm(p => ({ ...p, weeks: e.target.value }))} placeholder="Ex: 4" />
                  </div>
                  <div>
                    <Label>Dias/semana</Label>
                    <Input type="number" min={1} max={7} value={form.days_per_week} onChange={e => setForm(p => ({ ...p, days_per_week: e.target.value }))} placeholder="Ex: 3" />
                  </div>
                  <div>
                    <Label>Min/dia</Label>
                    <Input type="number" min={1} value={form.minutes_per_day} onChange={e => setForm(p => ({ ...p, minutes_per_day: e.target.value }))} placeholder="Ex: 60" />
                  </div>
                </div>

                {/* Exercises */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-base font-semibold">Exercícios</Label>
                    <Button size="sm" variant="outline" onClick={addExerciseRow}>
                      <Plus className="w-3 h-3 mr-1" /> Adicionar
                    </Button>
                  </div>
                  {exerciseRows.length > 0 && (
                    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        {selectedRowUids.size > 0
                          ? `${selectedRowUids.size} selecionado(s)`
                          : "Marque exercícios para agrupar:"}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-amber-500/60 text-amber-600 hover:bg-amber-500/10"
                        disabled={selectedRowUids.size < 2}
                        onClick={() => quickGroup("Biset", "#f59e0b", 2)}
                        title="Agrupar seleção como Biset (2+ exercícios)"
                      >
                        <Layers className="w-3 h-3 mr-1" /> Biset
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-violet-500/60 text-violet-600 hover:bg-violet-500/10"
                        disabled={selectedRowUids.size < 3}
                        onClick={() => quickGroup("Triset", "#8b5cf6", 3)}
                        title="Agrupar seleção como Triset (3+ exercícios)"
                      >
                        <Layers className="w-3 h-3 mr-1" /> Triset
                      </Button>
                      {selectedRowUids.size > 0 && (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={ungroupSelected}>
                            Desagrupar
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedRowUids(new Set())}>
                            <X className="w-3 h-3 mr-1" /> Limpar
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                  {exerciseRows.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum exercício. Clique em "Adicionar".</p>
                  )}
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={exerciseRows.map(r => r._uid)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4">
                        {exerciseRows.map((row, idx) => (
                          <SortableExerciseRow
                            key={row._uid}
                            row={row}
                            idx={idx}
                            libraryExercises={libraryExercises || []}
                            onRemove={removeExerciseRow}
                            onUpdate={updateExerciseRow}
                            onSelectFromLibrary={selectFromLibrary}
                            selected={selectedRowUids.has(row._uid)}
                            onToggleSelected={toggleSelected}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={closeTemplateDialog}>Cancelar</Button>
                  <Button onClick={() => saveTemplateMutation.mutate()} disabled={saveTemplateMutation.isPending}>
                    {saveTemplateMutation.isPending ? "Salvando..." : "Salvar Modelo"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Template List */}
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : (templates || []).length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Dumbbell className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum modelo de treino criado.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {(templates || []).map((t: any) => {
              const exs = templateExercisesMap?.[t.id] || [];
              const isExpanded = expandedId === t.id;
              const assignedCount = getAssignedCount(t.id);
              return (
                <Card key={t.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <button className="flex-1 text-left" onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-5 h-5 text-primary shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{t.title}</p>
                            <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                              <span>{t.weeks ? `${t.weeks}sem` : ""}{t.days_per_week ? ` • ${t.days_per_week}x/sem` : ""}{t.minutes_per_day ? ` • ${t.minutes_per_day}min` : ""}</span>
                              <Badge variant="outline" className="text-xs">{exs.length} exercício(s)</Badge>
                              {assignedCount > 0 && <Badge variant="secondary" className="text-xs"><Users className="w-3 h-3 mr-0.5" />{assignedCount}</Badge>}
                            </div>
                          </div>
                        </div>
                      </button>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setAssignDialog(t.id)}>
                          <Users className="w-3.5 h-3.5 mr-1" /> Atribuir
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEditTemplate(t)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteTemplateMutation.mutate(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </div>
                    {isExpanded && exs.length > 0 && (
                      <div className="mt-3 border-t pt-3 space-y-2">
                        {exs.map((ex: any, i: number) => {
                          const lib = (libraryExercises || []).find((item: any) => item.id === ex.exercise_id);
                          return (
                            <div key={ex.id} className="flex items-center gap-2 text-sm">
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                              <ExerciseMediaPreview
                                videoUrl={ex.video_url || lib?.video_url}
                                imageUrl={lib?.image_url}
                                alt={ex.custom_name || lib?.name || "Exercício"}
                                className="w-14 h-14 shrink-0"
                                showBadge
                              />
                              <span className="font-medium">{ex.custom_name || lib?.name || "Sem nome"}</span>
                              {ex.sets && ex.reps && <span className="text-muted-foreground">{ex.sets}x{ex.reps}</span>}
                              {(ex.video_url || lib?.video_url || lib?.image_url) && <Video className="w-3.5 h-3.5 text-primary" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Assign Dialog */}
        <Dialog open={!!assignDialog} onOpenChange={v => { if (!v) { setAssignDialog(null); setSelectedStudent(""); setStudentSearch(""); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Atribuir Treino ao Aluno</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Buscar Aluno</Label>
                <Input
                  placeholder="Filtrar por nome ou email..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="mb-2"
                />
                <Label>Selecionar Aluno</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger><SelectValue placeholder="Escolha um aluno..." /></SelectTrigger>
                  <SelectContent>
                    {(students || [])
                      .filter((s: any) => {
                        if (!studentSearch) return true;
                        const q = normalizeSearch(studentSearch);
                        return normalizeSearch(s.full_name).includes(q) || normalizeSearch(s.email).includes(q);
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
                  onClick={() => assignDialog && assignMutation.mutate({ templateId: assignDialog, userId: selectedStudent })}>
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

export default AdminWorkoutTemplates;
