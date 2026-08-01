// STH METHOD — cálculo determinístico de kcal/macros do cardápio.
// Metodologia: os valores da refeição são calculados SOBRE A REFEIÇÃO BASE,
// item a item, com tabela TACO/TBCA (valores por 100g/100ml).
// Isso substitui a estimativa da IA, que não é confiável para números.

type Macro = { kcal: number; p: number; c: number; f: number };

// chave normalizada (sem acento, minúscula) -> valores por 100 g/ml
const TABLE: Array<[string, Macro]> = [
  // cereais, pães, massas, tubérculos
  ["arroz branco", { kcal: 128, p: 2.5, c: 28.1, f: 0.2 }],
  ["arroz integral", { kcal: 124, p: 2.6, c: 25.8, f: 1.0 }],
  ["arroz parboilizado", { kcal: 131, p: 2.5, c: 28.6, f: 0.3 }],
  ["macarrao integral", { kcal: 142, p: 5.3, c: 27.4, f: 1.5 }],
  ["macarrao", { kcal: 158, p: 5.8, c: 30.9, f: 1.3 }],
  ["cuscuz", { kcal: 113, p: 2.3, c: 25.0, f: 0.4 }],
  ["quinoa", { kcal: 120, p: 4.4, c: 21.3, f: 1.9 }],
  ["aveia", { kcal: 394, p: 13.9, c: 66.6, f: 8.5 }],
  ["farelo de aveia", { kcal: 366, p: 14.0, c: 60.0, f: 7.0 }],
  ["granola", { kcal: 471, p: 11.5, c: 65.0, f: 18.0 }],
  ["tapioca pronta", { kcal: 240, p: 0, c: 60.0, f: 0 }],
  ["tapioca seca", { kcal: 350, p: 0.3, c: 87.0, f: 0.1 }],
  ["goma de tapioca", { kcal: 240, p: 0, c: 60.0, f: 0 }],
  ["tapioca", { kcal: 240, p: 0, c: 60.0, f: 0 }],
  ["pao integral", { kcal: 253, p: 9.4, c: 49.7, f: 3.0 }],
  ["pao de forma", { kcal: 273, p: 9.3, c: 50.4, f: 3.4 }],
  ["pao frances", { kcal: 300, p: 8.0, c: 58.6, f: 3.1 }],
  ["pao", { kcal: 273, p: 9.3, c: 50.4, f: 3.4 }],
  ["batata-doce", { kcal: 77, p: 0.6, c: 18.4, f: 0.1 }],
  ["batata doce", { kcal: 77, p: 0.6, c: 18.4, f: 0.1 }],
  ["batata-inglesa", { kcal: 52, p: 1.2, c: 11.9, f: 0.1 }],
  ["batata inglesa", { kcal: 52, p: 1.2, c: 11.9, f: 0.1 }],
  ["batata", { kcal: 52, p: 1.2, c: 11.9, f: 0.1 }],
  ["mandioca", { kcal: 125, p: 0.6, c: 30.1, f: 0.3 }],
  ["inhame", { kcal: 97, p: 2.1, c: 23.2, f: 0.2 }],
  ["milho", { kcal: 98, p: 3.2, c: 20.0, f: 1.0 }],
  ["farinha de mandioca", { kcal: 361, p: 1.2, c: 87.9, f: 0.3 }],

  // proteínas animais
  ["peito de frango", { kcal: 159, p: 32.0, c: 0, f: 3.0 }],
  ["frango grelhado", { kcal: 159, p: 32.0, c: 0, f: 3.0 }],
  ["frango desfiado", { kcal: 165, p: 31.0, c: 0, f: 4.0 }],
  ["frango", { kcal: 159, p: 32.0, c: 0, f: 3.0 }],
  ["patinho", { kcal: 212, p: 27.4, c: 0, f: 11.4 }],
  ["coxao mole", { kcal: 219, p: 32.4, c: 0, f: 9.4 }],
  ["alcatra", { kcal: 220, p: 35.0, c: 0, f: 8.5 }],
  ["file mignon", { kcal: 220, p: 32.0, c: 0, f: 9.5 }],
  ["carne moida", { kcal: 212, p: 27.4, c: 0, f: 11.4 }],
  ["lombo suino", { kcal: 210, p: 29.0, c: 0, f: 10.0 }],
  ["tilapia", { kcal: 128, p: 26.2, c: 0, f: 1.7 }],
  ["salmao", { kcal: 208, p: 22.5, c: 0, f: 12.4 }],
  ["merluza", { kcal: 113, p: 24.0, c: 0, f: 1.3 }],
  ["pescada", { kcal: 110, p: 23.0, c: 0, f: 1.5 }],
  ["atum", { kcal: 116, p: 26.0, c: 0, f: 1.0 }],
  ["sardinha", { kcal: 208, p: 24.6, c: 0, f: 11.5 }],
  ["camarao", { kcal: 90, p: 19.0, c: 0, f: 1.2 }],
  ["peito de peru", { kcal: 110, p: 18.0, c: 2.0, f: 3.0 }],
  ["ovo", { kcal: 146, p: 13.3, c: 0.6, f: 9.5 }],
  ["clara", { kcal: 52, p: 11.0, c: 0.7, f: 0.2 }],
  ["gema", { kcal: 354, p: 16.0, c: 0.6, f: 31.9 }],

  // laticínios e suplementos
  ["iogurte grego", { kcal: 60, p: 9.0, c: 4.0, f: 0.5 }],
  ["iogurte natural integral", { kcal: 61, p: 3.5, c: 4.7, f: 3.3 }],
  ["iogurte natural desnatado", { kcal: 41, p: 4.1, c: 4.9, f: 0.2 }],
  ["iogurte", { kcal: 61, p: 3.5, c: 4.7, f: 3.3 }],
  ["leite integral", { kcal: 61, p: 3.2, c: 4.7, f: 3.3 }],
  ["leite desnatado", { kcal: 35, p: 3.4, c: 4.9, f: 0.1 }],
  ["leite", { kcal: 61, p: 3.2, c: 4.7, f: 3.3 }],
  ["queijo minas frescal", { kcal: 264, p: 17.4, c: 3.2, f: 20.2 }],
  ["queijo cottage", { kcal: 98, p: 11.0, c: 3.4, f: 4.3 }],
  ["cottage", { kcal: 98, p: 11.0, c: 3.4, f: 4.3 }],
  ["requeijao", { kcal: 257, p: 9.6, c: 3.0, f: 23.0 }],
  ["queijo", { kcal: 264, p: 17.4, c: 3.2, f: 20.2 }],
  ["whey", { kcal: 380, p: 78.0, c: 8.0, f: 4.0 }],
  ["albumina", { kcal: 375, p: 80.0, c: 6.0, f: 1.0 }],

  // leguminosas
  ["feijao", { kcal: 76, p: 4.8, c: 13.6, f: 0.5 }],
  ["lentilha", { kcal: 93, p: 6.3, c: 16.3, f: 0.5 }],
  ["grao-de-bico", { kcal: 121, p: 6.5, c: 20.0, f: 2.1 }],
  ["grao de bico", { kcal: 121, p: 6.5, c: 20.0, f: 2.1 }],
  ["ervilha", { kcal: 81, p: 5.4, c: 14.5, f: 0.4 }],
  ["soja", { kcal: 141, p: 12.5, c: 9.9, f: 6.0 }],

  // gorduras e oleaginosas
  ["azeite", { kcal: 884, p: 0, c: 0, f: 100 }],
  ["oleo", { kcal: 884, p: 0, c: 0, f: 100 }],
  ["manteiga", { kcal: 726, p: 0.4, c: 0.1, f: 82.4 }],
  ["pasta de amendoim", { kcal: 588, p: 25.0, c: 20.0, f: 50.0 }],
  ["amendoim", { kcal: 544, p: 27.2, c: 20.3, f: 43.9 }],
  ["castanha", { kcal: 643, p: 14.7, c: 12.1, f: 60.0 }],
  ["nozes", { kcal: 654, p: 15.2, c: 13.7, f: 65.2 }],
  ["amendoas", { kcal: 579, p: 21.2, c: 21.6, f: 49.9 }],
  ["abacate", { kcal: 160, p: 2.0, c: 8.5, f: 14.7 }],
  ["chia", { kcal: 486, p: 16.5, c: 42.1, f: 30.7 }],
  ["linhaca", { kcal: 495, p: 14.1, c: 43.3, f: 32.3 }],

  // frutas e doces naturais
  ["banana", { kcal: 92, p: 1.3, c: 23.8, f: 0.1 }],
  ["mamao", { kcal: 40, p: 0.5, c: 10.4, f: 0.1 }],
  ["maca", { kcal: 56, p: 0.3, c: 15.2, f: 0 }],
  ["laranja", { kcal: 45, p: 1.0, c: 11.5, f: 0.1 }],
  ["abacaxi", { kcal: 48, p: 0.9, c: 12.3, f: 0.1 }],
  ["manga", { kcal: 64, p: 0.4, c: 16.7, f: 0.2 }],
  ["melao", { kcal: 29, p: 0.7, c: 7.5, f: 0 }],
  ["melancia", { kcal: 33, p: 0.9, c: 8.1, f: 0 }],
  ["morango", { kcal: 30, p: 0.9, c: 6.8, f: 0.3 }],
  ["uva", { kcal: 53, p: 0.7, c: 13.6, f: 0.2 }],
  ["pera", { kcal: 53, p: 0.6, c: 14.0, f: 0.1 }],
  ["kiwi", { kcal: 51, p: 1.3, c: 11.5, f: 0.6 }],
  ["mel", { kcal: 309, p: 0, c: 84.0, f: 0 }],
  ["acai", { kcal: 58, p: 0.8, c: 6.2, f: 3.9 }],

  // vegetais / genéricos
  ["salada", { kcal: 20, p: 1.3, c: 3.5, f: 0.2 }],
  ["legumes", { kcal: 35, p: 1.8, c: 7.0, f: 0.3 }],
  ["verduras", { kcal: 20, p: 1.3, c: 3.5, f: 0.2 }],
  ["brocolis", { kcal: 25, p: 2.1, c: 4.4, f: 0.5 }],
  ["cenoura", { kcal: 34, p: 1.3, c: 7.7, f: 0.2 }],
  ["abobrinha", { kcal: 19, p: 1.1, c: 4.3, f: 0.1 }],
  ["tomate", { kcal: 15, p: 1.1, c: 3.1, f: 0.2 }],
  ["molho de tomate", { kcal: 38, p: 1.5, c: 7.0, f: 0.5 }],
  ["couve", { kcal: 27, p: 2.9, c: 4.3, f: 0.5 }],
];

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function lookup(item: string): Macro | null {
  const n = norm(item);
  let best: { key: string; macro: Macro } | null = null;
  for (const [key, macro] of TABLE) {
    if (n.includes(key) && (!best || key.length > best.key.length)) best = { key, macro };
  }
  return best?.macro ?? null;
}

