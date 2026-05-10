// Porções comuns brasileiras com conversão para gramas/ml.
// Usado no Diário Alimentar para preencher rapidamente a quantidade
// (scoop, fatia, colher, unidade, copo, etc.).

export type PortionPreset = {
  label: string;     // "1 fatia (25g)"
  grams: number;     // valor numérico que vai para o campo quantidade
  unit?: "g" | "ml"; // unidade alvo (default = "g")
};

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

type Rule = { test: (n: string) => boolean; presets: PortionPreset[] };

const has = (...keys: string[]) => (n: string) => keys.every((k) => n.includes(k));
const any = (...keys: string[]) => (n: string) => keys.some((k) => n.includes(k));

// Ordem importa: regras mais específicas primeiro.
const RULES: Rule[] = [
  // ===== Suplementos em pó =====
  {
    test: any("whey", "albumina", "caseina", "proteina em po", "proteina  em po"),
    presets: [
      { label: "1 scoop (30g)", grams: 30 },
      { label: "2 scoops (60g)", grams: 60 },
      { label: "½ scoop (15g)", grams: 15 },
    ],
  },
  // ===== Pães =====
  { test: has("pao de forma"), presets: [
      { label: "1 fatia (25g)", grams: 25 },
      { label: "2 fatias (50g)", grams: 50 },
    ]},
  { test: has("pao frances"), presets: [
      { label: "1 unidade (50g)", grams: 50 },
      { label: "½ unidade (25g)", grams: 25 },
    ]},
  { test: has("pao sirio"), presets: [{ label: "1 unidade (60g)", grams: 60 }]},
  { test: has("pao de queijo"), presets: [
      { label: "1 unidade (20g)", grams: 20 },
      { label: "3 unidades (60g)", grams: 60 },
    ]},
  { test: has("tapioca"), presets: [
      { label: "1 unidade pequena (60g)", grams: 60 },
      { label: "1 unidade média (100g)", grams: 100 },
    ]},
  { test: any("biscoito cream cracker", "cream cracker"), presets: [
      { label: "1 unidade (8g)", grams: 8 },
      { label: "5 unidades (40g)", grams: 40 },
    ]},
  // ===== Cereais / grãos =====
  { test: has("arroz"), presets: [
      { label: "1 colher de servir (45g)", grams: 45 },
      { label: "1 escumadeira (80g)", grams: 80 },
      { label: "1 prato (150g)", grams: 150 },
    ]},
  { test: has("feijao"), presets: [
      { label: "1 concha pequena (60g)", grams: 60 },
      { label: "1 concha (80g)", grams: 80 },
    ]},
  { test: has("lentilha"), presets: [{ label: "1 concha (80g)", grams: 80 }]},
  { test: has("grao de bico"), presets: [{ label: "1 concha (80g)", grams: 80 }]},
  { test: has("macarrao"), presets: [
      { label: "1 pegador (80g)", grams: 80 },
      { label: "1 prato (200g)", grams: 200 },
    ]},
  { test: has("aveia"), presets: [
      { label: "1 colher de sopa (15g)", grams: 15 },
      { label: "2 colheres de sopa (30g)", grams: 30 },
      { label: "3 colheres de sopa (45g)", grams: 45 },
    ]},
  { test: has("granola"), presets: [
      { label: "1 colher de sopa (15g)", grams: 15 },
      { label: "3 colheres (45g)", grams: 45 },
    ]},
  { test: any("chia", "linhaca"), presets: [
      { label: "1 colher de sopa (10g)", grams: 10 },
      { label: "1 colher de chá (3g)", grams: 3 },
    ]},
  { test: has("cuscuz"), presets: [{ label: "1 pegador (80g)", grams: 80 }]},
  { test: has("quinoa"), presets: [{ label: "1 colher de servir (45g)", grams: 45 }]},

  // ===== Ovos =====
  { test: has("clara"), presets: [
      { label: "1 clara (33g)", grams: 33 },
      { label: "3 claras (100g)", grams: 100 },
    ]},
  { test: has("gema"), presets: [{ label: "1 gema (17g)", grams: 17 }]},
  { test: has("ovo"), presets: [
      { label: "1 unidade (50g)", grams: 50 },
      { label: "2 unidades (100g)", grams: 100 },
      { label: "3 unidades (150g)", grams: 150 },
    ]},

  // ===== Carnes / embutidos =====
  { test: any("file mignon", "patinho", "alcatra", "coxao mole", "contrafile", "maminha", "picanha", "acem"),
    presets: [
      { label: "Bife pequeno (100g)", grams: 100 },
      { label: "Bife médio (150g)", grams: 150 },
      { label: "Bife grande (200g)", grams: 200 },
    ]},
  { test: has("peito de frango"), presets: [
      { label: "Filé pequeno (100g)", grams: 100 },
      { label: "Filé médio (150g)", grams: 150 },
      { label: "Filé grande (200g)", grams: 200 },
    ]},
  { test: any("coxa", "sobrecoxa"), presets: [{ label: "1 unidade (80g)", grams: 80 }]},
  { test: has("bacon"), presets: [{ label: "1 fatia (8g)", grams: 8 }]},
  { test: has("linguica"), presets: [{ label: "1 unidade (60g)", grams: 60 }]},
  { test: has("salsicha"), presets: [{ label: "1 unidade (50g)", grams: 50 }]},
  { test: has("hamburguer"), presets: [{ label: "1 unidade (80g)", grams: 80 }]},
  { test: any("presunto", "peito de peru", "mortadela", "salame"),
    presets: [
      { label: "1 fatia (15g)", grams: 15 },
      { label: "3 fatias (45g)", grams: 45 },
    ]},
  { test: any("salmao", "tilapia", "merluza", "pescada", "bacalhau"),
    presets: [
      { label: "Filé pequeno (100g)", grams: 100 },
      { label: "Filé médio (150g)", grams: 150 },
    ]},
  { test: any("atum em conserva", "sardinha"),
    presets: [{ label: "1 lata escorrida (120g)", grams: 120 }]},

  // ===== Laticínios =====
  { test: any("queijo mussarela", "queijo prato", "queijo minas"),
    presets: [
      { label: "1 fatia (20g)", grams: 20 },
      { label: "2 fatias (40g)", grams: 40 },
    ]},
  { test: has("queijo cottage"), presets: [{ label: "1 colher de sopa (30g)", grams: 30 }]},
  { test: has("ricota"), presets: [
      { label: "1 fatia (30g)", grams: 30 },
      { label: "1 colher de sopa (20g)", grams: 20 },
    ]},
  { test: has("parmesao"), presets: [{ label: "1 colher de sopa (5g)", grams: 5 }]},
  { test: has("requeijao"), presets: [
      { label: "1 colher de sopa (30g)", grams: 30 },
      { label: "1 colher de chá (10g)", grams: 10 },
    ]},
  { test: has("cream cheese"), presets: [{ label: "1 colher de sopa (30g)", grams: 30 }]},
  { test: any("manteiga", "margarina"),
    presets: [
      { label: "1 colher de chá (5g)", grams: 5 },
      { label: "1 colher de sopa (15g)", grams: 15 },
    ]},
  { test: has("iogurte grego"), presets: [
      { label: "1 pote (130g)", grams: 130 },
      { label: "½ pote (65g)", grams: 65 },
    ]},
  { test: has("iogurte"), presets: [
      { label: "1 pote (170g)", grams: 170 },
      { label: "1 copo (200g)", grams: 200 },
    ]},
  { test: has("leite"), presets: [
      { label: "1 copo americano (200ml)", grams: 200, unit: "ml" },
      { label: "1 xícara (240ml)", grams: 240, unit: "ml" },
      { label: "½ copo (100ml)", grams: 100, unit: "ml" },
    ]},

  // ===== Frutas =====
  { test: has("banana nanica"), presets: [{ label: "1 unidade (100g)", grams: 100 }]},
  { test: has("banana prata"), presets: [{ label: "1 unidade (70g)", grams: 70 }]},
  { test: has("banana"), presets: [{ label: "1 unidade (90g)", grams: 90 }]},
  { test: has("maca"), presets: [{ label: "1 unidade média (130g)", grams: 130 }]},
  { test: has("pera"), presets: [{ label: "1 unidade (130g)", grams: 130 }]},
  { test: has("mamao papaia"), presets: [{ label: "½ unidade (150g)", grams: 150 }]},
  { test: has("mamao formosa"), presets: [{ label: "1 fatia (170g)", grams: 170 }]},
  { test: has("laranja"), presets: [{ label: "1 unidade (130g)", grams: 130 }]},
  { test: has("tangerina"), presets: [{ label: "1 unidade (90g)", grams: 90 }]},
  { test: has("limao"), presets: [{ label: "1 unidade (60g)", grams: 60 }]},
  { test: has("abacaxi"), presets: [{ label: "1 fatia (80g)", grams: 80 }]},
  { test: has("manga"), presets: [{ label: "1 unidade (200g)", grams: 200 }]},
  { test: has("melancia"), presets: [{ label: "1 fatia (200g)", grams: 200 }]},
  { test: has("melao"), presets: [{ label: "1 fatia (150g)", grams: 150 }]},
  { test: has("morango"), presets: [
      { label: "1 unidade (12g)", grams: 12 },
      { label: "1 xícara (150g)", grams: 150 },
    ]},
  { test: has("uva"), presets: [{ label: "1 cacho pequeno (100g)", grams: 100 }]},
  { test: has("kiwi"), presets: [{ label: "1 unidade (70g)", grams: 70 }]},
  { test: has("abacate"), presets: [
      { label: "½ unidade (100g)", grams: 100 },
      { label: "1 colher de sopa (30g)", grams: 30 },
    ]},
  { test: has("goiaba"), presets: [{ label: "1 unidade (150g)", grams: 150 }]},
  { test: has("pessego"), presets: [{ label: "1 unidade (80g)", grams: 80 }]},
  { test: has("ameixa"), presets: [{ label: "1 unidade (30g)", grams: 30 }]},
  { test: has("acai"), presets: [{ label: "1 tigela (200g)", grams: 200 }]},
  { test: has("coco fresco"), presets: [{ label: "1 fatia (30g)", grams: 30 }]},

  // ===== Tubérculos =====
  { test: has("batata inglesa"), presets: [
      { label: "1 unidade média (150g)", grams: 150 },
      { label: "1 unidade pequena (80g)", grams: 80 },
    ]},
  { test: has("batata-doce"), presets: [
      { label: "1 unidade média (200g)", grams: 200 },
      { label: "1 unidade pequena (100g)", grams: 100 },
    ]},
  { test: has("mandioca"), presets: [{ label: "1 pedaço (80g)", grams: 80 }]},
  { test: any("inhame", "cara"), presets: [{ label: "1 pedaço (100g)", grams: 100 }]},
  { test: has("milho verde"), presets: [{ label: "1 colher de sopa (20g)", grams: 20 }]},
  { test: has("abobora"), presets: [{ label: "1 colher de servir (60g)", grams: 60 }]},

  // ===== Vegetais / saladas =====
  { test: any("alface", "rucula", "espinafre cru"),
    presets: [
      { label: "1 prato sobremesa (40g)", grams: 40 },
      { label: "1 prato (80g)", grams: 80 },
    ]},
  { test: any("brocolis", "couve-flor", "couve flor", "couve"),
    presets: [{ label: "1 colher de servir (50g)", grams: 50 }]},
  { test: has("tomate"), presets: [
      { label: "1 unidade (90g)", grams: 90 },
      { label: "1 fatia (15g)", grams: 15 },
    ]},
  { test: has("pepino"), presets: [{ label: "½ unidade (100g)", grams: 100 }]},
  { test: has("cenoura"), presets: [
      { label: "1 unidade média (80g)", grams: 80 },
      { label: "1 colher de servir (40g)", grams: 40 },
    ]},
  { test: has("beterraba"), presets: [{ label: "1 unidade média (100g)", grams: 100 }]},
  { test: has("cebola"), presets: [{ label: "1 unidade média (100g)", grams: 100 }]},

  // ===== Oleaginosas / sementes =====
  { test: has("castanha do para"), presets: [
      { label: "1 unidade (5g)", grams: 5 },
      { label: "3 unidades (15g)", grams: 15 },
    ]},
  { test: has("castanha de caju"), presets: [
      { label: "1 punhado (30g)", grams: 30 },
      { label: "5 unidades (8g)", grams: 8 },
    ]},
  { test: has("amendoim"), presets: [{ label: "1 punhado (30g)", grams: 30 }]},
  { test: has("pasta de amendoim"), presets: [
      { label: "1 colher de sopa (15g)", grams: 15 },
      { label: "1 colher de chá (5g)", grams: 5 },
    ]},
  { test: any("amendoa", "noz", "avela", "pistache"),
    presets: [{ label: "1 punhado (30g)", grams: 30 }]},

  // ===== Óleos / azeite =====
  { test: any("azeite", "oleo de"),
    presets: [
      { label: "1 colher de chá (5ml)", grams: 5, unit: "ml" },
      { label: "1 colher de sopa (15ml)", grams: 15, unit: "ml" },
      { label: "Fio (3ml)", grams: 3, unit: "ml" },
    ]},

  // ===== Doces / açúcar =====
  { test: has("acucar"), presets: [
      { label: "1 colher de chá (5g)", grams: 5 },
      { label: "1 colher de sopa (12g)", grams: 12 },
    ]},
  { test: has("mel"), presets: [
      { label: "1 colher de chá (7g)", grams: 7 },
      { label: "1 colher de sopa (21g)", grams: 21 },
    ]},
  { test: has("chocolate"), presets: [
      { label: "1 quadradinho (5g)", grams: 5 },
      { label: "1 barra (25g)", grams: 25 },
    ]},
  { test: has("brigadeiro"), presets: [{ label: "1 unidade (20g)", grams: 20 }]},
  { test: has("doce de leite"), presets: [{ label: "1 colher de sopa (20g)", grams: 20 }]},
  { test: has("geleia"), presets: [{ label: "1 colher de sopa (15g)", grams: 15 }]},

  // ===== Bebidas =====
  { test: any("suco", "agua de coco", "leite de amendoa", "leite de soja"),
    presets: [
      { label: "1 copo (200ml)", grams: 200, unit: "ml" },
      { label: "1 copo grande (300ml)", grams: 300, unit: "ml" },
    ]},
  { test: has("cafe"), presets: [
      { label: "1 xícara (60ml)", grams: 60, unit: "ml" },
      { label: "1 cafezinho (50ml)", grams: 50, unit: "ml" },
    ]},
  { test: any("refrigerante", "cerveja"),
    presets: [
      { label: "1 lata (350ml)", grams: 350, unit: "ml" },
      { label: "1 copo (200ml)", grams: 200, unit: "ml" },
    ]},
  { test: has("vinho"), presets: [{ label: "1 taça (150ml)", grams: 150, unit: "ml" }]},

  // ===== Molhos =====
  { test: any("maionese", "ketchup", "mostarda", "molho de tomate", "shoyu"),
    presets: [
      { label: "1 colher de sopa (15g)", grams: 15 },
      { label: "1 colher de chá (5g)", grams: 5 },
    ]},

  // ===== Snacks =====
  { test: any("barra de proteina", "barra proteina"),
    presets: [{ label: "1 unidade (30g)", grams: 30 }]},
  { test: any("barrinha de cereal", "barrinha cereal"),
    presets: [{ label: "1 unidade (25g)", grams: 25 }]},
];

const GENERIC_G: PortionPreset[] = [
  { label: "50g", grams: 50 },
  { label: "100g", grams: 100 },
  { label: "150g", grams: 150 },
  { label: "200g", grams: 200 },
];
const GENERIC_ML: PortionPreset[] = [
  { label: "50ml", grams: 50, unit: "ml" },
  { label: "100ml", grams: 100, unit: "ml" },
  { label: "200ml", grams: 200, unit: "ml" },
  { label: "300ml", grams: 300, unit: "ml" },
];

export function getPortionPresets(name: string, defaultUnit: "g" | "ml" = "g"): PortionPreset[] {
  const n = norm(name || "");
  const matched: PortionPreset[] = [];
  for (const r of RULES) {
    if (r.test(n)) matched.push(...r.presets);
    if (matched.length >= 6) break;
  }
  const generic = defaultUnit === "ml" ? GENERIC_ML : GENERIC_G;
  // Deduplica por label, mantém específicos primeiro, completa com genéricos.
  const seen = new Set<string>();
  const out: PortionPreset[] = [];
  for (const p of [...matched, ...generic]) {
    if (seen.has(p.label)) continue;
    seen.add(p.label);
    out.push(p);
    if (out.length >= 8) break;
  }
  return out;
}