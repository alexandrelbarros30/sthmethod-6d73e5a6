import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
  studentName?: string;
  studentPhone?: string | null;
  onChanged?: () => void;
}

const PreviewUnlockToggle = ({ userId, studentName, studentPhone, onChanged }: Props) => {
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

  const sendWhatsApp = async () => {
    if (!enabled) await toggle(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/login?redirect=${encodeURIComponent("/dashboard/diet")}`;
    const firstName = (studentName || "").trim().split(" ")[0] || "tudo bem";
    const msg =
      `Olá ${firstName}! 👋\n\n` +
      `Sua *dieta* e *protocolo personalizados* já estão prontos na plataforma STH METHOD. ` +
      `Liberei uma *prévia exclusiva* para você visualizar agora 🎯\n\n` +
      `👉 Acesse: ${link}\n\n` +
      `Faça login com seu e-mail e confira o que preparamos. Após o pagamento, o acesso completo é liberado imediatamente.`;
    const phoneDigits = (studentPhone || "").replace(/\D/g, "");
    const base = phoneDigits
      ? `https://wa.me/${phoneDigits.startsWith("55") ? phoneDigits : "55" + phoneDigits}`
      : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-2">
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={sendWhatsApp}
        disabled={loading}
      >
        <Send className="w-3.5 h-3.5 mr-1.5" /> Enviar prévia via WhatsApp
      </Button>
    </div>
  );
};

export default PreviewUnlockToggle;