/** Extrai a quantidade em g/ml de um item textual do cardápio. */
function grams(item: string): number | null {
  const n = norm(item);
  const paren = n.match(/\((\d+(?:[.,]\d+)?)\s*(g|ml)\)/);
  if (paren) return parseFloat(paren[1].replace(",", "."));
  const direct = n.match(/(\d+(?:[.,]\d+)?)\s*(g|ml)\b/);
  if (direct) return parseFloat(direct[1].replace(",", "."));
  // unidades: "2 ovos", "1 fatia"
  const unit = n.match(/^(\d+(?:[.,]\d+)?)\s+(ovos?|unidades?|fatias?|colheres?|colher)/);
  if (unit) {
    const qty = parseFloat(unit[1].replace(",", "."));
    if (/ovo/.test(unit[2])) return qty * 50;
    if (/fatia/.test(unit[2])) return qty * 25;
    if (/colher/.test(unit[2])) return qty * 15;
    return qty * 100;
  }
  return null;
}

export function computeBaseMacros(baseText: string): { macro: Macro; coverage: number } {
  const items = baseText
    .replace(/\.$/, "")
    .split(/\s\+\s|,\s(?=\d)/)
    .map((i) => i.trim())
    .filter(Boolean);
  let matched = 0;
  const total: Macro = { kcal: 0, p: 0, c: 0, f: 0 };
  for (const item of items) {
    const g = grams(item);
    const food = lookup(item);
    if (!g || !food) continue;
    matched++;
    const k = g / 100;
    total.p += food.p * k;
    total.c += food.c * k;
    total.f += food.f * k;
  }
  // Coerência energética (Atwater): as kcal exibidas devem bater exatamente
  // com os macros exibidos — 4 kcal/g proteína e carboidrato, 9 kcal/g gordura.
  total.p = Math.round(total.p);
  total.c = Math.round(total.c);
  total.f = Math.round(total.f);
  total.kcal = total.p * 4 + total.c * 4 + total.f * 9;
  return { macro: total, coverage: items.length ? matched / items.length : 0 };
}

