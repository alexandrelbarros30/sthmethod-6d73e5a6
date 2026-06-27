import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles, ArrowRight, Clock, CalendarX } from "lucide-react";
import { Link } from "react-router-dom";
import { differenceInDays } from "date-fns";

interface SubscriptionAlertsProps {
  subscription: {
    status: string;
    end_date: string;
    plans?: { name: string; duration_days: number } | null;
  } | null;
}

const SubscriptionAlerts = ({ subscription }: SubscriptionAlertsProps) => {
  if (!subscription) return null;

  const now = new Date();
  const endDate = new Date(subscription.end_date);
  const daysLeft = differenceInDays(endDate, now);
  const isExpired = daysLeft < 0 || subscription.status === "expired";
  const planName = (subscription.plans as any)?.name || "Plano";

  // Faixas de alerta D-15 / D-7 / D-3 / D-1 / encerrado.
  // Tudo acima de 15 dias o aluno vê apenas o banner discreto na própria assinatura.
  if (!isExpired && daysLeft > 15) return null;

  type Tier = "info" | "warning" | "critical" | "expired";
  const tier: Tier = isExpired
    ? "expired"
    : daysLeft <= 1 ? "critical"
    : daysLeft <= 3 ? "critical"
    : daysLeft <= 7 ? "warning"
    : "info";

  const getMessage = (): { title: string; message: string } => {
    if (isExpired) {
      return {
        title: "Sua vigência do Programa foi encerrada",
        message:
          "O acesso à plataforma foi suspenso ao final do prazo contratado. Para retomar o acompanhamento, renove seu Programa. Seus dados de evolução continuam preservados.",
      };
    }
    if (daysLeft <= 1) {
      return {
        title: daysLeft === 0 ? "Sua vigência encerra hoje" : "Faltam menos de 24 horas para o encerramento",
        message:
          "Ao final do prazo o acesso à plataforma é encerrado automaticamente. Renove agora para manter a continuidade do acompanhamento, dieta e treinos.",
      };
    }
    if (daysLeft <= 3) {
      return {
        title: `Faltam ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} para o encerramento`,
        message:
          "Você está nos últimos dias da vigência do Programa. Renove para garantir que o acompanhamento continue sem interrupções.",
      };
    }
    if (daysLeft <= 7) {
      return {
        title: "Última semana da sua vigência",
        message:
          "Programe agora a renovação para manter o ritmo do acompanhamento. A continuidade é o que sustenta os ajustes estratégicos da sua jornada.",
      };
    }
    return {
      title: "Sua vigência atual está próxima do fim",
      message:
        "Quinze dias para o encerramento. Avalie a renovação para que o acompanhamento siga sem interrupções no fim do prazo.",
    };
  };

  const { title, message } = getMessage();

  const styles: Record<Tier, { border: string; bg: string; icon: JSX.Element; cta: "default" | "outline" }> = {
    info: {
      border: "border-primary/20", bg: "bg-primary/5", cta: "outline",
      icon: <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />,
    },
    warning: {
      border: "border-warning/30", bg: "bg-warning/5", cta: "outline",
      icon: <Sparkles className="w-5 h-5 text-warning mt-0.5 shrink-0" />,
    },
    critical: {
      border: "border-destructive/30", bg: "bg-destructive/5", cta: "default",
      icon: <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />,
    },
    expired: {
      border: "border-destructive/40", bg: "bg-destructive/10", cta: "default",
      icon: <CalendarX className="w-5 h-5 text-destructive mt-0.5 shrink-0" />,
    },
  };
  const s = styles[tier];

  return (
    <Card className={`mb-6 animate-fade-in ${s.border} ${s.bg}`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          {s.icon}
          <div className="flex-1">
            <p className="font-semibold text-foreground font-body">{title}</p>
            <p className="text-sm text-muted-foreground font-body mt-1">{message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {planName} ·{" "}
              {isExpired
                ? `Encerrado em ${endDate.toLocaleDateString("pt-BR")}`
                : daysLeft === 0
                ? "Encerra hoje"
                : `Faltam ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} de vigência`}
            </p>
            <div className="flex gap-2 mt-3">
              <Link to="/dashboard/subscription">
                <Button size="sm" variant={s.cta}>
                  <ArrowRight className="w-3 h-3 mr-1" />
                  {isExpired ? "Renovar Programa" : "Renovar agora"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionAlerts;
