import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StudentSubscription = () => {
  const { user } = useAuth();

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("active", true).order("duration_days");
      return data || [];
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["my-subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const currentPlanId = subscription?.plan_id;

  return (
    <DashboardLayout role="student" title="Assinatura" subtitle="Gerencie seu plano e veja os benefícios.">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
        {plans?.map((plan, i) => {
          const isCurrent = plan.id === currentPlanId;
          return (
            <Card
              key={plan.id}
              className={`animate-fade-in relative ${isCurrent ? "border-primary shadow-card-hover ring-2 ring-primary/20" : ""}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Seu plano</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2 pt-6">
                <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
                <p className="text-2xl font-bold text-foreground mt-2 font-body">{plan.price}</p>
                <p className="text-xs text-muted-foreground font-body">{plan.duration}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.benefits?.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm font-body">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default StudentSubscription;
