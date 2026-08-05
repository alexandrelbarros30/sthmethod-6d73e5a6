import { cn } from "@/lib/utils";

/** Marca oficial do STH AI (ícone de nós, mesmo do app/PWA). */
export default function AiLogoMark({
  className,
  iconClassName,
}: {
  className?: string;
  /** Mantido por compatibilidade com chamadas existentes. */
  iconClassName?: string;
}) {
  return (
    <span
      aria-label="STH AI"
      role="img"
      className={cn("grid shrink-0 place-items-center overflow-hidden rounded-2xl", className)}
    >
      <img
        src="/logo-master-v1.png"
        alt="STH AI"
        className={cn("h-full w-full object-cover", iconClassName)}
        loading="eager"
        decoding="async"
      />
    </span>
  );
}
