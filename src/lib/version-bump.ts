export type UpdateImpact = "patch" | "minor" | "major";

export function parseVersion(v: string): [number, number, number] {
  const clean = v.replace(/^Beta\s*/i, "").trim();
  const parts = clean.split(".").map((n) => parseInt(n, 10) || 0);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

export function bumpVersion(current: string, impact: UpdateImpact): string {
  const [maj, min, pat] = parseVersion(current);
  if (impact === "major") return `${maj + 1}.0.0`;
  if (impact === "minor") return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

export function compareVersions(a: string, b: string): number {
  const [a1, a2, a3] = parseVersion(a);
  const [b1, b2, b3] = parseVersion(b);
  if (a1 !== b1) return a1 - b1;
  if (a2 !== b2) return a2 - b2;
  return a3 - b3;
}

export const IMPACT_LABEL: Record<UpdateImpact, string> = {
  patch: "Pequena",
  minor: "Média",
  major: "Grande",
};

export const IMPACT_DESCRIPTION: Record<UpdateImpact, string> = {
  patch: "Correções de bug, ajustes visuais e textos",
  minor: "Nova funcionalidade ou melhoria notável",
  major: "Mudança estrutural ou refatoração visível",
};