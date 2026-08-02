import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

/** Marca vetorial padrão do STH AI (substitui o PNG com acabamento irregular). */
export default function AiLogoMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      aria-label="STH AI"
      role="img"
      className={cn(
        "grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm",
        className,
      )}
    >
      <Brain className={cn("h-4 w-4", iconClassName)} strokeWidth={1.8} />
    </span>
  );
}
