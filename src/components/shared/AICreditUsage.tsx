import { Sparkles } from "lucide-react";

// Estimativa aproximada de créditos Lovable AI por 1k tokens.
// Valores baseados nas tabelas públicas dos provedores no Lovable AI Gateway.
// Ajuste fino é feito no ledger da workspace (Settings → Plans & credits).
export const AI_CREDIT_RATES: Record<string, { in: number; out: number }> = {
  "google/gemini-3-flash-preview": { in: 0.03, out: 0.25 },
  "google/gemini-2.5-flash": { in: 0.03, out: 0.25 },
  "google/gemini-2.5-flash-lite": { in: 0.01, out: 0.04 },
  "google/gemini-2.5-pro": { in: 1.25, out: 10.0 },
  "google/gemini-3-pro-image": { in: 1.25, out: 10.0 },
};

interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface Props {
  model?: string;
  usage?: Usage | null;
  className?: string;
  label?: string;
}

export default function AICreditUsage({ model, usage, className = "", label }: Props) {
  if (!usage) return null;
  const inTok = usage.prompt_tokens ?? 0;
  const outTok = usage.completion_tokens ?? 0;
  const total = usage.total_tokens ?? (inTok + outTok);
  const rate = (model && AI_CREDIT_RATES[model]) || null;
  const credits = rate ? (inTok / 1000) * rate.in + (outTok / 1000) * rate.out : null;

  return (
    <div
      className={
        "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground " +
        className
      }
    >
      <span className="flex items-center gap-1 font-medium text-foreground">
        <Sparkles className="h-3 w-3 text-primary" />
        {label || "Consumo desta geração"}
      </span>
      {credits !== null && (
        <span>
          ≈ <strong className="text-foreground">{credits.toFixed(3)}</strong> créditos Lovable AI
          <span className="opacity-70"> (estimado)</span>
        </span>
      )}
      <span>
        Tokens: <strong className="text-foreground">{total.toLocaleString("pt-BR")}</strong>{" "}
        <span className="opacity-70">({inTok.toLocaleString("pt-BR")} in · {outTok.toLocaleString("pt-BR")} out)</span>
      </span>
      {model && <span className="opacity-70">· {model.split("/").pop()}</span>}
    </div>
  );
}