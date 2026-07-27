import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Utensils, Leaf, AlertTriangle, ArrowRight, Lightbulb } from "lucide-react";

type Row = {
  quality_score: number | null;
  alerts: any;
  foods: any;
  created_at: string;
};

const ALERT_LABELS: Record<string, string> = {
  muito_sodio: "Muito sódio",
  muito_acucar: "Muito açúcar",
  gordura_trans: "Gordura trans",
  ultraprocessado: "Ultraprocessado",
  pouca_proteina: "Pouca proteína",
  pouca_fibra: "Pouca fibra",
  excesso_gordura_saturada: "Excesso de gordura saturada",
  alcool: "Álcool",
};

const SthiaFoodWeeklyCard = () => {
  const { user } = useAuth();

  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["sthia-food-weekly", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_ai_logs")
        .select("quality_score, alerts, foods, created_at, suggestions")
        .eq("student_id", user!.id)
        .gte("created_at", from)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as (Row & { suggestions?: any })[];
    },
  });

  const insights = useMemo(() => {
    const rows = data ?? [];
    if (!rows.length) return null;

    const scores = rows
      .map((r) => (typeof r.quality_score === "number" ? r.quality_score * 10 : null))
      .filter((v): v is number => v !== null);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    let ultra = 0;
    let items = 0;
    rows.forEach((r) => {
      const foods = Array.isArray(r.foods) ? r.foods : [];
      foods.forEach((f: any) => {
        items += 1;
        if (Number(f?.nova_group) === 4) ultra += 1;
      });
    });
    const ultraPct = items ? Math.round((ultra / items) * 100) : 0;

    const alertCounts = new Map<string, number>();
    rows.forEach((r) => {
      const arr = Array.isArray(r.alerts) ? r.alerts : [];
      arr.forEach((a: any) => {
        const k = String(a).trim();
        if (!k) return;
        alertCounts.set(k, (alertCounts.get(k) ?? 0) + 1);
      });
    });
    const topAlerts = Array.from(alertCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => ALERT_LABELS[k] || k.replace(/_/g, " "));

    // Pick up to 3 unique AI suggestions from the most recent analyses
    const suggestionSet = new Set<string>();
    for (const r of rows) {
      const arr = Array.isArray((r as any).suggestions) ? (r as any).suggestions : [];
      for (const s of arr) {
        const str = String(s || "").trim();
        if (str && str.length <= 140) suggestionSet.add(str);
        if (suggestionSet.size >= 3) break;
      }
      if (suggestionSet.size >= 3) break;
    }

    return {
      count: rows.length,
      avgScore,
      ultraPct,
      topAlerts,
      suggestions: Array.from(suggestionSet).slice(0, 3),
    };
  }, [data]);

  if (isLoading || !insights) return null;

  const scoreColor =
    insights.avgScore >= 85
      ? "text-emerald-500"
      : insights.avgScore >= 70
      ? "text-lime-500"
      : insights.avgScore >= 50
      ? "text-amber-500"
      : "text-rose-500";

  const scoreLabel =
    insights.avgScore >= 85
      ? "Excelente"
      : insights.avgScore >= 70
      ? "Boa"
      : insights.avgScore >= 50
      ? "Moderada"
      : "A melhorar";

  return (
    <div className="mb-6 rounded-3xl border border-border/40 bg-background overflow-hidden animate-fade-in">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> STHIA Food · 7 dias
          </div>
          <Link
            to="/dashboard/sthia-food"
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Ver mais <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <p className="text-[20px] leading-tight font-semibold tracking-[-0.02em] text-foreground mb-1">
          {insights.count} análise{insights.count === 1 ? "" : "s"} nesta semana.
        </p>
        <p className="text-[12.5px] text-muted-foreground font-light tracking-tight mb-5">
          Resumo nutricional gerado pelo motor STHIA Food AI.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-2xl border border-border/40 p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              <Utensils className="w-3 h-3" /> Score
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-[26px] font-semibold tabular-nums tracking-[-0.03em] ${scoreColor}`}>
                {insights.avgScore}
              </span>
              <span className="text-[10.5px] text-muted-foreground/70">/100</span>
            </div>
            <p className="text-[10.5px] text-muted-foreground mt-1">{scoreLabel}</p>
          </div>

          <div className="rounded-2xl border border-border/40 p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              <Leaf className="w-3 h-3" /> Ultra
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-[26px] font-semibold tabular-nums tracking-[-0.03em] ${
                  insights.ultraPct > 30 ? "text-rose-500" : "text-foreground"
                }`}
              >
                {insights.ultraPct}
              </span>
              <span className="text-[10.5px] text-muted-foreground/70">%</span>
            </div>
            <p className="text-[10.5px] text-muted-foreground mt-1">NOVA 4</p>
          </div>

          <div className="rounded-2xl border border-border/40 p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              <AlertTriangle className="w-3 h-3" /> Alertas
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[26px] font-semibold tabular-nums tracking-[-0.03em] text-foreground">
                {insights.topAlerts.length}
              </span>
              <span className="text-[10.5px] text-muted-foreground/70">tipos</span>
            </div>
            <p className="text-[10.5px] text-muted-foreground mt-1 truncate">
              {insights.topAlerts[0] || "—"}
            </p>
          </div>
        </div>

        {insights.topAlerts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {insights.topAlerts.map((a) => (
              <span
                key={a}
                className="text-[10.5px] px-2.5 py-1 rounded-full border border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {insights.suggestions.length > 0 && (
          <div className="rounded-2xl border border-border/40 p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
              <Lightbulb className="w-3 h-3" /> Sugestões STHIA
            </div>
            <ul className="space-y-2">
              {insights.suggestions.map((s, i) => (
                <li key={i} className="text-[12.5px] leading-snug text-foreground/85 flex gap-2">
                  <span className="text-primary mt-0.5">·</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SthiaFoodWeeklyCard;