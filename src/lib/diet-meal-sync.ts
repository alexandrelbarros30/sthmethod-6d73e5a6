import { supabase } from "@/integrations/supabase/client";

export interface ParsedDietFood {
  item: string;
  quantity: string;
  sort_order: number;
}

export interface ParsedDietMeal {
  name: string;
  time: string;
  sort_order: number;
  foods: ParsedDietFood[];
  /** Raw HTML/text slice of this meal section (between this REFEIÇÃO heading and the next one). */
  raw_html?: string;
}

const DEFAULT_MEAL_NAMES: Record<number, string> = {
  0: "Café da Manhã",
  1: "Lanche da Manhã",
  2: "Almoço",
  3: "Lanche da Tarde",
  4: "Jantar",
  5: "Ceia",
};

const DEFAULT_MEAL_TIMES: Record<number, string> = {
  0: "07:00",
  1: "10:00",
  2: "12:00",
  3: "15:00",
  4: "19:00",
  5: "21:00",
};

const SECTION_TITLE_RE = /^(ROTINA\s*ALIMENTAR|PLANO\s*ALIMENTAR|DIETA)\b/i;

const stripInvisibleChars = (value: string) =>
  value
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ");

const normalize = (value: string) =>
  stripInvisibleChars(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const decodeHtml = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

/**
 * Token types emitted from the rich-text content.
 * - HEADING: a meal heading (h1-h3) → starts a new meal
 * - LABEL: an inline label like "Alimentos:" / "Substituições:" — attached as a note prefix
 * - ITEM: a regular line (paragraph or top-level li)
 * - SUB_ITEM: an ordered-list (<ol>) item — substitution alternative
 */
type DietToken =
  | { type: "HEADING"; text: string }
  | { type: "ITEM"; text: string }
  | { type: "SUB_ITEM"; text: string };

const stripTags = (html: string) =>
  stripInvisibleChars(decodeHtml(html.replace(/<[^>]+>/g, " ")))
    .replace(/\s+/g, " ")
    .trim();

const splitFoodsByPlus = (text: string): string[] => {
  // Split on "+" but keep numbers like "1/2" intact. Also split on " ou " to keep alternatives short.
  return text
    .split(/\s*\+\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const stripLeadingLabel = (text: string): string => {
  // Removes leading labels like "Alimentos:", "Substituições:", "Opção 1:" etc.
  return text.replace(/^\s*(alimentos|substitui[cç][õo]es|op[cç][aã]o\s*\d*|sugest[ãa]o)\s*[:\-–]\s*/i, "").trim();
};

/**
 * Tokenize the diet HTML preserving the semantic structure:
 * - <h1>/<h2>/<h3> → HEADING
 * - <ol><li> → SUB_ITEM (substitutions)
 * - <ul><li>, <p>, <div>, plain text → ITEM
 */
const htmlToTokens = (content: string): DietToken[] => {
  if (!content) return [];

  // Normalize: ensure plain text without HTML still works
  const hasHtml = /<[a-z!\/][^>]*>/i.test(content);
  if (!hasHtml) {
    return content
      .split(/\r?\n/)
      .map((l) => stripInvisibleChars(l).trim())
      .filter(Boolean)
      .map((text) => {
        if (/^(refei[cç][aã]o|caf[eé] da manh[ãa]|almo[cç]o|lanche|jantar|ceia|pr[eé][- ]?treino|p[oó]s[- ]?treino)/i.test(text)) {
          return { type: "HEADING" as const, text };
        }
        return { type: "ITEM" as const, text };
      });
  }

  // Pre-process: unwrap <li>…<ol/ul>…</ol/ul>…</li> so the inner list is not consumed by the lazy outer match.
  // CRITICAL: the captured prefix before <ol|ul> must NOT contain another <li> opener,
  // otherwise sibling <li>s get merged and their content is lost.
  // We also use a tempered pattern to avoid matching across sibling boundaries.
  let normalized = content;
  for (let i = 0; i < 3; i++) {
    const before = normalized;
    normalized = normalized.replace(
      /<li\b[^>]*>((?:(?!<li\b|<\/li>)[\s\S])*?<(?:ol|ul)\b[\s\S]*?<\/(?:ol|ul)>(?:(?!<li\b|<\/li>)[\s\S])*?)<\/li>/gi,
      "$1"
    );
    if (normalized === before) break;
  }

  const tokens: DietToken[] = [];
  // Match heading, ol-li, ul-li, p, div in document order
  const blockRe = /<(h[1-6]|li|p|div)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  // Track whether the parent of the current <li> is an <ol>
  const olRanges: Array<[number, number]> = [];
  const olRe = /<ol\b[^>]*>[\s\S]*?<\/ol>/gi;
  let olMatch: RegExpExecArray | null;
  while ((olMatch = olRe.exec(normalized)) !== null) {
    olRanges.push([olMatch.index, olMatch.index + olMatch[0].length]);
  }
  const isInsideOl = (pos: number) => olRanges.some(([s, e]) => pos >= s && pos < e);

  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(normalized)) !== null) {
    const tag = m[1].toLowerCase();
    const inner = m[3];
    const text = stripTags(inner);
    if (!text) continue;

    if (/^h[1-6]$/.test(tag)) {
      tokens.push({ type: "HEADING", text });
    } else if (tag === "li") {
      // Skip wrapper <li> that contains nested <ol>/<ul> — children will be emitted separately
      if (/<(ol|ul)\b/i.test(inner)) continue;
      // Skip pure label content like "Substituições:" / "Alimentos:"
      if (/^\s*(alimentos|substitui[cç][õo]es)\s*[:\-–]?\s*$/i.test(text)) continue;
      const sub = isInsideOl(m.index);
      tokens.push({ type: sub ? "SUB_ITEM" : "ITEM", text });
    } else {
      // p / div → split by <br> (already inside inner HTML)
      const parts = inner
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " ");
      decodeHtml(parts)
        .split("\n")
        .map((l) => l.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .forEach((line) => {
          // Plain-text headings inside <p> (e.g. "REFEIÇÃO 2")
          if (/^(refei[cç][aã]o\s*(extra|\d+)|caf[eé] da manh[ãa]|almo[cç]o|lanche\s+da\s+\w+|jantar|ceia|pr[eé][- ]?treino|p[oó]s[- ]?treino)\b/i.test(line)) {
            tokens.push({ type: "HEADING", text: line });
          } else {
            tokens.push({ type: "ITEM", text: line });
          }
        });
    }
  }

  return tokens;
};

const QUANTITY_RE = /^([\d.,\/]+\s?(?:g|gr|grama|gramas|kg|mg|ml|l|un|und|unidade|unidades|x[ií]cara|x[ií]caras|colher(?:es)?|fatia(?:s)?|kcal|copo|copos|pitada|porç[ãa]o|colheres?))\b/i;

const extractQuantity = (line: string) => {
  const match = line.match(QUANTITY_RE);
  return match?.[1]?.trim() || "porção";
};

const inferMealNameFromHeadingRemainder = (value: string): string | null => {
  const n = normalize(value.replace(/[()]/g, " "));
  if (!n) return null;
  if (n.includes("cafe da manha")) return "Café da Manhã";
  if (n.includes("lanche da manha")) return "Lanche da Manhã";
  if (n.includes("almoco")) return "Almoço";
  if (n.includes("lanche da tarde")) return "Lanche da Tarde";
  if (n.includes("jantar")) return "Jantar";
  if (n.includes("ceia") || n.includes("pos treino") || n.includes("pós treino")) return "Ceia";
  if (n.includes("extra")) return "Refeição Extra";
  return null;
};

const isHeadingMetadataOnly = (value: string) => {
  const n = normalize(value.replace(/[()]/g, " "));
  if (!n) return true;
  return (
    n.includes("cafe da manha") ||
    n.includes("lanche da manha") ||
    n.includes("almoco") ||
    n.includes("lanche da tarde") ||
    n.includes("jantar") ||
    n.includes("ceia") ||
    n.includes("pos treino") ||
    n.includes("pós treino") ||
    n === "extra"
  );
};

const parseHeading = (
  line: string,
  nextExtraOrder: () => number
): { sortOrder: number; name: string; remainder: string } | null => {
  const refeicao = line.match(/^refei[cç][aã]?o\s*(extra|\d+)\b[:\-\s]*(.*)$/i);
  if (refeicao) {
    const raw = refeicao[1]?.toLowerCase();
    const remainder = stripInvisibleChars(redecode(redecode? nope));
    const inferredName = inferMealNameFromHeadingRemainder(remainder);
    const remainderShouldBecomeFood = remainder && !inferredName && !isHeadingMetadataOnly(remainder);

    if (raw === "extra") {
      const sortOrder = nextExtraOrder();
      return {
        sortOrder,
        name: inferredName || "Refeição Extra",
        remainder: remainderShouldBecomeFood ? remainder : "",
      };
    }

    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      const sortOrder = parsed > 6 ? nextExtraOrder() : Math.max(0, parsed - 1);
      return {
        sortOrder,
        name: inferredName || DEFAULT_MEAL_NAMES[sortOrder] || `Refeição ${parsed}`,
        remainder: remainderShouldBecomeFood ? remainder : "",
      };
    }
  }

  const n = normalize(line);
  const namedMap: { test: RegExp; order: number; name: string }[] = [
    { test: /^cafe da manha\b/i, order: 0, name: "Café da Manhã" },
    { test: /^lanche da manha\b/i, order: 1, name: "Lanche da Manhã" },
    { test: /^almoco\b/i, order: 2, name: "Almoço" },
    { test: /^lanche da tarde\b/i, order: 3, name: "Lanche da Tarde" },
    { test: /^jantar\b/i, order: 4, name: "Jantar" },
    { test: /^ceia\b/i, order: 5, name: "Ceia" },
  ];

  for (const item of namedMap) {
    if (item.test.test(n)) {
      const remainder = line.replace(/^.+?[:\-]\s*/, "").trim();
      return { sortOrder: item.order, name: item.name, remainder: remainder === line ? "" : remainder };
    }
  }

  return null;
};

