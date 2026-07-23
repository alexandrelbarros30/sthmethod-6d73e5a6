import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Download, Copy, Sparkles, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Section = { id: string; title: string; html: string };

function splitSections(reportHtml: string): Section[] {
  // Divide o parecer em blocos usando <p><strong>...</strong></p> como âncora.
  const re = /<p>\s*<strong>([\s\S]*?)<\/strong>\s*<\/p>/gi;
  const anchors: { idx: number; title: string; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(reportHtml)) !== null) {
    anchors.push({ idx: m.index, title: m[1].replace(/<[^>]+>/g, "").trim(), end: m.index + m[0].length });
  }
  if (!anchors.length) return [{ id: "full", title: "Parecer completo", html: reportHtml }];
  const out: Section[] = [];
  for (let i = 0; i < anchors.length; i++) {
    const start = anchors[i].idx;
    const end = i + 1 < anchors.length ? anchors[i + 1].idx : reportHtml.length;
    out.push({
      id: `s${i}`,
      title: anchors[i].title || `Seção ${i + 1}`,
      html: reportHtml.slice(start, end).trim(),
    });
  }
  return out;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reportHtml: string;
  title: string;
  studentName: string;
  analysisId?: string | null;
  createdAt?: string | null;
  onSaved?: (patientSummaryHtml: string) => void;
}

export default function ClinicalExportDialog({
  open,
  onOpenChange,
  reportHtml,
  title,
  studentName,
  analysisId,
  createdAt,
  onSaved,
}: Props) {
  const sections = useMemo(() => splitSections(reportHtml), [reportHtml]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [includeSummary, setIncludeSummary] = useState(true);
  const [summaryHtml, setSummaryHtml] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      const init: Record<string, boolean> = {};
      sections.forEach((s) => (init[s.id] = true));
      setChecked(init);
      setSummaryHtml("");
    }
  }, [open, sections]);

  const toggle = (id: string) => setChecked((p) => ({ ...p, [id]: !p[id] }));
  const allOn = () => setChecked(Object.fromEntries(sections.map((s) => [s.id, true])));
  const allOff = () => setChecked(Object.fromEntries(sections.map((s) => [s.id, false])));

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("sthia-clinical-summary", {
        body: { reportHtml, studentName },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const html = String((data as any)?.summary_html || "").trim();
      if (!html) throw new Error("Resumo vazio");
      setSummaryHtml(html);
      toast.success("Resumo do paciente gerado");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao gerar resumo");
    } finally {
      setGenerating(false);
    }
  };

  const composedHtml = () => {
    const parts: string[] = [];
    for (const s of sections) if (checked[s.id]) parts.push(s.html);
    if (includeSummary && summaryHtml) {
      parts.push('<hr style="margin:24px 0;border:none;border-top:1px solid #ddd" />');
      parts.push(summaryHtml);
    }
    const body = parts.join("\n");
    const when = createdAt ? new Date(createdAt).toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR");
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>${escape(title)} · ${escape(studentName)}</title>
<style>
 body{font-family:-apple-system,Segoe UI,Roboto,Inter,sans-serif;max-width:820px;margin:32px auto;padding:0 24px;color:#111;line-height:1.55}
 h1{font-size:20px;margin:0 0 4px}
 .meta{color:#666;font-size:12px;margin-bottom:24px}
 table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12px}
 th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
 th{background:#f5f5f7}
 p{margin:8px 0}
 ul{margin:8px 0 8px 20px}
</style></head><body>
<h1>${escape(title)}</h1>
<div class="meta">${escape(studentName)} · ${escape(when)} · STH METHOD</div>
${body}
</body></html>`;
  };

  const download = () => {
    const html = composedHtml();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = studentName.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase() || "aluno";
    a.href = url;
    a.download = `parecer_${safeName}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Parecer exportado");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(composedHtml());
      toast.success("HTML copiado para a área de transferência");
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  const persist = async () => {
    if (!analysisId) {
      toast.error("Análise sem ID — não é possível registrar");
      return;
    }
    const payload: any = {};
    if (includeSummary && summaryHtml) payload.summary = summaryHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1200);
    payload.brief = { exported_sections: sections.filter((s) => checked[s.id]).map((s) => s.title), patient_summary_html: includeSummary ? summaryHtml : null, exported_at: new Date().toISOString() };
    payload.report_html = composedHtml();
    payload.released_to_student = true;
    payload.released_at = new Date().toISOString();
    const { error } = await supabase.from("student_clinical_analyses").update(payload).eq("id", analysisId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Parecer exportado para a Central de Análise do aluno");
    onSaved?.(includeSummary ? summaryHtml : "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exportar parecer para o aluno</DialogTitle>
        </DialogHeader>
        <p className="text-[12px] text-muted-foreground -mt-2">
          Ao confirmar, o parecer é publicado na <strong>Central de Análise</strong> do aluno com as seções selecionadas e o resumo (se ativado).
        </p>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Seções a incluir</Label>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={allOn}>Todos</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={allOff}>Nenhum</Button>
              </div>
            </div>
            <div className="grid gap-1.5 rounded-md border border-border p-3 bg-muted/30">
              {sections.map((s) => (
                <label key={s.id} className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox checked={!!checked[s.id]} onCheckedChange={() => toggle(s.id)} className="mt-0.5" />
                  <span>{s.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label className="text-sm">Parecer final resumido para o paciente</Label>
                <p className="text-[11px] text-muted-foreground">Linguagem simples, sem jargão, ideal para enviar ao aluno.</p>
              </div>
              <Switch checked={includeSummary} onCheckedChange={setIncludeSummary} />
            </div>
            {includeSummary && (
              <div className="space-y-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={generateSummary} disabled={generating}>
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {summaryHtml ? "Regerar resumo" : "Gerar resumo com STHIA"}
                </Button>
                {summaryHtml && (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none rounded-md border border-border p-3 bg-background"
                    dangerouslySetInnerHTML={{ __html: summaryHtml }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="ghost" onClick={copy} className="gap-1.5"><Copy className="w-4 h-4" /> Copiar HTML</Button>
          <Button variant="outline" onClick={download} className="gap-1.5"><Download className="w-4 h-4" /> Baixar .html</Button>
          <Button onClick={persist} className="gap-1.5"><Send className="w-4 h-4" /> Exportar para Central do Aluno</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function escape(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}