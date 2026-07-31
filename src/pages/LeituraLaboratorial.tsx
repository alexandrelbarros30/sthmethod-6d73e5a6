import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LabInterpretationPanel from "@/components/shared/LabInterpretationPanel";
import ClinicalReport from "@/components/shared/ClinicalReport";
import { Button } from "@/components/ui/button";
import { Printer, AlertCircle } from "lucide-react";

/**
 * Leitura visual laboratorial (STHIA) em página de navegador, com impressão.
 * Acesso somente por link liberado pelo admin/consultor — não aparece na dashboard do aluno.
 */
export default function LeituraLaboratorial() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("student_clinical_analyses")
        .select("id, title, scope, summary, report_html, created_at")
        .eq("id", id!)
        .maybeSingle();
      if (!active) return;
      if (error) console.error(error);
      setData(data || null);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [id]);

  const dateLabel = useMemo(
    () => (data?.created_at ? new Date(data.created_at).toLocaleDateString("pt-BR") : ""),
    [data]
  );

  useEffect(() => {
    document.title = data?.title ? `${data.title} · Leitura laboratorial` : "Leitura laboratorial · STH METHOD";
  }, [data]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Carregando…</div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" strokeWidth={1.5} />
          <p className="text-[15px] font-medium tracking-tight">Leitura indisponível</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Este link não está liberado ou você não tem acesso a este parecer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl no-print">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-muted-foreground">STH METHOD · STHIA</p>
            <h1 className="text-[15px] font-semibold tracking-tight truncate">{data.title}</h1>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-5">
        <p className="text-[11px] text-muted-foreground tracking-tight">
          {data.scope ? `${data.scope} · ` : ""}{dateLabel}
        </p>
        {data.summary && (
          <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
            <p className="text-[13px] leading-relaxed text-foreground/85">{data.summary}</p>
          </div>
        )}
        <LabInterpretationPanel html={data.report_html} />
        <ClinicalReport html={data.report_html} className="rounded-xl border border-border bg-card/40 px-4 py-4" />
      </main>
    </div>
  );
}
