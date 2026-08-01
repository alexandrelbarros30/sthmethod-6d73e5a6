import { Check } from "lucide-react";
import CoachLayout from "@/components/coach/CoachLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { COACH_PLANS, getCoachPlan } from "@/lib/coach-plans";
import { useCoachContext } from "@/hooks/useCoachTenant";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const CoachPlans = () => {
  const { tenant } = useCoachContext();
  const current = getCoachPlan(tenant?.plan);
  const limit = tenant?.student_limit ?? current.studentLimit;

  const { data: used = 0 } = useQuery({
    queryKey: ["coach-plan-usage", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("coach_students")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant!.id)
        .eq("status", "active");
      return count ?? 0;
    },
  });

  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <CoachLayout title="Plano" subtitle="Limites de alunos e recursos disponíveis no seu ambiente.">
      <Card className="p-6 rounded-2xl border-border/60">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[13px] font-semibold tracking-[-0.02em]">Plano atual: {current.name}</p>
            <p className="text-[12px] text-muted-foreground font-light mt-0.5">
              {used} de {limit.toLocaleString("pt-BR")} alunos ativos
            </p>
          </div>
          <Badge variant={pct >= 90 ? "destructive" : "secondary"} className="rounded-full">{pct}% usado</Badge>
        </div>
        <Progress value={pct} className="mt-4 h-1.5" />
      </Card>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        {COACH_PLANS.map((plan) => {
          const isCurrent = plan.id === current.id;
          return (
            <Card
              key={plan.id}
              className={cn("relative p-6 rounded-2xl flex flex-col border-border/60", isCurrent && "border-primary/50")}
            >
              {isCurrent && (
                <Badge className="absolute -top-2.5 left-6 rounded-full text-[10px] px-2.5">Seu plano</Badge>
              )}
              <h3 className="text-[15px] font-semibold tracking-[-0.02em]">{plan.name}</h3>
              <p className="mt-1 text-[12px] text-muted-foreground font-light leading-snug min-h-[32px]">{plan.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-2xl font-semibold tracking-[-0.03em]">{plan.price}</span>
                <span className="text-[11px] text-muted-foreground">{plan.priceNote}</span>
              </div>
              <ul className="mt-5 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[12.5px] text-muted-foreground leading-relaxed">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" strokeWidth={2.4} />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[11.5px] text-muted-foreground font-light">
        A cobrança automática será habilitada em breve. Para mudar de plano agora, fale com o suporte STH METHOD.
      </p>
    </CoachLayout>
  );
};

export default CoachPlans;