/**
 * Splits the raw HTML/text content into slices, one per meal heading.
 * A heading is REFEIÇÃO N, CAFÉ DA MANHÃ, ALMOÇO, LANCHE…, JANTAR, CEIA, PRÉ/PÓS-TREINO.
 * Each slice contains everything between this heading and the next one.
 */
const HEADING_KEYWORDS_RE = /^(refei[cç][aã]o\s*(?:extra|\d+)|caf[eé]\s+da\s+manh[ãa]|almo[cç]o|lanche\s+da\s+\w+|jantar|ceia|pr[eé][- ]?treino|p[oó]s[- ]?treino)\b/i;

const sliceContentByMealHeading = (content: string): Array<{ headingText: string; htmlSlice: string }> => {
  if (!content) return [];

  const hasHtml = /<[a-z!\/][^>]*>/i.test(content);

  if (!hasHtml) {
    const lines = content.split(/\r?\n/);
    const slices: Array<{ headingText: string; htmlSlice: string }> = [];
    let currentHeading: string | null = null;
    let buffer: string[] = [];
    const flush = () => {
      if (currentHeading !== null) {
        slices.push({ headingText: currentHeading, htmlSlice: buffer.join("\n").trim() });
      }
      buffer = [];
    };
    for (const line of lines) {
      const t = stripInvisibleChars(line).trim();
      if (HEADING_KEYWORDS_RE.test(t)) {
        flush();
        currentHeading = t;
      } else if (currentHeading !== null) {
        buffer.push(line);
      }
    }
    flush();
    return slices;
  }

  // A marker locates a heading block. We capture both the heading text AND any
  // "remainder" content that lives in the SAME block (e.g. text after a <br>).
  type Marker = {
    blockStart: number;
    blockEnd: number;
    headingText: string;
    remainderHtml: string; // any extra content inside the same block, after the heading line
  };
  const markers: Marker[] = [];
  const re = /<(h[1-6]|p|div|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const tag = m[1].toLowerCase();
    const inner = m[2];
    const innerText = stripTags(inner);
    if (!innerText) continue;
    const isHeadingTag = /^h[1-6]$/i.test(tag);

    let headingLine = "";
    let remainderHtml = "";

    if (isHeadingTag) {
      headingLine = innerText;
    } else {
      // Split the block by <br> and look for a heading on the FIRST non-empty line.
      const segments = inner.split(/<br\s*\/?\s*>/gi);
      const firstSegText = stripTags(segments[0] || "");
      if (HEADING_KEYWORDS_RE.test(firstSegText)) {
        headingLine = firstSegText;
        // Anything after the first <br> in the same block belongs to this meal.
        if (segments.length > 1) {
          remainderHtml = segments.slice(1).join("<br>").trim();
        }
      }
    }

    if (!headingLine || !HEADING_KEYWORDS_RE.test(headingLine)) continue;

    markers.push({
      blockStart: m.index,
      blockEnd: m.index + m[0].length,
      headingText: headingLine,
      remainderHtml,
    });
  }

  if (!markers.length) return [];

  const slices: Array<{ headingText: string; htmlSlice: string }> = [];
  for (let i = 0; i < markers.length; i++) {
    const cur = markers[i];
    const next = markers[i + 1];
    // Everything between the end of THIS heading block and the start of the NEXT
    // heading block — guaranteed uninterrupted (lists, paragraphs, divs all included).
    const between = content.slice(cur.blockEnd, next ? next.blockStart : content.length);
    const htmlSlice = (cur.remainderHtml ? `<p>${cur.remainderHtml}</p>` : "") + between;
    slices.push({
      headingText: cur.headingText,
      htmlSlice: htmlSlice.trim(),
    });
  }
  return slices;
};

