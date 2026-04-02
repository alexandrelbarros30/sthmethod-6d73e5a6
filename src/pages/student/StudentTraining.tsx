import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, Dumbbell, Timer, ChevronDown, ChevronUp, Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StCoachButton from "@/components/student/StCoachButton";
import StudentInfoHeader from "@/components/student/StudentInfoHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const getEmbedUrl = (url: string) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
};

const StudentTraining = () => {
  const { user } = useAuth();
  const { isActive, isLoading: subLoading } = useSubscriptionGuard();
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

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
    queryKey: ["student-training-weeks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_weeks")
        .select("*")
        .eq("user_id", user!.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!user?.id && isActive,
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
    enabled: !!weeks?.length,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = subLoading || weeksLoading || exLoading;

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
          <StCoachButton />

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
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg">Programa de Treino</h2>
                <p className="text-sm text-muted-foreground">{weeks.length} treino(s) configurado(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  // iOS universal link — tries to open app, falls back to App Store
                  window.location.href = "stcoach://";
                  setTimeout(() => { window.open(storeUrl, "_blank"); }, 1500);
                } else {
                  // Android intent — opens app if installed, falls back to Play Store
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

        {/* Tabs for each workout */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full flex overflow-x-auto gap-1 bg-muted/50 p-1 h-auto flex-wrap">
            {weeks.map((week: any, i: number) => (
              <TabsTrigger
                key={week.id}
                value={week.id}
                className="flex-1 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
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
                    const embedUrl = getEmbedUrl(ex.video_url || "");
                    const isExpanded = expandedExercises.has(ex.id);

                    return (
                      <Card
                        key={ex.id}
                        className={`overflow-hidden transition-all ${isExpanded ? "ring-1 ring-primary/30 shadow-md" : "hover:shadow-sm"}`}
                      >
                        {/* Exercise header */}
                        <button
                          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                          onClick={() => toggleExercise(ex.id)}
                        >
                          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm font-body">{ex.name}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                              {ex.reps && (
                                <span className="font-semibold text-primary">{ex.reps}</span>
                              )}
                              {ex.rest_interval && (
                                <span className="flex items-center gap-0.5">
                                  <Timer className="w-3 h-3" /> {ex.rest_interval}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {ex.video_url && (
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                <Play className="w-3.5 h-3.5 text-primary" />
                              </div>
                            )}
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            }
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="border-t border-border p-4 space-y-4 bg-muted/10">
                            {/* Video embed */}
                            {embedUrl && (
                              <div className="aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
                                <iframe
                                  src={embedUrl}
                                  className="w-full h-full"
                                  allowFullScreen
                                  title={`Vídeo - ${ex.name}`}
                                />
                              </div>
                            )}

                            {/* Stats grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {ex.reps && (
                                <div className="rounded-xl bg-background p-3 border border-border text-center">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Séries x Reps</p>
                                  <p className="font-bold text-primary text-sm">{ex.reps}</p>
                                </div>
                              )}
                              {ex.rest_interval && (
                                <div className="rounded-xl bg-background p-3 border border-border text-center">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-center gap-1">
                                    <Timer className="w-3 h-3" /> Intervalo
                                  </p>
                                  <p className="font-bold text-sm">{ex.rest_interval}</p>
                                </div>
                              )}
                              {ex.load_suggestion && (
                                <div className="rounded-xl bg-background p-3 border border-border text-center">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Carga</p>
                                  <p className="font-bold text-sm">{ex.load_suggestion}</p>
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            {ex.description && (
                              <div className="rounded-xl bg-background p-4 border border-border">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Info className="w-3.5 h-3.5 text-primary" />
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Execução</p>
                                </div>
                                <p className="text-sm text-foreground font-body leading-relaxed whitespace-pre-wrap">{ex.description}</p>
                              </div>
                            )}

                            {/* Notes */}
                            {ex.notes && (
                              <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
                                <p className="text-xs font-semibold text-primary mb-1">Observações</p>
                                <p className="text-sm text-muted-foreground font-body whitespace-pre-wrap">{ex.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
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
