import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Search, GripVertical, Video, ChevronDown, ChevronUp, Copy, FileText } from "lucide-react";
import ExerciseLibraryPicker from "@/components/admin/ExerciseLibraryPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Exercise {
  id?: string;
  name: string;
  video_url: string;
  description: string;
  sets: string;
  reps: string;
  rest_interval: string;
  load_suggestion: string;
  notes: string;
  sort_order: number;
  week_id?: string;
}

const emptyExercise = (): Exercise => ({
  name: "", video_url: "", description: "", sets: "", reps: "",
  rest_interval: "", load_suggestion: "", notes: "", sort_order: 0,
});

const getEmbedUrl = (url: string) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
};

const AdminTraining = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [returnToEdit, setReturnToEdit] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [weekName, setWeekName] = useState("");
  const [weekDialogOpen, setWeekDialogOpen] = useState(false);
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateTargetId, setDuplicateTargetId] = useState<string | null>(null);
  const [textEditorOpen, setTextEditorOpen] = useState(false);
  const [textEditorWeekId, setTextEditorWeekId] = useState<string | null>(null);
  const [textEditorContent, setTextEditorContent] = useState("");

  const { data: students } = useQuery({
    queryKey: ["admin-students-training-list"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email");
      const { data: weeks } = await supabase.from("training_weeks").select("user_id");
      const weekCounts: Record<string, number> = {};
      (weeks || []).forEach((w: any) => { weekCounts[w.user_id] = (weekCounts[w.user_id] || 0) + 1; });
      return (profiles || []).map((p: any) => ({
        ...p,
        weekCount: weekCounts[p.user_id] || 0,
        initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
      }));
    },
  });

  const { data: weeks } = useQuery({
    queryKey: ["admin-training-weeks", selectedStudent?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_weeks")
        .select("*")
        .eq("user_id", selectedStudent!.user_id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!selectedStudent?.user_id && manageOpen,
  });

  const { data: exercises } = useQuery({
    queryKey: ["admin-training-exercises", selectedStudent?.user_id],
    queryFn: async () => {
      if (!weeks?.length) return [];
      const weekIds = weeks.map((w: any) => w.id);
      const { data } = await supabase
        .from("training_exercises")
        .select("*")
        .in("week_id", weekIds)
        .order("sort_order");
      return data || [];
    },
    enabled: !!weeks?.length,
  });

  // Auto-select student from URL param
  useEffect(() => {
    const uid = searchParams.get("uid");
    if (uid && students?.length && !selectedStudent) {
      const found = students.find((s: any) => s.user_id === uid);
      if (found) {
        const shouldReturn = searchParams.get("return") === "edit";
        if (shouldReturn) setReturnToEdit(uid);
        setSelectedStudent(found);
        setManageOpen(true);
        setExpandedWeeks(new Set());
        searchParams.delete("uid");
        searchParams.delete("return");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [students, searchParams]);

  const openManage = (student: any) => {
    setSelectedStudent(student);
    setManageOpen(true);
    setExpandedWeeks(new Set());
  };

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      next.has(weekId) ? next.delete(weekId) : next.add(weekId);
      return next;
    });
  };

  // Week mutations
  const saveWeekMutation = useMutation({
    mutationFn: async () => {
      if (editingWeekId) {
        await supabase.from("training_weeks").update({ name: weekName }).eq("id", editingWeekId);
      } else {
        const maxOrder = (weeks || []).reduce((m: number, w: any) => Math.max(m, w.sort_order), -1);
        await supabase.from("training_weeks").insert({ user_id: selectedStudent.user_id, name: weekName, sort_order: maxOrder + 1 });
      }
    },
    onSuccess: () => {
      toast.success("Treino salvo!");
      qc.invalidateQueries({ queryKey: ["admin-training-weeks"] });
      qc.invalidateQueries({ queryKey: ["admin-students-training-list"] });
      setWeekDialogOpen(false);
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const deleteWeekMutation = useMutation({
    mutationFn: async (weekId: string) => {
      await supabase.from("training_exercises").delete().eq("week_id", weekId);
      await supabase.from("training_weeks").delete().eq("id", weekId);
    },
    onSuccess: () => {
      toast.success("Treino removido!");
      qc.invalidateQueries({ queryKey: ["admin-training-weeks"] });
      qc.invalidateQueries({ queryKey: ["admin-training-exercises"] });
      qc.invalidateQueries({ queryKey: ["admin-students-training-list"] });
    },
  });

  // Exercise mutations
  const saveExerciseMutation = useMutation({
    mutationFn: async () => {
      if (!editingExercise || !activeWeekId) return;
      const payload = {
        name: editingExercise.name,
        video_url: editingExercise.video_url,
        description: editingExercise.description,
        sets: editingExercise.sets,
        reps: editingExercise.reps,
        rest_interval: editingExercise.rest_interval,
        load_suggestion: editingExercise.load_suggestion,
        notes: editingExercise.notes,
        sort_order: editingExercise.sort_order,
        week_id: activeWeekId,
      };
      if (editingExercise.id) {
        await supabase.from("training_exercises").update(payload).eq("id", editingExercise.id);
      } else {
        const weekExercises = (exercises || []).filter((e: any) => e.week_id === activeWeekId);
        const maxOrder = weekExercises.reduce((m: number, e: any) => Math.max(m, e.sort_order), -1);
        await supabase.from("training_exercises").insert({ ...payload, sort_order: maxOrder + 1 });
      }
    },
    onSuccess: () => {
      toast.success("Exercício salvo!");
      qc.invalidateQueries({ queryKey: ["admin-training-exercises"] });
      setExerciseDialogOpen(false);
    },
    onError: () => toast.error("Erro ao salvar exercício"),
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("training_exercises").delete().eq("id", id);
    },
    onSuccess: () => {
      toast.success("Exercício removido!");
      qc.invalidateQueries({ queryKey: ["admin-training-exercises"] });
    },
  });

  const moveExercise = async (exerciseId: string, weekId: string, direction: "up" | "down") => {
    const weekExercises = (exercises || []).filter((e: any) => e.week_id === weekId).sort((a: any, b: any) => a.sort_order - b.sort_order);
    const idx = weekExercises.findIndex((e: any) => e.id === exerciseId);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === weekExercises.length - 1)) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const a = weekExercises[idx], b = weekExercises[swapIdx];
    await supabase.from("training_exercises").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("training_exercises").update({ sort_order: a.sort_order }).eq("id", b.id);
    qc.invalidateQueries({ queryKey: ["admin-training-exercises"] });
  };

  const duplicateTrainingMutation = useMutation({
    mutationFn: async () => {
      if (!duplicateTargetId || !weeks?.length) return;
      for (const week of weeks) {
        const { data: newWeek } = await supabase
          .from("training_weeks")
          .insert({ user_id: duplicateTargetId, name: week.name, sort_order: week.sort_order })
          .select()
          .single();
        if (!newWeek) continue;
        const weekExercises = (exercises || []).filter((e: any) => e.week_id === week.id);
        if (weekExercises.length > 0) {
          await supabase.from("training_exercises").insert(
            weekExercises.map((ex: any) => ({
              week_id: newWeek.id,
              name: ex.name,
              video_url: ex.video_url || "",
              description: ex.description || "",
              sets: ex.sets || "",
              reps: ex.reps || "",
              rest_interval: ex.rest_interval || "",
              load_suggestion: ex.load_suggestion || "",
              notes: ex.notes || "",
              sort_order: ex.sort_order,
            }))
          );
        }
      }
    },
    onSuccess: () => {
      toast.success("Treino duplicado com sucesso!");
      qc.invalidateQueries({ queryKey: ["admin-students-training-list"] });
      setDuplicateDialogOpen(false);
      setDuplicateTargetId(null);
    },
    onError: () => toast.error("Erro ao duplicar treino"),
  });

  const openNewExercise = (weekId: string) => {
    setActiveWeekId(weekId);
    setEditingExercise(emptyExercise());
    setExerciseDialogOpen(true);
  };

  const openEditExercise = (exercise: any) => {
    setActiveWeekId(exercise.week_id);
    setEditingExercise({ ...exercise });
    setExerciseDialogOpen(true);
  };

  const openTextEditor = (weekId: string) => {
    const weekExercises = (exercises || []).filter((e: any) => e.week_id === weekId).sort((a: any, b: any) => a.sort_order - b.sort_order);
    const text = weekExercises.map((ex: any) => {
      const parts = [ex.name];
      if (ex.reps) parts.push(ex.reps);
      if (ex.rest_interval) parts.push(`Int: ${ex.rest_interval}`);
      if (ex.load_suggestion) parts.push(`Carga: ${ex.load_suggestion}`);
      if (ex.video_url) parts.push(`Video: ${ex.video_url}`);
      if (ex.notes) parts.push(`Obs: ${ex.notes}`);
      return parts.join(" | ");
    }).join("\n");
    setTextEditorWeekId(weekId);
    setTextEditorContent(text);
    setTextEditorOpen(true);
  };

  const saveTextExercisesMutation = useMutation({
    mutationFn: async () => {
      if (!textEditorWeekId) return;
      const lines = textEditorContent.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      const parsed = lines.map((line, i) => {
        const parts = line.split("|").map(p => p.trim());
        const name = parts[0] || "Exercício";
        let reps = "", rest_interval = "", load_suggestion = "", video_url = "", notes = "";
        for (let j = 1; j < parts.length; j++) {
          const p = parts[j];
          if (p.toLowerCase().startsWith("int:")) rest_interval = p.slice(4).trim();
          else if (p.toLowerCase().startsWith("carga:")) load_suggestion = p.slice(6).trim();
          else if (p.toLowerCase().startsWith("video:")) video_url = p.slice(6).trim();
          else if (p.toLowerCase().startsWith("obs:")) notes = p.slice(4).trim();
          else if (!reps) reps = p;
          else notes = notes ? `${notes}; ${p}` : p;
        }
        return { week_id: textEditorWeekId!, name, reps, rest_interval, load_suggestion, video_url, notes, sets: "", description: "", sort_order: i };
      });
      await supabase.from("training_exercises").delete().eq("week_id", textEditorWeekId);
      if (parsed.length > 0) {
        const { error } = await supabase.from("training_exercises").insert(parsed);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Exercícios atualizados por texto!");
      qc.invalidateQueries({ queryKey: ["admin-training-exercises"] });
      setTextEditorOpen(false);
    },
    onError: () => toast.error("Erro ao salvar exercícios"),
  });

  const embedUrl = editingExercise?.video_url ? getEmbedUrl(editingExercise.video_url) : null;

  return (
    <DashboardLayout role="admin" title="Gestão de Treinos" subtitle="Gerencie fichas de treino com exercícios, vídeos e séries.">
      {!manageOpen ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Alunos</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {search.trim().length < 2 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Digite pelo menos 2 caracteres para buscar alunos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">Aluno</TableHead>
                    <TableHead className="font-body">Treinos</TableHead>
                    <TableHead className="font-body text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students?.filter((s: any) => {
                    const q = search.toLowerCase();
                    return s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
                  }).map((s: any) => (
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
                        <Badge variant={s.weekCount > 0 ? "secondary" : "outline"} className="text-xs">
                          {s.weekCount > 0 ? `${s.weekCount} treino(s)` : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openManage(s)}>
                          <Pencil className="w-3 h-3 mr-1" /> Gerenciar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" size="sm" onClick={() => {
                if (returnToEdit && selectedStudent) {
                  navigate(`/admin/students?edit=${selectedStudent.user_id}`);
                  setReturnToEdit(null);
                } else {
                  setManageOpen(false);
                  setSelectedStudent(null);
                }
              }}>
                ← {returnToEdit ? "Voltar ao Aluno" : "Voltar"}
              </Button>
              <h2 className="font-display text-lg font-semibold mt-1">{selectedStudent?.full_name}</h2>
            </div>
            <div className="flex gap-2">
              {weeks && weeks.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => { setDuplicateTargetId(null); setDuplicateDialogOpen(true); }}>
                  <Copy className="w-4 h-4 mr-1" /> Duplicar para outro aluno
                </Button>
              )}
              <Button size="sm" onClick={() => { setEditingWeekId(null); setWeekName(""); setWeekDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Novo Treino
              </Button>
            </div>
          </div>

          {(!weeks || weeks.length === 0) && (
            <Card><CardContent className="py-8 text-center">
              <p className="text-muted-foreground font-body text-sm">Nenhum treino configurado. Clique em "Novo Treino" para começar.</p>
            </CardContent></Card>
          )}

          {weeks?.map((week: any) => {
            const weekExercises = (exercises || []).filter((e: any) => e.week_id === week.id).sort((a: any, b: any) => a.sort_order - b.sort_order);
            const isExpanded = expandedWeeks.has(week.id);
            return (
              <Card key={week.id}>
                <CardHeader className="cursor-pointer" onClick={() => toggleWeek(week.id)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-display flex items-center gap-2">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {week.name}
                      <Badge variant="outline" className="text-xs ml-2">{weekExercises.length} exercício(s)</Badge>
                    </CardTitle>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingWeekId(week.id); setWeekName(week.name); setWeekDialogOpen(true); }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Remover este treino e todos os exercícios?")) deleteWeekMutation.mutate(week.id); }}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-3">
                    {weekExercises.map((ex: any, idx: number) => (
                      <div key={ex.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex flex-col gap-1 mt-1">
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveExercise(ex.id, week.id, "up")} disabled={idx === 0}>
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <GripVertical className="w-4 h-4 text-muted-foreground mx-auto" />
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveExercise(ex.id, week.id, "down")} disabled={idx === weekExercises.length - 1}>
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">{idx + 1}.</span>
                            <p className="font-medium text-sm font-body">{ex.name}</p>
                            {ex.video_url && <Video className="w-3 h-3 text-primary" />}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                            {ex.sets && <span>Séries: {ex.sets}</span>}
                            {ex.reps && <span>• Reps: {ex.reps}</span>}
                            {ex.rest_interval && <span>• Intervalo: {ex.rest_interval}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditExercise(ex)}><Pencil className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Remover exercício?")) deleteExerciseMutation.mutate(ex.id); }}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openNewExercise(week.id)}>
                        <Plus className="w-4 h-4 mr-1" /> Adicionar Exercício
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openTextEditor(week.id)}>
                        <FileText className="w-4 h-4 mr-1" /> Editar por Texto
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Week dialog */}
      <Dialog open={weekDialogOpen} onOpenChange={setWeekDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editingWeekId ? "Editar Treino" : "Novo Treino"}</DialogTitle></DialogHeader>
          <div><Label className="font-body">Nome do treino</Label><Input value={weekName} onChange={(e) => setWeekName(e.target.value)} placeholder="Ex: Treino A - Peito e Tríceps" /></div>
          <DialogFooter>
            <Button onClick={() => saveWeekMutation.mutate()} disabled={!weekName.trim() || saveWeekMutation.isPending}>
              {saveWeekMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exercise dialog */}
      <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editingExercise?.id ? "Editar Exercício" : "Novo Exercício"}</DialogTitle></DialogHeader>
          {editingExercise && (
            <div className="space-y-4">
              {/* Exercise Library Picker */}
              {!editingExercise.id && (
                <ExerciseLibraryPicker
                  onSelect={(ex) => {
                    setEditingExercise({
                      ...editingExercise,
                      name: ex.name,
                      description: ex.description,
                      video_url: ex.video_url,
                    });
                  }}
                />
              )}
              <div>
                <Label className="font-body">Nome do exercício *</Label>
                <Input value={editingExercise.name} onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })} placeholder="Ex: Supino Barra Reta" maxLength={40} />
                <p className="text-xs text-muted-foreground text-right mt-1">{editingExercise.name.length}/40</p>
              </div>
              <div>
                <Label className="font-body">Endereço do vídeo</Label>
                <Input value={editingExercise.video_url} onChange={(e) => setEditingExercise({ ...editingExercise, video_url: e.target.value })} placeholder="https://player.vimeo.com/video/..." maxLength={200} />
                <p className="text-xs text-muted-foreground mt-1">Utilize vídeos do YouTube ou Vimeo</p>
                {embedUrl && (
                  <div className="aspect-video mt-2 rounded-lg overflow-hidden border border-border">
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="Preview" />
                  </div>
                )}
              </div>
              <div>
                <Label className="font-body">Descrição da execução</Label>
                <Textarea value={editingExercise.description} onChange={(e) => setEditingExercise({ ...editingExercise, description: e.target.value })} rows={5} placeholder="Descreva a técnica de execução..." maxLength={800} />
                <p className="text-xs text-muted-foreground text-right mt-1">{editingExercise.description.length}/800</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-body">Séries x Repetições</Label>
                  <Input value={editingExercise.reps} onChange={(e) => setEditingExercise({ ...editingExercise, reps: e.target.value })} placeholder="4x15/12/10/8" maxLength={100} />
                </div>
                <div>
                  <Label className="font-body">Intervalo</Label>
                  <Input value={editingExercise.rest_interval} onChange={(e) => setEditingExercise({ ...editingExercise, rest_interval: e.target.value })} placeholder="60s" maxLength={20} />
                </div>
              </div>
              <div>
                <Label className="font-body">Sugestão de carga (opcional)</Label>
                <Input value={editingExercise.load_suggestion} onChange={(e) => setEditingExercise({ ...editingExercise, load_suggestion: e.target.value })} placeholder="Progressão de carga..." maxLength={100} />
              </div>
              <div>
                <Label className="font-body">Observações</Label>
                <Textarea value={editingExercise.notes} onChange={(e) => setEditingExercise({ ...editingExercise, notes: e.target.value })} rows={2} placeholder="Notas adicionais..." />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {editingExercise?.id && (
              <Button variant="destructive" size="sm" onClick={() => { deleteExerciseMutation.mutate(editingExercise.id!); setExerciseDialogOpen(false); }}>
                <Trash2 className="w-3 h-3 mr-1" /> Excluir
              </Button>
            )}
            <Button onClick={() => saveExerciseMutation.mutate()} disabled={!editingExercise?.name.trim() || saveExerciseMutation.isPending}>
              {saveExerciseMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Duplicar Treino</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-body">
            Copiar todos os treinos e exercícios de <strong>{selectedStudent?.full_name}</strong> para outro aluno.
          </p>
          <div>
            <Label className="font-body">Selecionar aluno destino</Label>
            <Select value={duplicateTargetId || ""} onValueChange={setDuplicateTargetId}>
              <SelectTrigger><SelectValue placeholder="Escolha um aluno..." /></SelectTrigger>
              <SelectContent>
                {students?.filter((s: any) => s.user_id !== selectedStudent?.user_id).map((s: any) => (
                  <SelectItem key={s.user_id} value={s.user_id}>
                    {s.full_name || s.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => duplicateTrainingMutation.mutate()} disabled={!duplicateTargetId || duplicateTrainingMutation.isPending}>
              {duplicateTrainingMutation.isPending ? "Duplicando..." : "Duplicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Text editor dialog */}
      <Dialog open={textEditorOpen} onOpenChange={setTextEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Editar Exercícios por Texto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Formato: um exercício por linha</p>
              <p>Nome | Séries/Reps | Int: intervalo | Carga: sugestão | Video: url | Obs: notas</p>
              <p className="italic">Exemplo: Supino Reto | 4x12 | Int: 60s | Carga: 40kg</p>
              <p className="text-destructive">⚠ Ao salvar, os exercícios existentes serão substituídos.</p>
            </div>
            <Textarea
              value={textEditorContent}
              onChange={(e) => setTextEditorContent(e.target.value)}
              rows={12}
              placeholder={"Supino Reto | 4x12 | Int: 60s\nPuxada Frontal | 3x15 | Int: 45s\nAgachamento | 4x10 | Int: 90s | Carga: 60kg"}
              className="font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTextEditorOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveTextExercisesMutation.mutate()} disabled={saveTextExercisesMutation.isPending}>
              {saveTextExercisesMutation.isPending ? "Salvando..." : "Salvar Exercícios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminTraining;
