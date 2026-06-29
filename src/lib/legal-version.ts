/**
 * Versionamento dos documentos legais da STH METHOD.
 * Atualize a versão sempre que houver alteração material no Termo
 * ou na Política de Privacidade — o aceite é registrado por versão.
 */

export const LEGAL = {
  termsVersion: "v2026.06.29",
  privacyVersion: "v2026.06",
  programNature:
    "Programa de Acompanhamento em Saúde e Performance por prazo determinado.",
  supportWhatsapp: "5521998496289",
  supportEmail: "contato@sthmethod.com.br",
  /**
   * Data em que a nova versão entra em vigor para alunos JÁ ATIVOS.
   * A partir dessa data, conta-se o período de carência (graceDays)
   * para que registrem o aceite. Após o prazo, o acesso é bloqueado
   * até que o Termo seja aceito.
   */
  termsEffectiveAt: "2026-06-29T00:00:00-03:00",
  graceDays: 7,
} as const;

/** Deadline = termsEffectiveAt + graceDays. */
export function getTermsGraceDeadline(): Date {
  const start = new Date(LEGAL.termsEffectiveAt);
  const d = new Date(start);
  d.setDate(d.getDate() + LEGAL.graceDays);
  return d;
}

/** Dias restantes da carência (>=0). 0 = já bloqueia. */
export function getTermsGraceDaysLeft(now: Date = new Date()): number {
  const deadline = getTermsGraceDeadline();
  const ms = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export const LEGAL_DISCLAIMER_SHORT =
  "O cliente contrata um Programa de Acompanhamento por prazo determinado — não a aquisição definitiva de dietas, treinos ou protocolos. Encerrada a vigência do plano, o acesso à plataforma é encerrado. Resultados não são garantidos.";

export const PLAN_CATALOG = [
  {
    code: "30D",
    name: "Plano 30D",
    duration: "30 dias de vigência",
    pix: "R$ 87,00",
    card: "R$ 97,00 no cartão",
  },
  {
    code: "90D",
    name: "Plano 90D",
    duration: "90 dias de vigência",
    pix: "R$ 227,00",
    card: "até 3x de R$ 85,67",
  },
  {
    code: "6M",
    name: "Plano 6M",
    duration: "180 dias de vigência",
    pix: "R$ 427,00",
    card: "até 6x de R$ 79,50",
  },
  {
    code: "PV180",
    name: "Projeto Verão 180",
    duration: "180 dias de vigência",
    pix: "2 parcelas de R$ 49,50 + 4 parcelas de R$ 94,50",
    card: "Cartão recorrente em 6 parcelas escalonadas",
  },
  {
    code: "SELECTED",
    name: "Plano Selected",
    duration: "Vigência estabelecida entre as partes",
    pix: "Gratuito",
    card: "Funcionalidades limitadas conforme definido pela STH METHOD",
  },
] as const;