export const parseDietContentToMeals = (content: string): ParsedDietMeal[] => {
  const slices = sliceContentByMealHeading(content);
  const mealsMap = new Map<number, ParsedDietMeal>();
  let extraOrder = 6;

  const nextExtraOrder = () => {
    const value = extraOrder;
    extraOrder += 1;
    return value;
  };

  const ensureMeal = (order: number, name?: string, rawHtml?: string) => {
    if (!mealsMap.has(order)) {
      mealsMap.set(order, {
        sort_order: order,
        name: name || DEFAULT_MEAL_NAMES[order] || "Refeição Extra",
        time: DEFAULT_MEAL_TIMES[order] || "12:00",
        foods: [],
        raw_html: rawHtml,
      });
    } else if (rawHtml && !mealsMap.get(order)!.raw_html) {
      mealsMap.get(order)!.raw_html = rawHtml;
    }
    return mealsMap.get(order)!;
  };

  const addFoodsFromText = (meal: ParsedDietMeal, rawText: string, opts?: { isSubstitution?: boolean; subIndex?: number }) => {
    const stripped = stripLeadingLabel(rawText);
    if (!stripped) return;
    if (/^(alimentos|substitui[cç][õo]es)\s*[:\-–]?\s*$/i.test(rawText.trim())) return;

    const parts = splitFoodsByPlus(stripped);
    parts.forEach((part) => {
      const cleaned = part.replace(/^[•\-*]\s*/, "").trim();
      if (!cleaned) return;
      const itemText = opts?.isSubstitution
        ? `Opção ${opts.subIndex}: ${cleaned}`
        : cleaned;
      meal.foods.push({
        item: itemText,
        quantity: extractQuantity(cleaned),
        sort_order: meal.foods.length,
      });
    });
  };

  // If we have heading-based slices, parse each slice independently — this is the most reliable path.
  if (slices.length > 0) {
    for (const slice of slices) {
      const heading = parseHeading(slice.headingText, nextExtraOrder);
      if (!heading) continue;
      const meal = ensureMeal(heading.sortOrder, heading.name, slice.htmlSlice);
      if (heading.remainder && !SECTION_TITLE_RE.test(heading.remainder)) {
        addFoodsFromText(meal, heading.remainder);
      }

      // Tokenize ONLY the slice's HTML — guarantees no cross-meal bleed.
      const sliceTokens = htmlToTokens(slice.htmlSlice);
      let substitutionIndex = 0;
      for (const token of sliceTokens) {
        const text = token.text;
        if (!text || SECTION_TITLE_RE.test(text)) continue;
        // Defensive: ignore any heading tokens inside a slice (shouldn't happen, but safe).
        if (token.type === "HEADING") continue;
        if (token.type === "SUB_ITEM") {
          substitutionIndex += 1;
          addFoodsFromText(meal, text, { isSubstitution: true, subIndex: substitutionIndex });
        } else {
          addFoodsFromText(meal, text);
        }
      }
    }
  } else {
    // Fallback: no headings detected — flat tokenize and dump into a single default meal.
    const tokens = htmlToTokens(content);
    let currentOrder: number | null = null;
    let substitutionIndex = 0;
    for (const token of tokens) {
      const text = token.text;
      if (!text || SECTION_TITLE_RE.test(text)) continue;
      if (token.type === "HEADING") {
        const heading = parseHeading(text, nextExtraOrder);
        if (heading) {
          currentOrder = heading.sortOrder;
          substitutionIndex = 0;
          ensureMeal(heading.sortOrder, heading.name);
        }
        continue;
      }
      if (currentOrder === null) continue;
      const meal = ensureMeal(currentOrder);
      if (token.type === "SUB_ITEM") {
        substitutionIndex += 1;
        addFoodsFromText(meal, text, { isSubstitution: true, subIndex: substitutionIndex });
      } else {
        addFoodsFromText(meal, text);
      }
    }
  }

  return Array.from(mealsMap.values())
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((meal) => meal.foods.length > 0);
};

