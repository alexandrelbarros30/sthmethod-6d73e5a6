// ============================================================
// STHIA 2.0 — Gabarito nutricional (contra-informação)
// Confronta cada alimento declarado pela IA com:
//   1) tabela TACO/TBCA embarcada (prioridade, alimentos brasileiros)
//   2) FatSecret Platform API (fallback, alimentos genéricos)
// Corrige divergências acima da tolerância antes de liberar o cardápio.
// ============================================================
import { findFoodRef, parseQuantityToGrams, macrosForGrams } from "./food-reference.ts";

const ITEM_TOLERANCE_PCT = 8;

export type ValidationEntry = {
  meal_number: number;
  food: string;
  quantity: string;
  source: "TACO/TBCA" | "FatSecret" | "não verificado";
  status: "ok" | "corrigido" | "não verificado";
  deviation_pct?: number;
  before?: { energy_kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  after?: { energy_kcal: number; protein_g: number; carbs_g: number; fat_g: number };
};

export type ValidationReport = {
  checked: number;
  corrected: number;
  unverified: number;
  entries: ValidationEntry[];
};

const strip = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").trim();

const fsCache = new Map<string, any | null>();

async function fatSecretLookup(name: string): Promise<any | null> {
  const key = strip(name);
  if (!key) return null;
  if (fsCache.has(key)) return fsCache.get(key) ?? null;

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !ANON) return null;

  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 12000);
    let json: any;
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/fatsecret-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}`, apikey: ANON },
        body: JSON.stringify({ query: name, maxResults: 10 }),
        signal: ctl.signal,
      });
      json = await resp.json();
    } finally {
      clearTimeout(timer);
    }

    const tokens = strip(name).split(/\s+/).filter((t) => t.length > 3);
    const match = (json?.foods || []).find((f: any) => {
      if (f.category !== "Generic") return false;
      if (!f.energy_kcal || f.energy_kcal > 950) return false;
      const fn = strip(f.name);
      return tokens.length > 0 && tokens.some((t) => fn.includes(t));
    }) || null;

    fsCache.set(key, match);
    return match;
  } catch (_e) {
    fsCache.set(key, null);
    return null;
  }
}

const pctDiff = (value: number, ref: number) => (ref > 0 ? Math.abs((value - ref) / ref) * 100 : 0);

/**
 * Audita e corrige os base_items de cada refeição contra as bases oficiais.
 * Muta `meals` in place e devolve o relatório da conferência.
 */
export async function validateMealsAgainstTables(meals: any[]): Promise<ValidationReport> {
  const report: ValidationReport = { checked: 0, corrected: 0, unverified: 0, entries: [] };
  if (!Array.isArray(meals)) return report;

  for (const meal of meals) {
    const items = Array.isArray(meal?.base_items) ? meal.base_items : [];
    for (const item of items) {
      const name = String(item?.food || "").trim();
      const quantity = String(item?.quantity || "").trim();
      const before = {
        energy_kcal: Number(item?.energy_kcal) || 0,
        protein_g: Number(item?.protein_g) || 0,
        carbs_g: Number(item?.carbs_g) || 0,
        fat_g: Number(item?.fat_g) || 0,
      };

      let ref = findFoodRef(name);
      let source: ValidationEntry["source"] = "TACO/TBCA";
      let per100: { kcal: number; protein: number; carbs: number; fat: number; fiber: number } | null = ref
        ? { kcal: ref.kcal, protein: ref.protein, carbs: ref.carbs, fat: ref.fat, fiber: ref.fiber }
        : null;

      if (!per100) {
        const fs = await fatSecretLookup(name);
        if (fs) {
          source = "FatSecret";
          per100 = { kcal: fs.energy_kcal, protein: fs.protein_g, carbs: fs.carbs_g, fat: fs.fat_g, fiber: fs.fiber_g || 0 };
        }
      }

      const qty = parseQuantityToGrams(quantity, ref);
      if (!per100 || !qty || qty.grams <= 0) {
        report.unverified++;
        item.validation = { source: "não verificado", status: "não verificado" };
        report.entries.push({ meal_number: Number(meal?.meal_number) || 0, food: name, quantity, source: "não verificado", status: "não verificado" });
        continue;
      }

      const expected = macrosForGrams(
        { key: name, aliases: [], kcal: per100.kcal, protein: per100.protein, carbs: per100.carbs, fat: per100.fat, fiber: per100.fiber },
        qty.grams,
      );

      report.checked++;
      const worst = Math.max(
        pctDiff(before.energy_kcal, expected.energy_kcal),
        pctDiff(before.protein_g, expected.protein_g),
        pctDiff(before.carbs_g, expected.carbs_g),
        pctDiff(before.fat_g, expected.fat_g),
      );

      if (worst > ITEM_TOLERANCE_PCT) {
        item.energy_kcal = expected.energy_kcal;
        item.protein_g = expected.protein_g;
        item.carbs_g = expected.carbs_g;
        item.fat_g = expected.fat_g;
        item.fiber_g = expected.fiber_g;
        item.validation = { source, status: "corrigido", deviation_pct: Math.round(worst * 10) / 10 };
        report.corrected++;
        report.entries.push({
          meal_number: Number(meal?.meal_number) || 0,
          food: name,
          quantity,
          source,
          status: "corrigido",
          deviation_pct: Math.round(worst * 10) / 10,
          before,
          after: { energy_kcal: expected.energy_kcal, protein_g: expected.protein_g, carbs_g: expected.carbs_g, fat_g: expected.fat_g },
        });
      } else {
        item.validation = { source, status: "ok", deviation_pct: Math.round(worst * 10) / 10 };
        report.entries.push({
          meal_number: Number(meal?.meal_number) || 0,
          food: name,
          quantity,
          source,
          status: "ok",
          deviation_pct: Math.round(worst * 10) / 10,
        });
      }
    }
  }

  return report;
}
