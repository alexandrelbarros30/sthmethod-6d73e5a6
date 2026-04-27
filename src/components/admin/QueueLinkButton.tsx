import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LinkIcon, Copy, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  studentUserId: string;
  studentName?: string;
  studentPhone?: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default";
}

const generateToken = () =>
  crypto.randomUUID().replace(/-/g, "").slice(0, 22);

/** Botão que gera (ou recupera) um link público de fila para o aluno e oferece copiar/WhatsApp. */
const QueueLinkButton = ({ studentUserId, studentName, studentPhone, variant = "outline", size = "sm" }: Props) => {
  const [loading, setLoading] = useState(false);

  const ensureToken = async (): Promise<string | null> => {
    const { data: existing } = await supabase
      .from("queue_link_tokens")
      .select("token")
      .eq("student_user_id", studentUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.token) return existing.token;

    const newToken = generateToken();
    const { error } = await supabase
      .from("queue_link_tokens")
      .insert({ student_user_id: studentUserId, token: newToken });
    if (error) {
      toast({ title: "Erro ao gerar link", description: error.message, variant: "destructive" });
      return null;
    }
    return newToken;
  };

  const buildLink = (token: string) => `${window.location.origin}/fila/${token}`;

  const handleCopy = async () => {
    setLoading(true);
    const token = await ensureToken();
    setLoading(false);
    if (!token) return;
    const link = buildLink(token);
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "Link copiado", description: link });
    } catch {
      toast({ title: "Link da fila", description: link });
    }
  };

  const handleWhatsApp = async () => {
    setLoading(true);
    const token = await ensureToken();
    setLoading(false);
    if (!token) return;
    const link = buildLink(token);
    const first = (studentName || "Aluno").split(" ")[0];
    const message = `Olá ${first}! 👋\n\nVocê está sendo adicionado à nossa fila de atendimento STH METHOD.\n\n👉 Acesse o link abaixo para entrar na fila. Você não precisa responder por aqui — assim que chegar a sua vez, entraremos em contato:\n\n${link}`;
    const phone = (studentPhone || "").replace(/\D/g, "");
    if (!phone) {
      toast({ title: "Aluno sem telefone", description: "Cadastre o telefone para enviar via WhatsApp.", variant: "destructive" });
      return;
    }
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="inline-flex items-center gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleCopy}
        disabled={loading}
        className="gap-1.5"
        title="Copiar link público de entrada na fila"
      >
        <LinkIcon className="w-3.5 h-3.5" />
        <Copy className="w-3 h-3" />
        <span className="hidden sm:inline">Link da fila</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size={size}
        onClick={handleWhatsApp}
        disabled={loading}
        className="gap-1 text-success"
        title="Enviar link via WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default QueueLinkButton;
