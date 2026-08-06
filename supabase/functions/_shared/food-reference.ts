// ============================================================
// STHIA 2.0 — Base de referência nutricional (TACO/TBCA)
// Valores por 100 g (ou 100 ml) de alimento pronto para consumo.
// Usada como "gabarito" antes de liberar qualquer cardápio.
// ============================================================

export type FoodRef = {
  key: string;
  aliases: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  /** peso médio de 1 unidade em gramas (quando o alimento é contado por unidade) */
  unitGrams?: number;
};

export const TACO_TABLE: FoodRef[] = [
  // ---------- Proteínas animais ----------
  { key: "peito de frango grelhado", aliases: ["frango grelhado", "peito de frango", "file de frango", "frango cozido", "frango"], kcal: 163, protein: 31.5, carbs: 0, fat: 3.6, fiber: 0 },
  { key: "coxa/sobrecoxa de frango sem pele", aliases: ["coxa de frango", "sobrecoxa"], kcal: 187, protein: 26.9, carbs: 0, fat: 8.4, fiber: 0 },
  { key: "patinho bovino grelhado", aliases: ["patinho", "carne magra", "carne bovina magra", "coxao mole", "coxao duro", "alcatra", "musculo bovino", "file mignon", "carne moida"], kcal: 219, protein: 35.9, carbs: 0, fat: 7.3, fiber: 0 },
  { key: "contrafile grelhado", aliases: ["contrafile", "picanha", "maminha"], kcal: 278, protein: 32.4, carbs: 0, fat: 15.6, fiber: 0 },
  { key: "lombo suino assado", aliases: ["lombo suino", "lombo de porco", "carne suina"], kcal: 210, protein: 35.7, carbs: 0, fat: 6.4, fiber: 0 },
  { key: "tilapia grelhada", aliases: ["tilapia", "peixe branco", "merluza", "pescada"], kcal: 128, protein: 26.2, carbs: 0, fat: 2.7, fiber: 0 },
  { key: "salmao grelhado", aliases: ["salmao"], kcal: 208, protein: 22.8, carbs: 0, fat: 12.5, fiber: 0 },
  { key: "atum em agua", aliases: ["atum", "atum enlatado", "atum solido"], kcal: 116, protein: 25.5, carbs: 0, fat: 0.8, fiber: 0 },
  { key: "sardinha em agua", aliases: ["sardinha"], kcal: 164, protein: 24.6, carbs: 0, fat: 7.0, fiber: 0 },
  { key: "camarao cozido", aliases: ["camarao"], kcal: 99, protein: 24.0, carbs: 0.2, fat: 0.3, fiber: 0 },
  { key: "ovo de galinha cozido", aliases: ["ovo cozido", "ovo inteiro", "ovos", "ovo", "ovo mexido", "ovo frito"], kcal: 146, protein: 13.3, carbs: 0.6, fat: 9.5, fiber: 0, unitGrams: 50 },
  { key: "clara de ovo", aliases: ["claras", "clara", "clara de ovo cozida"], kcal: 52, protein: 10.9, carbs: 0.7, fat: 0.2, fiber: 0, unitGrams: 33 },

  // ---------- Laticínios ----------
  { key: "leite desnatado", aliases: ["leite desnatado", "leite zero"], kcal: 35, protein: 3.4, carbs: 4.9, fat: 0.2, fiber: 0 },
  { key: "leite integral", aliases: ["leite integral", "leite"], kcal: 61, protein: 3.2, carbs: 4.7, fat: 3.3, fiber: 0 },
  { key: "iogurte natural desnatado", aliases: ["iogurte natural desnatado", "iogurte desnatado", "iogurte zero"], kcal: 41, protein: 4.0, carbs: 5.8, fat: 0.2, fiber: 0 },
  { key: "iogurte natural integral", aliases: ["iogurte natural", "iogurte"], kcal: 62, protein: 3.8, carbs: 4.7, fat: 3.0, fiber: 0 },
  { key: "iogurte grego zero", aliases: ["iogurte grego", "grego zero"], kcal: 59, protein: 9.5, carbs: 4.0, fat: 0.4, fiber: 0 },
  { key: "queijo cottage", aliases: ["cottage"], kcal: 98, protein: 11.1, carbs: 3.4, fat: 4.3, fiber: 0 },
  { key: "queijo minas frescal", aliases: ["minas frescal", "queijo branco", "queijo minas"], kcal: 264, protein: 17.4, carbs: 3.2, fat: 20.2, fiber: 0 },
  { key: "requeijao light", aliases: ["requeijao"], kcal: 178, protein: 9.6, carbs: 3.4, fat: 14.0, fiber: 0 },
  { key: "queijo mussarela", aliases: ["mussarela", "muçarela", "queijo"], kcal: 280, protein: 25.0, carbs: 3.0, fat: 19.0, fiber: 0 },

  // ---------- Suplementos ----------
  { key: "whey protein concentrado", aliases: ["whey", "whey protein", "proteina em po", "whey isolado"], kcal: 400, protein: 76.0, carbs: 10.0, fat: 5.0, fiber: 0 },
  { key: "albumina", aliases: ["albumina"], kcal: 375, protein: 80.0, carbs: 5.0, fat: 1.0, fiber: 0 },
  { key: "caseina", aliases: ["caseina"], kcal: 380, protein: 78.0, carbs: 8.0, fat: 3.0, fiber: 0 },

  // ---------- Carboidratos ----------
  { key: "arroz branco cozido", aliases: ["arroz", "arroz branco"], kcal: 128, protein: 2.5, carbs: 28.1, fat: 0.2, fiber: 1.6 },
  { key: "arroz integral cozido", aliases: ["arroz integral"], kcal: 124, protein: 2.6, carbs: 25.8, fat: 1.0, fiber: 2.7 },
  { key: "feijao carioca cozido", aliases: ["feijao", "feijao carioca", "feijao preto"], kcal: 76, protein: 4.8, carbs: 13.6, fat: 0.5, fiber: 8.5 },
  { key: "lentilha cozida", aliases: ["lentilha"], kcal: 93, protein: 6.3, carbs: 16.3, fat: 0.5, fiber: 7.9 },
  { key: "grao de bico cozido", aliases: ["grao de bico"], kcal: 130, protein: 8.4, carbs: 16.7, fat: 2.1, fiber: 7.6 },
  { key: "batata doce cozida", aliases: ["batata doce"], kcal: 77, protein: 0.6, carbs: 18.4, fat: 0.1, fiber: 2.2 },
  { key: "batata inglesa cozida", aliases: ["batata", "batata inglesa", "pure de batata"], kcal: 52, protein: 1.2, carbs: 11.9, fat: 0, fiber: 1.3 },
  { key: "mandioca cozida", aliases: ["mandioca", "aipim", "macaxeira"], kcal: 125, protein: 0.6, carbs: 30.1, fat: 0.3, fiber: 1.6 },
  { key: "inhame cozido", aliases: ["inhame", "cara"], kcal: 97, protein: 2.1, carbs: 23.2, fat: 0.2, fiber: 1.7 },
  { key: "macarrao cozido", aliases: ["macarrao", "massa", "espaguete", "penne"], kcal: 158, protein: 5.8, carbs: 30.9, fat: 1.3, fiber: 1.6 },
  { key: "cuscuz de milho cozido", aliases: ["cuscuz", "cuscuz de milho"], kcal: 113, protein: 2.4, carbs: 25.3, fat: 0.5, fiber: 1.2 },
  { key: "tapioca goma hidratada", aliases: ["tapioca", "goma de tapioca"], kcal: 240, protein: 0.2, carbs: 59.0, fat: 0.1, fiber: 0.5 },
  { key: "aveia em flocos", aliases: ["aveia", "farelo de aveia"], kcal: 394, protein: 13.9, carbs: 66.6, fat: 8.5, fiber: 9.1 },
  { key: "granola tradicional", aliases: ["granola"], kcal: 471, protein: 9.0, carbs: 66.0, fat: 18.0, fiber: 7.0 },
  { key: "pao frances", aliases: ["pao frances", "pao de sal", "pao"], kcal: 300, protein: 8.0, carbs: 58.6, fat: 3.1, fiber: 2.3, unitGrams: 50 },
  { key: "pao integral de forma", aliases: ["pao integral", "pao de forma", "fatia de pao"], kcal: 253, protein: 9.4, carbs: 43.9, fat: 3.7, fiber: 6.9, unitGrams: 25 },
  { key: "torrada integral", aliases: ["torrada", "biscoito de arroz"], kcal: 380, protein: 11.0, carbs: 70.0, fat: 5.0, fiber: 5.0, unitGrams: 8 },
  { key: "milho verde cozido", aliases: ["milho", "milho verde"], kcal: 98, protein: 3.2, carbs: 19.0, fat: 1.0, fiber: 3.9 },
  { key: "quinoa cozida", aliases: ["quinoa"], kcal: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8 },
  { key: "farinha de mandioca", aliases: ["farofa", "farinha de mandioca"], kcal: 365, protein: 1.6, carbs: 87.9, fat: 0.3, fiber: 6.4 },

  // ---------- Frutas ----------
  { key: "banana prata", aliases: ["banana", "banana prata", "banana nanica"], kcal: 98, protein: 1.3, carbs: 26.0, fat: 0.1, fiber: 2.0, unitGrams: 70 },
  { key: "maca", aliases: ["maca", "maça"], kcal: 56, protein: 0.3, carbs: 15.2, fat: 0, fiber: 1.3, unitGrams: 130 },
  { key: "mamao formosa", aliases: ["mamao", "papaia"], kcal: 45, protein: 0.8, carbs: 11.6, fat: 0.1, fiber: 1.8 },
  { key: "laranja", aliases: ["laranja", "laranja pera"], kcal: 37, protein: 1.0, carbs: 8.9, fat: 0.1, fiber: 0.8, unitGrams: 180 },
  { key: "morango", aliases: ["morango", "morangos"], kcal: 30, protein: 0.9, carbs: 6.8, fat: 0.3, fiber: 1.7 },
  { key: "abacaxi", aliases: ["abacaxi"], kcal: 48, protein: 0.9, carbs: 12.3, fat: 0.1, fiber: 1.0 },
  { key: "melancia", aliases: ["melancia"], kcal: 33, protein: 0.9, carbs: 8.1, fat: 0, fiber: 0.1 },
  { key: "manga", aliases: ["manga"], kcal: 64, protein: 0.4, carbs: 16.7, fat: 0.2, fiber: 1.6 },
  { key: "uva", aliases: ["uva", "uvas"], kcal: 49, protein: 0.6, carbs: 13.6, fat: 0.2, fiber: 0.9 },
  { key: "abacate", aliases: ["abacate"], kcal: 96, protein: 1.2, carbs: 6.0, fat: 8.4, fiber: 6.3 },
  { key: "kiwi", aliases: ["kiwi"], kcal: 51, protein: 1.3, carbs: 11.5, fat: 0.6, fiber: 2.7, unitGrams: 80 },
  { key: "pera", aliases: ["pera"], kcal: 53, protein: 0.6, carbs: 14.0, fat: 0.1, fiber: 3.0, unitGrams: 130 },

  // ---------- Vegetais ----------
  { key: "brocolis cozido", aliases: ["brocolis"], kcal: 25, protein: 2.1, carbs: 4.4, fat: 0.5, fiber: 3.4 },
  { key: "couve refogada", aliases: ["couve"], kcal: 90, protein: 1.7, carbs: 4.8, fat: 7.2, fiber: 3.1 },
  { key: "abobrinha cozida", aliases: ["abobrinha"], kcal: 19, protein: 1.1, carbs: 3.0, fat: 0.2, fiber: 1.5 },
  { key: "cenoura crua", aliases: ["cenoura"], kcal: 34, protein: 1.3, carbs: 7.7, fat: 0.2, fiber: 3.2 },
  { key: "tomate", aliases: ["tomate"], kcal: 15, protein: 1.1, carbs: 3.1, fat: 0.2, fiber: 1.2 },
  { key: "alface", aliases: ["alface", "salada verde", "salada"], kcal: 15, protein: 1.3, carbs: 2.4, fat: 0.2, fiber: 1.8 },
  { key: "pepino", aliases: ["pepino"], kcal: 10, protein: 0.9, carbs: 2.0, fat: 0, fiber: 1.1 },
  { key: "beterraba cozida", aliases: ["beterraba"], kcal: 32, protein: 1.3, carbs: 7.2, fat: 0.1, fiber: 1.9 },
  { key: "chuchu cozido", aliases: ["chuchu"], kcal: 19, protein: 0.4, carbs: 4.8, fat: 0.1, fiber: 1.0 },
  { key: "vagem cozida", aliases: ["vagem"], kcal: 25, protein: 1.8, carbs: 5.0, fat: 0.2, fiber: 2.4 },
  { key: "espinafre refogado", aliases: ["espinafre"], kcal: 26, protein: 2.7, carbs: 2.8, fat: 0.9, fiber: 2.1 },

  // ---------- Gorduras / oleaginosas ----------
  { key: "azeite de oliva", aliases: ["azeite", "oleo de oliva"], kcal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { key: "oleo de soja", aliases: ["oleo", "oleo vegetal"], kcal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { key: "castanha do para", aliases: ["castanha do para", "castanha do brasil"], kcal: 643, protein: 14.5, carbs: 15.1, fat: 63.5, fiber: 7.9, unitGrams: 5 },
  { key: "castanha de caju", aliases: ["castanha de caju", "caju torrado"], kcal: 570, protein: 18.5, carbs: 29.1, fat: 46.3, fiber: 3.7 },
  { key: "amendoim torrado", aliases: ["amendoim"], kcal: 544, protein: 27.2, carbs: 20.3, fat: 43.9, fiber: 8.0 },
  { key: "pasta de amendoim integral", aliases: ["pasta de amendoim"], kcal: 588, protein: 25.0, carbs: 20.0, fat: 50.0, fiber: 6.0 },
  { key: "amendoas", aliases: ["amendoa", "amendoas"], kcal: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5 },
  { key: "nozes", aliases: ["noz", "nozes"], kcal: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7 },
  { key: "chia", aliases: ["chia", "semente de chia"], kcal: 486, protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4 },
  { key: "linhaca", aliases: ["linhaca"], kcal: 495, protein: 14.1, carbs: 43.3, fat: 32.3, fiber: 33.5 },
  { key: "manteiga", aliases: ["manteiga"], kcal: 717, protein: 0.9, carbs: 0.1, fat: 81.1, fiber: 0 },

  // ---------- Diversos / zero ----------
  { key: "gelatina zero", aliases: ["gelatina zero", "gelatina diet", "gelatina"], kcal: 8, protein: 1.2, carbs: 0.5, fat: 0, fiber: 0 },
  { key: "cafe sem acucar", aliases: ["cafe", "cafe preto"], kcal: 2, protein: 0.1, carbs: 0.3, fat: 0, fiber: 0 },
  { key: "cha sem acucar", aliases: ["cha", "cha verde"], kcal: 1, protein: 0, carbs: 0.2, fat: 0, fiber: 0 },
  { key: "agua de coco", aliases: ["agua de coco"], kcal: 22, protein: 0.3, carbs: 5.3, fat: 0, fiber: 0.1 },
  { key: "mel", aliases: ["mel"], kcal: 309, protein: 0, carbs: 84.0, fat: 0, fiber: 0 },
  { key: "acucar refinado", aliases: ["acucar"], kcal: 387, protein: 0, carbs: 99.5, fat: 0, fiber: 0 },
  { key: "chocolate 70%", aliases: ["chocolate amargo", "chocolate 70"], kcal: 579, protein: 7.8, carbs: 45.9, fat: 41.1, fiber: 10.9 },
  // Adições baseadas em referências de cardápios reais do método
  { key: "biscoito de arroz", aliases: ["biscoito de arroz integral"], kcal: 387, protein: 8.2, carbs: 82.0, fat: 2.8, fiber: 3.0, unitGrams: 8 },
  { key: "patinho moido magro", aliases: ["patinho moido", "patinho"], kcal: 219, protein: 35.9, carbs: 0, fat: 7.3, fiber: 0 },
  { key: "peito de frango desfiado", aliases: ["frango desfiado"], kcal: 163, protein: 31.5, carbs: 0, fat: 3.6, fiber: 0 },
];

const strip = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOPWORDS = new Set([
  "de", "do", "da", "dos", "das", "com", "sem", "e", "a", "o", "em", "ao",
  "grelhado", "grelhada", "cozido", "cozida", "assado", "assada", "cru", "crua",
  "refogado", "refogada", "natural", "light", "diet", "zero", "picado", "fatiado",
  "temperado", "temperada", "no", "na", "vapor", "sopa", "colher", "colheres",
]);

/** Encontra o alimento de referência mais próximo na tabela TACO/TBCA. */
export function findFoodRef(name: string): FoodRef | null {
  const n = strip(name);
  if (!n) return null;
  let best: { ref: FoodRef; score: number } | null = null;

  for (const ref of TACO_TABLE) {
    for (const alias of [ref.key, ...ref.aliases]) {
      const a = strip(alias);
      if (!a) continue;
      let score = 0;
      if (n === a) score = 100;
      else if (n.includes(a)) score = 60 + a.length;
      else if (a.includes(n) && n.length >= 4) score = 50 + n.length;
      else {
        const at = a.split(" ").filter((t) => t.length > 2 && !STOPWORDS.has(t));
        const nt = n.split(" ").filter((t) => t.length > 2 && !STOPWORDS.has(t));
        if (at.length && nt.length) {
          const hits = at.filter((t) => nt.includes(t)).length;
          if (hits === at.length) score = 40 + hits * 3;
        }
      }
      if (score > 0 && (!best || score > best.score)) best = { ref, score };
    }
  }
  return best && best.score >= 40 ? best.ref : null;
}

export type ParsedQty = { grams: number; basis: "g" | "ml" | "unidade" } | null;

const UNIT_WORDS = /(unidades?|unid\.?|un\.?|ovos?|claras?|fatias?|colheres?|colher|scoops?|scoop|filés?|files?|filé|file|posta|postas|pães|paes|pao|pão)/i;

/** Converte a quantidade textual em gramas usando o peso médio da unidade quando necessário. */
export function parseQuantityToGrams(quantity: string, ref: FoodRef | null): ParsedQty {
  const q = (quantity || "").toLowerCase().replace(",", ".");
  if (!q) return null;

  const gm = q.match(/(\d+(?:\.\d+)?)\s*(g|gramas?|gr)\b/);
  if (gm) return { grams: parseFloat(gm[1]), basis: "g" };

  const ml = q.match(/(\d+(?:\.\d+)?)\s*(ml|mililitros?)\b/);
  if (ml) return { grams: parseFloat(ml[1]), basis: "ml" };

  const num = q.match(/(\d+(?:\.\d+)?)/);
  if (num && UNIT_WORDS.test(q)) {
    const count = parseFloat(num[1]);
    // colher de sopa ~ 10 g (15 g para líquidos/pastas), scoop de whey ~ 30 g
    if (/scoops?/.test(q)) return { grams: count * 30, basis: "unidade" };
    if (/colher/.test(q)) return { grams: count * (/(azeite|oleo|pasta|mel)/.test(q) ? 12 : 10), basis: "unidade" };
    if (ref?.unitGrams) return { grams: count * ref.unitGrams, basis: "unidade" };
    return null;
  }
  return null;
}

export type RefMacros = { energy_kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number };

export function macrosForGrams(ref: FoodRef, grams: number): RefMacros {
  const f = grams / 100;
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return {
    energy_kcal: Math.round(ref.kcal * f),
    protein_g: round1(ref.protein * f),
    carbs_g: round1(ref.carbs * f),
    fat_g: round1(ref.fat * f),
    fiber_g: round1(ref.fiber * f),
  };
}
