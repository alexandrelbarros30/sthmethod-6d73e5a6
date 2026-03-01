import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { mockDiet } from "@/lib/mock-data";

const StudentDiet = () => {
  return (
    <DashboardLayout role="student" title="Dieta Personalizada" subtitle="Seu plano alimentar estruturado por refeições.">
      <div className="space-y-4 max-w-3xl">
        {mockDiet.map((meal, i) => (
          <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
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
                {meal.foods.map((food, j) => (
                  <div key={j} className="flex items-start justify-between py-1.5 border-b border-border/50 last:border-0">
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
