import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Substitui o card duplicado de `CRMAutomationControl` em telas onde ele aparecia
 * apenas como atalho. A configuração canônica vive em
 * /admin/atendimento/configuracoes (AdminMotorRespostaApis).
 */
export default function MotorRespostaLink({
  context = "Motor de Disparo (cobranças, campanhas, automações)",
}: { context?: string }) {
  return (
    <Card className="border-border/40 bg-card/40">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Settings2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Configuração centralizada</p>
            <p className="text-xs text-muted-foreground truncate">{context}</p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/atendimento/configuracoes">
            Gerenciar <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}