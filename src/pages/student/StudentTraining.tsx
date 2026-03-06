import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, Dumbbell, Timer, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

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
        <Card><CardContent className="py-8 text-center">
          <p className="text-muted-foreground font-body">Nenhum treino configurado ainda. Aguarde seu consultor.</p>
        </CardContent></Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" title="Treino" subtitle="Seu plano de treino personalizado.">
      <style>{`
        @media print { .training-protected { display: none !important; } body::after { content: "Impressão não permitida"; display: flex; align-items: center; justify-content: center; font-size: 2rem; height: 100vh; } }
        .training-protected { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; -webkit-touch-callout: none; }
      `}</style>
      <div className="space-y-6 max-w-4xl training-protected">
        {weeks.map((week: any) => {
          const weekExercises = (exercises || [])
            .filter((e: any) => e.week_id === week.id)
            .sort((a: any, b: any) => a.sort_order - b.sort_order);

          return (
            <Card key={week.id}>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  {week.name}
                  <Badge variant="outline" className="text-xs ml-2">{weekExercises.length} exercício(s)</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {weekExercises.map((ex: any, idx: number) => {
                  const embedUrl = getEmbedUrl(ex.video_url || "");
                  const isExpanded = expandedExercises.has(ex.id);

                  return (
                    <div key={ex.id} className="rounded-lg border border-border overflow-hidden">
                      {/* Exercise header - always visible */}
                      <button
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                        onClick={() => toggleExercise(ex.id)}
                      >
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm font-body">{ex.name}</p>
                          <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
                            {ex.reps && <span className="text-primary font-semibold">{ex.reps}</span>}
                            {ex.rest_interval && <span>Intervalo: {ex.rest_interval}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {ex.video_url && <Video className="w-4 h-4 text-primary" />}
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="border-t border-border p-4 space-y-4 bg-muted/20">
                          {embedUrl && (
                            <div className="aspect-video rounded-lg overflow-hidden">
                              <iframe
                                src={embedUrl}
                                className="w-full h-full"
                                allowFullScreen
                                title={`Vídeo - ${ex.name}`}
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            {ex.reps && (
                              <div className="rounded-lg bg-background p-3 border border-border">
                                <p className="text-xs text-muted-foreground mb-1">Séries x Reps</p>
                                <p className="font-semibold text-primary">{ex.reps}</p>
                              </div>
                            )}
                            {ex.rest_interval && (
                              <div className="rounded-lg bg-background p-3 border border-border">
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Timer className="w-3 h-3" /> Intervalo</p>
                                <p className="font-semibold">{ex.rest_interval}</p>
                              </div>
                            )}
                            {ex.load_suggestion && (
                              <div className="rounded-lg bg-background p-3 border border-border">
                                <p className="text-xs text-muted-foreground mb-1">Carga</p>
                                <p className="font-semibold">{ex.load_suggestion}</p>
                              </div>
                            )}
                          </div>

                          {ex.description && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Descrição da execução</p>
                              <p className="text-sm text-foreground font-body leading-relaxed whitespace-pre-wrap">{ex.description}</p>
                            </div>
                          )}

                          {ex.notes && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Observações</p>
                              <p className="text-sm text-muted-foreground font-body whitespace-pre-wrap">{ex.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {weekExercises.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum exercício neste treino.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default StudentTraining;
