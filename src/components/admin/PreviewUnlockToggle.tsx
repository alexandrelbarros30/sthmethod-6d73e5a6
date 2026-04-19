import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
  onChanged?: () => void;
}

const PreviewUnlockToggle = ({ userId, onChanged }: Props) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("profiles")
      .select("preview_unlocked")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setEnabled(!!(data as any)?.preview_unlocked);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggle = async (next: boolean) => {
    setSaving(true);
    const prev = enabled;
    setEnabled(next);
    const { error } = await supabase
      .from("profiles")
      .update({ preview_unlocked: next })
      .eq("user_id", userId);
    setSaving(false);
    if (error) {
      setEnabled(prev);
      toast.error("Não foi possível atualizar.");
      return;
    }
    toast.success(next ? "Prévia liberada para o aluno." : "Prévia desativada.");
    onChanged?.();
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">
          Liberar prévia para conversão
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Mostra um trecho borrado da dieta e protocolo + popup ao logar, mesmo sem assinatura ativa.
        </p>
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} disabled={loading || saving} />
    </div>
  );
};

export default PreviewUnlockToggle;
