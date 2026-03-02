import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Salad, Dumbbell, FlaskConical, BookOpen, CalendarDays, CheckCircle, AlertCircle, User, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SubscriptionAlerts from "@/components/student/SubscriptionAlerts";

const modules = [
  { to: "/dashboard/diet", icon: Salad, title: "Dieta", desc: "Plano alimentar", color: "text-success" },
  { to: "/dashboard/training", icon: Dumbbell, title: "Treino", desc: "Periodização", color: "text-info" },
  { to: "/dashboard/protocol", icon: FlaskConical, title: "Protocolo", desc: "Suplementação", color: "text-warning" },
  { to: "/dashboard/content", icon: BookOpen, title: "Conteúdo", desc: "Materiais educativos", color: "text-primary" },
];

const StudentOverview = () => {
  const { profile, user } = useAuth();

  const { data: fullProfile } = useQuery({
    queryKey: ["student-full-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*, plans(*)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const isActive = subscription?.status === "active" && new Date(subscription.end_date) > new Date();
  const daysLeft = subscription ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86400000)) : 0;
  const firstName = profile?.full_name?.split(" ")[0] || "Aluno";
  const p = fullProfile as any;

  return (
    <DashboardLayout role="student" title={`Bem-vindo, ${firstName}!`} subtitle="Acompanhe seu progresso e acesse seus módulos.">
      {/* Expiration / renewal alerts */}
      <SubscriptionAlerts subscription={subscription ? { ...subscription, plans: (subscription as any)?.plans } : null} />
      {/* Status card */}
      {subscription ? (
        <Card className={`mb-6 ${isActive ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"}`}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              {isActive ? <CheckCircle className="w-5 h-5 text-primary" /> : <AlertCircle className="w-5 h-5 text-destructive" />}
              <div>
                <p className="font-semibold text-foreground font-body">{isActive ? "Assinatura ativa" : "Assinatura vencida"}</p>
                <p className="text-sm text-muted-foreground font-body">
                  Plano {(subscription as any)?.plans?.name} • Vence em {new Date(subscription.end_date).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            {isActive && (
              <Badge variant="outline" className="border-primary text-primary">
                <CalendarDays className="w-3 h-3 mr-1" /> {daysLeft} dias restantes
              </Badge>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-muted">
          <CardContent className="py-4">
            <p className="text-muted-foreground font-body text-sm">Nenhuma assinatura encontrada. Fale com seu consultor.</p>
          </CardContent>
        </Card>
      )}

      {/* Profile summary */}
      {p && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2"><User className="w-4 h-4" /> Minha Ficha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{p.full_name}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{p.email}</span></div>
              <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{p.phone || "—"}</span></div>
              <div><span className="text-muted-foreground">Nascimento:</span> <span className="font-medium">{p.birth_date ? new Date(p.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</span></div>
              <div><span className="text-muted-foreground">Altura:</span> <span className="font-medium">{p.height ? `${p.height} cm` : "—"}</span></div>
              <div><span className="text-muted-foreground">Peso:</span> <span className="font-medium">{p.weight ? `${p.weight} kg` : "—"}</span></div>
            </div>

            {(p.physical_activity || p.objective || p.current_protocol || p.comorbidities) && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {p.physical_activity && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Atividade Física</p><p className="text-sm whitespace-pre-wrap">{p.physical_activity}</p></div>}
                {p.objective && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Objetivo</p><p className="text-sm whitespace-pre-wrap">{p.objective}</p></div>}
                {p.current_protocol && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Protocolo Atual</p><p className="text-sm whitespace-pre-wrap">{p.current_protocol}</p></div>}
                {p.comorbidities && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Comorbidades</p><p className="text-sm whitespace-pre-wrap">{p.comorbidities}</p></div>}
              </div>
            )}

            {(p.lab_exam_url || p.medical_prescription_url) && (
              <div className="mt-4 border-t pt-4 flex gap-4">
                {p.lab_exam_url && <a href={p.lab_exam_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1"><FileText className="w-4 h-4" /> Exames</a>}
                {p.medical_prescription_url && <a href={p.medical_prescription_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1"><FileText className="w-4 h-4" /> Receita</a>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
