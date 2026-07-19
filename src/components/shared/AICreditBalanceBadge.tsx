import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ExternalLink, TrendingUp, Zap } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AI_CREDIT_RATES } from "@/components/shared/AICreditUsage";

// Widget compacto que mostra, direto na tela, a estimativa de consumo Lovable AI
// dos últimos 30 dias e abre um popover com o link para o saldo oficial em
// Settings → Plans & credits (lovable.dev/settings/workspace).
interface Props {
  className?: string;
  compact?: boolean;
}

export default function AICreditBalanceBadge({ className = "", compact = false }: Props) {
  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["lovable-ai-badge-30d", since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_ai_runs")
        .select("tokens, model")
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
        estCredits += (t * 0.3 / 1000) * rate.in + (t * 0.7 / 1000) * rate.out;
      }
    }
    return { runs: runs.length, totalTokens, estCredits };
  }, [data]);

  const label = isLoading ? "…" : `≈ ${stats.estCredits.toFixed(2)} créd. (30d)`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] font-medium text-foreground hover:bg-primary/10 transition " +
            className
          }
          title="Créditos Lovable AI Cloud — separados dos créditos do plano Free/Pro"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          <span>{compact ? "Créd. AI Cloud" : "AI Cloud (≠ plano)"}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-primary">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3 rounded-2xl">
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Lovable AI Cloud
            </p>
            <p className="text-sm font-display font-medium">Créditos de IA (consumo)</p>
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
              Créditos usados para <strong>contagem de calorias/macros</strong> e
              <strong> geração de treinos</strong>. São <strong>separados</strong> dos
              créditos mensais do plano Free/Pro.
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-border/40 bg-background/60 p-2">
            <p className="text-[9px] uppercase text-muted-foreground">Exec</p>
            <p className="text-sm font-semibold">{isLoading ? "…" : stats.runs}</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/60 p-2">
            <p className="text-[9px] uppercase text-muted-foreground">Tokens</p>
            <p className="text-sm font-semibold">
              {isLoading ? "…" : stats.totalTokens.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-2">
            <p className="text-[9px] uppercase text-primary flex items-center justify-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5" /> Créd.
            </p>
            <p className="text-sm font-semibold">
              {isLoading ? "…" : stats.estCredits.toFixed(2)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Estimativa dos últimos 30 dias. O saldo oficial em tempo real fica no painel
          da Lovable.
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          <Button asChild variant="outline" size="sm" className="w-full gap-2 rounded-xl">
            <a
              href="https://lovable.dev/settings/workspace"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver saldo <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            className="w-full gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <a
              href="https://lovable.dev/settings/workspace"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Zap className="h-3.5 w-3.5" /> Comprar créditos
            </a>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}