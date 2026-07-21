import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { usePreviewAs } from "@/hooks/usePreviewAs";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import ScreenWatermark from "@/components/student/ScreenWatermark";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dumbbell, ChevronLeft, ChevronDown, History, Play, Calendar, ChevronsDown, Save, Eraser, VideoOff, Star, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import StCoachCredit from "@/components/shared/StCoachCredit";
import SuperCoachAssignedPrograms from "@/components/shared/SuperCoachAssignedPrograms";
import WorkoutChronometer from "@/components/student/WorkoutChronometer";
import LazyVideoEmbed from "@/components/student/LazyVideoEmbed";
import { toast } from "sonner";

// Encodes URL path segments containing spaces/parens/etc while preserving the
// scheme + query. Alguns WebViews (Android) e navegadores mais restritivos
// falham silenciosamente com <img src=".../file (1).jpg"> se caracteres não
// forem escapados. Reforça a compatibilidade sem quebrar URLs já corretas.
const safeImgUrl = (raw?: string | null): string => {
  if (!raw) return "";
  try {
    const u = new URL(raw);
    u.pathname = u.pathname.split("/").map((seg) => {
      try { return encodeURIComponent(decodeURIComponent(seg)); } catch { return encodeURIComponent(seg); }
    }).join("/");
    return u.toString();
  } catch {
    return raw;
  }
};

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
  const { effectiveUserId, isPreviewing } = usePreviewAs();
  const targetUserId = effectiveUserId || user?.id;
  const { isActive, isLoading: subLoading } = useSubscriptionGuard();
  const qc = useQueryClient();
  const [view, setView] = useState<View>({ kind: "programs" });
  const [loadInputs, setLoadInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [rDifficulty, setRDifficulty] = useState<number>(0);
  const [rEnergy, setREnergy] = useState<number>(0);
  const [rMood, setRMood] = useState<number>(0);
  const [painReported, setPainReported] = useState<boolean>(false);
  // Program feedback
  const [progFbOpen, setProgFbOpen] = useState<null | string>(null); // programId
  const [pfOverall, setPfOverall] = useState(0);
  const [pfDifficulty, setPfDifficulty] = useState(0);
  const [pfResults, setPfResults] = useState(0);
  const [pfRepeat, setPfRepeat] = useState<boolean | null>(null);
  const [pfHighlights, setPfHighlights] = useState("");
  const [pfImprovements, setPfImprovements] = useState("");
  const [pfNotes, setPfNotes] = useState("");
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [chronoOpen, setChronoOpen] = useState(false);
  const [chronoRest, setChronoRest] = useState(60);
  const [chronoTitle, setChronoTitle] = useState<string>("");

  // Assignments + template (with program_id)
  const { data: assignments, isLoading: aLoading } = useQuery({
    queryKey: ["sgw-assignments", targetUserId],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("student_workout_assignments")
        .select("*, workout_templates(*)")
        .eq("user_id", targetUserId!)
        .eq("active", true)
        .eq("visible", true)
        .or(`start_date.is.null,start_date.lte.${today}`)
        .or(`end_date.is.null,end_date.gte.${today}`);
      return (data || []).filter((a: any) => a.workout_templates?.released !== false);
    },
    enabled: !!targetUserId && isActive,
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
    queryKey: ["sgw-logs", targetUserId],
    queryFn: async () => {
      const ids = (assignments || []).map((a: any) => a.id);
      if (!ids.length) return [];
      const { data } = await supabase
        .from("student_exercise_logs")
        .select("*")
        .eq("user_id", targetUserId!)
        .in("assignment_id", ids)
        .order("logged_at", { ascending: false });
      return data || [];
    },
    enabled: !!(assignments || []).length,
  });

  const saveLog = useMutation({
    mutationFn: async (p: { assignmentId: string; templateExerciseId: string; load: string }) => {
      if (isPreviewing) { toast.info("Modo visualização — carga não salva."); return; }
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
    mutationFn: async (p: {
      assignmentId: string;
      templateId: string;
      feedback: string;
      difficulty: number;
      energy: number;
      mood: number;
      pain: boolean;
    }) => {
      if (isPreviewing) { toast.info("Modo visualização — sessão não registrada."); return; }
      const { data, error } = await supabase.from("student_workout_sessions").insert({
        user_id: user!.id,
        assignment_id: p.assignmentId,
        template_id: p.templateId,
        finished_at: new Date().toISOString(),
        feedback: p.feedback,
        difficulty_rating: p.difficulty || null,
        energy_level: p.energy || null,
        mood_rating: p.mood || null,
        pain_reported: p.pain,
      }).select("id").maybeSingle();
      if (error) throw error;
      // Best-effort ST Coach sync
      if (data?.id) {
        supabase.functions.invoke("supercoach-sync-feedback", {
          body: { scope: "workout", record_id: data.id },
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      toast.success("Treino finalizado!");
      setFeedback("");
      setRDifficulty(0); setREnergy(0); setRMood(0); setPainReported(false);
      setView({ kind: "programs" });
    },
    onError: () => toast.error("Erro ao finalizar treino."),
  });

  const submitProgramFeedback = useMutation({
    mutationFn: async (p: { programId: string }) => {
      if (isPreviewing) { toast.info("Modo visualização — feedback não registrado."); return; }
      if (!pfOverall) throw new Error("Dê uma nota geral (1 a 5).");
      const { data, error } = await supabase.from("student_program_feedback").insert({
        user_id: user!.id,
        program_id: p.programId,
        overall_rating: pfOverall,
        difficulty_rating: pfDifficulty || null,
        results_rating: pfResults || null,
        would_repeat: pfRepeat,
        highlights: pfHighlights.trim() || null,
        improvements: pfImprovements.trim() || null,
        notes: pfNotes.trim() || null,
      }).select("id").maybeSingle();
      if (error) throw error;
      if (data?.id) {
        supabase.functions.invoke("supercoach-sync-feedback", {
          body: { scope: "program", record_id: data.id },
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      toast.success("Feedback do programa enviado!");
      setProgFbOpen(null);
      setPfOverall(0); setPfDifficulty(0); setPfResults(0);
      setPfRepeat(null); setPfHighlights(""); setPfImprovements(""); setPfNotes("");
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao enviar feedback."),
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
          <SuperCoachAssignedPrograms
            userId={targetUserId}
            title="Seus programas no ST Coach"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {groups.map((pid) => {
              const program = (programs || []).find((p: any) => p.id === pid);
              const list = groupedByProgram[pid];
              const title = program?.title || "Treinos";
              const poster = safeImgUrl(program?.poster_url);
              return (
                <button
                  key={pid}
                  onClick={() => setView({ kind: "program", programId: pid })}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-border/40 bg-muted text-left"
                >
                  {poster ? (
                    <img
                      src={poster}
                      alt={title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback: esconde a img e revela o placeholder abaixo
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        const ph = (e.currentTarget.nextElementSibling as HTMLElement | null);
                        if (ph) ph.style.display = "flex";
                      }}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : null}
                  {!poster && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-background flex items-center justify-center">
                      <Dumbbell className="w-10 h-10 text-foreground/40" />
                    </div>
                  )}
                  {poster && (
                    <div style={{ display: "none" }} className="absolute inset-0 bg-gradient-to-br from-primary/30 to-background items-center justify-center">
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

          {program?.poster_url && (
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-border/40 bg-muted">
              <img
                src={safeImgUrl(program.poster_url)}
                alt={program?.title || "Programa"}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3">
                <p className="text-white font-semibold text-sm tracking-tight">{program?.title}</p>
              </div>
            </div>
          )}

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
                  <ul className="mt-3 space-y-2 border-t border-border/50 pt-3">
                    {allExercises.map((ex: any, i: number) => {
                      const series = ex.sets && ex.reps ? `${ex.sets}x${ex.reps}` : (ex.sets || ex.reps || "");
                      return (
                        <li key={ex.id} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground shrink-0 pt-0.5">{i + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground font-medium leading-snug">
                                {ex.custom_name || "Exercício"}
                              </p>
                              {series && (
                                <p className="text-primary font-semibold text-xs mt-0.5 tabular-nums tracking-tight">
                                  {series}
                                </p>
                              )}
                            </div>
                          </div>
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

          {program && view.programId !== "_solo" && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Concluiu este programa?</p>
                  <p className="text-[11px] text-muted-foreground">Envie sua avaliação — vai pro seu histórico e pro ST Coach.</p>
                </div>
              </div>
              <Button
                onClick={() => setProgFbOpen(view.programId as string)}
                className="rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wide text-xs px-4"
              >
                Avaliar Programa
              </Button>
            </div>
          )}
        </div>

        <ProgramFeedbackDialog
          open={!!progFbOpen}
          onOpenChange={(o) => !o && setProgFbOpen(null)}
          programTitle={program?.title || ""}
          pfOverall={pfOverall} setPfOverall={setPfOverall}
          pfDifficulty={pfDifficulty} setPfDifficulty={setPfDifficulty}
          pfResults={pfResults} setPfResults={setPfResults}
          pfRepeat={pfRepeat} setPfRepeat={setPfRepeat}
          pfHighlights={pfHighlights} setPfHighlights={setPfHighlights}
          pfImprovements={pfImprovements} setPfImprovements={setPfImprovements}
          pfNotes={pfNotes} setPfNotes={setPfNotes}
          onSubmit={() => progFbOpen && submitProgramFeedback.mutate({ programId: progFbOpen })}
          submitting={submitProgramFeedback.isPending}
        />
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
      <ScreenWatermark fixed />
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
            onClick={() => {
              const first = exList[0];
              const raw = String(first?.rest_interval || "").match(/(\d+)\s*(m|min|s|seg)?/i);
              let secs = 60;
              if (raw) {
                const n = parseInt(raw[1], 10);
                const unit = (raw[2] || "").toLowerCase();
                secs = unit.startsWith("m") ? n * 60 : n;
              }
              setChronoRest(secs);
              setChronoTitle(template.title);
              setChronoOpen(true);
            }}
          >
            Iniciar Treino
          </Button>
          <p className="text-xs mt-2 opacity-80">Aperte iniciar para começar o treino.</p>
        </div>

        <WorkoutChronometer
          open={chronoOpen}
          onClose={() => setChronoOpen(false)}
          workoutTitle={chronoTitle}
          defaultRest={chronoRest}
        />

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
                      <LazyVideoEmbed url={videoSource.url} title={ex.custom_name} posterUrl={ex.image_url || meta?.image_url} />
                      <StCoachCredit variant="overlay" />
                    </div>
                    <StCoachCredit />
                  </>
                )}

                {videoSource?.kind === "file" && (
                  <div className="aspect-[4/3] sm:aspect-video sm:max-h-[70vh] rounded-2xl overflow-hidden border border-border/40 bg-black/30">
                    <video src={videoSource.url} className="w-full h-full" controls playsInline preload="none" />
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
          <p className="text-center font-bold text-foreground">Envie seu feedback</p>

          <div className="mt-4 space-y-3">
            <RatingRow label="Dificuldade" value={rDifficulty} onChange={setRDifficulty} />
            <RatingRow label="Energia" value={rEnergy} onChange={setREnergy} />
            <RatingRow label="Humor" value={rMood} onChange={setRMood} />
            <div className="flex items-center justify-between gap-3 pt-1">
              <Label htmlFor="pain-switch" className="text-sm">Senti dor / desconforto</Label>
              <Switch id="pain-switch" checked={painReported} onCheckedChange={setPainReported} />
            </div>
          </div>

          <Textarea
            placeholder="Observações (opcional)"
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
                difficulty: rDifficulty,
                energy: rEnergy,
                mood: rMood,
                pain: painReported,
              })
            }
            className="mt-4 w-full rounded-full bg-white text-black hover:bg-white/90 font-bold uppercase tracking-wide"
          >
            {(feedback.trim() || rDifficulty || rEnergy || rMood || painReported)
              ? "Finalizar e enviar"
              : "Finalizar sem feedback"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentGuidedWorkout;

// -------- Helpers UI --------
function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            className="p-1"
            aria-label={`${label} ${n}`}
          >
            <Star
              className={`w-5 h-5 transition-colors ${n <= value ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProgramFeedbackDialog(props: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  programTitle: string;
  pfOverall: number; setPfOverall: (n: number) => void;
  pfDifficulty: number; setPfDifficulty: (n: number) => void;
  pfResults: number; setPfResults: (n: number) => void;
  pfRepeat: boolean | null; setPfRepeat: (v: boolean | null) => void;
  pfHighlights: string; setPfHighlights: (v: string) => void;
  pfImprovements: string; setPfImprovements: (v: string) => void;
  pfNotes: string; setPfNotes: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const {
    open, onOpenChange, programTitle,
    pfOverall, setPfOverall, pfDifficulty, setPfDifficulty, pfResults, setPfResults,
    pfRepeat, setPfRepeat, pfHighlights, setPfHighlights, pfImprovements, setPfImprovements,
    pfNotes, setPfNotes, onSubmit, submitting,
  } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliar programa: {programTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RatingRow label="Nota geral" value={pfOverall} onChange={setPfOverall} />
          <RatingRow label="Dificuldade" value={pfDifficulty} onChange={setPfDifficulty} />
          <RatingRow label="Resultados percebidos" value={pfResults} onChange={setPfResults} />
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Repetiria este programa?</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={pfRepeat === true ? "default" : "outline"} onClick={() => setPfRepeat(pfRepeat === true ? null : true)}>Sim</Button>
              <Button size="sm" variant={pfRepeat === false ? "default" : "outline"} onClick={() => setPfRepeat(pfRepeat === false ? null : false)}>Não</Button>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Destaques</Label>
            <Textarea rows={2} value={pfHighlights} onChange={(e) => setPfHighlights(e.target.value)} placeholder="O que funcionou melhor?" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Melhorias</Label>
            <Textarea rows={2} value={pfImprovements} onChange={(e) => setPfImprovements(e.target.value)} placeholder="O que pode melhorar?" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea rows={2} value={pfNotes} onChange={(e) => setPfNotes(e.target.value)} placeholder="Outras observações" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={submitting || !pfOverall}>
            {submitting ? "Enviando..." : "Enviar feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}