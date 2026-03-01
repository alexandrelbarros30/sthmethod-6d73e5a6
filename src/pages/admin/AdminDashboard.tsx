import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, AlertCircle, Clock, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      return data || [];
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*, plans(*), profiles!subscriptions_user_id_fkey(full_name, email)");
      return data || [];
    },
  });

  const totalStudents = profiles?.length || 0;
  const now = new Date();
  const activeCount = subscriptions?.filter((s) => s.status === "active" && new Date(s.end_date) > now).length || 0;
  const expiredCount = subscriptions?.filter((s) => s.status === "expired" || new Date(s.end_date) <= now).length || 0;
  const in7Days = new Date(now.getTime() + 7 * 86400000);
  const expiringCount = subscriptions?.filter((s) => {
    const end = new Date(s.end_date);
    return s.status === "active" && end > now && end <= in7Days;
  }).length || 0;

  const metrics = [
    { label: "Total de alunos", value: totalStudents, icon: Users, color: "text-primary" },
    { label: "Alunos ativos", value: activeCount, icon: UserCheck, color: "text-success" },
    { label: "Assinaturas vencidas", value: expiredCount, icon: AlertCircle, color: "text-destructive" },
    { label: "Vencendo em 7 dias", value: expiringCount, icon: Clock, color: "text-warning" },
  ];

  return (
    <DashboardLayout role="admin" title="Dashboard" subtitle="Visão geral da consultoria.">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m, i) => (
          <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center">
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground font-body">{m.value}</p>
                <p className="text-sm text-muted-foreground font-body">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Alunos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profiles?.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground font-body">{p.full_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground font-body">{p.email}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!profiles || profiles.length === 0) && (
              <p className="text-sm text-muted-foreground font-body">Nenhum aluno cadastrado ainda.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboard;
