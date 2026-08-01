import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LabInterpretationPanel from "@/components/shared/LabInterpretationPanel";
import { aiReportToHtml, cleanAiReport } from "@/lib/ai-report-html";
import { ShieldAlert } from "lucide-react";

interface Props {
  /** conteúdo bruto da geração (markdown ou html) */
  content: string;
  /** id da geração — usado para o link da leitura visual */
  generationId: string;
  updatedAt?: string;
}

/**
 * Relatório inteligente de evolução (STH AI): texto limpo e elegante +
 * painel STHIA · Leitura visual (interpretação laboratorial), com abertura
 * no navegador para impressão e cópia de link.
 */
export default function AiAnalysisReport({ content, generationId, updatedAt }: Props) {
  const clean = useMemo(() => cleanAiReport(content), [content]);
  const html = useMemo(() => aiReportToHtml(content), [content]);
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/ai/leitura/${generationId}`;

  return (
    <div className="mt-5 space-y-5">
      <LabInterpretationPanel html={html} />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
          onClick={() => window.open(`/ai/leitura/${generationId}`, "_blank", "noopener")}
        >
          🌐 Abrir no navegador (imprimir)
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              toast.success("Link da leitura visual copiado");
              setTimeout(() => setCopied(false), 1800);
            } catch {
              toast.error("Não foi possível copiar o link");
            }
          }}
        >
          🔗 {copied ? "Link copiado" : "Copiar link"}
        </Button>
      </div>

      <Card className="p-6 sm:p-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          STHIA · Relatório inteligente
        </p>
        <h3 className="mt-1 text-[17px] font-semibold tracking-tight">Leitura de evolução</h3>
        <article
          className="ai-report mt-5 max-w-[68ch] text-[14.5px] font-light leading-[1.85] tracking-[0.01em] text-foreground/85
            [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground
            [&_h3]:mt-6 [&_h3]:mb-1.5 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-[0.16em] [&_h3]:text-muted-foreground
            [&_p]:my-3.5
            [&_strong]:font-medium [&_strong]:text-foreground
            [&_ul]:my-3.5 [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:list-disc [&_li]:marker:text-muted-foreground/50
            [&_ol]:my-3.5 [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol_li]:list-decimal
            [&_table]:hidden"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{clean}</ReactMarkdown>
        </article>

        <div className="mt-7 flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-3.5">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
          <p className="text-[11.5px] font-light leading-relaxed text-muted-foreground">
            A leitura visual fica disponível enquanto sua conta permanecer ativa no app. Toda análise e interpretação
            têm caráter educativo e <span className="font-medium">não substituem o acompanhamento com um profissional de saúde</span>.
          </p>
        </div>

        {updatedAt && (
          <p className="mt-4 text-[11px] text-muted-foreground">
            Atualizado em {new Date(updatedAt).toLocaleString("pt-BR")}
          </p>
        )}
      </Card>
    </div>
  );
}
