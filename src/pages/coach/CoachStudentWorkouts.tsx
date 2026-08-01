import { useQuery } from "@tanstack/react-query";
import { Dumbbell } from "lucide-react";
import CoachLayout from "@/components/coach/CoachLayout";
import StudentWorkoutView from "@/components/coach/StudentWorkoutView";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCoachContext } from "@/hooks/useCoachTenant";

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
            <StudentWorkoutView
              key={p.id}
              program={p}
              workouts={workouts}
              exercises={data?.exercises || []}
              endDate={assignment?.end_date}
            />
          );
        })}
      </div>
    </CoachLayout>
  );
};

export default CoachStudentWorkouts;