import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Salad, Dumbbell, FlaskConical, BookOpen, CalendarDays, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const modules = [
  { to: "/dashboard/diet", icon: Salad, title: "Dieta", desc: "6 refeições planejadas", color: "text-success" },
  { to: "/dashboard/training", icon: Dumbbell, title: "Treino", desc: "5 dias de treino", color: "text-info" },
  { to: "/dashboard/protocol", icon: FlaskConical, title: "Protocolo", desc: "6 itens ativos", color: "text-warning" },
  { to: "/dashboard/content", icon: BookOpen, title: "Conteúdo", desc: "5 materiais disponíveis", color: "text-primary" },
];

const StudentOverview = () => {
  return (
    <DashboardLayout role="student" title="Bem-vindo, Lucas!" subtitle="Acompanhe seu progresso e acesse seus módulos.">
      {/* Status card */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground font-body">Assinatura ativa</p>
              <p className="text-sm text-muted-foreground font-body">Plano Trimestral • Vence em 15/04/2026</p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary text-primary">
            <CalendarDays className="w-3 h-3 mr-1" /> 45 dias restantes
          </Badge>
        </CardContent>
      </Card>

      {/* Module cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {modules.map((mod) => (
          <Link key={mod.to} to={mod.to}>
            <Card className="hover:shadow-card-hover hover:border-primary/20 transition-all duration-300 cursor-pointer group">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <mod.icon className={`w-5 h-5 ${mod.color}`} />
                </div>
                <div>
                  <CardTitle className="text-base font-display">{mod.title}</CardTitle>
                  <p className="text-sm text-muted-foreground font-body">{mod.desc}</p>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentOverview;
