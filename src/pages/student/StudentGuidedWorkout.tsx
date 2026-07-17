import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dumbbell, ChevronLeft, ChevronDown, History, Play, Calendar, ChevronsDown, Save, Eraser, VideoOff } from "lucide-react";
import StCoachButton from "@/components/student/StCoachButton";
import { toast } from "sonner";

const getVideoSource = (url: string): { kind: "embed" | "file" | "image"; url: string } | null => {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (yt) return { kind: "embed", url: `https://www.youtube.com/embed/${yt[1]}` };
  const v = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (v) return { kind: "embed", url: `https://player.vimeo.com/video/${v[1]}` };
  if (/\.(gif|png|jpe?g|webp|avif)(\?.*)?$/i.test(url)) return { kind: "image", url };
  return { kind: "file", url };
};

const isImageUrl = (url?: string | null) =>
  !!url && /\.(gif|png|jpe?g|webp|avif)(\?.*)?$/i.test(url);

const pickBestMediaUrl = (...candidates: (string | null | undefined)[]): string => {
  const list = candidates.filter((u): u is string => !!u && u.trim().length > 0);
  // Prefer any non-image (real video / YouTube / Vimeo / mp4) over images (GIFs).
  const nonImage = list.find((u) => !isImageUrl(u));
  return nonImage || list[0] || "";
};

type View =
  | { kind: "programs" }
  | { kind: "program"; programId: string | "_solo" }
  | { kind: "workout"; assignmentId: string };

