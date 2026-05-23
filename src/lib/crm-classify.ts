export type CrmStatus = "active" | "expiring" | "expired" | "lead" | "tool_user";

export interface CrmProfileInput {
  onboarding_complete?: boolean | null;
  objective?: string | null;
}

export interface CrmSubInput {
  end_date: string;
  status?: string | null;
}

/**
 * Classifica um perfil para o CRM.
 * - active / expiring / expired: tem assinatura
 * - lead: SEM assinatura mas com onboarding completo (lead real, qualificado)
 * - tool_user: SEM assinatura e SEM onboarding → veio só para usar ferramenta gratuita
 *   (questionário de macros, calculadora, IMC, simulador, etc.)
 */
export function classifyCrm(profile: CrmProfileInput | undefined, sub: CrmSubInput | undefined): CrmStatus {
  if (sub) {
    const days = Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000);
    if (days < 0) return "expired";
    if (days <= 7) return "expiring";
    return "active";
  }
  if (profile?.onboarding_complete) return "lead";
  return "tool_user";
}

export const CRM_STATUS_LABEL: Record<CrmStatus, string> = {
  active: "Ativo",
  expiring: "Vencendo",
  expired: "Vencido",
  lead: "Lead",
  tool_user: "Ferramenta",
};

export const CRM_STATUS_COLOR: Record<CrmStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  expiring: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  expired: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  lead: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  tool_user: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};