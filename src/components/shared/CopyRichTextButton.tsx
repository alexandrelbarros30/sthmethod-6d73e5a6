import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  html: string;
  label?: string;
}

/** Copia o conteúdo HTML do editor como texto puro (preservando quebras de linha). */
export default function CopyRichTextButton({ html, label = "Copiar texto" }: Props) {
  const [done, setDone] = useState(false);

  async function handleCopy() {
    const source = html || "";
    const plain = source
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (!plain) {
      toast.error("Nada para copiar");
      return;
    }
    try {
      await navigator.clipboard.writeText(plain);
      setDone(true);
      toast.success("Texto copiado!");
      setTimeout(() => setDone(false), 1800);
    } catch {
      toast.error("Falha ao copiar");
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="h-7 text-[11px] gap-1.5">
      {done ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {done ? "Copiado" : label}
    </Button>
  );
}