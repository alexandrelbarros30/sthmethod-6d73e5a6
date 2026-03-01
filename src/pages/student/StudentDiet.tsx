import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StudentDiet = () => {
  const { user } = useAuth();

  const { data: meals, isLoading } = useQuery({
    queryKey: ["diet", user?.id],
    queryFn: async () => {
      const { data: mealsData } = await supabase
        .from("diet_meals")
        .select("*, diet_foods(*)")
        .eq("user_id", user!.id)
        .order("sort_order");
      return mealsData || [];
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout role="student" title="Dieta Personalizada" subtitle="Seu plano alimentar estruturado por refeições.">
      <div className="space-y-4 max-w-3xl">
        {isLoading && <p className="text-muted-foreground font-body text-sm">Carregando...</p>}
        {!isLoading && (!meals || meals.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground font-body">Nenhuma dieta cadastrada ainda. Aguarde seu consultor configurar.</p>
            </CardContent>
          </Card>
        )}
        {meals?.map((meal, i) => (
          <Card key={meal.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">{meal.name}</CardTitle>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" /> {meal.time}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(meal.diet_foods as any[])?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((food: any) => (
                  <div key={food.id} className="flex items-start justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-foreground font-body">{food.item}</span>
                      {food.notes && <p className="text-xs text-muted-foreground font-body">{food.notes}</p>}
                    </div>
                    <span className="text-sm text-muted-foreground font-body whitespace-nowrap ml-4">{food.quantity}</span>
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

export default StudentDiet;
