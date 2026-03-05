import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

const AssistenteDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["assistente-stats"],
    queryFn: async () => {
      const [profilesRes, pendingRes] = await Promise.all([
        supabase.from("profiles").select("user_id", { count: "exact", head: true }),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("onboarding_complete", false),
      ]);
      return {
        total: profilesRes.count || 0,
        pendingOnboarding: pendingRes.count || 0,
      };
    },
  });

  return (
    <DashboardLayout role="assistente" title="Painel do Assistente" subtitle="Cadastro e suporte de alunos">
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Cadastro Pendente</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingOnboarding ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <Link to="/assistente/students">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body">Novo Aluno</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-body">Cadastrar aluno</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AssistenteDashboard;
