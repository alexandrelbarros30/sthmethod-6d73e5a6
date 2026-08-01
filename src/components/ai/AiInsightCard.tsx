import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAiInsight } from "@/hooks/useAiGrowth";
import { Brain, Loader2, RefreshCw, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

export default function AiInsightCard() {
  const { insight, loading, error, generate } = useAiInsight();
  const s = insight?.signals ?? {};
  const slope = s.weight_kg_per_week ?? null;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <Brain className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">STHIA · Leitura preditiva</h2>
            <p className="text-xs text-muted-foreground">
              {insight
                ? `Atualizada em ${new Date(insight.created_at).toLocaleDateString("pt-BR")}`
                : "Análise de platô, tendência e ajustes sugeridos."}
            </p>
          </div>
        </div>
        <Button variant={insight ? "outline" : "default"} size="sm" onClick={() => generate(Boolean(insight))} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {insight ? "Reanalisar" : "Gerar leitura"}
        </Button>
      </div>

      {insight && (
        <div className="mt-4 flex flex-wrap gap-2">
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
        <div className="prose prose-sm mt-4 max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight">
          <ReactMarkdown>{insight.content}</ReactMarkdown>
        </div>
      ) : (
        !loading && (
          <p className="mt-4 text-sm text-muted-foreground">
            Registre check-ins e ao menos três medidas de peso para uma leitura preditiva mais precisa.
          </p>
        )
      )}
    </Card>
  );
}
