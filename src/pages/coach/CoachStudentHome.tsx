import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Target, User } from "lucide-react";
import CoachLayout from "@/components/coach/CoachLayout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCoachContext } from "@/hooks/useCoachTenant";

const CoachStudentHome = () => {
  const { student, tenant } = useCoachContext();

  const { data: detail } = useQuery({
    queryKey: ["coach-student-detail", student?.id],
    enabled: !!student?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("coach_students")
        .select("full_name, goal, height_cm, weight_kg, status")
        .eq("id", student!.id)
        .maybeSingle();
      return data;
    },
  });

  return (
    <CoachLayout
      audience="student"
      title={`Olá, ${(detail?.full_name || student?.full_name || "aluno").split(" ")[0]}`}
      subtitle={tenant?.business_name ? `Você treina com ${tenant.business_name}.` : undefined}
    >
      <Card className="p-6 rounded-2xl border-border/60">
        <Dumbbell className="h-5 w-5 text-primary mb-3" strokeWidth={1.9} />
        <p className="text-[14px] font-semibold tracking-[-0.02em]">Seus treinos</p>
        <p className="mt-2 text-[13px] text-muted-foreground font-light leading-relaxed">
          Assim que seu treinador publicar um programa, ele aparece aqui com vídeos, séries,
          repetições e registro de cargas.
        </p>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-6 rounded-2xl border-border/60">
          <Target className="h-4 w-4 text-primary mb-3" strokeWidth={1.9} />
          <p className="text-[12px] text-muted-foreground font-light">Objetivo</p>
          <p className="text-[14px] font-semibold tracking-[-0.02em] mt-1">
            {detail?.goal || "A definir com seu treinador"}
          </p>
        </Card>
        <Card className="p-6 rounded-2xl border-border/60">
          <User className="h-4 w-4 text-primary mb-3" strokeWidth={1.9} />
          <p className="text-[12px] text-muted-foreground font-light">Dados atuais</p>
          <p className="text-[14px] font-semibold tracking-[-0.02em] mt-1">
            {detail?.height_cm ? `${detail.height_cm} cm` : "—"} · {detail?.weight_kg ? `${detail.weight_kg} kg` : "—"}
          </p>
        </Card>
      </div>
    </CoachLayout>
  );
};

export default CoachStudentHome;