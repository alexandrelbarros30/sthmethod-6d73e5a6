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
import ErrorDetailsDialog, { type ErrorDetails } from "@/components/shared/ErrorDetailsDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users, ChevronRight, Layers, ArrowLeft, Copy, Target, Zap, Search, Dumbbell, ImagePlus, X, UserMinus, Image as ImageIcon, Download, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { MoreHorizontal, Wrench, Database } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

const chunk = <T,>(items: T[], size: number) => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
};

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
  const [coverSyncing, setCoverSyncing] = useState<null | "push" | "pull">(null);
  const [coverError, setCoverError] = useState<ErrorDetails | null>(null);
  const [generatingCoverId, setGeneratingCoverId] = useState<string | null>(null);
  const [creatingMaxProgram, setCreatingMaxProgram] = useState(false);
  const [repairingProgram, setRepairingProgram] = useState(false);
  const [syncingVideos, setSyncingVideos] = useState(false);

  // Deep-link: /admin/workout-templates?program=<id> abre direto o programa
  useEffect(() => {
    const pid = searchParams.get("program");
    if (pid) {
      setSelectedProgramId((prev) => (prev === pid ? prev : pid));
    }
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
      const { data: tpls, error: tplError } = await supabase
        .from("workout_templates")
        .select("id, program_id")
        .not("program_id", "is", null);
      if (tplError) throw tplError;
      const tplToProgram: Record<string, string> = {};
      (tpls || []).forEach((t: any) => { tplToProgram[t.id] = t.program_id; });
      const tIds = Object.keys(tplToProgram);
      if (!tIds.length) return {} as Record<string, number>;
      const assigns: any[] = [];
      for (const ids of chunk(tIds, 150)) {
        const { data, error } = await supabase
          .from("student_workout_assignments")
          .select("user_id, template_id")
          .in("template_id", ids)
          .eq("active", true);
        if (error) throw error;
        assigns.push(...(data || []));
      }
      const map: Record<string, Set<string>> = {};
      assigns.forEach((a: any) => {
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
        .in("template_id", tIds)
        .eq("active", true);
      const userIds = Array.from(new Set((assigns || []).map((a: any) => a.user_id)));
      if (!userIds.length) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      return (profiles || []).map((p: any) => {
        const userAssigns = (assigns || []).filter((a: any) => a.user_id === p.user_id);
        return { ...p, total: userAssigns.length, active: userAssigns.length, templateIds: tIds };
      });
    },
    enabled: !!assignedDialog,
  });

  const invokeEdgeWithSimpleFallback = async (functionName: string, payload: Record<string, unknown>) => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;

    try {
      const r = await supabase.functions.invoke(functionName, { body: payload });
      if (!r.error) {
        if ((r.data as any)?.ok === false) throw new Error((r.data as any)?.error || "Falha na sincronização");
        return r.data;
      }
    } catch {}

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if ((data as any)?.ok === false) throw new Error((data as any)?.error || "Falha na sincronização");
        return data;
      }
    } catch {}

    if (!token) throw new Error("Sessão administrativa expirada. Entre novamente antes de sincronizar.");
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ ...payload, accessToken: token }),
    });
    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { error: text }; }
    if (!res.ok || data?.ok === false) throw new Error(data?.error || `Falha HTTP ${res.status}`);
    return data;
  };

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
      await invokeEdgeWithSimpleFallback("supercoach-assign-program", { userId, programId, action: "unassign" });
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
        return editingProgram;
      } else {
        const { data: inserted, error } = await supabase.from("training_programs").insert({
          title: form.title, details: form.details,
          objective: form.objective, difficulty: form.difficulty, status: form.status,
          poster_url: form.poster_url, video_url: form.video_url,
          expires_at: form.expires_at || null,
          created_by: user!.id,
          } as any).select("id").single();
        if (error) {
          const { handleLibraryWriteError } = await import("@/lib/library-write-guard");
          await handleLibraryWriteError(error, {
            table: "training_programs", operation: "insert", payload: form as any,
          });
          throw error;
        }
        return inserted?.id as string | undefined;
      }
    },
    onSuccess: async (programId) => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      toast.success(editingProgram ? "Programa atualizado!" : "Programa criado!");
      // Auto-sync ST Coach: espelha metadados do programa republicando os templates
      if (programId) {
        try {
          // 1) Sincroniza metadados do programa (nome/subtítulo/capa) mesmo sem templates
          invokeEdgeWithSimpleFallback("supercoach-sync-program", { programId })
            .catch((e) => console.warn("[auto-sync ST Coach program meta]", e));
          // 2) Re-publica templates para propagar mudanças (nome do treino, capa, etc.)
          const { data: tpls } = await supabase
            .from("workout_templates")
            .select("id")
            .eq("program_id", programId);
          (tpls || []).forEach((t: any) => {
            invokeEdgeWithSimpleFallback("supercoach-push-template", { templateId: t.id, programId })
              .catch((e) => console.warn("[auto-sync ST Coach]", e));
          });
        } catch (e) {
          console.warn("[auto-sync ST Coach program]", e);
        }
      }
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
      const syncFailures: string[] = [];
      for (const uid of userIds) {
        try {
          await invokeEdgeWithSimpleFallback("supercoach-assign-program", { userId: uid, programId, action: "assign" });
        } catch (error: any) {
          const student = (students || []).find((item: any) => item.user_id === uid);
          syncFailures.push(`${student?.full_name || student?.email || uid}: ${error?.message || "falha"}`);
        }
      }
      return { count: rows.length, students: userIds.length, syncFailures };
    },
    onSuccess: ({ count, students, syncFailures }) => {
      if (syncFailures.length) {
        toast.warning(`Atribuído no STH METHOD, mas ${syncFailures.length} sincronização(ões) no ST Coach precisam de revisão.`);
      } else {
        toast.success(`Programa compartilhado e sincronizado no ST Coach! ${count} atribuição(ões), ${students} aluno(s).`);
      }
      setAssignDialog(null);
      setSelectedStudents([]);
      setStudentSearch("");
      queryClient.invalidateQueries({ queryKey: ["sgw-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["program-assigned-counts"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atribuir."),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["program-assigned-counts"] });
      queryClient.invalidateQueries({ queryKey: ["program-assigned-students"] });
    },
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

  const generateCoverAttempt = async (program: any, provider: "openai" | "gemini") => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      return {
        error: "Sua sessão administrativa expirou. Faça login novamente antes de gerar a capa.",
        code: "AUTH_SESSION_MISSING",
        model: "edge-function",
        when: new Date().toISOString(),
      };
    }

    try {
      let body: any = null;
      let error: any = null;
      try {
        const res = await supabase.functions.invoke("generate-program-cover", {
          body: { programId: program.id, provider, async: true },
        });
        body = res.data;
        error = res.error;
      } catch (invokeErr: any) {
        error = invokeErr;
      }

      // Fallback: direct fetch se invoke falhar no transporte (FunctionsFetchError)
      if (error && !body) {
        try {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-program-cover`;
          const resp = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ programId: program.id, provider, async: true }),
          });
          const text = await resp.text();
          try { body = JSON.parse(text); } catch { body = { raw: text }; }
          if (resp.ok) error = null;
        } catch (fetchErr: any) {
          error = fetchErr;
        }
      }

      // Fallback final: chamada simples sem headers customizados.
      // Evita preflight CORS quando o navegador/rede bloqueia a chamada normal da função.
      if (error && !body) {
        try {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-program-cover`;
          const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body: JSON.stringify({ accessToken: token, programId: program.id, provider, async: true }),
          });
          const text = await resp.text();
          try { body = JSON.parse(text); } catch { body = { raw: text }; }
          if (resp.ok) error = null;
        } catch (simpleFetchErr: any) {
          error = simpleFetchErr;
        }
      }

      if (error || body?.error) {
        return {
          ...body,
          error: body?.error || error?.message || "Falha ao iniciar a geração de capa.",
          code: body?.code || "EDGE_INVOKE_FAILED",
          model: body?.model || (provider === "openai" ? "openai/gpt-image-2" : "google/gemini-3-pro-image"),
          details: error ? { name: error.name, message: error.message, context: (error as any).context } : undefined,
          when: body?.when || new Date().toISOString(),
        };
      }

      return body;
    } catch (error: any) {
      return {
        error: error?.message || "Falha de rede ao iniciar a função de capa.",
        code: "EDGE_INVOKE_EXCEPTION",
        model: "edge-function",
        details: { name: error?.name, message: error?.message },
        retryable: true,
        when: new Date().toISOString(),
      };
    }
  };

  const generateCoverWithAi = async (
    program: any,
    onProgress?: (elapsedSec: number) => void,
  ) => {
    const first = await generateCoverAttempt(program, "gemini");
    if (first?.error || !first?.accepted) {
      return first;
    }

    const startedAt = Date.now();
    const initialPosterUrl = String(program.poster_url || "");
    for (let attempt = 1; attempt <= 45; attempt++) {
      await new Promise((resolve) => window.setTimeout(resolve, attempt <= 5 ? 2000 : 3000));
      onProgress?.(Math.round((Date.now() - startedAt) / 1000));
      const { data, error } = await supabase
        .from("training_programs")
        .select("poster_url")
        .eq("id", program.id)
        .maybeSingle();

      if (error) {
        return {
          error: error.message || "Falha ao verificar a capa gerada.",
          code: "POSTER_POLL_FAILED",
          model: first.model || "edge-function",
          details: error,
          when: new Date().toISOString(),
        };
      }

      const posterUrl = String((data as any)?.poster_url || "");
      if (posterUrl && posterUrl !== initialPosterUrl) {
        return {
          ok: true,
          posterUrl,
          accepted: true,
          elapsedMs: Date.now() - startedAt,
          model: first.model || "google/gemini-3-pro-image → openai/gpt-image-2",
        };
      }
    }

    return {
      error: "A geração foi aceita, mas a capa ainda não ficou disponível. Tente atualizar a lista em alguns segundos.",
      code: "ASYNC_COVER_TIMEOUT",
      model: first.model || "google/gemini-3-pro-image → openai/gpt-image-2",
      attempts: [first],
      when: new Date().toISOString(),
    };
  };

  const selectedProgram = (programs || []).find((p: any) => p.id === selectedProgramId);

  const filteredPrograms = (programs || []).filter((p: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.details || "").toLowerCase().includes(q);
  });

  if (selectedProgram) {
    return (
      <DashboardLayout role={(role as any) || "admin"} title={selectedProgram.title} subtitle="Gerencie os treinos deste programa.">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* LEFT: sticky programs list */}
          <aside className="rounded-2xl border bg-card/40 p-3 xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">Programas</p>
              <Button size="icon" variant="ghost" className="h-8 w-8" title="Novo programa" onClick={() => { setForm(emptyForm); setEditingProgram(null); setProgramDialog(true); }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              {filteredPrograms.map((p: any) => {
                const active = p.id === selectedProgramId;
                const wCount = workoutCounts?.[p.id] || 0;
                const assigned = assignedCounts?.[p.id] || 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProgramId(p.id)}
                    className={`w-full text-left rounded-xl border p-2.5 transition-all flex items-center gap-3 ${active ? "border-primary bg-primary/10 shadow-sm" : "border-border/60 hover:border-primary/40 hover:bg-muted/40"}`}
                  >
                    {p.poster_url ? (
                      <img src={p.poster_url} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" loading="lazy" />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate leading-tight ${active ? "text-primary" : ""}`}>{p.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{wCount} treino(s) · {assigned} aluno(s)</p>
                    </div>
                    {active && <ChevronRight className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* RIGHT: workouts + inline exercises pane */}
          <div className="min-w-0 space-y-5">
            <div className="rounded-2xl border bg-card/40 p-4 flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2"
                onClick={() => {
                  setSelectedProgramId(null);
                  if (searchParams.get("program")) {
                    const next = new URLSearchParams(searchParams);
                    next.delete("program");
                    setSearchParams(next, { replace: true });
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Todos os programas
              </Button>
              <div className="hidden sm:block h-5 w-px bg-border" />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{getObjectiveLabel(selectedProgram.objective || "general")}</Badge>
                <Badge variant="outline" className={getDifficultyInfo(selectedProgram.difficulty || "intermediate").color}>
                  {getDifficultyInfo(selectedProgram.difficulty || "intermediate").label}
                </Badge>
                {selectedProgram.status === "draft" && <Badge variant="secondary">Rascunho</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  disabled={coverSyncing !== null}
                  onClick={async () => {
                    if (!selectedProgram.supercoach_program_id) {
                      toast.info("Este programa não está vinculado ao ST Coach.");
                      return;
                    }
                    if (!selectedProgram.poster_url) {
                      toast.info("Este programa ainda não tem capa para enviar.");
                      return;
                    }
                    setCoverSyncing("push");
                    const toastId = toast.loading("Sincronizando capa com o ST Coach...");
                    try {
                      const { data, error } = await supabase.functions.invoke("supercoach-sync-covers", {
                        body: { programIds: [selectedProgram.id] },
                      });
                      if (error) throw error;
                      const fails = (data?.programs_failed || 0) + (data?.trainings_failed || 0);
                      toast.success(
                        `Capa sincronizada · ${data?.programs_synced || 0} programa / ${data?.trainings_synced || 0} treino(s)` +
                          (fails ? ` · falhas: ${fails}` : ""),
                        { id: toastId }
                      );
                    } catch (e: any) {
                      toast.error(e?.message || "Falha ao sincronizar a capa.", { id: toastId });
                    } finally {
                      setCoverSyncing(null);
                    }
                  }}
                >
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${coverSyncing === "push" ? "animate-spin" : ""}`} />
                  Sincronizar capa (ST Coach)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  disabled={coverSyncing !== null}
                  onClick={async () => {
                    if (!selectedProgram.supercoach_program_id) {
                      toast.info("Este programa não está vinculado ao ST Coach.");
                      return;
                    }
                    setCoverSyncing("pull");
                    const toastId = toast.loading("Importando capa do ST Coach...");
                    try {
                      const { data, error } = await supabase.functions.invoke("supercoach-import-covers", {
                        body: { programIds: [selectedProgram.id], overwrite: true },
                      });
                      if (error) throw error;
                      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
                      queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
                      toast.success(
                        `Capa importada · ${data?.programs_updated || 0} programa / ${data?.templates_updated || 0} treino(s)`,
                        { id: toastId }
                      );
                    } catch (e: any) {
                      toast.error(e?.message || "Falha ao importar a capa.", { id: toastId });
                    } finally {
                      setCoverSyncing(null);
                    }
                  }}
                >
                  <ImageIcon className={`w-4 h-4 mr-1.5 ${coverSyncing === "pull" ? "animate-pulse" : ""}`} />
                  Importar capa
                </Button>
              </div>
            </div>
            <ProgramWorkouts programId={selectedProgram.id} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={(role as any) || "admin"} title="Programas de Treino" subtitle="Crie programas com múltiplos treinos e atribua aos alunos.">
      <div className="space-y-5 max-w-6xl">
        {/* Toolbar compacta: busca à esquerda, ações principais à direita, ferramentas em massa em menu */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar programa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden sm:inline text-[11px] text-muted-foreground uppercase tracking-wide mr-1">
              {filteredPrograms.length} programa(s)
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
              disabled={repairingProgram}
              onClick={async () => {
                const confirm = window.confirm("Isso irá reconstruir os exercícios do programa MASCULINO 1.0. Continuar?");
                if (!confirm) return;
                setRepairingProgram(true);
                try {
                  const { repairMasculino10Program } = await import("@/lib/repair-masculino-10");
                  await repairMasculino10Program();
                  toast.success("Programa MASCULINO 1.0 reparado com sucesso!");
                  queryClient.invalidateQueries({ queryKey: ["training-programs"] });
                  queryClient.invalidateQueries({ queryKey: ["program-workout-counts"] });
                } catch (e: any) {
                  toast.error("Erro ao reparar programa: " + e.message);
                } finally {
                  setRepairingProgram(false);
                }
              }}
            >
              <Wrench className={`w-4 h-4 mr-1.5 ${repairingProgram ? "animate-spin" : ""}`} />
              Reparar Masculino 1.0
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={creatingMaxProgram}
              onClick={async () => {
                setCreatingMaxProgram(true);
                try {
                  const { createHipertrofiaMaxProgram } = await import("@/lib/create-hipertrofia-max");
                  const res = await createHipertrofiaMaxProgram(user!.id);
                  if (res.success) {
                    toast.success("Programa Hipertrofia Max 1.0 criado com sucesso!");
                    queryClient.invalidateQueries({ queryKey: ["training-programs"] });
                  } else {
                    throw res.error;
                  }
                } catch (e: any) {
                  toast.error("Erro ao criar programa: " + (e.message || e));
                } finally {
                  setCreatingMaxProgram(false);
                }
              }}
              className="h-9 border-primary/40 text-primary hover:bg-primary/10"
            >
              {creatingMaxProgram ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              Hipertrofia Max 1.0
            </Button>
            <AiWorkoutCoachDialog triggerLabel="STHIA · Elite Coach" variant="secondary" />
            <ImportFromSuperCoachDialog
              libraryExercises={[]}
              buttonLabel="Importar ST Coach"
              buttonVariant="outline"
              onImported={() => {
                queryClient.invalidateQueries({ queryKey: ["training-programs"] });
                queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Wrench className="w-4 h-4 mr-1" /> Ferramentas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Capas · em massa</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={async () => {
                    const ids = (programs || [])
                      .filter((p: any) => p.supercoach_program_id && p.poster_url)
                      .map((p: any) => p.id);
                    if (!ids.length) { toast.info("Nenhum programa elegível para sincronizar."); return; }
                    const toastId = toast.loading(`Sincronizando capas (0/${ids.length})...`);
                    let progOk = 0, progFail = 0, trOk = 0, trFail = 0, done = 0;
                    for (const id of ids) {
                      try {
                        const { data, error } = await supabase.functions.invoke("supercoach-sync-covers", { body: { programIds: [id] } });
                        if (error) throw error;
                        progOk += data?.programs_synced || 0;
                        progFail += data?.programs_failed || 0;
                        trOk += data?.trainings_synced || 0;
                        trFail += data?.trainings_failed || 0;
                      } catch { progFail++; }
                      done++;
                      toast.loading(`Sincronizando capas (${done}/${ids.length})...`, { id: toastId });
                    }
                    toast.success(
                      `Capas sincronizadas · ${progOk} programas / ${trOk} treinos` +
                        (progFail || trFail ? ` · falhas: ${progFail + trFail}` : ""),
                      { id: toastId }
                    );
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar capas ST Coach
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const ids = (programs || [])
                      .filter((p: any) => p.supercoach_program_id)
                      .map((p: any) => p.id);
                    if (!ids.length) { toast.info("Nenhum programa vinculado ao ST Coach."); return; }
                    const toastId = toast.loading(`Importando capas (0/${ids.length})...`);
                    let progUpd = 0, tplUpd = 0, fails = 0, done = 0;
                    for (const id of ids) {
                      try {
                        const { data, error } = await supabase.functions.invoke("supercoach-import-covers", { body: { programIds: [id], overwrite: true } });
                        if (error) throw error;
                        progUpd += data?.programs_updated || 0;
                        tplUpd += data?.templates_updated || 0;
                        fails += data?.failures?.length || 0;
                      } catch { fails++; }
                      done++;
                      toast.loading(`Importando capas (${done}/${ids.length})...`, { id: toastId });
                    }
                    queryClient.invalidateQueries({ queryKey: ["training-programs"] });
                    queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
                    toast.success(
                      `Capas importadas · ${progUpd} programas / ${tplUpd} treinos` +
                        (fails ? ` · falhas: ${fails}` : ""),
                      { id: toastId }
                    );
                  }}
                >
                  <ImageIcon className="w-4 h-4 mr-2" /> Importar capas do ST Coach
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={async () => {
                    const list = (filteredPrograms as any[]).filter((p: any) => !p.supercoach_program_id);
                    if (!list.length) { toast.info("Nenhum programa próprio (não ST Coach) na lista."); return; }
                    if (!confirm(`Regerar capas com IA para ${list.length} programa(s) criados aqui (ST Coach ignorados)? Consome créditos de IA.`)) return;
                    const total = list.length;
                    const toastId = toast.loading(`Regenerando capas 0/${total}...`);
                    let ok = 0, fail = 0;
                    for (let i = 0; i < list.length; i++) {
                      const p = list[i];
                      try {
                        const data = await generateCoverWithAi(p);
                        if ((data as any)?.error) throw new Error((data as any)?.error);
                        ok++;
                      } catch { fail++; }
                      toast.loading(`Regenerando capas ${i + 1}/${total} · ok ${ok} · falhas ${fail}`, { id: toastId });
                    }
                    queryClient.invalidateQueries({ queryKey: ["training-programs"] });
                    toast.success(`Regeração concluída · ${ok} capas OK · ${fail} falhas`, { id: toastId });
                  }}
                >
                  <ImageIcon className="w-4 h-4 mr-2" /> Regerar capas próprias (IA)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" className="h-9" onClick={() => { setForm(emptyForm); setEditingProgram(null); setProgramDialog(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Novo
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : filteredPrograms.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Layers className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">{searchQuery ? "Nenhum resultado." : "Nenhum programa criado."}</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((p: any) => {
              const wCount = workoutCounts?.[p.id] || 0;
              const diffInfo = getDifficultyInfo(p.difficulty || "intermediate");
              const assigned = assignedCounts?.[p.id] || 0;
              return (
                <Card
                  key={p.id}
                  className="group relative overflow-hidden hover:shadow-lg transition-all hover:border-primary/40 cursor-pointer flex flex-col"
                  onClick={() => setSelectedProgramId(p.id)}
                >
                  {/* Cover top */}
                  <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden">
                    {p.poster_url ? (
                      <img src={p.poster_url} alt={p.title} className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
                        <Layers className="w-10 h-10 text-primary/60" />
                      </div>
                    )}
                    {p.status === "draft" && (
                      <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">Rascunho</Badge>
                    )}
                    {assigned > 0 && (
                      <Badge className="absolute bottom-2 left-2 text-[10px] bg-primary text-primary-foreground shadow-lg">
                        <Users className="w-3 h-3 mr-1" /> {assigned} aluno(s)
                      </Badge>
                    )}
                    {/* Overflow menu */}
                    <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur hover:bg-background">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => setAssignedDialog(p.id)}>
                            <UserMinus className="w-4 h-4 mr-2" /> Ver atribuídos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditProgram(p)}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={duplicateProgramMutation.isPending}
                            onClick={() => {
                              if (confirm(`Duplicar "${p.title}" com todos os treinos?`)) duplicateProgramMutation.mutate(p.id);
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={generatingCoverId === p.id}
                            onClick={async () => {
                        const toastId = `cover-${p.id}`;
                        setGeneratingCoverId(p.id);
                        toast.loading("Gerando capa com IA… pode levar 20–60s", { id: toastId });
                        try {
                          const body: any = await generateCoverWithAi(p, (sec) => {
                            toast.loading(`Gerando capa com IA… ${sec}s`, { id: toastId });
                          });
                          if (body?.error) {
                            setCoverError({
                              title: "Falha ao gerar capa",
                              code: body.code || "ERR",
                              model: body.model || "—",
                              message: body.error,
                              raw: JSON.stringify(body, null, 2),
                              when: body.when,
                            });
                            toast.error("Falha ao gerar capa — veja detalhes", { id: toastId });
                            return;
                          }
                          toast.success(`Capa gerada com IA! (${body.model || "IA"})`, { id: toastId });
                          queryClient.invalidateQueries({ queryKey: ["training-programs"] });
                        } catch (e: any) {
                          setCoverError({
                            title: "Falha ao gerar capa",
                            code: "NET",
                            model: "—",
                            message: e?.message || "Erro desconhecido",
                            raw: String(e?.stack || e),
                            when: new Date().toISOString(),
                          });
                          toast.error("Falha ao gerar capa — veja detalhes", { id: toastId });
                        } finally {
                          setGeneratingCoverId((cur) => (cur === p.id ? null : cur));
                        }
                            }}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {generatingCoverId === p.id ? "Gerando…" : p.poster_url ? "Regerar capa" : "Gerar capa"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!p.poster_url}
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
                            window.open(p.poster_url, "_blank", "noopener,noreferrer");
                          }
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" /> Baixar capa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm(`Excluir "${p.title}"? Esta ação não pode ser desfeita.`)) deleteProgramMutation.mutate(p.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Body */}
                  <CardContent className="flex-1 flex flex-col p-4 gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-tight line-clamp-2 flex-1">{p.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">{getObjectiveLabel(p.objective || "general")}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${diffInfo.color}`}>{diffInfo.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto pt-2">
                      <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" /> {wCount} treino(s)</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {assigned} aluno(s)</span>
                    </div>
                    <div className="flex gap-2 pt-2" onClick={e => e.stopPropagation()}>
                      <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => setSelectedProgramId(p.id)}>
                        <Dumbbell className="w-3.5 h-3.5 mr-1" /> Abrir treinos
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAssignDialog(p.id)}>
                        <Users className="w-3.5 h-3.5 mr-1" /> Atribuir
                      </Button>
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
      <ErrorDetailsDialog open={!!coverError} onOpenChange={(v) => !v && setCoverError(null)} details={coverError} />
    </DashboardLayout>
  );
};

export default AdminTrainingPrograms;
