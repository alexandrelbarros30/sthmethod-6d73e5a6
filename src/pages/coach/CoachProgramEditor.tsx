import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronUp, Eye, GripVertical, Link2, Plus, Trash2, UserPlus } from "lucide-react";
import CoachLayout from "@/components/coach/CoachLayout";
import CoachExerciseSearch, { PickedExercise } from "@/components/coach/CoachExerciseSearch";
import StudentWorkoutView from "@/components/coach/StudentWorkoutView";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCoachContext } from "@/hooks/useCoachTenant";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);

const CoachProgramEditor = () => {
  const { programId } = useParams();
  const qc = useQueryClient();
  const { tenant } = useCoachContext();
  const tenantId = tenant?.id;
  const [openWorkout, setOpenWorkout] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ start_date: today(), end_date: "" });
  const [selected, setSelected] = useState<string[]>([]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["coach-program", programId] });
    qc.invalidateQueries({ queryKey: ["coach-programs"] });
  };

  const { data, isLoading } = useQuery({
    queryKey: ["coach-program", programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data: program, error } = await supabase
        .from("coach_programs")
        .select("id, name, goal, weeks, description, tenant_id")
        .eq("id", programId!)
        .maybeSingle();
      if (error) throw error;
      const { data: workouts } = await supabase
        .from("coach_workouts")
        .select("id, name, day_label, notes, order_index")
        .eq("program_id", programId!)
        .order("order_index");
      const ids = (workouts || []).map((w: any) => w.id);
      const { data: exercises } = ids.length
        ? await supabase
            .from("coach_workout_exercises")
            .select("*")
            .in("workout_id", ids)
            .order("order_index")
        : { data: [] as any[] };
      const { data: assignments } = await supabase
        .from("coach_student_programs")
        .select("id, student_id, start_date, end_date, active")
        .eq("program_id", programId!);
      return { program, workouts: workouts || [], exercises: exercises || [], assignments: assignments || [] };
    },
  });

  const { data: students } = useQuery({
    queryKey: ["coach-students-min", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data } = await supabase
        .from("coach_students")
        .select("id, full_name, status")
        .eq("tenant_id", tenantId!)
        .order("full_name");
      return data || [];
    },
  });

  const addWorkout = async () => {
    if (!tenantId || !programId) return;
    const order = (data?.workouts.length || 0);
    const { data: created, error } = await supabase.from("coach_workouts").insert({
      tenant_id: tenantId,
      program_id: programId,
      name: `Treino ${String.fromCharCode(65 + order)}`,
      order_index: order,
    }).select("id").single();
    if (error) return toast.error(error.message);
    setOpenWorkout(created.id);
    invalidate();
  };

  const updateWorkout = async (id: string, patch: any) => {
    const { error } = await supabase.from("coach_workouts").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
  };

  const deleteWorkout = async (id: string) => {
    if (!confirm("Excluir este treino?")) return;
    const { error } = await supabase.from("coach_workouts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
  };

  const addExercise = async (workoutId: string, ex: PickedExercise) => {
    if (!tenantId) return;
    const count = (data?.exercises || []).filter((e: any) => e.workout_id === workoutId).length;
    const { error } = await supabase.from("coach_workout_exercises").insert({
      tenant_id: tenantId,
      workout_id: workoutId,
      name: ex.name,
      source: ex.source,
      media_url: ex.media_url,
      thumb_url: ex.thumb_url,
      muscle_group: ex.muscle_group,
      order_index: count,
    });
    if (error) return toast.error(error.message);
    invalidate();
  };

  const updateExercise = async (id: string, patch: any) => {
    const { error } = await supabase.from("coach_workout_exercises").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
  };

  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from("coach_workout_exercises").delete().eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
  };

  const moveExercise = async (workoutId: string, id: string, dir: -1 | 1) => {
    const list = (data?.exercises || []).filter((e: any) => e.workout_id === workoutId);
    const idx = list.findIndex((e: any) => e.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= list.length) return;
    await Promise.all([
      supabase.from("coach_workout_exercises").update({ order_index: target }).eq("id", list[idx].id),
      supabase.from("coach_workout_exercises").update({ order_index: idx }).eq("id", list[target].id),
    ]);
    invalidate();
  };

  const groupWith = async (workoutId: string, id: string, type: "biset" | "triset") => {
    const list = (data?.exercises || []).filter((e: any) => e.workout_id === workoutId);
    const idx = list.findIndex((e: any) => e.id === id);
    const size = type === "biset" ? 2 : 3;
    const slice = list.slice(idx, idx + size);
    if (slice.length < size) return toast.error(`Adicione ${size} exercícios em sequência para o ${type}`);
    const key = crypto.randomUUID();
    await Promise.all(
      slice.map((e: any) => supabase.from("coach_workout_exercises").update({ group_type: type, group_key: key }).eq("id", e.id))
    );
    invalidate();
  };

  const ungroup = async (workoutId: string, key: string) => {
    await supabase.from("coach_workout_exercises")
      .update({ group_type: "single", group_key: null })
      .eq("workout_id", workoutId).eq("group_key", key);
    invalidate();
  };

  const assign = async () => {
    if (!tenantId || !programId || !selected.length) return;
    const rows = selected.map((student_id) => ({
      tenant_id: tenantId,
      program_id: programId,
      student_id,
      start_date: assignForm.start_date || null,
      end_date: assignForm.end_date || null,
      active: true,
    }));
    const { error } = await supabase.from("coach_student_programs").upsert(rows, { onConflict: "student_id,program_id" });
    if (error) return toast.error(error.message);
    toast.success("Programa atribuído");
    setAssignOpen(false);
    setSelected([]);
    invalidate();
  };

  const unassign = async (id: string) => {
    const { error } = await supabase.from("coach_student_programs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
  };

  const program = data?.program;
  const assignedIds = new Set((data?.assignments || []).map((a: any) => a.student_id));

  return (
    <CoachLayout
      title={program?.name || (isLoading ? "Carregando…" : "Programa")}
      subtitle={program ? `${program.goal || "Sem objetivo"} · ${program.weeks} semanas` : undefined}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="ghost" className="rounded-xl">
            <Link to="/coach/treinos"><ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar</Link>
          </Button>
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <Eye className="h-4 w-4 mr-1.5" /> Ver como aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 overflow-hidden">
              <DialogHeader className="px-5 pt-5">
                <DialogTitle className="text-[15px]">Como o aluno vê este treino</DialogTitle>
              </DialogHeader>
              <div className="px-5 pb-5 mt-2 max-h-[75vh] overflow-y-auto bg-muted/30">
                <div className="py-4">
                  <StudentWorkoutView
                    program={program}
                    workouts={data?.workouts || []}
                    exercises={data?.exercises || []}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <UserPlus className="h-4 w-4 mr-1.5" /> Atribuir a alunos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Atribuir programa</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[12px]">Início</Label>
                  <Input type="date" value={assignForm.start_date} onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })} className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label className="text-[12px]">Término</Label>
                  <Input type="date" value={assignForm.end_date} onChange={(e) => setAssignForm({ ...assignForm, end_date: e.target.value })} className="mt-1.5 rounded-xl" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 mt-2">
                {(students || []).map((s: any) => (
                  <label key={s.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60 cursor-pointer">
                    <Checkbox
                      checked={selected.includes(s.id)}
                      onCheckedChange={(v) =>
                        setSelected((prev) => (v ? [...prev, s.id] : prev.filter((i) => i !== s.id)))
                      }
                    />
                    <span className="text-[13px] flex-1 truncate">{s.full_name}</span>
                    {assignedIds.has(s.id) && <Badge variant="secondary" className="text-[10px]">já atribuído</Badge>}
                  </label>
                ))}
              </div>
              <Button onClick={assign} disabled={!selected.length} className="w-full rounded-xl">
                Atribuir a {selected.length || 0} aluno(s)
              </Button>
            </DialogContent>
          </Dialog>
          <Button onClick={addWorkout} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1.5" /> Novo treino
          </Button>
        </div>
      }
    >
      {!!data?.assignments.length && (
        <Card className="p-4 rounded-2xl border-border/60 mb-4">
          <p className="text-[12px] text-muted-foreground font-light mb-2">Alunos com este programa</p>
          <div className="flex flex-wrap gap-2">
            {data.assignments.map((a: any) => {
              const st = (students || []).find((s: any) => s.id === a.student_id);
              return (
                <Badge key={a.id} variant="secondary" className="text-[11px] font-normal gap-1.5 py-1">
                  {st?.full_name || "Aluno"}
                  <button onClick={() => unassign(a.id)} aria-label="Remover" className="text-muted-foreground hover:text-destructive">×</button>
                </Badge>
              );
            })}
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {(data?.workouts || []).map((w: any) => {
          const exs = (data?.exercises || []).filter((e: any) => e.workout_id === w.id);
          const isOpen = openWorkout === w.id;
          return (
            <Card key={w.id} className="rounded-2xl border-border/60 overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <Input
                  defaultValue={w.name}
                  onBlur={(e) => e.target.value !== w.name && updateWorkout(w.id, { name: e.target.value })}
                  className="h-9 rounded-xl text-[14px] font-semibold max-w-[240px]"
                />
                <Input
                  defaultValue={w.day_label || ""}
                  placeholder="Dia (ex.: Segunda)"
                  onBlur={(e) => e.target.value !== (w.day_label || "") && updateWorkout(w.id, { day_label: e.target.value || null })}
                  className="h-9 rounded-xl text-[13px] max-w-[180px]"
                />
                <Badge variant="secondary" className="text-[11px] font-normal">{exs.length} exercícios</Badge>
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setOpenWorkout(isOpen ? null : w.id)}>
                    {isOpen ? "Fechar" : "Editar"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteWorkout(w.id)} aria-label="Excluir treino">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border/60 p-4 space-y-3">
                  <CoachExerciseSearch onPick={(ex) => addExercise(w.id, ex)} />

                  {exs.map((ex: any, i: number) => (
                    <div
                      key={ex.id}
                      className={`rounded-xl border p-3 ${
                        ex.group_type !== "single" ? "border-primary/30 bg-primary/[0.03]" : "border-border/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        {ex.thumb_url && (
                          <img src={ex.thumb_url} alt={ex.name} loading="lazy" className="h-9 w-12 rounded-md object-cover" />
                        )}
                        <Input
                          defaultValue={ex.name}
                          onBlur={(e) => e.target.value !== ex.name && updateExercise(ex.id, { name: e.target.value })}
                          className="h-9 rounded-lg text-[13px] font-medium"
                        />
                        {ex.group_type !== "single" && (
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wide shrink-0">
                            {ex.group_type}
                          </Badge>
                        )}
                        <div className="flex shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => moveExercise(w.id, ex.id, -1)} aria-label="Subir">
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => moveExercise(w.id, ex.id, 1)} aria-label="Descer">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteExercise(ex.id)} aria-label="Remover">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Séries</Label>
                          <Input type="number" min={1} defaultValue={ex.sets}
                            onBlur={(e) => updateExercise(ex.id, { sets: Number(e.target.value) || 1 })}
                            className="h-9 rounded-lg text-[13px] mt-1" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Repetições</Label>
                          <Input defaultValue={ex.reps}
                            onBlur={(e) => updateExercise(ex.id, { reps: e.target.value })}
                            className="h-9 rounded-lg text-[13px] mt-1" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Carga</Label>
                          <Input defaultValue={ex.load_text || ""} placeholder="Ex.: 20 kg"
                            onBlur={(e) => updateExercise(ex.id, { load_text: e.target.value || null })}
                            className="h-9 rounded-lg text-[13px] mt-1" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Descanso (s)</Label>
                          <Input type="number" min={0} defaultValue={ex.rest_seconds}
                            onBlur={(e) => updateExercise(ex.id, { rest_seconds: Number(e.target.value) || 0 })}
                            className="h-9 rounded-lg text-[13px] mt-1" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Agrupamento</Label>
                          <Select
                            value={ex.group_type}
                            onValueChange={(v) => {
                              if (v === "single") {
                                ex.group_key ? ungroup(w.id, ex.group_key) : updateExercise(ex.id, { group_type: "single" });
                              } else groupWith(w.id, ex.id, v as "biset" | "triset");
                            }}
                          >
                            <SelectTrigger className="h-9 rounded-lg text-[13px] mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Simples</SelectItem>
                              <SelectItem value="biset">Biset (com o próximo)</SelectItem>
                              <SelectItem value="triset">Triset (com os 2 próximos)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Input defaultValue={ex.notes || ""} placeholder="Observação técnica (opcional)"
                        onBlur={(e) => updateExercise(ex.id, { notes: e.target.value || null })}
                        className="h-9 rounded-lg text-[12px] mt-2" />

                      {ex.media_url && (
                        <a href={ex.media_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] text-primary mt-2">
                          <Link2 className="h-3 w-3" /> Ver mídia do exercício
                        </a>
                      )}
                    </div>
                  ))}

                  {!exs.length && (
                    <p className="text-[13px] text-muted-foreground font-light text-center py-4">
                      Busque acima para adicionar o primeiro exercício.
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {!data?.workouts.length && !isLoading && (
          <Card className="p-10 rounded-2xl border-border/60 text-center">
            <p className="text-[14px] font-semibold tracking-[-0.02em]">Nenhum treino neste programa</p>
            <Button onClick={addWorkout} className="mt-4 rounded-xl">
              <Plus className="h-4 w-4 mr-1.5" /> Criar primeiro treino
            </Button>
          </Card>
        )}
      </div>
    </CoachLayout>
  );
};

export default CoachProgramEditor;