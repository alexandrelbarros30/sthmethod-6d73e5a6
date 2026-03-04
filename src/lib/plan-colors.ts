/**
 * Plan tier color system
 * Maps plans to visual tiers based on duration_days.
 * Tiers: entry (≤30d), mid (31-120d), premium (>120d)
 */

export type PlanTier = "entry" | "mid" | "premium" | "none";

export function getPlanTier(durationDays?: number | null): PlanTier {
  if (!durationDays) return "none";
  if (durationDays <= 30) return "entry";
  if (durationDays <= 120) return "mid";
  return "premium";
}

/** Returns Tailwind-compatible class sets for a plan tier */
export function getPlanTierClasses(tier: PlanTier) {
  switch (tier) {
    case "entry":
      return {
        badge: "bg-plan-entry/15 text-plan-entry border-plan-entry/30",
        bg: "bg-plan-entry/10",
        border: "border-plan-entry/25",
        text: "text-plan-entry",
        glow: "shadow-[0_0_12px_-3px_hsl(var(--plan-entry)/0.3)]",
        dot: "bg-plan-entry",
      };
    case "mid":
      return {
        badge: "bg-plan-mid/15 text-plan-mid border-plan-mid/30",
        bg: "bg-plan-mid/10",
        border: "border-plan-mid/25",
        text: "text-plan-mid",
        glow: "shadow-[0_0_12px_-3px_hsl(var(--plan-mid)/0.3)]",
        dot: "bg-plan-mid",
      };
    case "premium":
      return {
        badge: "bg-plan-premium/15 text-plan-premium border-plan-premium/30",
        bg: "bg-plan-premium/10",
        border: "border-plan-premium/25",
        text: "text-plan-premium",
        glow: "shadow-[0_0_12px_-3px_hsl(var(--plan-premium)/0.3)]",
        dot: "bg-plan-premium",
      };
    default:
      return {
        badge: "bg-muted text-muted-foreground border-border",
        bg: "bg-muted/10",
        border: "border-border",
        text: "text-muted-foreground",
        glow: "",
        dot: "bg-muted-foreground",
      };
  }
}

export function getPlanTierLabel(tier: PlanTier) {
  switch (tier) {
    case "entry": return "Essencial";
    case "mid": return "Recomendado";
    case "premium": return "Premium";
    default: return "—";
  }
}

/** Convenience: from duration_days directly to classes */
export function planColorClasses(durationDays?: number | null) {
  return getPlanTierClasses(getPlanTier(durationDays));
}
