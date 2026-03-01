import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

const SubscriptionBlock = () => (
  <Card className="max-w-md mx-auto mt-12 border-destructive/30">
    <CardContent className="py-10 text-center space-y-4">
      <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
      <h2 className="text-lg font-bold font-display text-foreground">Assinatura Vencida</h2>
      <p className="text-sm text-muted-foreground font-body">
        Seu plano expirou. Renove sua assinatura para continuar acessando os conteúdos.
      </p>
      <Button asChild>
        <Link to="/dashboard/subscription">Renovar Assinatura</Link>
      </Button>
    </CardContent>
  </Card>
);

export default SubscriptionBlock;
