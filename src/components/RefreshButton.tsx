import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Botão flutuante global para atualizar dados (dieta, treino, protocolo etc).
 * Invalida cache do react-query e força refetch sem recarregar a página inteira.
 * Oculto em rotas públicas (landing, login, cadastro, reset).
 */
const HIDDEN_PREFIXES = ["/login", "/forgot-password", "/reset-password", "/cadastro", "/pagamento"];

export default function RefreshButton() {
  const location = useLocation();
  const qc = useQueryClient();
  const [spinning, setSpinning] = useState(false);

  const path = location.pathname;
  if (path === "/" || HIDDEN_PREFIXES.some((p) => path.startsWith(p))) return null;

  const handle = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      await qc.invalidateQueries();
      await qc.refetchQueries({ type: "active" });
      toast.success("Conteúdo atualizado");
    } catch {
      toast.error("Não foi possível atualizar");
    } finally {
      setTimeout(() => setSpinning(false), 600);
    }
  };

  return (
    <button
      onClick={handle}
      aria-label="Atualizar conteúdo"
      className={cn(
        "fixed z-[60] rounded-full shadow-lg",
        "bg-background/80 backdrop-blur border border-border",
        "hover:bg-accent hover:text-accent-foreground",
        "transition-all active:scale-95",
        "h-11 w-11 flex items-center justify-center",
        "bottom-[calc(env(safe-area-inset-bottom)+88px)] right-4",
        "md:bottom-6 md:right-6"
      )}
    >
      <RefreshCw className={cn("h-5 w-5", spinning && "animate-spin")} />
    </button>
  );
}
