import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, AlertCircle, Clock, UserPlus, Bell, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminReminders from "@/components/admin/AdminReminders";

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

  // Recent completed onboardings (onboarding_complete + active subscription in last 7 days)
  const { data: recentOnboardings } = useQuery({
    queryKey: ["admin-recent-onboardings"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*, plans(name), profiles:user_id(full_name, email, onboarding_complete)")
        .gte("created_at", sevenDaysAgo)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return (subs || []).filter((s: any) => s.profiles?.onboarding_complete);
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

      {/* Onboarding Alerts */}
      {recentOnboardings && recentOnboardings.length > 0 && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Novos Cadastros Completos
              <Badge variant="default" className="ml-2">{recentOnboardings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentOnboardings.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{(s as any).profiles?.full_name || "Aluno"}</p>
                    <p className="text-xs text-muted-foreground">
                      {(s as any).plans?.name} • Cadastro completo em {new Date(s.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">Ativo</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AdminReminders />

      <Card className="mt-6">
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
