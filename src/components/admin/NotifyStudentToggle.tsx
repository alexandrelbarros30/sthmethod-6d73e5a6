import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotifyStudentToggleProps {
  userId: string;
}

/**
 * Toggle inline para o admin ativar/desativar notificações automáticas de WhatsApp
 * (dieta/treino/protocolo/plano) para um aluno específico.
 * Persiste em profiles.notify_on_updates (default true).
 */
const NotifyStudentToggle = ({ userId }: NotifyStudentToggleProps) => {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("notify_on_updates")
        .eq("user_id", userId)
        .maybeSingle();
      if (!cancelled) {
        setEnabled((data as any)?.notify_on_updates !== false);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const handleToggle = async (next: boolean) => {
    setEnabled(next);
    const { error } = await supabase
      .from("profiles")
      .update({ notify_on_updates: next } as any)
      .eq("user_id", userId);
    if (error) {
      toast.error("Erro ao atualizar preferência");
      setEnabled(!next);
      return;
    }
    toast.success(next ? "WhatsApp automático ativado" : "WhatsApp automático desativado");
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1.5">
      {enabled ? (
        <Bell className="w-3.5 h-3.5 text-primary" />
      ) : (
        <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
      )}
      <Label htmlFor={`notify-${userId}`} className="text-[11px] font-body cursor-pointer select-none">
        Avisar no WhatsApp
      </Label>
      <Switch
        id={`notify-${userId}`}
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={loading}
      />
    </div>
  );
};

export default NotifyStudentToggle;