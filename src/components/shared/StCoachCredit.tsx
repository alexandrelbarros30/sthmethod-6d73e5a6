import { cn } from "@/lib/utils";

export const isStCoachVideoUrl = (url?: string | null) => {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes("vimeo.com") ||
    u.includes("player.vimeo") ||
    u.includes("supertreinosapp") ||
    u.includes("appsupercoach")
  );
};

interface Props {
  className?: string;
  variant?: "inline" | "overlay";
}

const StCoachCredit = ({ className, variant = "inline" }: Props) => {
  if (variant === "overlay") {
    return (
      <div
        className={cn(
          "pointer-events-none absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/90 shadow",
          className
        )}
      >
        Ref. técnica · © ST Coach
      </div>
    );
  }
  return (
    <p
      className={cn(
        "text-[11px] text-muted-foreground/80 italic leading-snug",
        className
      )}
    >
      Vídeo de referência técnica — os créditos e direitos deste vídeo pertencem ao{" "}
      <span className="font-medium not-italic">ST Coach</span>.
    </p>
  );
};

export default StCoachCredit;