export interface MealMacros {
  meal_number: number;
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const syncStudentDietMeals = async (
  studentId: string,
  content: string,
  perMealMacros?: MealMacros[],
  dietId?: string
) => {
  const meals = parseDietContentToMeals(content);

  // If no per-meal macros from AI, try to fetch totals from student_diets and distribute equally
  let fallbackPerMealMacros: MealMacros[] | undefined;
  if (!perMealMacros?.length && meals.length > 0) {
    let dietQuery = supabase
      .from("student_diets")
      .select("energy_kcal, protein_g, carbs_g, fat_g");
    if (dietId) {
      dietQuery = dietQuery.eq("id", dietId);
    } else {
      dietQuery = dietQuery.eq("user_id", studentId).order("created_at", { ascending: false }).limit(1);
    }
    const { data: dietRecord } = await dietQuery.maybeSingle();

    if (dietRecord && (dietRecord.energy_kcal || dietRecord.protein_g)) {
      const totalKcal = dietRecord.energy_kcal || 0;
      const totalProtein = dietRecord.protein_g || 0;
      const totalCarbs = dietRecord.carbs_g || 0;
      const totalFat = dietRecord.fat_g || 0;
      const mealCount = meals.length;

      fallbackPerMealMacros = meals.map((m, idx) => ({
        meal_number: m.sort_order + 1,
        energy_kcal: Math.round((totalKcal / mealCount) * 10) / 10,
        protein_g: Math.round((totalProtein / mealCount) * 10) / 10,
        carbs_g: Math.round((totalCarbs / mealCount) * 10) / 10,
        fat_g: Math.round((totalFat / mealCount) * 10) / 10,
      }));
    }
  }

  const effectiveMacros = perMealMacros?.length ? perMealMacros : fallbackPerMealMacros;

  let existingQuery = supabase
    .from("diet_meals")
    .select("id")
    .eq("user_id", studentId);
  if (dietId) existingQuery = existingQuery.eq("diet_id", dietId);
  const { data: existingMeals, error: existingMealsError } = await existingQuery;

  if (existingMealsError) throw existingMealsError;

  if (existingMeals?.length) {
    const mealIds = existingMeals.map((m) => m.id);
    const { error: deleteFoodsError } = await supabase.from("diet_foods").delete().in("meal_id", mealIds);
    if (deleteFoodsError) throw deleteFoodsError;

    const { error: deleteMealsError } = await supabase.from("diet_meals").delete().in("id", mealIds);
    if (deleteMealsError) throw deleteMealsError;
  }

  let foodsCount = 0;

  for (let i = 0; i < meals.length; i++) {
    const meal = meals[i];
    const { data: insertedMeal, error: insertMealError } = await supabase
      .from("diet_meals")
      .insert({
        user_id: studentId,
        name: meal.name,
        time: meal.time,
        sort_order: i,
        diet_id: dietId ?? null,
      } as any)
      .select("id")
      .single();

    if (insertMealError) throw insertMealError;

    if (meal.foods.length > 0) {
      // Find matching per-meal macros from AI analysis (meal_number is 1-based, sort_order is 0-based)
      const mealMacro = effectiveMacros?.find((m) => m.meal_number === meal.sort_order + 1);

      const rows = meal.foods.map((food, index) => {
        const foodCount = meal.foods.length;
        return {
          meal_id: insertedMeal.id,
          item: food.item,
          quantity: food.quantity,
          sort_order: index,
          // Persist the raw HTML/text of the entire meal section on the first food's `notes`,
          // so the student detail panel can render it faithfully (with prefix marker).
          notes: index === 0 && meal.raw_html ? `__RAW_HTML__${meal.raw_html}` : null,
          // Distribute meal macros equally across foods
          energy_kcal: mealMacro ? Math.round((mealMacro.energy_kcal / foodCount) * 10) / 10 : 0,
          protein_g: mealMacro ? Math.round((mealMacro.protein_g / foodCount) * 10) / 10 : 0,
          carbs_g: mealMacro ? Math.round((mealMacro.carbs_g / foodCount) * 10) / 10 : 0,
          fat_g: mealMacro ? Math.round((mealMacro.fat_g / foodCount) * 10) / 10 : 0,
        };
      });

      const { error: insertFoodsError } = await supabase.from("diet_foods").insert(rows);
      if (insertFoodsError) throw insertFoodsError;
      foodsCount += rows.length;
    }
  }

  return { mealsCount: meals.length, foodsCount };
};
