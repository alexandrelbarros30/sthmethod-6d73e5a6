import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles, ArrowRight } from "lucide-react";
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
  const isExpiring = !isExpired && daysLeft <= 3;
  const planName = (subscription.plans as any)?.name || "Plano";
  const durationDays = (subscription.plans as any)?.duration_days || 30;

  if (!isExpired && !isExpiring) return null;

  // Personalized message based on plan duration
  const getMessage = () => {
    if (isExpired) {
      return {
        title: "Seu plano expirou",
        message: "Para continuar acessando seus protocolos, dieta e treinos atualizados, renove sua assinatura.",
        variant: "expired" as const,
      };
    }
    if (durationDays <= 30) {
      return {
        title: "Seu plano está chegando ao fim 😊",
        message: "Para manter sua evolução e alcançar o resultado completo, é importante dar continuidade ao acompanhamento. Cada dia conta na sua transformação!",
        variant: "warning" as const,
      };
    }
    return {
      title: "Estamos nos aproximando do encerramento do seu ciclo atual",
      message: "A continuidade garante ajustes estratégicos e melhores resultados. Renove agora para não perder seu progresso.",
      variant: "warning" as const,
    };
  };

  const { title, message, variant } = getMessage();

  return (
    <Card className={`mb-6 animate-fade-in ${
      variant === "expired" 
        ? "border-destructive/30 bg-destructive/5" 
        : "border-warning/30 bg-warning/5"
    }`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          {variant === "expired" ? (
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-warning mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-foreground font-body">{title}</p>
            <p className="text-sm text-muted-foreground font-body mt-1">{message}</p>
            {isExpiring && (
              <p className="text-xs text-muted-foreground mt-1">
                {planName} • Vence em {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <Link to="/dashboard/subscription">
                <Button size="sm" variant={variant === "expired" ? "default" : "outline"}>
                  <ArrowRight className="w-3 h-3 mr-1" />
                  {isExpired ? "Renovar agora" : "Ver planos"}
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
