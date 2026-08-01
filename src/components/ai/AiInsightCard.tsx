import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAiInsight } from "@/hooks/useAiGrowth";
import { Brain, Loader2, RefreshCw, AlertTriangle, TrendingDown, TrendingUp, ChevronDown } from "lucide-react";

export default function AiInsightCard() {
  const { insight, loading, error, generate } = useAiInsight();
  const [open, setOpen] = useState(false);
  const s = insight?.signals ?? {};
  const slope = s.weight_kg_per_week ?? null;

  return (
    <Card className="overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-left">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <Brain className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">STHIA · Leitura preditiva</h2>
            <p className="text-xs font-light text-muted-foreground">
              {insight
                ? `Atualizada em ${new Date(insight.created_at).toLocaleDateString("pt-BR")}`
                : "Análise de platô, tendência e ajustes sugeridos."}
            </p>
          </div>
          <ChevronDown className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <Button variant={insight ? "outline" : "default"} size="sm" onClick={() => generate(Boolean(insight))} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {insight ? "Reanalisar" : "Gerar leitura"}
        </Button>
      </div>

      <CollapsibleContent className="px-5 pb-5">
      {insight && (
        <div className="flex flex-wrap gap-2">
          {s.plateau && (
            <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Platô detectado</Badge>
          )}
          {slope != null && (
            <Badge variant="secondary" className="gap-1">
              {slope < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {slope > 0 ? "+" : ""}{slope} kg/semana
            </Badge>
          )}
          {s.projection_30d != null && <Badge variant="outline">Projeção 30d: {s.projection_30d} kg</Badge>}
          {s.adherence14 != null && <Badge variant="outline">Adesão 14d: {s.adherence14}/14</Badge>}
          {typeof s.streak === "number" && <Badge variant="outline">Constância: {s.streak}d</Badge>}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {insight ? (
        <div className="mt-5 max-w-[68ch] text-[15px] font-light leading-[1.75] tracking-[0.01em] text-foreground/85 [&_em]:italic [&_h1]:mb-2 [&_h1]:mt-6 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:mb-1.5 [&_h3]:mt-5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-[0.12em] [&_h3]:text-muted-foreground [&_li]:mb-1.5 [&_li]:pl-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&>*:first-child]:mt-0">
          <ReactMarkdown>{insight.content}</ReactMarkdown>
        </div>
      ) : (
        !loading && (
          <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground">
            Registre check-ins e ao menos três medidas de peso para uma leitura preditiva mais precisa.
          </p>
        )
      )}
      </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
