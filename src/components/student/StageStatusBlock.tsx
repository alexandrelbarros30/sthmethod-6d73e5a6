import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { FriendlyError } from "@/lib/friendly-errors";

export type StageStatusKind = "loading" | "success" | "error";

interface StageStatusBlockProps {
  kind: StageStatusKind;
  title: string;
  description?: string;
  error?: FriendlyError | null;
  accent?: string; // hsl triplet like "145 60% 42%"
  onRetry?: () => void;
}

/**
 * Bloco reutilizável de status para etapas da Missão Evolução.
 * Renderiza loading / sucesso / erro com ícone, texto e código STH-XXX
 * respeitando quebras de linha em telas pequenas (sem overflow).
 */
const StageStatusBlock = ({
  kind,
  title,
  description,
  error,
  accent = "145 60% 42%",
  onRetry,
}: StageStatusBlockProps) => {
  const isError = kind === "error";
  const isSuccess = kind === "success";

  const color = isError
    ? "0 72% 51%"
    : isSuccess
      ? accent
      : "215 15% 55%";

  const Icon = isError ? AlertCircle : isSuccess ? CheckCircle2 : Loader2;

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className="w-full min-w-0 rounded-lg p-3 text-xs overflow-hidden"
      style={{
        background: `hsl(${color} / 0.08)`,
        border: `1px solid hsl(${color} / 0.35)`,
      }}
    >
      <div className="flex items-start gap-2 min-w-0">
        <Icon
          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${kind === "loading" ? "animate-spin" : ""}`}
          style={{ color: `hsl(${color})` }}
        />
        <div className="flex-1 min-w-0 space-y-1">
          <p
            className="text-[12px] font-semibold leading-snug break-words hyphens-auto"
            style={{ color: `hsl(${color})` }}
          >
            {title}
          </p>
          {description && (
            <p className="text-[11px] text-muted-foreground leading-snug break-words hyphens-auto">
              {description}
            </p>
          )}
          {isError && error && (
            <p className="text-[11px] text-muted-foreground leading-snug break-words hyphens-auto">
              {error.message}
            </p>
          )}
          {isError && error && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold tabular-nums whitespace-nowrap"
                style={{
                  background: `hsl(${color} / 0.15)`,
                  color: `hsl(${color})`,
                }}
              >
                {error.code}
              </span>
              {error.ref && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono text-muted-foreground bg-foreground/[0.06] whitespace-nowrap max-w-full truncate">
                  Ref: {error.ref}
                </span>
              )}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="ml-auto text-[11px] font-semibold underline underline-offset-2 whitespace-nowrap"
                  style={{ color: `hsl(${color})` }}
                >
                  Tentar novamente
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StageStatusBlock;