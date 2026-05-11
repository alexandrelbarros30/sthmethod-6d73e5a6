import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, ExternalLink, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: "insufficient" | "rate_limit";
}

const AICreditsDialog = ({ open, onOpenChange, reason = "insufficient" }: Props) => {
  const isRate = reason === "rate_limit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-primary/30 bg-card">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {isRate ? (
              <AlertTriangle className="h-6 w-6 text-primary" />
            ) : (
              <Sparkles className="h-6 w-6 text-primary" />
            )}
          </div>
          <DialogTitle className="text-center font-display">
            {isRate ? "Limite temporário atingido" : "Créditos de IA insuficientes"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {isRate
              ? "Muitas requisições em pouco tempo. Aguarde alguns segundos e tente novamente."
              : "A análise nutricional por IA usa créditos da Lovable Cloud. Recarregue o saldo para continuar usando."}
          </DialogDescription>
        </DialogHeader>

        {!isRate && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1.5">
            <p>
              <strong className="text-foreground">Como recarregar:</strong>
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Abra as configurações da Lovable Cloud.</li>
              <li>
                Vá em <strong>Cloud &amp; AI balance</strong> e clique em{" "}
                <strong>Top up</strong>.
              </li>
              <li>Após a recarga, clique em "Tentar novamente" na análise.</li>
            </ol>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {!isRate && (
            <Button
              asChild
              className="gap-2"
            >
              <a
                href="https://lovable.dev/settings/workspace"
                target="_blank"
                rel="noopener noreferrer"
              >
                Recarregar créditos
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AICreditsDialog;