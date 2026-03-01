import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StudentTraining = () => {
  const { user } = useAuth();

  const { data: weeks, isLoading } = useQuery({
    queryKey: ["training", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_weeks")
        .select("*, training_exercises(*)")
        .eq("user_id", user!.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout role="student" title="Treino Estruturado" subtitle="Sua periodização semanal de exercícios.">
      <div className="space-y-6 max-w-3xl">
        {isLoading && <p className="text-muted-foreground font-body text-sm">Carregando...</p>}
        {!isLoading && (!weeks || weeks.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground font-body">Nenhum treino cadastrado ainda. Aguarde seu consultor configurar.</p>
            </CardContent>
          </Card>
        )}
        {weeks?.map((week, i) => (
          <Card key={week.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">{week.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(week.training_exercises as any[])?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((ex: any) => (
                  <div key={ex.id} className="flex items-start justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-foreground font-body">{ex.name}</span>
                      {ex.notes && <p className="text-xs text-muted-foreground font-body">{ex.notes}</p>}
                    </div>
                    <span className="text-sm text-muted-foreground font-body whitespace-nowrap ml-4">
                      {ex.sets} × {ex.reps}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentTraining;
