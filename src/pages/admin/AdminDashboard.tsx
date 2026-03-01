import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, AlertCircle, Clock, DollarSign, UserPlus } from "lucide-react";
import { mockAdminMetrics, mockStudents } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

const metrics = [
  { label: "Total de alunos", value: mockAdminMetrics.totalStudents, icon: Users, color: "text-primary" },
  { label: "Alunos ativos", value: mockAdminMetrics.activeStudents, icon: UserCheck, color: "text-success" },
  { label: "Assinaturas vencidas", value: mockAdminMetrics.expiredSubscriptions, icon: AlertCircle, color: "text-destructive" },
  { label: "Vencendo em 7 dias", value: mockAdminMetrics.expiringIn7Days, icon: Clock, color: "text-warning" },
  { label: "Receita mensal", value: mockAdminMetrics.revenue, icon: DollarSign, color: "text-primary" },
  { label: "Novos este mês", value: mockAdminMetrics.newThisMonth, icon: UserPlus, color: "text-info" },
];

const AdminDashboard = () => {
  return (
    <DashboardLayout role="admin" title="Dashboard" subtitle="Visão geral da consultoria.">
      {/* Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

      {/* Recent students */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Alunos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockStudents.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{s.avatarInitials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground font-body">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-body">{s.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-body">{s.plan}</span>
                  <Badge variant={s.status === "active" ? "secondary" : "destructive"} className="text-xs">
                    {s.status === "active" ? "Ativo" : "Vencido"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboard;
