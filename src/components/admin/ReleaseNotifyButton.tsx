import { useState } from "react";
import { Button } from "@/components/ui/button";
import { KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendSystemTemplate, type SystemTemplateKey } from "@/lib/system-templates";
import { toast } from "sonner";

interface ReleaseNotifyButtonProps {
  userId: string;
  type: "diet" | "training" | "protocol";
  label?: string;
}

const KEY_MAP: Record<ReleaseNotifyButtonProps["type"], SystemTemplateKey> = {
  diet: "diet_updated",
  training: "training_updated",
  protocol: "protocol_updated",
};

const LABEL_MAP: Record<ReleaseNotifyButtonProps["type"], string> = {
  diet: "Liberar Dieta",
  training: "Liberar Treino",
  protocol: "Liberar Protocolo",
};

/**
 * Botão "chave de liberação" — dispara manualmente a mensagem automática
 * de dieta/treino/protocolo via WhatsApp (Z-API + fallback wa.me).
 * Análogo ao fluxo de liberação da Central de Análise.
 */
const ReleaseNotifyButton = ({ userId, type, label }: ReleaseNotifyButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("user_id", userId)
        .maybeSingle();

      const phone = (profile as any)?.phone;
      if (!phone) {
        toast.error("Aluno sem telefone cadastrado.");
        return;
      }

      const res = await sendSystemTemplate(
        KEY_MAP[type],
        {
          full_name: (profile as any)?.full_name || null,
          email: (profile as any)?.email || null,
          phone,
          user_id: userId,
        },
        { logHistory: true, mode: "auto", silent: true },
      );

      if (!res.ok) {
        toast.error(`Falha no envio: ${res.reason || "erro desconhecido"}`);
      } else if (res.reason) {
        toast.error(`Falha no envio automático: ${res.reason}`);
      } else {
        toast.success("Liberado! Aluno notificado no WhatsApp.");
      }
    } catch (err: any) {
      toast.error("Erro ao liberar/notificar.");
      console.warn("[ReleaseNotifyButton] failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
      {label || LABEL_MAP[type]}
    </Button>
  );
};

export default ReleaseNotifyButton;