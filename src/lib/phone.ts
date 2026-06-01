/**
 * Normaliza um telefone para o formato E.164 (somente dígitos com DDI 55 quando aplicável).
 * Aceita strings com máscara, espaços, +, parênteses etc.
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  let digits = String(raw).replace(/\D+/g, "");
  if (!digits) return "";
  // remove zeros à esquerda
  digits = digits.replace(/^0+/, "");
  // se já vier com 55 e tamanho válido (12 ou 13), mantém
  if (digits.length >= 12 && digits.startsWith("55")) return digits;
  // se vier sem DDI (10 ou 11 dígitos), adiciona 55
  if (digits.length === 10 || digits.length === 11) return "55" + digits;
  return digits;
}

export function formatPhoneBR(raw: string | null | undefined): string {
  const d = normalizePhone(raw);
  if (!d) return "";
  // 55 + DDD(2) + numero(8 ou 9)
  const local = d.startsWith("55") ? d.slice(2) : d;
  if (local.length === 11) return `+55 (${local.slice(0,2)}) ${local.slice(2,7)}-${local.slice(7)}`;
  if (local.length === 10) return `+55 (${local.slice(0,2)}) ${local.slice(2,6)}-${local.slice(6)}`;
  return "+" + d;
}

export function phoneCandidates(raw: string | null | undefined): string[] {
  const d = normalizePhone(raw);
  if (!d) return [];
  const set = new Set<string>([d]);
  const local = d.startsWith("55") ? d.slice(2) : d;
  if (local) {
    set.add(local);
    set.add("55" + local);
    // variações com/sem 9o dígito
    if (local.length === 11 && local[2] === "9") set.add(local.slice(0,2) + local.slice(3));
    if (local.length === 10) set.add(local.slice(0,2) + "9" + local.slice(2));
  }
  return Array.from(set);
}