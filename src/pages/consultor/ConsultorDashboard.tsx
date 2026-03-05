import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Salad, Dumbbell, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";

const ConsultorDashboard = () => {
  const { user } = useAuth();

  const { data: linkedStudents = [] } = useQuery({
    queryKey: ["consultor-students", user?.id],
    queryFn: async () => {
      const { data: links } = await supabase
        .from("consultant_students")
        .select("student_id")
        .eq("consultant_id", user!.id);
      if (!links?.length) return [];
      const ids = links.map((l) => l.student_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, avatar_url")
        .in("user_id", ids);
      return profiles || [];
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout role="consultor" title="Painel do Consultor" subtitle="Gerencie seus alunos vinculados">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Alunos Vinculados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linkedStudents.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Meus Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          {linkedStudents.length === 0 ? (
            <p className="text-muted-foreground text-sm font-body">Nenhum aluno vinculado ainda.</p>
          ) : (
            <div className="space-y-3">
              {linkedStudents.map((s: any) => (
                <div key={s.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium font-body">{s.full_name}</p>
                    <p className="text-sm text-muted-foreground font-body">{s.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/consultor/diet?student=${s.user_id}`} className="p-2 rounded hover:bg-accent"><Salad className="w-4 h-4" /></Link>
                    <Link to={`/consultor/training?student=${s.user_id}`} className="p-2 rounded hover:bg-accent"><Dumbbell className="w-4 h-4" /></Link>
                    <Link to={`/consultor/protocol?student=${s.user_id}`} className="p-2 rounded hover:bg-accent"><FlaskConical className="w-4 h-4" /></Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ConsultorDashboard;
