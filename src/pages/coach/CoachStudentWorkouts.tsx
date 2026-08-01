import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Timer } from "lucide-react";
import CoachLayout from "@/components/coach/CoachLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCoachContext } from "@/hooks/useCoachTenant";

const formatDate = (d?: string | null) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR") : null;

const CoachStudentWorkouts = () => {
  const { student } = useCoachContext();

  const { data, isLoading } = useQuery({
    queryKey: ["coach-student-programs", student?.id],
    enabled: !!student?.id,
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from("coach_student_programs")
        .select("id, program_id, start_date, end_date, active")
        .eq("student_id", student!.id)
        .eq("active", true);
      const programIds = (assignments || []).map((a: any) => a.program_id);
      if (!programIds.length) return { assignments: [], programs: [], workouts: [], exercises: [] };
      const { data: programs } = await supabase
        .from("coach_programs").select("id, name, goal, weeks, description").in("id", programIds);
      const { data: workouts } = await supabase
        .from("coach_workouts").select("id, program_id, name, day_label, notes, order_index")
        .in("program_id", programIds).order("order_index");
      const workoutIds = (workouts || []).map((w: any) => w.id);
      const { data: exercises } = workoutIds.length
        ? await supabase.from("coach_workout_exercises").select("*").in("workout_id", workoutIds).order("order_index")
        : { data: [] as any[] };
      return { assignments: assignments || [], programs: programs || [], workouts: workouts || [], exercises: exercises || [] };
    },
  });

  return (
    <CoachLayout audience="student" title="Meus treinos" subtitle="Programas montados pelo seu treinador.">
      {isLoading && <Card className="p-6 rounded-2xl border-border/60 text-[13px] text-muted-foreground">Carregando…</Card>}

      {!isLoading && !data?.programs.length && (
        <Card className="p-10 rounded-2xl border-border/60 text-center">
          <Dumbbell className="h-6 w-6 text-primary mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-[14px] font-semibold tracking-[-0.02em]">Nenhum treino publicado ainda</p>
          <p className="text-[13px] text-muted-foreground font-light mt-1.5">
            Assim que seu treinador atribuir um programa, ele aparece aqui.
          </p>
        </Card>
      )}

      <div className="space-y-6">
        {(data?.programs || []).map((p: any) => {
          const assignment = (data?.assignments || []).find((a: any) => a.program_id === p.id);
          const workouts = (data?.workouts || []).filter((w: any) => w.program_id === p.id);
          return (
            <div key={p.id}>
              <Card className="p-5 rounded-2xl border-border/60">
                <p className="text-[16px] font-semibold tracking-[-0.025em]">{p.name}</p>
                <p className="text-[12px] text-muted-foreground font-light mt-1">
                  {p.goal || "Programa de treino"} · {p.weeks} semanas
                  {assignment?.end_date ? ` · até ${formatDate(assignment.end_date)}` : ""}
                </p>
                {p.description && (
                  <p className="text-[13px] text-muted-foreground font-light mt-3 leading-relaxed">{p.description}</p>
                )}
              </Card>

              <div className="mt-3 space-y-3">
                {workouts.map((w: any) => {
                  const exs = (data?.exercises || []).filter((e: any) => e.workout_id === w.id);
                  return (
                    <Card key={w.id} className="p-5 rounded-2xl border-border/60">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold tracking-[-0.02em]">{w.name}</p>
                        {w.day_label && <Badge variant="secondary" className="text-[10px] font-normal">{w.day_label}</Badge>}
                      </div>
                      <div className="mt-3 space-y-2">
                        {exs.map((ex: any) => (
                          <div
                            key={ex.id}
                            className={`flex items-center gap-3 rounded-xl border p-3 ${
                              ex.group_type !== "single" ? "border-primary/25 bg-primary/[0.03]" : "border-border/50"
                            }`}
                          >
                            {ex.thumb_url ? (
                              <img src={ex.thumb_url} alt={ex.name} loading="lazy" className="h-12 w-16 rounded-lg object-cover" />
                            ) : (
                              <div className="h-12 w-16 rounded-lg bg-muted flex items-center justify-center">
                                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium truncate">{ex.name}</p>
                              <p className="text-[12px] text-muted-foreground font-light">
                                {ex.sets} × {ex.reps}
                                {ex.load_text ? ` · ${ex.load_text}` : ""}
                              </p>
                              {ex.notes && <p className="text-[11px] text-muted-foreground mt-0.5">{ex.notes}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              {ex.group_type !== "single" && (
                                <Badge variant="outline" className="text-[10px] uppercase mb-1">{ex.group_type}</Badge>
                              )}
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                                <Timer className="h-3 w-3" /> {ex.rest_seconds}s
                              </p>
                            </div>
                          </div>
                        ))}
                        {!exs.length && (
                          <p className="text-[12px] text-muted-foreground font-light">Sem exercícios cadastrados.</p>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </CoachLayout>
  );
};

export default CoachStudentWorkouts;