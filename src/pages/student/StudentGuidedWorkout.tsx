import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dumbbell, Video, ChevronDown, ChevronUp, Save, Clock, Repeat, Weight, Smartphone, Play } from "lucide-react";
import { toast } from "sonner";

const getEmbedUrl = (url: string) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
};

const StudentGuidedWorkout = () => {
  const { user } = useAuth();
  const { isActive, isLoading: subLoading } = useSubscriptionGuard();
  const queryClient = useQueryClient();
  const [expandedEx, setExpandedEx] = useState<Set<string>>(new Set());
  const [loadInputs, setLoadInputs] = useState<Record<string, string>>({});

  const { data: assignments, isLoading: assignLoading } = useQuery({
    queryKey: ["my-workout-assignments", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_workout_assignments")
        .select("*, workout_templates(*)")
        .eq("user_id", user!.id)
        .eq("active", true);
      // Filter out workouts that are not released
      return (data || []).filter((a: any) => a.workout_templates?.released !== false);
    },
    enabled: !!user?.id && isActive,
  });

  const templateIds = (assignments || []).map((a: any) => a.template_id);

  const { data: templateExercises } = useQuery({
    queryKey: ["my-template-exercises", templateIds],
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

  const { data: myLogs } = useQuery({
    queryKey: ["my-exercise-logs", user?.id],
    queryFn: async () => {
      const assignmentIds = (assignments || []).map((a: any) => a.id);
      if (!assignmentIds.length) return [];
      const { data } = await supabase
        .from("student_exercise_logs")
        .select("*")
        .eq("user_id", user!.id)
        .in("assignment_id", assignmentIds)
        .order("logged_at", { ascending: false });
      return data || [];
    },
    enabled: !!(assignments || []).length,
  });

  const saveLogMutation = useMutation({
    mutationFn: async ({ assignmentId, templateExerciseId, load }: { assignmentId: string; templateExerciseId: string; load: string }) => {
      const { error } = await supabase.from("student_exercise_logs").insert({
        user_id: user!.id,
        assignment_id: assignmentId,
        template_exercise_id: templateExerciseId,
        load_used: load,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-exercise-logs"] });
      toast.success("Carga registrada!");
    },
    onError: () => toast.error("Erro ao salvar carga."),
  });

  const toggleEx = (id: string) => {
    setExpandedEx(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getLastLog = (templateExerciseId: string) => {
    return (myLogs || []).find((l: any) => l.template_exercise_id === templateExerciseId);
  };

  const isLoading = subLoading || assignLoading;

  if (isLoading) {
    return (
      <DashboardLayout role="student" title="Treino Guiado" subtitle="Seus treinos atribuídos.">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </DashboardLayout>
    );
  }

  if (!isActive) {
    return (
      <DashboardLayout role="student" title="Treino Guiado" subtitle="Seus treinos atribuídos.">
        <SubscriptionBlock />
      </DashboardLayout>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <DashboardLayout role="student" title="Treino Guiado" subtitle="Seus treinos atribuídos.">
        <div className="space-y-6 max-w-4xl">
          <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardContent className="py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground font-display text-sm">Abrir no ST Coach</p>
                <p className="text-xs text-muted-foreground">Execute seu treino pelo app com cronômetro e guia</p>
              </div>
              <Button
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => {
                  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                  const storeUrl = isIOS
                    ? "https://apps.apple.com/us/app/st-coach/id1537125272"
                    : "https://play.google.com/store/apps/details?id=com.appsupercoach.app";
                  if (isIOS) {
                    window.location.href = "stcoach://";
                    setTimeout(() => { window.open(storeUrl, "_blank"); }, 1500);
                  } else {
                    window.location.href =
                      "intent://#Intent;package=com.appsupercoach.app;scheme=stcoach;S.browser_fallback_url=" +
                      encodeURIComponent(storeUrl) + ";end";
                  }
                }}
              >
                <Play className="w-3.5 h-3.5" /> Abrir App
              </Button>
            </CardContent>
          </Card>

          <Card><CardContent className="py-12 text-center">
            <Dumbbell className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum treino atribuído. Aguarde seu consultor.</p>
          </CardContent></Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" title="Treino Guiado" subtitle="Seus treinos atribuídos.">
      <div className="space-y-6 max-w-4xl">
        {/* ST Coach App Button */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardContent className="py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground font-display text-sm">Abrir no ST Coach</p>
              <p className="text-xs text-muted-foreground">Execute seu treino pelo app com cronômetro e guia</p>
            </div>
            <Button
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                const storeUrl = isIOS
                  ? "https://apps.apple.com/us/app/st-coach/id1537125272"
                  : "https://play.google.com/store/apps/details?id=com.appsupercoach.app";
                if (isIOS) {
                  window.location.href = "stcoach://";
                  setTimeout(() => { window.open(storeUrl, "_blank"); }, 1500);
                } else {
                  window.location.href =
                    "intent://#Intent;package=com.appsupercoach.app;scheme=stcoach;S.browser_fallback_url=" +
                    encodeURIComponent(storeUrl) + ";end";
                }
              }}
            >
              <Play className="w-3.5 h-3.5" /> Abrir App
            </Button>
          </CardContent>
        </Card>
        {assignments.map((assignment: any) => {
          const template = assignment.workout_templates;
          if (!template) return null;
          const exercises = (templateExercises || []).filter((e: any) => e.template_id === template.id);

          return (
            <Card key={assignment.id}>
              <CardContent className="py-5">
                <div className="flex items-center gap-2 mb-1">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-lg">{template.title}</h3>
                </div>
                {template.description && <p className="text-sm text-muted-foreground mb-2">{template.description}</p>}
                <div className="flex gap-2 mb-4 text-xs text-muted-foreground">
                  <Badge variant="outline">{template.weeks} sem</Badge>
                  <Badge variant="outline">{template.days_per_week}x/sem</Badge>
                  <Badge variant="outline">{template.minutes_per_day} min/dia</Badge>
                </div>

                <div className="space-y-3">
                  {exercises.map((ex: any, idx: number) => {
                    const isOpen = expandedEx.has(ex.id);
                    const embedUrl = getEmbedUrl(ex.video_url || "");
                    const lastLog = getLastLog(ex.id);
                    const loadKey = `${assignment.id}-${ex.id}`;

                    return (
                      <div key={ex.id} className="rounded-lg border border-border overflow-hidden">
                        <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors" onClick={() => toggleEx(ex.id)}>
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{ex.custom_name || "Exercício"}</p>
                            <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
                              {ex.sets && ex.reps && <span className="text-primary font-semibold">{ex.sets}x{ex.reps}</span>}
                              {ex.rest_interval && <span>Int: {ex.rest_interval}</span>}
                              {lastLog && <span className="text-primary">Última carga: {lastLog.load_used}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {ex.video_url && <Video className="w-4 h-4 text-primary" />}
                            {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-border p-4 space-y-4 bg-muted/20">
                            {embedUrl && (
                              <div className="aspect-video rounded-lg overflow-hidden">
                                <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={ex.custom_name} />
                              </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              {ex.sets && (
                                <div className="rounded-lg bg-background p-3 border border-border">
                                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Repeat className="w-3 h-3" /> Séries</p>
                                  <p className="font-semibold text-primary">{ex.sets}</p>
                                </div>
                              )}
                              {ex.reps && (
                                <div className="rounded-lg bg-background p-3 border border-border">
                                  <p className="text-xs text-muted-foreground mb-1">Repetições</p>
                                  <p className="font-semibold text-primary">{ex.reps}</p>
                                </div>
                              )}
                              {ex.rest_interval && (
                                <div className="rounded-lg bg-background p-3 border border-border">
                                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Intervalo</p>
                                  <p className="font-semibold">{ex.rest_interval}</p>
                                </div>
                              )}
                              {ex.load_suggestion && (
                                <div className="rounded-lg bg-background p-3 border border-border">
                                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Weight className="w-3 h-3" /> Carga sugerida</p>
                                  <p className="font-semibold">{ex.load_suggestion}</p>
                                </div>
                              )}
                            </div>

                            {ex.custom_description && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Descrição da execução</p>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{ex.custom_description}</p>
                              </div>
                            )}

                            {/* Load input */}
                            <div className="flex items-end gap-2 pt-2 border-t">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Registrar carga utilizada</p>
                                <Input
                                  placeholder="Ex: 30kg"
                                  value={loadInputs[loadKey] || ""}
                                  onChange={e => setLoadInputs(p => ({ ...p, [loadKey]: e.target.value }))}
                                />
                              </div>
                              <Button
                                size="sm"
                                disabled={!loadInputs[loadKey]?.trim() || saveLogMutation.isPending}
                                onClick={() => {
                                  saveLogMutation.mutate({
                                    assignmentId: assignment.id,
                                    templateExerciseId: ex.id,
                                    load: loadInputs[loadKey]!.trim(),
                                  });
                                  setLoadInputs(p => ({ ...p, [loadKey]: "" }));
                                }}
                              >
                                <Save className="w-4 h-4 mr-1" /> Salvar
                              </Button>
                            </div>
                            {lastLog && (
                              <p className="text-xs text-muted-foreground">
                                Último registro: <span className="font-semibold text-foreground">{lastLog.load_used}</span> em {new Date(lastLog.logged_at).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default StudentGuidedWorkout;
