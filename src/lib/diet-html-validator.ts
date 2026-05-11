// Validator for new diet HTML rules — applies to diets created on/after 2026-05-11.
// Rules:
// 1) Each meal must be identified by a heading in the pattern:
//    "REFEIÇÃO N: NOME" (case-insensitive; N = number; colon after the number;
//    an optional name may follow the colon).
// 2) Right after each meal heading, the meal body must START with a quote (") and END with a quote (")
//    (whitespace, line breaks and HTML tags around them are ignored).
//
// The validator is non-blocking by design: callers should warn the admin/consultant
// and let them confirm to save anyway.

export const NEW_DIET_RULES_CUTOFF = new Date("2026-05-11T00:00:00");

export type DietValidationIssue = {
  meal?: string;
  message: string;
};

export type DietValidationResult = {
  ok: boolean;
  issues: DietValidationIssue[];
};

// Allows: "REFEIÇÃO 1:", "REFEIÇÃO 1: NOME", "REFEIÇÃO 1: NOME COM ESPAÇOS / ACENTOS (PARÊNTESES)"
const MEAL_HEADING_VALID_RE = /^\s*REFEI[ÇC][ÃA]O\s+\d+\s*:\s*.*$/i;
const MEAL_HEADING_LOOSE_RE = /REFEI[ÇC][ÃA]O\s*\d+/i;

const stripInvisibleChars = (value: string) =>
  value
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ");

function htmlToBlocks(html: string): string[] {
  if (!html) return [];
  // Insert markers for block-level boundaries so we can split into "lines".
  const withBreaks = html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return withBreaks
    .split(/\n+/)
    .map((s) => stripInvisibleChars(s.replace(/&nbsp;/gi, " ")).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function validateDietHtml(html: string): DietValidationResult {
  const issues: DietValidationIssue[] = [];
  const blocks = htmlToBlocks(html);

  if (blocks.length === 0) {
    return { ok: false, issues: [{ message: "Conteúdo da dieta vazio." }] };
  }

  // Locate meal heading indices
  const headingIdx: number[] = [];
  blocks.forEach((b, i) => {
    if (MEAL_HEADING_LOOSE_RE.test(b)) headingIdx.push(i);
  });

  if (headingIdx.length === 0) {
    issues.push({
      message:
        'Nenhuma refeição encontrada. Use o formato "REFEIÇÃO N: NOME" (ex: REFEIÇÃO 1: CAFÉ DA MANHÃ).',
    });
    return { ok: false, issues };
  }

  headingIdx.forEach((idx, k) => {
    const heading = blocks[idx];
    if (!MEAL_HEADING_VALID_RE.test(heading)) {
      issues.push({
        meal: heading,
        message: `Cabeçalho fora do padrão: "${heading}". Use "REFEIÇÃO N: NOME" (dois pontos após o número; nome é opcional).`,
      });
    }

    // Body = blocks between this heading and the next
    const nextIdx = headingIdx[k + 1] ?? blocks.length;
    const body = blocks.slice(idx + 1, nextIdx).join(" ").trim();

    if (!body) {
      issues.push({ meal: heading, message: `"${heading}" está sem conteúdo.` });
      return;
    }

    const startsWithQuote = /^["“”]/.test(body);
    const endsWithQuote = /["“”]\s*$/.test(body);

    if (!startsWithQuote || !endsWithQuote) {
      issues.push({
        meal: heading,
        message: `"${heading}": o conteúdo deve começar com aspas (") e terminar com aspas (").`,
      });
    }
  });

  return { ok: issues.length === 0, issues };
}

export function shouldValidateDiet(createdAt?: string | Date | null): boolean {
  // New diets (no createdAt yet) always validate.
  if (!createdAt) return true;
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(d.getTime())) return true;
  return d.getTime() >= NEW_DIET_RULES_CUTOFF.getTime();
}

export function formatValidationMessage(result: DietValidationResult): string {
  if (result.ok) return "";
  const lines = result.issues.map((i) => `• ${i.message}`).join("\n");
  return `A dieta não segue as novas regras de formatação (a partir de 11/05/26):\n\n${lines}\n\nDeseja salvar mesmo assim?`;
}