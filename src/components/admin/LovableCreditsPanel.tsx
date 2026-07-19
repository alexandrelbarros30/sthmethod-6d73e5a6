import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink, TrendingUp, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AI_CREDIT_RATES } from "@/components/shared/AICreditUsage";

// Estimativa mostrada no painel — o saldo real fica em Settings → Plans & credits.
// Aqui agregamos consumo dos últimos 30 dias a partir de `crm_ai_runs`.

const LovableCreditsPanel = () => {
  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["lovable-ai-usage-30d", since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_ai_runs")
        .select("tokens, model, created_at")
        .gte("created_at", since);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const stats = useMemo(() => {
    const runs = data || [];
    let totalTokens = 0;
    let estCredits = 0;
    for (const r of runs) {
      const t = Number(r.tokens || 0);
      totalTokens += t;
      const rate = (r.model && AI_CREDIT_RATES[r.model as string]) || null;
      if (rate) {
        // Sem separação in/out, assume 30% in / 70% out (média típica de chat).
        estCredits += (t * 0.3 / 1000) * rate.in + (t * 0.7 / 1000) * rate.out;
      }
    }
    return {
      runs: runs.length,
      totalTokens,
      estCredits,
    };
  }, [data]);

  return (
    <Card className="premium-card mb-6 border-primary/30 bg-gradient-to-br from-primary/10 via-card/60 to-card/40 backdrop-blur-2xl">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Lovable AI Cloud
              </p>
              <p className="text-[15px] font-display font-medium tracking-tight text-foreground">
                Créditos de IA (Cloud) — separados do plano
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-md">
                Créditos usados para <strong>contagem de calorias/macros</strong> e
                <strong> elaboração de programas de treino</strong> pela IA. Estes créditos
                são <strong>diferentes</strong> dos créditos mensais do plano Free/Pro —
                consulte o saldo real no painel oficial. Abaixo, estimativa de consumo
                interno dos últimos 30 dias.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="gap-2 rounded-2xl border-primary/30">
              <a
                href="https://lovable.dev/settings/workspace"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver saldo <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button asChild className="gap-2 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
              <a
                href="https://lovable.dev/settings/workspace"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Zap className="h-4 w-4" /> Comprar créditos
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border/40 bg-background/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Execuções (30d)</p>
            <p className="mt-1 text-lg font-display font-semibold">
              {isLoading ? "…" : stats.runs.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tokens (30d)</p>
            <p className="mt-1 text-lg font-display font-semibold">
              {isLoading ? "…" : stats.totalTokens.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-primary flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Créditos (est.)
            </p>
            <p className="mt-1 text-lg font-display font-semibold text-foreground">
              {isLoading ? "…" : `≈ ${stats.estCredits.toFixed(2)}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LovableCreditsPanel;