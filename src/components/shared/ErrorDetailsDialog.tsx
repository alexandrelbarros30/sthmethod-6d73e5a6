import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export interface ErrorDetails {
  title?: string;
  code?: string | number;   // ex.: 502, "STH-500"
  model?: string;           // ex.: "openai/gpt-image-2" → "google/gemini-3.1-flash-image"
  message?: string;         // mensagem amigável
  raw?: string;             // detalhes técnicos (upstream body, stack, etc.)
  requestId?: string;
  when?: string;            // ISO
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  details: ErrorDetails | null;
}

export default function ErrorDetailsDialog({ open, onOpenChange, details }: Props) {
  if (!details) return null;
  const copy = async () => {
    const txt = [
      `Título: ${details.title || "Falha"}`,
      `Código: ${details.code ?? "—"}`,
      `Modelo: ${details.model || "—"}`,
      `Mensagem: ${details.message || "—"}`,
      details.requestId ? `RequestId: ${details.requestId}` : "",
      details.when ? `Quando: ${details.when}` : "",
      details.raw ? `\nDetalhes técnicos:\n${details.raw}` : "",
    ].filter(Boolean).join("\n");
    try { await navigator.clipboard.writeText(txt); toast.success("Copiado"); } catch { toast.error("Falha ao copiar"); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {details.title || "Detalhes do erro"}
          </DialogTitle>
          <DialogDescription>Copie estas informações para diagnóstico rápido.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="destructive">Código: {String(details.code ?? "—")}</Badge>
            <Badge variant="outline">Modelo: {details.model || "—"}</Badge>
            {details.requestId && <Badge variant="secondary">ReqId: {details.requestId}</Badge>}
          </div>
          {details.message && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Mensagem</p>
              <p className="rounded-md bg-muted/50 border p-2 text-sm break-words">{details.message}</p>
            </div>
          )}
          {details.raw && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Detalhes técnicos</p>
              <pre className="rounded-md bg-muted/50 border p-2 text-[11px] max-h-56 overflow-auto whitespace-pre-wrap break-words">{details.raw}</pre>
            </div>
          )}
          {details.when && <p className="text-[11px] text-muted-foreground">Quando: {details.when}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={copy}><Copy className="w-3 h-3 mr-1" /> Copiar tudo</Button>
            <Button size="sm" onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}