const MEAL_BLOCK_RE =
  /(<p><strong>Refei[çc][ãa]o\s*\d+[^<]*?)(\d[\d.]*)\s*kcal\s*·\s*P\s*(\d+)\s*g\s*\/\s*C\s*(\d+)\s*g\s*\/\s*G\s*(\d+)\s*g(<\/strong><\/p>\s*<p><strong>"?\s*⭐?\s*BASE:<\/strong>\s*)([^<]+)/gi;

/**
 * Recalcula, no HTML gerado pela IA, as kcal e macros de cada refeição a partir
 * da refeição BASE. Mantém o texto intacto quando não há cobertura suficiente.
 */
export function recalcDietMacros(html: string): { html: string; totals: Macro; recalculated: number } {
  const totals: Macro = { kcal: 0, p: 0, c: 0, f: 0 };
  let recalculated = 0;
  const out = html.replace(MEAL_BLOCK_RE, (full, head, kcal, p, c, f, mid, baseText) => {
    const { macro, coverage } = computeBaseMacros(String(baseText));
    if (coverage < 0.7 || macro.kcal <= 0) {
      totals.kcal += Number(String(kcal).replace(/\./g, ""));
      totals.p += Number(p);
      totals.c += Number(c);
      totals.f += Number(f);
      return full;
    }
    recalculated++;
    const r = {
      kcal: Math.round(macro.kcal),
      p: Math.round(macro.p),
      c: Math.round(macro.c),
      f: Math.round(macro.f),
    };
    totals.kcal += r.kcal;
    totals.p += r.p;
    totals.c += r.c;
    totals.f += r.f;
    return `${head}${r.kcal} kcal · P ${r.p}g / C ${r.c}g / G ${r.f}g${mid}${baseText}`;
  });
  return { html: out, totals, recalculated };
}
