import { useRef, useState } from "react";
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

const COLUMN_MAP: Record<ReleaseNotifyButtonProps["type"], "diet_ready_at" | "training_ready_at" | "protocol_ready_at"> = {
  diet: "diet_ready_at",
  training: "training_ready_at",
  protocol: "protocol_ready_at",
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
  const clickLockRef = useRef(false);

  const handleClick = async () => {
    if (clickLockRef.current || loading) return;
    clickLockRef.current = true;
    setLoading(true);
    const readyColumn = COLUMN_MAP[type];
    let reservedReadyAt: string | null = null;
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

      // Remove imediatamente o envio agendado deste tipo para evitar corrida
      // entre o clique manual e o setTimeout disparado após o save.
      try {
        const { data: batch } = await supabase
          .from("student_content_batches")
          .select(`last_individual_sent, ${readyColumn}`)
          .eq("user_id", userId)
          .maybeSingle();

        reservedReadyAt = ((batch as any)?.[readyColumn] as string | null) ?? null;

        if (reservedReadyAt) {
          await supabase
            .from("student_content_batches")
            .update({ [readyColumn]: null } as any)
            .eq("user_id", userId)
            .eq(readyColumn, reservedReadyAt);
        }
      } catch (err) {
        console.warn("[ReleaseNotifyButton] reserve scheduled send failed", err);
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
        if (reservedReadyAt) {
          await supabase
            .from("student_content_batches")
            .update({ [readyColumn]: reservedReadyAt } as any)
            .eq("user_id", userId)
            .is(readyColumn, null);
        }
        toast.error(`Falha no envio: ${res.reason || "erro desconhecido"}`);
      } else if (res.reason) {
        if (reservedReadyAt) {
          await supabase
            .from("student_content_batches")
            .update({ [readyColumn]: reservedReadyAt } as any)
            .eq("user_id", userId)
            .is(readyColumn, null);
        }
        toast.error(`Falha no envio automático: ${res.reason}`);
      } else {
        toast.success("Liberado! Mensagem enviada à fila do WhatsApp.", {
          description:
            "A entrega depende do WhatsApp do destinatário. Confirme com o aluno se não chegar em alguns minutos.",
        });
        // Anti-duplicidade: marca como já enviado para cancelar o
        // setTimeout agendado pelo save (notifyStudentContentUpdate).
        try {
          const { data: batch } = await supabase
            .from("student_content_batches")
            .select("last_individual_sent")
            .eq("user_id", userId)
            .maybeSingle();
          const sentMap = ((batch?.last_individual_sent || {}) as Record<string, string>);
          sentMap[type] = new Date().toISOString();
          await supabase
            .from("student_content_batches")
            .upsert(
              {
                user_id: userId,
                last_individual_sent: sentMap,
              } as any,
              { onConflict: "user_id" },
            );
        } catch (err) {
          console.warn("[ReleaseNotifyButton] dedup mark failed", err);
        }
      }
    } catch (err: any) {
      if (reservedReadyAt) {
        try {
          await supabase
            .from("student_content_batches")
            .update({ [readyColumn]: reservedReadyAt } as any)
            .eq("user_id", userId)
            .is(readyColumn, null);
        } catch (restoreErr) {
          console.warn("[ReleaseNotifyButton] restore scheduled send failed", restoreErr);
        }
      }
      toast.error("Erro ao liberar/notificar.");
      console.warn("[ReleaseNotifyButton] failed", err);
    } finally {
      clickLockRef.current = false;
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