import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, UserPlus, TrendingUp, CalendarClock, ArrowRight } from "lucide-react";
import CoachLayout from "@/components/coach/CoachLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useCoachContext } from "@/hooks/useCoachTenant";
import { getCoachPlan } from "@/lib/coach-plans";

const CoachDashboard = () => {
  const { tenant, member } = useCoachContext();
  const tenantId = tenant?.id;

  const { data } = useQuery({
    queryKey: ["coach-dashboard", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 864e5).toISOString();
      const [students, recent, invites] = await Promise.all([
        supabase.from("coach_students").select("id, full_name, status, created_at").eq("tenant_id", tenantId!),
        supabase.from("coach_students").select("id").eq("tenant_id", tenantId!).gte("created_at", since),
        supabase.from("coach_invites").select("id").eq("tenant_id", tenantId!).is("redeemed_at", null),
      ]);
      const all = students.data || [];
      return {
        total: all.length,
        active: all.filter((s: any) => s.status === "active").length,
        newThisWeek: (recent.data || []).length,
        openInvites: (invites.data || []).length,
        latest: [...all].sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 5),
      };
    },
  });

  const plan = getCoachPlan(tenant?.plan);
  const limit = tenant?.student_limit ?? plan.studentLimit;
  const used = data?.active ?? 0;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const stats = [
    { icon: Users, label: "Alunos ativos", value: used },
    { icon: TrendingUp, label: "Total cadastrado", value: data?.total ?? 0 },
    { icon: UserPlus, label: "Novos (7 dias)", value: data?.newThisWeek ?? 0 },
    { icon: CalendarClock, label: "Convites abertos", value: data?.openInvites ?? 0 },
  ];

  return (
    <CoachLayout
      title={`Olá, ${(member?.full_name || "treinador").split(" ")[0]}`}
      subtitle="Sua operação de treino em um só lugar."
      actions={
        <Button asChild className="rounded-full">
          <Link to="/coach/alunos">
            Gerenciar alunos <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 rounded-2xl border-border/60">
            <s.icon className="h-4 w-4 text-primary mb-3" strokeWidth={1.9} />
            <p className="text-2xl font-semibold tracking-[-0.03em]">{s.value}</p>
            <p className="text-[12px] text-muted-foreground mt-1 font-light">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-5 p-6 rounded-2xl border-border/60">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[13px] font-semibold tracking-[-0.02em]">Plano {plan.name}</p>
            <p className="text-[12px] text-muted-foreground font-light mt-0.5">
              {used} de {limit.toLocaleString("pt-BR")} alunos ativos
            </p>
          </div>
          <Badge variant={pct >= 90 ? "destructive" : "secondary"} className="rounded-full">{pct}% usado</Badge>
        </div>
        <Progress value={pct} className="mt-4 h-1.5" />
        <Button asChild variant="outline" size="sm" className="mt-5 rounded-full">
          <Link to="/coach/planos">Ver planos e limites</Link>
        </Button>
      </Card>

      <Card className="mt-5 p-6 rounded-2xl border-border/60">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-semibold tracking-[-0.02em]">Últimos alunos</p>
          <Button asChild variant="ghost" size="sm" className="rounded-full text-[12px]">
            <Link to="/coach/convites">Convidar</Link>
          </Button>
        </div>
        {data?.latest?.length ? (
          <ul className="divide-y divide-border/60">
            {data.latest.map((s: any) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <span className="text-[13px] tracking-tight">{s.full_name}</span>
                <Badge variant={s.status === "active" ? "secondary" : "outline"} className="rounded-full text-[10px]">
                  {s.status === "active" ? "Ativo" : s.status}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted-foreground font-light">
            Nenhum aluno ainda. Comece cadastrando manualmente ou enviando um convite.
          </p>
        )}
      </Card>
    </CoachLayout>
  );
};

export default CoachDashboard;