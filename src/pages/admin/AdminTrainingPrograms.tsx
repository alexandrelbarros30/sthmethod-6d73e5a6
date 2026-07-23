import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users, ChevronRight, Layers, ArrowLeft, Copy, Target, Zap, Search, Dumbbell, ImagePlus, X, UserMinus, Image as ImageIcon, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import ProgramWorkouts from "@/components/admin/ProgramWorkouts";
import { processAndUpload, validateImageFile } from "@/lib/image-upload";
import ReleaseNotifyButton from "@/components/admin/ReleaseNotifyButton";
import { normalizeSearch } from "@/lib/utils";
import AiWorkoutCoachDialog from "@/components/admin/AiWorkoutCoachDialog";
import ImportFromSuperCoachDialog from "@/components/admin/ImportFromSuperCoachDialog";

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
  poster_url: string;
  video_url: string;
  expires_at: string;
}

const emptyForm: ProgramForm = { title: "", details: "", objective: "general", difficulty: "intermediate", status: "published", poster_url: "", video_url: "", expires_at: "" };

const AdminTrainingPrograms = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [programDialog, setProgramDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramForm>(emptyForm);
  const [assignDialog, setAssignDialog] = useState<string | null>(null);
  const [assignedDialog, setAssignedDialog] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Deep-link: /admin/workout-templates?program=<id> abre direto o programa
  useEffect(() => {
    const pid = searchParams.get("program");
    if (pid && pid !== selectedProgramId) setSelectedProgramId(pid);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedProgramId && searchParams.get("program")) {
      const next = new URLSearchParams(searchParams);
      next.delete("program");
      setSearchParams(next, { replace: true });
    }
  }, [selectedProgramId]);

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

  // Count of distinct students with at least one ACTIVE assignment per program
  const { data: assignedCounts } = useQuery({
    queryKey: ["program-assigned-counts"],
    queryFn: async () => {
      const { data: tpls } = await supabase
        .from("workout_templates")
        .select("id, program_id")
        .not("program_id", "is", null);
      const tplToProgram: Record<string, string> = {};
      (tpls || []).forEach((t: any) => { tplToProgram[t.id] = t.program_id; });
      const tIds = Object.keys(tplToProgram);
      if (!tIds.length) return {} as Record<string, number>;
      const { data: assigns } = await supabase
        .from("student_workout_assignments")
        .select("user_id, template_id, active")
        .in("template_id", tIds)
        .eq("active", true);
      const map: Record<string, Set<string>> = {};
      (assigns || []).forEach((a: any) => {
        const pid = tplToProgram[a.template_id];
        if (!pid) return;
        (map[pid] ||= new Set()).add(a.user_id);
      });
      const counts: Record<string, number> = {};
      Object.keys(map).forEach((pid) => { counts[pid] = map[pid].size; });
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

  const { data: assignedStudents, refetch: refetchAssigned } = useQuery({
    queryKey: ["program-assigned-students", assignedDialog],
    queryFn: async () => {
      if (!assignedDialog) return [];
      const { data: tpls } = await supabase.from("workout_templates").select("id").eq("program_id", assignedDialog);
      const tIds = (tpls || []).map((t: any) => t.id);
      if (!tIds.length) return [];
      const { data: assigns } = await supabase
        .from("student_workout_assignments")
        .select("user_id, template_id, active")
        .in("template_id", tIds);
      const userIds = Array.from(new Set((assigns || []).map((a: any) => a.user_id)));
      if (!userIds.length) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      return (profiles || []).map((p: any) => {
        const userAssigns = (assigns || []).filter((a: any) => a.user_id === p.user_id);
        const totalActive = userAssigns.filter((a: any) => a.active).length;
        return { ...p, total: userAssigns.length, active: totalActive, templateIds: tIds };
      });
    },
    enabled: !!assignedDialog,
  });

  const unassignMutation = useMutation({
    mutationFn: async ({ programId, userId }: { programId: string; userId: string }) => {
      const { data: tpls } = await supabase.from("workout_templates").select("id").eq("program_id", programId);
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
      toast.success("Programa desatribuído.");
      refetchAssigned();
      queryClient.invalidateQueries({ queryKey: ["sgw-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["program-assigned-counts"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao desatribuir."),
  });

  const saveProgramMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Título obrigatório");
      if (editingProgram) {
        const { error } = await supabase.from("training_programs").update({
          title: form.title, details: form.details,
          objective: form.objective, difficulty: form.difficulty, status: form.status,
          poster_url: form.poster_url, video_url: form.video_url,
          expires_at: form.expires_at || null,
          updated_at: new Date().toISOString(),
        }).eq("id", editingProgram);
        if (error) {
          const { handleLibraryWriteError } = await import("@/lib/library-write-guard");
          await handleLibraryWriteError(error, {
            table: "training_programs", operation: "update",
            recordId: editingProgram, payload: form as any,
          });
          throw error;
        }
      } else {
        const { error } = await supabase.from("training_programs").insert({
          title: form.title, details: form.details,
          objective: form.objective, difficulty: form.difficulty, status: form.status,
          poster_url: form.poster_url, video_url: form.video_url,
          expires_at: form.expires_at || null,
          created_by: user!.id,
        } as any);
        if (error) {
          const { handleLibraryWriteError } = await import("@/lib/library-write-guard");
          await handleLibraryWriteError(error, {
            table: "training_programs", operation: "insert", payload: form as any,
          });
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      toast.success(editingProgram ? "Programa atualizado!" : "Programa criado!");
      closeProgramDialog();
    },
    onError: () => {},
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.functions.invoke("supercoach-delete-program", { body: { programId: id } });
      } catch (e) { console.warn("[supercoach-delete-program]", e); }
      const { error } = await supabase.from("training_programs").delete().eq("id", id);
      if (error) {
        const { handleLibraryWriteError } = await import("@/lib/library-write-guard");
        await handleLibraryWriteError(error, {
          table: "training_programs", operation: "delete", recordId: id,
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      if (selectedProgramId) setSelectedProgramId(null);
      toast.success("Programa removido!");
    },
    onError: () => {},
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
    mutationFn: async ({ programId, userIds }: { programId: string; userIds: string[] }) => {
      if (!userIds.length) throw new Error("Selecione ao menos um aluno");
      // Fetch templates fresh inside the mutation to avoid stale/empty cache
      const { data: tpls, error: tplErr } = await supabase
        .from("workout_templates")
        .select("id")
        .eq("program_id", programId);
      if (tplErr) throw tplErr;
      const templateIds = (tpls || []).map((t: any) => t.id);
      if (!templateIds.length) throw new Error("Este programa ainda não possui treinos. Crie ao menos 1 treino antes de compartilhar.");
      const rows = userIds.flatMap((uid) =>
        templateIds.map((templateId) => ({
          user_id: uid, template_id: templateId, assigned_by: user!.id, active: true, seen_by_student: false,
        }))
      );
      const { error } = await supabase
        .from("student_workout_assignments")
        .upsert(rows as any, { onConflict: "user_id,template_id" });
      if (error) throw error;
      return { count: rows.length };
    },
    onSuccess: ({ count }) => {
      toast.success(`Programa compartilhado! ${count} atribuição(ões) criada(s).`);
      setAssignDialog(null);
      setSelectedStudents([]);
      setStudentSearch("");
      queryClient.invalidateQueries({ queryKey: ["sgw-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["program-assigned-counts"] });
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
      poster_url: p.poster_url || "", video_url: p.video_url || "",
      expires_at: p.expires_at || "",
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
          <AiWorkoutCoachDialog triggerLabel="STHIA · Elite Coach" variant="secondary" />
          <ImportFromSuperCoachDialog
            libraryExercises={[]}
            buttonLabel="Importar do ST Coach"
            buttonVariant="outline"
            onImported={() => {
              queryClient.invalidateQueries({ queryKey: ["training-programs"] });
              queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
            }}
          />
          <Button
            variant="outline"
            onClick={async () => {
              const toastId = toast.loading("Sincronizando capas no ST Coach...");
              try {
                const { data, error } = await supabase.functions.invoke("supercoach-sync-covers", { body: {} });
                if (error) throw error;
                toast.success(
                  `Capas sincronizadas · ${data?.programs_synced || 0} programas / ${data?.trainings_synced || 0} treinos` +
                    (data?.programs_failed || data?.trainings_failed ? ` · falhas: ${(data?.programs_failed || 0) + (data?.trainings_failed || 0)}` : ""),
                  { id: toastId }
                );
              } catch (e: any) {
                toast.error(`Falha ao sincronizar capas: ${e?.message || e}`, { id: toastId });
              }
            }}
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Sincronizar capas ST Coach
          </Button>
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
                      {p.poster_url ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
                          <img src={p.poster_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 shrink-0">
                          <Layers className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">{p.title}</p>
                          {p.status === "draft" && <Badge variant="secondary" className="text-[10px] shrink-0">Rascunho</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <Badge variant="outline" className="text-[10px]">{getObjectiveLabel(p.objective || "general")}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${diffInfo.color}`}>{diffInfo.label}</Badge>
                          <Badge variant="outline" className="text-[10px]">{wCount} treino(s)</Badge>
                          {(assignedCounts?.[p.id] || 0) > 0 ? (
                            <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
                              <Users className="w-2.5 h-2.5 mr-0.5" /> {assignedCounts![p.id]} aluno(s)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground/60">Sem atribuições</Badge>
                          )}
                        </div>
                        {p.details && <p className="text-xs text-muted-foreground line-clamp-2">{p.details}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t justify-end" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="default" className="text-xs h-7" onClick={() => setSelectedProgramId(p.id)}>
                        <Dumbbell className="w-3 h-3 mr-1" /> Treinos ({wCount})
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setAssignDialog(p.id)}>
                        <Users className="w-3 h-3 mr-1" /> Atribuir
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setAssignedDialog(p.id)}>
                        <UserMinus className="w-3 h-3 mr-1" /> Atribuídos
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-xs h-7" disabled={duplicateProgramMutation.isPending}>
                            <Copy className="w-3 h-3 mr-1" /> Duplicar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Duplicar programa?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Será criada uma cópia de "{p.title}" com todos os treinos e exercícios.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => duplicateProgramMutation.mutate(p.id)}>
                              Duplicar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={async () => {
                        try {
                          toast.info("Gerando capa...");
                          const { data, error } = await supabase.functions.invoke("generate-program-cover", { body: { programId: p.id } });
                          if (error) throw error;
                          if ((data as any)?.error) throw new Error((data as any).error);
                          toast.success("Capa gerada!");
                          queryClient.invalidateQueries({ queryKey: ["training-programs"] });
                        } catch (e: any) {
                          toast.error(e?.message || "Falha ao gerar capa");
                        }
                      }}>
                        <ImageIcon className="w-3 h-3 mr-1" /> {p.poster_url ? "Regerar capa" : "Gerar capa"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        disabled={!p.poster_url}
                        title={p.poster_url ? "Baixar imagem do card" : "Gere uma capa antes de baixar"}
                        onClick={async () => {
                          if (!p.poster_url) { toast.info("Gere uma capa primeiro"); return; }
                          try {
                            const res = await fetch(p.poster_url, { mode: "cors" });
                            if (!res.ok) throw new Error("fetch_failed");
                            const blob = await res.blob();
                            const ext = (blob.type.split("/")[1] || "jpg").split(";")[0];
                            const safe = (p.title || "capa-treino").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${safe || "capa-treino"}.${ext}`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                          } catch {
                            // fallback: abre em nova aba
                            window.open(p.poster_url, "_blank", "noopener,noreferrer");
                          }
                        }}
                      >
                        <Download className="w-3 h-3 mr-1" /> Baixar capa
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
              <div>
                <Label>Imagem do Programa (card do aluno)</Label>
                <div className="flex items-center gap-3 mt-1">
                  {form.poster_url ? (
                    <div className="relative w-28 h-28 rounded-lg overflow-hidden border">
                      <img src={form.poster_url} alt="Poster" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, poster_url: "" }))}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-28 h-28 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/50">
                      <ImagePlus className="w-6 h-6 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const err = validateImageFile(file);
                          if (err) { toast.error(err); return; }
                          try {
                            const path = `${user!.id}/programs/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
                            const url = await processAndUpload(file, "workout-images", path);
                            setForm(p => ({ ...p, poster_url: url }));
                            toast.success("Imagem carregada!");
                          } catch {
                            toast.error("Falha no upload da imagem.");
                          }
                        }}
                      />
                    </label>
                  )}
                  <p className="text-xs text-muted-foreground flex-1">
                    Esta imagem aparece no card do programa na tela de treino do aluno. Recomendado: 3:4 (vertical).
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Vídeo de apresentação (URL)</Label>
                  <Input value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} placeholder="https://player.vimeo.com/..." />
                </div>
                <div>
                  <Label>Vencimento do Programa</Label>
                  <Input type="date" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} />
                </div>
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
        <Dialog open={!!assignDialog} onOpenChange={v => { if (!v) { setAssignDialog(null); setSelectedStudents([]); setStudentSearch(""); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Compartilhar Programa com Alunos</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Buscar Aluno</Label>
                <Input placeholder="Filtrar por nome ou email..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="mb-2" />
                <div className="flex items-center justify-between mt-2 mb-1">
                  <Label>Selecione um ou mais alunos</Label>
                  <span className="text-xs text-muted-foreground">{selectedStudents.length} selecionado(s)</span>
                </div>
                <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                  {(students || [])
                    .filter((s: any) => {
                      if (!studentSearch) return true;
                      const q = normalizeSearch(studentSearch);
                      return normalizeSearch(s.full_name).includes(q) || normalizeSearch(s.email).includes(q);
                    })
                    .map((s: any) => {
                      const checked = selectedStudents.includes(s.user_id);
                      return (
                        <label key={s.user_id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/40 cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              setSelectedStudents((prev) =>
                                v ? [...prev, s.user_id] : prev.filter((id) => id !== s.user_id)
                              )
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium break-words">{s.full_name || "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground break-words">{s.email}</p>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setAssignDialog(null); setSelectedStudents([]); }}>Cancelar</Button>
                <Button disabled={!selectedStudents.length || assignMutation.isPending}
                  onClick={() => assignDialog && assignMutation.mutate({ programId: assignDialog, userIds: selectedStudents })}>
                  {assignMutation.isPending ? "Compartilhando..." : `Compartilhar (${selectedStudents.length})`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assigned students Dialog (unassign) */}
        <Dialog open={!!assignedDialog} onOpenChange={v => { if (!v) setAssignedDialog(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Alunos com este programa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {(!assignedStudents || assignedStudents.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum aluno tem este programa atribuído.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
                  {assignedStudents.map((s: any) => (
                    <div key={s.user_id} className="flex items-center gap-2 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium break-words">{s.full_name || "Sem nome"}</p>
                        <p className="text-[11px] text-muted-foreground break-words">{s.email} · {s.active}/{s.total} ativos</p>
                      </div>
                      <ReleaseNotifyButton userId={s.user_id} type="training" />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 text-xs">
                            <X className="w-3 h-3 mr-1" /> Remover
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Desatribuir programa?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Todos os treinos deste programa serão removidos do aluno {s.full_name || s.email}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => assignedDialog && unassignMutation.mutate({ programId: assignedDialog, userId: s.user_id })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Desatribuir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminTrainingPrograms;
