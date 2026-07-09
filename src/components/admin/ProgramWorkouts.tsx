import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Dumbbell, Video, ChevronDown, ChevronUp, Copy, GripVertical, Library, Layers, Unlink, Link2 } from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SortableExerciseRow, { ExerciseRow } from "@/components/admin/SortableExerciseRow";
import LibraryMultiSelectDialog from "@/components/admin/LibraryMultiSelectDialog";
import ExerciseMediaPreview, { getExerciseMediaSource } from "@/components/admin/ExerciseMediaPreview";

const GROUP_COLOR_PRESETS = [
  { name: "Biset", color: "#f59e0b" },
  { name: "Triset", color: "#8b5cf6" },
  { name: "Drop-set", color: "#ef4444" },
  { name: "Super Série", color: "#10b981" },
  { name: "Circuito", color: "#06b6d4" },
];

interface Props {
  programId: string;
}

interface WorkoutForm {
  title: string;
  subtitle: string;
  description: string;
  released: boolean;
  weeks: string;
  days_per_week: string;
  minutes_per_day: string;
  image_url: string;
}

const emptyWorkout: WorkoutForm = {
  title: "", subtitle: "", description: "", released: true,
  weeks: "", days_per_week: "", minutes_per_day: "", image_url: "",
};

/* ---------- sortable workout card ---------- */
const SortableWorkoutCard = ({ w, wIdx, exs, libraryExercises, isExpanded, onToggle, onEdit, onDelete, onDuplicate, onToggleReleased }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: w.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex items-start gap-2">
            <button type="button" className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0 mt-1" {...attributes} {...listeners}>
              <GripVertical className="w-4 h-4" />
            </button>
            <button className="flex-1 min-w-0 text-left" onClick={onToggle}>
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {wIdx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{w.title}</p>
                    {!w.released && <Badge variant="secondary" className="text-[10px]">Bloqueado</Badge>}
                  </div>
                  {w.subtitle && <p className="text-xs text-muted-foreground truncate">{w.subtitle}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Badge variant="outline" className="text-[10px]">{exs.length} ex.</Badge>
                    {w.weeks && <Badge variant="outline" className="text-[10px]">{w.weeks} sem</Badge>}
                  </div>
                </div>
              </div>
            </button>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Switch
                checked={w.released ?? true}
                onCheckedChange={(checked) => onToggleReleased(checked)}
              />
              <div className="flex items-center gap-0.5">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7"><Copy className="w-3.5 h-3.5" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Duplicar treino?</AlertDialogTitle>
                    <AlertDialogDescription>Será criada uma cópia de "{w.title}" com todos os exercícios.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDuplicate}>Duplicar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir treino?</AlertDialogTitle>
                    <AlertDialogDescription>Isso removerá "{w.title}" e seus exercícios.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
          </div>
          {isExpanded && exs.length > 0 && (
            <div className="mt-3 border-t pt-3 space-y-2">
              {exs.map((ex: any, i: number) => {
                const lib = (libraryExercises || []).find((item: any) => item.id === ex.exercise_id);
                const media = getExerciseMediaSource({ videoUrl: ex.video_url || lib?.video_url, imageUrl: lib?.image_url });
                const prev = i > 0 ? exs[i - 1] : null;
                const next = i < exs.length - 1 ? exs[i + 1] : null;
                const linkedTop = prev && ex.group_id && prev.group_id === ex.group_id;
                const linkedBottom = next && ex.group_id && next.group_id === ex.group_id;
                return (
                  <div
                    key={ex.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-lg border border-border/60 bg-background/60 p-3 text-sm sm:grid-cols-[auto_minmax(0,1fr)_minmax(220px,320px)_auto] relative"
                    style={{ borderLeft: ex.group_color ? `4px solid ${ex.group_color}` : undefined }}
                  >
                    {linkedTop && (
                      <span className="absolute -top-1.5 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: ex.group_color || "#8b5cf6", color: "#fff" }}>
                        <Link2 className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground truncate">{ex.custom_name || lib?.name || "Sem nome"}</span>
                        {(ex.video_url || lib?.video_url || lib?.image_url) && <Video className="w-3.5 h-3.5 text-primary shrink-0" />}
                        {ex.group_name && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0"
                            style={{ backgroundColor: ex.group_color ? `${ex.group_color}22` : undefined, borderColor: ex.group_color || undefined, color: ex.group_color || undefined }}
                          >
                            {ex.group_name}
                          </Badge>
                        )}
                      </div>
                      {ex.sets && ex.reps && (
                        <div className="text-xs text-muted-foreground/90 mt-0.5">{ex.sets}×{ex.reps}</div>
                      )}
                      {ex.rest_interval && (
                        <div className="text-[11px] text-muted-foreground/60 mt-0.5">Int: {ex.rest_interval}</div>
                      )}
                    </div>
                    {media && (
                      <ExerciseMediaPreview
                        videoUrl={ex.video_url || lib?.video_url}
                        imageUrl={lib?.image_url}
                        alt={ex.custom_name || lib?.name || "Exercício"}
                        mode="player"
                        className="col-span-3 w-full aspect-video sm:col-span-1"
                        showBadge
                      />
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 self-start"
                      onClick={(e) => { e.stopPropagation(); onEdit(); }}
                      title="Editar exercício"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {linkedBottom && (
                      <span className="absolute -bottom-1.5 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: ex.group_color || "#8b5cf6", color: "#fff" }}>
                        <Link2 className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ProgramWorkouts = ({ programId }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [workoutDialog, setWorkoutDialog] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<string | null>(null);
  const [form, setForm] = useState<WorkoutForm>(emptyWorkout);
  const [exerciseRows, setExerciseRows] = useState<ExerciseRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedRowUids, setSelectedRowUids] = useState<Set<string>>(new Set());
  const [groupForm, setGroupForm] = useState({ name: "Biset", color: "#f59e0b" });

  const { data: workouts, isLoading } = useQuery({
    queryKey: ["program-workouts", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_templates")
        .select("*")
        .eq("program_id", programId)
        .order("sort_order")
        .order("created_at");
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

  const { data: templateExercisesMap } = useQuery({
    queryKey: ["template-exercises-program", programId],
    queryFn: async () => {
      const ids = (workouts || []).map((w: any) => w.id);
      if (!ids.length) return {};
      const { data } = await supabase.from("workout_template_exercises").select("*").in("template_id", ids).order("sort_order");
      return (data || []).reduce((acc: Record<string, any[]>, ex: any) => {
        (acc[ex.template_id] = acc[ex.template_id] || []).push(ex);
        return acc;
      }, {});
    },
    enabled: !!(workouts || []).length,
  });

  const saveWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Título obrigatório");
      const weeks = form.weeks ? Number(form.weeks) : null;
      const days_per_week = form.days_per_week ? Number(form.days_per_week) : null;
      const minutes_per_day = form.minutes_per_day ? Number(form.minutes_per_day) : null;
      let templateId = editingWorkout;

      if (editingWorkout) {
        const { error } = await supabase.from("workout_templates").update({
          title: form.title, subtitle: form.subtitle, description: form.description,
          released: form.released, weeks, days_per_week, minutes_per_day,
          image_url: form.image_url,
          updated_at: new Date().toISOString(),
        }).eq("id", editingWorkout);
        if (error) throw error;
        // Notify all assigned students about the update
        await supabase
          .from("student_workout_assignments")
          .update({ seen_by_student: false } as any)
          .eq("template_id", editingWorkout);
      } else {
        const sortOrder = (workouts || []).length;
        const { data, error } = await supabase.from("workout_templates").insert({
          title: form.title, subtitle: form.subtitle, description: form.description,
          released: form.released, weeks, days_per_week, minutes_per_day,
          image_url: form.image_url,
          program_id: programId, created_by: user!.id, sort_order: sortOrder,
        }).select("id").single();
        if (error) throw error;
        templateId = data.id;
      }

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
      queryClient.invalidateQueries({ queryKey: ["program-workouts", programId] });
      queryClient.invalidateQueries({ queryKey: ["template-exercises-program", programId] });
      queryClient.invalidateQueries({ queryKey: ["program-workout-counts"] });
      toast.success(editingWorkout ? "Treino atualizado!" : "Treino criado!");
      closeWorkoutDialog();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar."),
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workout_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-workouts", programId] });
      queryClient.invalidateQueries({ queryKey: ["program-workout-counts"] });
      toast.success("Treino removido!");
    },
  });

  const duplicateWorkoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const original = (workouts || []).find((w: any) => w.id === id);
      if (!original) throw new Error("Treino não encontrado");
      const { data: newW, error } = await supabase.from("workout_templates").insert({
        title: `${original.title} (Cópia)`, subtitle: original.subtitle, description: original.description,
        weeks: original.weeks, days_per_week: original.days_per_week, minutes_per_day: original.minutes_per_day,
        image_url: original.image_url || "",
        program_id: programId, created_by: user!.id, sort_order: (workouts || []).length, released: original.released,
      }).select("id").single();
      if (error) throw error;
      const exs = templateExercisesMap?.[id] || [];
      if (exs.length > 0) {
        await supabase.from("workout_template_exercises").insert(
          exs.map((e: any) => ({
            template_id: newW.id, exercise_id: e.exercise_id,
            custom_name: e.custom_name, custom_description: e.custom_description,
            sets: e.sets, reps: e.reps, rest_interval: e.rest_interval,
            load_suggestion: e.load_suggestion, video_url: e.video_url, sort_order: e.sort_order,
            group_id: e.group_id || null, group_name: e.group_name || "", group_color: e.group_color || "",
          }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-workouts", programId] });
      queryClient.invalidateQueries({ queryKey: ["template-exercises-program", programId] });
      queryClient.invalidateQueries({ queryKey: ["program-workout-counts"] });
      toast.success("Treino duplicado!");
    },
    onError: () => toast.error("Erro ao duplicar treino."),
  });

  const toggleReleasedMutation = useMutation({
    mutationFn: async ({ id, released }: { id: string; released: boolean }) => {
      const { error } = await supabase.from("workout_templates").update({ released }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-workouts", programId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (ordered: { id: string; sort_order: number }[]) => {
      for (const item of ordered) {
        await supabase.from("workout_templates").update({ sort_order: item.sort_order }).eq("id", item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-workouts", programId] });
    },
  });

  const closeWorkoutDialog = () => {
    setWorkoutDialog(false);
    setEditingWorkout(null);
    setForm(emptyWorkout);
    setExerciseRows([]);
    setSelectedRowUids(new Set());
  };

  const openEditWorkout = (w: any) => {
    setEditingWorkout(w.id);
    setForm({
      title: w.title, subtitle: w.subtitle || "", description: w.description || "",
      released: w.released ?? true, weeks: w.weeks?.toString() || "",
      days_per_week: w.days_per_week?.toString() || "", minutes_per_day: w.minutes_per_day?.toString() || "",
      image_url: w.image_url || "",
    });
    const exs = (templateExercisesMap?.[w.id] || []).map((e: any) => ({
      id: e.id, exercise_id: e.exercise_id, custom_name: e.custom_name || "",
      custom_description: e.custom_description || "", sets: e.sets || "", reps: e.reps || "",
      rest_interval: e.rest_interval || "", load_suggestion: e.load_suggestion || "",
      video_url: e.video_url || "", sort_order: e.sort_order, _uid: e.id || crypto.randomUUID(),
      group_id: e.group_id || null, group_name: e.group_name || "", group_color: e.group_color || "",
    }));
    setExerciseRows(exs);
    setSelectedRowUids(new Set());
    setWorkoutDialog(true);
  };

  const addExerciseRow = () => {
    setExerciseRows(prev => [...prev, {
      exercise_id: null, custom_name: "", custom_description: "",
      sets: "", reps: "", rest_interval: "", load_suggestion: "", video_url: "",
      sort_order: prev.length, _uid: crypto.randomUUID(),
      group_id: null, group_name: "", group_color: "",
    }]);
  };

  const addFromLibrary = (items: any[]) => {
    setExerciseRows(prev => [
      ...prev,
      ...items.map((lib, i) => ({
        exercise_id: lib.id,
        custom_name: lib.name,
        custom_description: lib.description || "",
        sets: "", reps: "", rest_interval: "", load_suggestion: "",
        video_url: lib.video_url || lib.image_url || "",
        sort_order: prev.length + i,
        _uid: crypto.randomUUID(),
        group_id: null, group_name: "", group_color: "",
      })),
    ]);
    toast.success(`${items.length} exercício(s) adicionado(s)!`);
  };

  const toggleRowSelected = (idx: number) => {
    const uid = exerciseRows[idx]?._uid;
    if (!uid) return;
    setSelectedRowUids(prev => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };

  const applyGroup = () => {
    if (selectedRowUids.size < 2) {
      toast.error("Selecione pelo menos 2 exercícios para agrupar.");
      return;
    }
    const groupId = crypto.randomUUID();
    setExerciseRows(prev => prev.map(r =>
      selectedRowUids.has(r._uid)
        ? { ...r, group_id: groupId, group_name: groupForm.name, group_color: groupForm.color }
        : r
    ));
    setSelectedRowUids(new Set());
    setGroupDialogOpen(false);
    toast.success(`Agrupados como ${groupForm.name}!`);
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

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const handleWorkoutDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const items = workouts || [];
    const oldIndex = items.findIndex((w: any) => w.id === active.id);
    const newIndex = items.findIndex((w: any) => w.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    // Optimistic update via query cache
    queryClient.setQueryData(["program-workouts", programId], reordered);
    reorderMutation.mutate(reordered.map((w: any, i: number) => ({ id: w.id, sort_order: i })));
  };

  const handleExerciseDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setExerciseRows(prev => {
      const oldIndex = prev.findIndex(r => r._uid === active.id);
      const newIndex = prev.findIndex(r => r._uid === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const removeExerciseRow = (idx: number) => setExerciseRows(prev => prev.filter((_, i) => i !== idx));
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{(workouts || []).length} treino(s)</p>
        <Button size="sm" onClick={() => { setForm(emptyWorkout); setEditingWorkout(null); setExerciseRows([]); setWorkoutDialog(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Novo Treino
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (workouts || []).length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Dumbbell className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Nenhum treino neste programa.</p>
        </CardContent></Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleWorkoutDragEnd}>
          <SortableContext items={(workouts || []).map((w: any) => w.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {(workouts || []).map((w: any, wIdx: number) => (
                <SortableWorkoutCard
                  key={w.id}
                  w={w}
                  wIdx={wIdx}
                  exs={templateExercisesMap?.[w.id] || []}
                  libraryExercises={libraryExercises || []}
                  isExpanded={expandedId === w.id}
                  onToggle={() => setExpandedId(expandedId === w.id ? null : w.id)}
                  onEdit={() => openEditWorkout(w)}
                  onDelete={() => deleteWorkoutMutation.mutate(w.id)}
                  onDuplicate={() => duplicateWorkoutMutation.mutate(w.id)}
                  onToggleReleased={(checked: boolean) => toggleReleasedMutation.mutate({ id: w.id, released: checked })}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Workout Create/Edit Dialog */}
      <Dialog open={workoutDialog} onOpenChange={v => { if (!v) closeWorkoutDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWorkout ? "Editar Treino" : "Novo Treino"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={form.released} onCheckedChange={v => setForm(p => ({ ...p, released: v }))} />
              <Label>{form.released ? "Liberado" : "Bloqueado"}</Label>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Treino A — Inferiores" />
            </div>
            <div>
              <Label>Subtítulo</Label>
              <Input value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Ex: Foco em quadríceps" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Semanas</Label>
                <Input type="number" min={1} value={form.weeks} onChange={e => setForm(p => ({ ...p, weeks: e.target.value }))} placeholder="4" />
              </div>
              <div>
                <Label>Dias/sem</Label>
                <Input type="number" min={1} max={7} value={form.days_per_week} onChange={e => setForm(p => ({ ...p, days_per_week: e.target.value }))} placeholder="3" />
              </div>
              <div>
                <Label>Min/dia</Label>
                <Input type="number" min={1} value={form.minutes_per_day} onChange={e => setForm(p => ({ ...p, minutes_per_day: e.target.value }))} placeholder="60" />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-base font-semibold">Exercícios ({exerciseRows.length})</Label>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  <Button size="sm" onClick={addExerciseRow} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/30">
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLibraryDialogOpen(true)}>
                    <Library className="w-3 h-3 mr-1" /> Biblioteca
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selectedRowUids.size < 2}
                    onClick={() => setGroupDialogOpen(true)}
                  >
                    <Layers className="w-3 h-3 mr-1" /> Agrupar ({selectedRowUids.size})
                  </Button>
                  {selectedRowUids.size > 0 && (
                    <Button size="sm" variant="ghost" onClick={ungroupSelected}>
                      <Unlink className="w-3 h-3 mr-1" /> Desagrupar
                    </Button>
                  )}
                </div>
              </div>
              {exerciseRows.length > 0 && (
                <p className="text-[11px] text-muted-foreground mb-2">
                  Marque os checkboxes dos exercícios para agrupar como Biset, Triset, Drop-set etc.
                </p>
              )}
              {exerciseRows.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum exercício. Use "Adicionar" ou "Biblioteca".</p>
              )}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleExerciseDragEnd}>
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
                        onToggleSelected={toggleRowSelected}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={closeWorkoutDialog}>Cancelar</Button>
              <Button onClick={() => saveWorkoutMutation.mutate()} disabled={saveWorkoutMutation.isPending}>
                {saveWorkoutMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LibraryMultiSelectDialog
        open={libraryDialogOpen}
        onOpenChange={setLibraryDialogOpen}
        libraryExercises={libraryExercises || []}
        onAdd={addFromLibrary}
      />

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agrupar exercícios ({selectedRowUids.size})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome do agrupamento</Label>
              <Input value={groupForm.name} maxLength={40} onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Tipo / Cor</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {GROUP_COLOR_PRESETS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setGroupForm({ name: p.name, color: p.color })}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${groupForm.color === p.color ? "ring-2 ring-offset-1 ring-offset-background" : ""}`}
                    style={{ backgroundColor: `${p.color}22`, borderColor: p.color, color: p.color }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Label className="text-xs">Cor customizada:</Label>
                <input type="color" value={groupForm.color} onChange={e => setGroupForm(p => ({ ...p, color: e.target.value }))} className="w-10 h-8 rounded border cursor-pointer" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>Cancelar</Button>
              <Button onClick={applyGroup}>Salvar série</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgramWorkouts;