const StudentGuidedWorkout = () => {
  const { user } = useAuth();
  const { isActive, isLoading: subLoading } = useSubscriptionGuard();
  const qc = useQueryClient();
  const [view, setView] = useState<View>({ kind: "programs" });
  const [loadInputs, setLoadInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);

  // Assignments + template (with program_id)
  const { data: assignments, isLoading: aLoading } = useQuery({
    queryKey: ["sgw-assignments", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_workout_assignments")
        .select("*, workout_templates(*)")
        .eq("user_id", user!.id)
        .eq("active", true);
      return (data || []).filter((a: any) => a.workout_templates?.released !== false);
    },
    enabled: !!user?.id && isActive,
  });

  const programIds = useMemo(
    () => Array.from(new Set((assignments || []).map((a: any) => a.workout_templates?.program_id).filter(Boolean))),
    [assignments]
  );

  const { data: programs } = useQuery({
    queryKey: ["sgw-programs", programIds],
    queryFn: async () => {
      if (!programIds.length) return [];
      const { data } = await supabase.from("training_programs").select("*").in("id", programIds);
      return data || [];
    },
    enabled: programIds.length > 0,
  });

  const templateIds = useMemo(() => (assignments || []).map((a: any) => a.template_id), [assignments]);

  const { data: exercises } = useQuery({
    queryKey: ["sgw-exercises", templateIds],
    queryFn: async () => {
      if (!templateIds.length) return [];
      const { data } = await supabase
        .from("workout_template_exercises")
        .select("*")
        .in("template_id", templateIds)
        .order("sort_order");
      return data || [];
    },
    enabled: templateIds.length > 0,
  });

  const exerciseIds = useMemo(
    () => Array.from(new Set((exercises || []).map((e: any) => e.exercise_id).filter(Boolean))),
    [exercises]
  );

  const { data: exerciseLibraryMap = {} } = useQuery({
    queryKey: ["sgw-exercise-library-map", exerciseIds],
    queryFn: async () => {
      if (!exerciseIds.length) return {};
      const { data } = await supabase
        .from("exercise_library")
        .select("id, description, video_url, image_url")
        .in("id", exerciseIds);

      return (data || []).reduce((acc: Record<string, any>, item: any) => {
        acc[item.id] = item;
        return acc;
      }, {});
    },
    enabled: exerciseIds.length > 0,
  });

  // Nome -> metadata (fallback quando exercise_id não está setado no template)
  const exerciseNames = useMemo(
    () =>
      Array.from(
        new Set(
          (exercises || [])
            .filter((e: any) => !e.exercise_id && e.custom_name)
            .map((e: any) => String(e.custom_name).trim().toLowerCase())
        )
      ),
    [exercises]
  );

  const { data: exerciseLibraryByName = {} } = useQuery({
    queryKey: ["sgw-exercise-library-by-name", exerciseNames],
    queryFn: async () => {
      if (!exerciseNames.length) return {};
      const { data } = await supabase
        .from("exercise_library")
        .select("name, description, video_url, image_url");
      const map: Record<string, any> = {};
      (data || []).forEach((item: any) => {
        const key = String(item.name || "").trim().toLowerCase();
        if (key && !map[key]) map[key] = item;
      });
      return map;
    },
    enabled: exerciseNames.length > 0,
  });

  const { data: myLogs } = useQuery({
    queryKey: ["sgw-logs", user?.id],
    queryFn: async () => {
      const ids = (assignments || []).map((a: any) => a.id);
      if (!ids.length) return [];
      const { data } = await supabase
        .from("student_exercise_logs")
        .select("*")
        .eq("user_id", user!.id)
        .in("assignment_id", ids)
        .order("logged_at", { ascending: false });
      return data || [];
    },
    enabled: !!(assignments || []).length,
  });

  const saveLog = useMutation({
    mutationFn: async (p: { assignmentId: string; templateExerciseId: string; load: string }) => {
      const { error } = await supabase.from("student_exercise_logs").insert({
        user_id: user!.id,
        assignment_id: p.assignmentId,
        template_exercise_id: p.templateExerciseId,
        load_used: p.load,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sgw-logs"] });
      toast.success("Carga salva!");
    },
    onError: () => toast.error("Erro ao salvar carga."),
  });

  const finishSession = useMutation({
    mutationFn: async (p: { assignmentId: string; templateId: string; feedback: string }) => {
      const { error } = await supabase.from("student_workout_sessions").insert({
        user_id: user!.id,
        assignment_id: p.assignmentId,
        template_id: p.templateId,
        finished_at: new Date().toISOString(),
        feedback: p.feedback,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Treino finalizado!");
      setFeedback("");
      setView({ kind: "programs" });
    },
    onError: () => toast.error("Erro ao finalizar treino."),
  });

  if (subLoading || aLoading) {
    return (
      <DashboardLayout role="student" title="Treino Guiado" subtitle="">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </DashboardLayout>
    );
  }
  if (!isActive) {
    return (
      <DashboardLayout role="student" title="Treino Guiado" subtitle="">
        <SubscriptionBlock />
      </DashboardLayout>
    );
  }

  // ----- Helpers -----
  const countLogs = (assignmentId: string) =>
    (myLogs || []).filter((l: any) => l.assignment_id === assignmentId).length;

  // ============ VIEW: PROGRAMS ============
  if (view.kind === "programs") {
    const groupedByProgram = (assignments || []).reduce((acc: any, a: any) => {
      const pid = a.workout_templates?.program_id || "_solo";
      (acc[pid] ||= []).push(a);
      return acc;
    }, {});
    const groups = Object.keys(groupedByProgram);

    if (!assignments || assignments.length === 0) {
      return (
        <DashboardLayout role="student" title="Treino Guiado" subtitle="Seus treinos.">
          <div className="space-y-6 max-w-4xl">
            <StCoachButton />
            <Card><CardContent className="py-12 text-center">
              <Dumbbell className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhum treino atribuído. Aguarde seu consultor.</p>
            </CardContent></Card>
          </div>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout role="student" title="Treino Guiado" subtitle="Selecione seu programa.">
        <div className="space-y-4 max-w-4xl">
          <StCoachButton />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {groups.map((pid) => {
              const program = (programs || []).find((p: any) => p.id === pid);
              const list = groupedByProgram[pid];
              const title = program?.title || "Treinos";
              const poster = program?.poster_url;
              return (
                <button
                  key={pid}
                  onClick={() => setView({ kind: "program", programId: pid })}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-border/40 bg-muted text-left"
                >
                  {poster ? (
                    <img src={poster} alt={title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-background flex items-center justify-center">
                      <Dumbbell className="w-10 h-10 text-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                    <p className="text-[11px] text-white/70 uppercase tracking-widest">{list.length} treino{list.length > 1 ? "s" : ""}</p>
                    <p className="text-white font-semibold text-sm leading-tight tracking-tight line-clamp-2">{title}</p>
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary-foreground bg-primary px-2 py-0.5 rounded-full uppercase tracking-wide">STH METHOD</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============ VIEW: PROGRAM (list of workouts) ============
  if (view.kind === "program") {
    const list = (assignments || [])
      .filter((a: any) => (a.workout_templates?.program_id || "_solo") === view.programId)
      .sort((a: any, b: any) => (a.workout_templates?.sort_order || 0) - (b.workout_templates?.sort_order || 0));
    const program = (programs || []).find((p: any) => p.id === view.programId);

    return (
      <DashboardLayout role="student" title={program?.title || "Treinos"} subtitle="Selecione um treino.">
        <div className="space-y-3 max-w-4xl">
          <button
            onClick={() => setView({ kind: "programs" })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground uppercase tracking-wide"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>

          {program?.expires_at && (
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              <Calendar className="w-3 h-3" /> Vence em {new Date(program.expires_at).toLocaleDateString("pt-BR")}
            </div>
          )}

          {list.map((a: any, idx: number) => {
            const t = a.workout_templates;
            const letter = String.fromCharCode(65 + idx);
            const logs = countLogs(a.id);
            const allExercises = (exercises || []).filter((ex: any) => ex.template_id === t.id);
            const previewExercises = allExercises
              .slice(0, 3)
              .map((ex: any) => ex.custom_name)
              .filter(Boolean);
            const isExpanded = expandedAssignment === a.id;
            return (
              <div
                key={a.id}
                className="rounded-2xl border border-border bg-card p-4 cursor-pointer transition-colors hover:bg-card/80"
                onClick={() => setExpandedAssignment(isExpanded ? null : a.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-semibold text-foreground tracking-tight">
                    {letter}. {t.title}
                  </p>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
                {t.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{t.subtitle}</p>}
                {t.description && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{t.description}</p>}
                {!isExpanded && previewExercises.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {previewExercises.join(" • ")}
                  </p>
                )}
                {isExpanded && allExercises.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
                    {allExercises.map((ex: any, i: number) => {
                      const series = ex.sets && ex.reps ? `${ex.sets}x${ex.reps}` : (ex.sets || ex.reps || "");
                      return (
                        <li key={ex.id} className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="text-foreground">
                            <span className="text-muted-foreground mr-1.5">{i + 1}.</span>
                            {ex.custom_name || "Exercício"}
                          </span>
                          {series && <span className="text-primary font-semibold text-xs whitespace-nowrap">{series}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="flex items-center justify-between gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-full">
                    <History className="w-3.5 h-3.5" /> Histórico
                    <span className="ml-1 inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-foreground/10">{logs}</span>
                  </div>
                  <Button
                    onClick={() => setView({ kind: "workout", assignmentId: a.id })}
                    className="rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wide text-xs px-5"
                  >
                    Ver Treino
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DashboardLayout>
    );
  }

  // ============ VIEW: WORKOUT (exercises sequential) ============
  const assignment = (assignments || []).find((a: any) => a.id === view.assignmentId);
  if (!assignment) {
    return (
      <DashboardLayout role="student" title="Treino" subtitle="">
        <p className="text-sm text-muted-foreground">Treino não encontrado.</p>
      </DashboardLayout>
    );
  }
  const template = assignment.workout_templates;
  const exList = (exercises || []).filter((e: any) => e.template_id === template.id);
  const programId = template?.program_id || "_solo";
  const program = (programs || []).find((p: any) => p.id === programId);

  const lastLog = (exId: string) =>
    (myLogs || []).find((l: any) => l.template_exercise_id === exId && l.assignment_id === assignment.id);

  return (
    <DashboardLayout role="student" title={template.title} subtitle={program?.title || ""}>
      <div className="space-y-4 max-w-3xl">
        <button
          onClick={() => setView({ kind: "program", programId })}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground uppercase tracking-wide"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Hero */}
        <div className="rounded-2xl bg-primary text-primary-foreground p-5 text-center">
          <ChevronDown className="w-5 h-5 mx-auto opacity-70" />
          <h2 className="text-xl font-bold mt-1">{template.title}</h2>
          {template.subtitle && <p className="mt-2 text-sm opacity-90">{template.subtitle}</p>}
          {template.description && <p className="mt-3 text-sm opacity-80 whitespace-pre-wrap">{template.description}</p>}
          <Button
            variant="secondary"
            className="mt-4 w-full rounded-full bg-white text-black font-bold uppercase tracking-wide"
          >
            Iniciar Treino
          </Button>
          <p className="text-xs mt-2 opacity-80">Aperte iniciar para começar o treino.</p>
        </div>

        {/* Exercises list */}
        <div className="space-y-6">
          {exList.map((ex: any, idx: number) => {
            const libraryMeta = ex.exercise_id ? exerciseLibraryMap[ex.exercise_id] : null;
            const nameKey = String(ex.custom_name || "").trim().toLowerCase();
            const libraryByName = !libraryMeta && nameKey ? exerciseLibraryByName[nameKey] : null;
            const meta = libraryMeta || libraryByName;
            const videoSource = getVideoSource(
              pickBestMediaUrl(meta?.video_url, ex.video_url, ex.image_url, meta?.image_url)
            );
            const exerciseDescription = ex.custom_description || meta?.description || "";
            const fallbackImage = "";
            const last = lastLog(ex.id);
            const key = `${assignment.id}-${ex.id}`;
            return (
              <div key={ex.id} className="space-y-3">
                <div>
                  <p className="font-bold text-foreground">
                    {idx + 1}. {ex.custom_name || "Exercício"}
                    {ex.group_name && (
                      <span
                        className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full border align-middle"
                        style={{ backgroundColor: `${ex.group_color}22`, borderColor: ex.group_color, color: ex.group_color }}
                      >
                        {ex.group_name}
                      </span>
                    )}
                  </p>
                  {(ex.sets || ex.reps) && (
                    <p className="text-sm font-semibold text-primary mt-1">
                      Série: {ex.sets && ex.reps ? `${ex.sets}x${ex.reps}` : ex.sets || ex.reps}
                      {ex.load_suggestion && ` + ${ex.load_suggestion}`}
                    </p>
                  )}
                  {ex.rest_interval && (
                    <p className="text-sm text-muted-foreground">Intervalo: ⏱ {ex.rest_interval}</p>
                  )}
                </div>

                {videoSource?.kind === "embed" && (
                  <>
                    <div className="aspect-[4/3] sm:aspect-video sm:max-h-[70vh] rounded-2xl overflow-hidden border border-border/40 relative">
                      <iframe src={videoSource.url} className="w-full h-full" allowFullScreen title={ex.custom_name} />
                      <StCoachCredit variant="overlay" />
                    </div>
                    <StCoachCredit />
                  </>
                )}

                {videoSource?.kind === "file" && (
                  <div className="aspect-[4/3] sm:aspect-video sm:max-h-[70vh] rounded-2xl overflow-hidden border border-border/40 bg-black/30">
                    <video src={videoSource.url} className="w-full h-full" controls playsInline preload="metadata" />
                  </div>
                )}

                {videoSource?.kind === "image" && (
                  <div className="aspect-[4/3] sm:aspect-video sm:max-h-[70vh] rounded-2xl overflow-hidden border border-border/40 bg-black relative">
                    <img
                      src={videoSource.url}
                      alt={ex.custom_name || "Exercício"}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      draggable={false}
                    />
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-black/70 text-white px-2 py-0.5 rounded-full">
                      ▶ Vídeo
                    </div>
                  </div>
                )}

                {!videoSource && fallbackImage && (
                  <div className="aspect-[4/3] sm:aspect-video sm:max-h-[70vh] rounded-2xl overflow-hidden border border-border/40 bg-black/30 relative">
                    <img
                      src={fallbackImage}
                      alt={ex.custom_name || "Exercício"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-black/60 text-white px-2 py-0.5 rounded-full">
                      Imagem ilustrativa
                    </div>
                  </div>
                )}

                {exerciseDescription && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-semibold text-foreground inline-flex items-center gap-1">
                      Detalhes <ChevronDown className="w-4 h-4" />
                    </summary>
                    <p className="text-muted-foreground whitespace-pre-wrap mt-2 leading-relaxed">{exerciseDescription}</p>
                  </details>
                )}

                {!videoSource && !fallbackImage && (
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-full">
                    <VideoOff className="w-3.5 h-3.5" /> Vídeo não cadastrado para este exercício.
                  </div>
                )}

                {/* Load input */}
                <div className="flex items-stretch gap-2">
                  <Textarea
                    placeholder="Anote os pesos aqui"
                    value={loadInputs[key] || ""}
                    onChange={(e) => setLoadInputs((p) => ({ ...p, [key]: e.target.value }))}
                    rows={2}
                    className="flex-1 rounded-xl bg-muted/40 border-border resize-none"
                  />
                  <div className="flex flex-col gap-1.5">
                    <Button
                      size="sm"
                      disabled={!loadInputs[key]?.trim() || saveLog.isPending}
                      onClick={() => {
                        saveLog.mutate({ assignmentId: assignment.id, templateExerciseId: ex.id, load: loadInputs[key]!.trim() });
                        setLoadInputs((p) => ({ ...p, [key]: "" }));
                      }}
                      className="rounded-full bg-primary text-primary-foreground font-bold uppercase text-xs"
                    >
                      <Save className="w-3.5 h-3.5 mr-1" /> Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLoadInputs((p) => ({ ...p, [key]: "" }))}
                      className="text-xs uppercase font-bold"
                    >
                      <Eraser className="w-3.5 h-3.5 mr-1" /> Limpar
                    </Button>
                  </div>
                </div>
                {last && (
                  <p className="text-[11px] text-muted-foreground">
                    Último: <span className="font-semibold text-foreground">{last.load_used}</span> em {new Date(last.logged_at).toLocaleDateString("pt-BR")}
                  </p>
                )}

                {idx < exList.length - 1 && (
                  <div className="flex justify-center pt-1 text-muted-foreground/50">
                    <ChevronsDown className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Feedback */}
        <div className="rounded-2xl border-2 border-primary/40 bg-card p-5 mt-6">
          <p className="text-center text-sm">O que achou do treino?</p>
          <p className="text-center font-bold text-foreground">Envie um feedback!</p>
          <Textarea
            placeholder="Deixe aqui seu feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="mt-4 rounded-xl bg-muted/40 border-border"
          />
          <Button
            disabled={finishSession.isPending}
            onClick={() =>
              finishSession.mutate({
                assignmentId: assignment.id,
                templateId: template.id,
                feedback: feedback.trim(),
              })
            }
            className="mt-4 w-full rounded-full bg-white text-black hover:bg-white/90 font-bold uppercase tracking-wide"
          >
            {feedback.trim() ? "Finalizar e enviar" : "Finalizar sem feedback"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentGuidedWorkout;