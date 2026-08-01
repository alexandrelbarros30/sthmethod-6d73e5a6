import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LabInterpretationPanel from "@/components/shared/LabInterpretationPanel";
import { Button } from "@/components/ui/button";
import { Printer, AlertCircle } from "lucide-react";
import { aiReportToHtml } from "@/lib/ai-report-html";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";

/**
 * Leitura visual laboratorial do STH AI em página de navegador, com impressão.
 * Disponível somente enquanto o aluno permanecer com acesso ativo no app.
 */
export default function AiLeituraVisual() {
  useSthAiTheme();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<{ content: string; updated_at: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("ai_app_generations")
        .select("content, updated_at")
        .eq("id", id!)
        .eq("kind", "analysis")
        .maybeSingle();
      if (!active) return;
      if (error) console.error(error);
      setRow((data as any) || null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const html = useMemo(() => aiReportToHtml(row?.content), [row]);

  useEffect(() => {
    document.title = "Leitura laboratorial · STH METHOD AI";
  }, []);

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Carregando…</div>;
  }

  if (!row) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-[15px] font-medium tracking-tight">Leitura indisponível</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Este link só funciona enquanto sua conta permanecer ativa no app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              STH METHOD AI · STHIA
            </p>
            <h1 className="truncate text-[15px] font-semibold tracking-tight">Interpretação laboratorial</h1>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
        <p className="text-[11px] text-muted-foreground">
          Atualizado em {new Date(row.updated_at).toLocaleString("pt-BR")}
        </p>
        <LabInterpretationPanel html={html} />
        <p className="text-[11px] font-light leading-relaxed text-muted-foreground">
          Disponível enquanto sua conta permanecer ativa no app. Toda análise e interpretação têm caráter educativo e
          não substituem o acompanhamento com um profissional de saúde.
        </p>
      </main>
    </div>
  );
}
