import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockPlans } from "@/lib/mock-data";

const AdminPlans = () => {
  return (
    <DashboardLayout role="admin" title="Gestão de Planos" subtitle="Configure e gerencie os planos oferecidos.">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
        {mockPlans.map((plan, i) => (
          <Card key={plan.id} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
              <p className="text-2xl font-bold text-foreground mt-2 font-body">{plan.price}</p>
              <p className="text-xs text-muted-foreground font-body">{plan.duration}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.benefits.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm font-body">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{b}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full gap-2" size="sm">
                <Settings className="w-3 h-3" /> Editar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminPlans;
