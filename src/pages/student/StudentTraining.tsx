import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { usePreviewAs } from "@/hooks/usePreviewAs";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, Dumbbell, Timer, ChevronDown, ChevronUp, Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StudentInfoHeader from "@/components/student/StudentInfoHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StudentGuidedWorkout from "@/pages/student/StudentGuidedWorkout";
import StCoachCredit from "@/components/shared/StCoachCredit";

const getMediaSource = (url: string): { kind: "embed" | "image" | "file"; url: string } | null => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return { kind: "embed", url: `https://www.youtube.com/embed/${ytMatch[1]}` };
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { kind: "embed", url: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  if (/\.(gif|png|jpe?g|webp|avif)(\?.*)?$/i.test(url)) return { kind: "image", url };
  return { kind: "file", url };
};

const isImageUrl = (url?: string | null) =>
  !!url && /\.(gif|png|jpe?g|webp|avif)(\?.*)?$/i.test(url);

const pickBestMediaUrl = (...candidates: (string | null | undefined)[]): string => {
  const list = candidates.filter((u): u is string => !!u && u.trim().length > 0);
  const nonImage = list.find((u) => !isImageUrl(u));
  return nonImage || list[0] || "";
};

const StudentTraining = () => {
  const { user } = useAuth();
  const { effectiveUserId } = usePreviewAs();
  const targetUserId = effectiveUserId || user?.id;
  const { isActive, isLoading: subLoading } = useSubscriptionGuard();
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  // Auto-expand all exercises so the student sees details highlighted immediately
  // (no need to click to open — media + reps + notes are visible by default).

  const { data: guidedAssignmentsCount = 0, isLoading: guidedAssignmentsLoading } = useQuery({
    queryKey: ["student-guided-assignment-count", targetUserId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("student_workout_assignments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", targetUserId!)
        .eq("active", true);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!targetUserId && isActive,
  });

  const hasGuidedAssignments = guidedAssignmentsCount > 0;

  // Prevent screenshots
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.key === "p") || (e.metaKey && e.key === "p")) {
        e.preventDefault();
        document.body.style.filter = "blur(20px)";
        setTimeout(() => { document.body.style.filter = "none"; }, 1500);
      }
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleVisibilityChange = () => {
      document.body.style.filter = document.visibilityState === "hidden" ? "blur(20px)" : "none";
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.body.style.filter = "none";
    };
  }, []);

  const { data: weeks, isLoading: weeksLoading } = useQuery({
    queryKey: ["student-training-weeks", targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_weeks")
        .select("*")
        .eq("user_id", targetUserId!)
        .order("sort_order");
      return data || [];
    },
    enabled: !!targetUserId && isActive && !hasGuidedAssignments,
  });

  const { data: exercises, isLoading: exLoading } = useQuery({
    queryKey: ["student-training-exercises", user?.id],
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
    enabled: !!weeks?.length && !hasGuidedAssignments,
  });

  useEffect(() => {
    if (exercises && exercises.length > 0) {
      setExpandedExercises(new Set((exercises as any[]).map((e: any) => e.id)));
    }
  }, [exercises]);

  const { data: profile } = useQuery({
    queryKey: ["profile-training", targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", targetUserId!)
        .single();
      return data;
    },
    enabled: !!targetUserId,
  });

  const { data: libraryByName = {} } = useQuery({
    queryKey: ["student-training-library-by-name"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercise_library")
        .select("name, video_url, image_url");
      const map: Record<string, { video_url?: string | null; image_url?: string | null }> = {};
      (data || []).forEach((row: any) => {
        const key = String(row.name || "").trim().toLowerCase();
        if (key) map[key] = { video_url: row.video_url, image_url: row.image_url };
      });
      return map;
    },
    enabled: !!targetUserId && isActive && !hasGuidedAssignments,
  });

  const isLoading = subLoading || guidedAssignmentsLoading || weeksLoading || exLoading;

  if (hasGuidedAssignments) {
    return <StudentGuidedWorkout />;
  }

  const toggleExercise = (id: string) => {
    setExpandedExercises(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout role="student" title="Treino" subtitle="Seu plano de treino personalizado.">
        <p className="text-muted-foreground font-body text-sm">Carregando...</p>
      </DashboardLayout>
    );
  }

  if (!isActive) {
    return (
      <DashboardLayout role="student" title="Treino" subtitle="Seu plano de treino personalizado.">
        <SubscriptionBlock />
      </DashboardLayout>
    );
  }

  if (!weeks || weeks.length === 0) {
    return (
      <DashboardLayout role="student" title="Treino" subtitle="Seu plano de treino personalizado.">
        <div className="max-w-4xl training-protected space-y-4">
          <Card><CardContent className="py-8 text-center">
            <Dumbbell className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-body">Nenhum treino configurado ainda. Aguarde seu consultor.</p>
          </CardContent></Card>
        </div>
      </DashboardLayout>
    );
  }

  const defaultTab = weeks[0]?.id || "";

  return (
    <DashboardLayout role="student" title="Treino" subtitle="Seu plano de treino personalizado.">
      <style>{`
        @media print { .training-protected { display: none !important; } body::after { content: "Impressão não permitida"; display: flex; align-items: center; justify-content: center; font-size: 2rem; height: 100vh; } }
        .training-protected { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; -webkit-touch-callout: none; }
      `}</style>
      <div className="max-w-4xl training-protected space-y-4">
        {/* Student info */}
        {profile && (
          <Card className="border-border bg-muted/50">
            <CardContent className="py-4">
              <StudentInfoHeader info={{
                name: profile.full_name || undefined,
                age: profile.birth_date ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
                weight: profile.weight || undefined,
                height: profile.height || undefined,
                objective: profile.objective || undefined,
              }} />
            </CardContent>
          </Card>
        )}

        {/* Program header card */}
        <div className="rounded-3xl border border-border/40 bg-background p-6">
          <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">Programa</p>
          <h2 className="text-[28px] font-semibold text-foreground tracking-[-0.035em] leading-tight mt-2">Treino</h2>
          <p className="text-[12px] text-muted-foreground font-light mt-2 tracking-tight">{weeks.length} treino(s) configurado(s)</p>
        </div>

        {/* Tabs for each workout */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full flex overflow-x-auto gap-1 bg-muted/50 p-1 h-auto flex-wrap">
            {weeks.map((week: any, i: number) => (
              <TabsTrigger
                key={week.id}
                value={week.id}
                className="flex-1 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                {week.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {weeks.map((week: any) => {
            const weekExercises = (exercises || [])
              .filter((e: any) => e.week_id === week.id)
              .sort((a: any, b: any) => a.sort_order - b.sort_order);

            return (
              <TabsContent key={week.id} value={week.id} className="mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    {weekExercises.length} exercício(s)
                  </Badge>
                </div>

                <div className="space-y-3">
                   {weekExercises.map((ex: any, idx: number) => {
                     const nameKey = String(ex.name || "").trim().toLowerCase();
                     const libMeta = nameKey ? (libraryByName as any)[nameKey] : null;
                     const media = getMediaSource(
                       pickBestMediaUrl(libMeta?.video_url, ex.video_url, ex.image_url, libMeta?.image_url)
                     );
                    const isExpanded = expandedExercises.has(ex.id);

                    return (
                      <div
                        key={ex.id}
                        className={`rounded-3xl border bg-background overflow-hidden transition-all ${isExpanded ? "border-foreground/50 shadow-[0_8px_28px_-14px_rgba(0,0,0,0.35)] ring-1 ring-foreground/10" : "border-border/40"}`}
                      >
                        {/* Exercise header */}
                        <button
                          className="w-full flex items-center gap-4 p-5 text-left transition-colors"
                          onClick={() => toggleExercise(ex.id)}
                        >
                          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-foreground text-background text-[13px] font-semibold shrink-0 tabular-nums tracking-tight">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-foreground tracking-[-0.015em]">{ex.name}</p>
                            {ex.reps && (
                              <p className="mt-1 text-[12px] font-medium text-foreground/70 tabular-nums tracking-tight">
                                {ex.reps}
                              </p>
                            )}
                            {ex.rest_interval && (
                              <p className="mt-0.5 text-[11px] text-muted-foreground/60 font-light tracking-tight flex items-center gap-1">
                                <Timer className="w-3 h-3" /> Int: {ex.rest_interval}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {media && (
                              <Play className="w-4 h-4 text-foreground/60" strokeWidth={1.8} />
                            )}
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 text-foreground/40" strokeWidth={2} />
                              : <ChevronDown className="w-4 h-4 text-foreground/40" strokeWidth={2} />
                            }
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="border-t border-border/40 p-5 space-y-4">
                            {/* Video embed */}
                            {media?.kind === "embed" && (
                              <div className="space-y-1.5">
                                <div className="relative aspect-[4/3] sm:aspect-video sm:max-h-[70vh] rounded-2xl overflow-hidden border border-border/40">
                                  <iframe
                                    src={media.url}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title={`Vídeo - ${ex.name}`}
                                  />
                                  <StCoachCredit variant="overlay" />
                                </div>
                                <StCoachCredit />
                              </div>
                            )}
                            {media?.kind === "image" && (
                              <div className="aspect-[4/3] sm:aspect-video sm:max-h-[70vh] rounded-2xl overflow-hidden border border-border/40 bg-black relative">
                                <img
                                  src={media.url}
                                  alt={ex.name}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                  draggable={false}
                                />
                                <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-black/70 text-white px-2 py-0.5 rounded-full">
                                  <Play className="w-3 h-3" strokeWidth={2} /> Vídeo
                                </div>
                              </div>
                            )}
                            {media?.kind === "file" && (
                              <div className="aspect-[4/3] sm:aspect-video sm:max-h-[70vh] rounded-2xl overflow-hidden border border-border/40 bg-black/30">
                                <video src={media.url} className="w-full h-full" controls playsInline preload="metadata" />
                              </div>
                            )}

                            {/* Stats grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {ex.reps && (
                                <div className="rounded-2xl border border-border/40 p-3 text-center">
                                  <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5 font-medium">Séries x Reps</p>
                                  <p className="font-semibold text-foreground text-[13px] tabular-nums tracking-tight">{ex.reps}</p>
                                </div>
                              )}
                              {ex.rest_interval && (
                                <div className="rounded-2xl border border-border/40 p-3 text-center">
                                  <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5 font-medium">Intervalo</p>
                                  <p className="font-semibold text-foreground text-[13px] tabular-nums tracking-tight">{ex.rest_interval}</p>
                                </div>
                              )}
                              {ex.load_suggestion && (
                                <div className="rounded-2xl border border-border/40 p-3 text-center">
                                  <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5 font-medium">Carga</p>
                                  <p className="font-semibold text-foreground text-[13px] tabular-nums tracking-tight">{ex.load_suggestion}</p>
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            {ex.description && (
                              <div className="rounded-2xl border border-border/40 p-4">
                                <p className="text-[9px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-2">Execução</p>
                                <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap font-light tracking-tight">{ex.description}</p>
                              </div>
                            )}

                            {/* Notes */}
                            {ex.notes && (
                              <div className="rounded-2xl border border-border/40 p-4">
                                <p className="text-[9px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-2">Observações</p>
                                <p className="text-[13px] text-muted-foreground whitespace-pre-wrap font-light tracking-tight leading-relaxed">{ex.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {weekExercises.length === 0 && (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Dumbbell className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhum exercício neste treino.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StudentTraining;
