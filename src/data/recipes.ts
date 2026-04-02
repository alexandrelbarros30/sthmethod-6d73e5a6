import recipePoke from "@/assets/recipe-poke.jpg";
import recipeFrango from "@/assets/recipe-frango.jpg";
import recipeAcai from "@/assets/recipe-acai.jpg";
import recipeSmoothie from "@/assets/recipe-smoothie.jpg";
import recipePanqueca from "@/assets/recipe-panqueca.jpg";
import recipeSalada from "@/assets/recipe-salada.jpg";
import recipeMoqueca from "@/assets/recipe-moqueca.jpg";
import recipeTapioca from "@/assets/recipe-tapioca.jpg";
import recipeCuscuz from "@/assets/recipe-cuscuz.jpg";
import recipePureBatata from "@/assets/recipe-pure-batata.jpg";
import recipeOmelete from "@/assets/recipe-omelete.jpg";
import recipeEscondidinho from "@/assets/recipe-escondidinho.jpg";

export interface Recipe {
  id: string;
  title: string;
  image: string;
  time: string;
  kcal: number;
  category: "Café da manhã" | "Almoço" | "Lanche" | "Jantar";
  tags: string[];
  objetivo: string;
  ingredients: string[];
  instructions: string;
  substituicoes: string[];
  ajusteEstrategico: string;
  dicaPratica: string;
}

export const recipes: Recipe[] = [
  {
    id: "1",
    title: "Poke Bowl de Salmão",
    image: recipePoke,
    time: "20 min",
    kcal: 420,
    category: "Almoço",
    tags: ["Alto em Proteína", "Low Carb"],
    objetivo: "Hipertrofia / Manutenção",
    ingredients: [
      "150g salmão fresco em cubos",
      "100g arroz japonês cozido",
      "½ abacate fatiado",
      "50g edamame",
      "50g repolho roxo fatiado",
      "Gergelim e molho shoyu light",
    ],
    instructions:
      "1. Cozinhe o arroz e reserve.\n2. Corte o salmão em cubos médios.\n3. Monte o bowl: arroz na base, salmão, abacate, edamame e repolho.\n4. Finalize com gergelim e um fio de shoyu light.",
    substituicoes: [
      "Salmão → atum em cubos ou frango desfiado",
      "Arroz japonês → arroz integral ou quinoa",
      "Edamame → grão-de-bico cozido",
    ],
    ajusteEstrategico:
      "A combinação de proteína de alta biodisponibilidade (salmão) com gordura boa (abacate) e carboidrato de liberação moderada cria uma refeição com alto poder de saciedade e perfil anabólico favorável pós-treino.",
    dicaPratica:
      "Deixe o arroz pronto do dia anterior. Monte o bowl em menos de 5 minutos pela manhã e leve na marmita — o salmão pode ser substituído por atum em lata no aperto.",
  },
  {
    id: "2",
    title: "Frango Grelhado com Batata Doce",
    image: recipeFrango,
    time: "30 min",
    kcal: 380,
    category: "Almoço",
    tags: ["Alto em Proteína", "Pré-treino"],
    objetivo: "Hipertrofia / Emagrecimento",
    ingredients: [
      "200g peito de frango",
      "150g batata doce",
      "100g brócolis",
      "Azeite, sal e pimenta a gosto",
    ],
    instructions:
      "1. Tempere o frango com sal, pimenta e azeite.\n2. Grelhe em fogo médio-alto por 6 min de cada lado.\n3. Cozinhe a batata doce no vapor por 15 min.\n4. Refogue o brócolis com um fio de azeite.",
    substituicoes: [
      "Frango → patinho moído ou filé de tilápia",
      "Batata doce → mandioca cozida ou inhame",
      "Brócolis → vagem ou couve-flor",
    ],
    ajusteEstrategico:
      "A batata doce fornece carboidrato de baixo índice glicêmico, ideal como combustível pré-treino. O frango garante aporte proteico magro e o brócolis adiciona fibra e micronutrientes sem impactar o calórico.",
    dicaPratica:
      "Grelhe 1kg de frango no domingo e congele em porções de 200g. Na hora da refeição é só aquecer — economia de tempo e consistência garantida.",
  },
  {
    id: "3",
    title: "Açaí Bowl Proteico",
    image: recipeAcai,
    time: "10 min",
    kcal: 350,
    category: "Lanche",
    tags: ["Pós-treino", "Rico em Fibras"],
    objetivo: "Hipertrofia / Manutenção",
    ingredients: [
      "200g polpa de açaí sem açúcar",
      "1 banana madura",
      "30g granola sem açúcar",
      "Morangos e mirtilos a gosto",
      "1 scoop whey protein (opcional)",
    ],
    instructions:
      "1. Bata o açaí com a banana e o whey no liquidificador até ficar cremoso.\n2. Despeje na tigela.\n3. Cubra com granola, morangos e mirtilos.",
    substituicoes: [
      "Açaí → polpa de frutas vermelhas congelada",
      "Granola → aveia em flocos + coco ralado",
      "Whey → pasta de amendoim (1 colher)",
    ],
    ajusteEstrategico:
      "O açaí sem açúcar é rico em antioxidantes e gorduras boas. Com whey, vira uma refeição pós-treino completa — carboidrato rápido (banana) + proteína para recuperação muscular.",
    dicaPratica:
      "Congele bananas maduras cortadas em rodelas. Na hora de bater, o açaí fica mais cremoso e não precisa de gelo.",
  },
  {
    id: "4",
    title: "Smoothie Verde Detox",
    image: recipeSmoothie,
    time: "5 min",
    kcal: 180,
    category: "Café da manhã",
    tags: ["Detox", "Rico em Vitaminas"],
    objetivo: "Emagrecimento / Manutenção",
    ingredients: [
      "1 xícara de espinafre fresco",
      "1 banana",
      "1 kiwi",
      "1 colher de sopa de chia",
      "200ml água de coco",
    ],
    instructions:
      "1. Coloque todos os ingredientes no liquidificador.\n2. Bata até ficar homogêneo e cremoso.\n3. Sirva gelado imediatamente.",
    substituicoes: [
      "Espinafre → couve manteiga",
      "Kiwi → abacaxi ou maracujá",
      "Água de coco → água filtrada + 1 colher de mel",
    ],
    ajusteEstrategico:
      "A chia expande no estômago e prolonga a saciedade por até 3 horas. O espinafre fornece ferro e folato sem alterar o sabor. Ideal para quem precisa controlar apetite nas primeiras horas do dia.",
    dicaPratica:
      "Deixe a chia de molho em 2 colheres de água por 10 min antes de bater — ela forma gel e deixa o smoothie mais espesso e saciante.",
  },
  {
    id: "5",
    title: "Panqueca Proteica",
    image: recipePanqueca,
    time: "15 min",
    kcal: 290,
    category: "Café da manhã",
    tags: ["Alto em Proteína", "Pré-treino"],
    objetivo: "Hipertrofia / Manutenção",
    ingredients: [
      "2 ovos inteiros",
      "1 banana madura",
      "30g aveia em flocos",
      "1 scoop whey protein",
      "Frutas vermelhas para decorar",
    ],
    instructions:
      "1. Bata os ovos, banana, aveia e whey no liquidificador.\n2. Despeje porções em frigideira antiaderente em fogo baixo.\n3. Doure 2 min de cada lado.\n4. Sirva com frutas vermelhas.",
    substituicoes: [
      "Whey → 2 colheres de pasta de amendoim",
      "Aveia → farinha de arroz (sem glúten)",
      "Banana → 50g de abóbora cozida",
    ],
    ajusteEstrategico:
      "Café da manhã com ~30g de proteína logo cedo ativa a síntese proteica muscular e reduz o desejo por doces ao longo do dia. A aveia fornece beta-glucana, fibra que controla a glicemia.",
    dicaPratica:
      "Faça a massa na noite anterior e deixe na geladeira. Pela manhã é só despejar na frigideira — café da manhã pronto em 5 minutos.",
  },
  {
    id: "6",
    title: "Salada de Salmão e Quinoa",
    image: recipeSalada,
    time: "25 min",
    kcal: 400,
    category: "Jantar",
    tags: ["Rico em Ômega-3", "Low Carb"],
    objetivo: "Emagrecimento / Manutenção",
    ingredients: [
      "150g salmão grelhado",
      "80g quinoa cozida",
      "Mix de folhas verdes",
      "Tomate cereja cortados ao meio",
      "½ abacate fatiado",
      "Azeite extravirgem e limão",
    ],
    instructions:
      "1. Grelhe o salmão temperado com sal e limão por 4 min de cada lado.\n2. Cozinhe a quinoa conforme embalagem.\n3. Monte a salada com folhas, tomate e abacate.\n4. Coloque o salmão e a quinoa por cima.\n5. Finalize com azeite e limão.",
    substituicoes: [
      "Salmão → sardinha grelhada ou frango desfiado",
      "Quinoa → arroz integral ou lentilha",
      "Abacate → castanhas trituradas",
    ],
    ajusteEstrategico:
      "Jantar leve e rico em ômega-3 melhora a qualidade do sono e a recuperação noturna. A quinoa é proteína vegetal completa (todos os aminoácidos essenciais), complementando o salmão.",
    dicaPratica:
      "Cozinhe a quinoa em grande quantidade no início da semana e congele em porções de 80g. Descongele no micro-ondas em 1 minuto.",
  },
  {
    id: "7",
    title: "Moqueca de Peixe Fit",
    image: recipeMoqueca,
    time: "35 min",
    kcal: 360,
    category: "Almoço",
    tags: ["Rico em Ômega-3", "Brasileiro"],
    objetivo: "Emagrecimento / Manutenção",
    ingredients: [
      "200g filé de peixe branco (tilápia ou merluza)",
      "100ml leite de coco light",
      "1 tomate maduro picado",
      "½ pimentão picado",
      "½ cebola picada",
      "Coentro fresco a gosto",
      "1 colher de azeite de dendê",
    ],
    instructions:
      "1. Tempere o peixe com limão, sal e pimenta e reserve 10 min.\n2. Refogue cebola, pimentão e tomate no azeite.\n3. Adicione o peixe e cubra com leite de coco.\n4. Cozinhe em fogo baixo por 15 min sem mexer.\n5. Finalize com azeite de dendê e coentro.",
    substituicoes: [
      "Peixe branco → camarão ou frango em cubos",
      "Leite de coco light → creme de leite vegetal",
      "Azeite de dendê → azeite extravirgem (menos sabor regional, mas funciona)",
    ],
    ajusteEstrategico:
      "O leite de coco light reduz a gordura saturada sem perder cremosidade. O peixe branco é uma das proteínas mais magras disponíveis — ideal em fase de emagrecimento com calorias controladas.",
    dicaPratica:
      "Congele o peixe já temperado em saquinhos individuais. Na hora do preparo, descongele no micro-ondas e vá direto para a panela — jantar pronto em 20 min.",
  },
  {
    id: "8",
    title: "Tapioca de Frango",
    image: recipeTapioca,
    time: "15 min",
    kcal: 280,
    category: "Lanche",
    tags: ["Sem Glúten", "Brasileiro"],
    objetivo: "Manutenção / Emagrecimento",
    ingredients: [
      "3 colheres de sopa de goma de tapioca",
      "100g frango desfiado temperado",
      "Tomate fatiado e alface",
      "1 colher de requeijão light",
    ],
    instructions:
      "1. Espalhe a goma uniformemente na frigideira antiaderente em fogo médio.\n2. Quando firmar (1-2 min), vire e recheie com frango, requeijão, tomate e alface.\n3. Dobre e sirva imediatamente.",
    substituicoes: [
      "Frango → atum sólido em água ou ovo mexido",
      "Requeijão → cream cheese light ou cottage",
      "Tapioca → crepioca (tapioca + ovo batido)",
    ],
    ajusteEstrategico:
      "A tapioca é carboidrato sem glúten e de digestão rápida — ideal como lanche pré-treino. Combinada com frango, entrega proteína sem peso no estômago.",
    dicaPratica:
      "Desfie 500g de frango no domingo e guarde em potes na geladeira. Rende a semana inteira para rechear tapiocas, wraps e saladas.",
  },
  {
    id: "9",
    title: "Cuscuz com Ovos e Legumes",
    image: recipeCuscuz,
    time: "20 min",
    kcal: 320,
    category: "Café da manhã",
    tags: ["Rico em Fibras", "Brasileiro"],
    objetivo: "Manutenção / Hipertrofia",
    ingredients: [
      "100g flocos de milho para cuscuz",
      "2 ovos cozidos",
      "Tomate, cebola e pimentão picados",
      "Azeite, sal e coentro a gosto",
    ],
    instructions:
      "1. Hidrate os flocos com água e sal (proporção 1:1) por 5 min.\n2. Coloque na cuscuzeira e cozinhe por 5-8 min no vapor.\n3. Cozinhe os ovos por 10 min.\n4. Sirva o cuscuz com ovos fatiados, legumes picados e um fio de azeite.",
    substituicoes: [
      "Ovos cozidos → ovo mexido ou queijo coalho grelhado",
      "Flocos de milho → cuscuz marroquino integral",
      "Pimentão → cenoura ralada",
    ],
    ajusteEstrategico:
      "O cuscuz é um dos café da manhã mais práticos e baratos do Brasil. Rico em carboidrato e fibras do milho, combinado com ovos entrega um café da manhã com ~25g de proteína e altíssima saciedade.",
    dicaPratica:
      "Deixe os flocos hidratando enquanto toma banho. Quando sair, é só colocar na cuscuzeira — pronto em menos de 10 min sem esforço.",
  },
  {
    id: "10",
    title: "Purê de Batata Doce com Frango",
    image: recipePureBatata,
    time: "30 min",
    kcal: 410,
    category: "Jantar",
    tags: ["Alto em Proteína", "Brasileiro"],
    objetivo: "Hipertrofia / Manutenção",
    ingredients: [
      "200g batata doce descascada",
      "180g peito de frango grelhado",
      "100g vagem e cenoura no vapor",
      "Azeite, sal e ervas finas a gosto",
    ],
    instructions:
      "1. Cozinhe a batata doce até ficar macia e amasse com um fio de azeite.\n2. Grelhe o frango temperado por 6 min de cada lado.\n3. Cozinhe os legumes no vapor por 8 min.\n4. Monte o prato: purê na base, frango fatiado e legumes ao lado.",
    substituicoes: [
      "Batata doce → abóbora cabotiá (purê cremoso)",
      "Frango → carne moída magra refogada",
      "Vagem → abobrinha grelhada",
    ],
    ajusteEstrategico:
      "Refeição com balanço ideal de macros para jantar em fase de ganho muscular. A batata doce sustenta a glicemia durante o sono e o frango fornece aminoácidos para a recuperação noturna.",
    dicaPratica:
      "Cozinhe a batata doce no micro-ondas: fure com garfo, embrulhe em filme e micro-ondas por 6 min. Fica pronta sem usar panela.",
  },
  {
    id: "11",
    title: "Omelete de Claras com Espinafre",
    image: recipeOmelete,
    time: "10 min",
    kcal: 200,
    category: "Café da manhã",
    tags: ["Alto em Proteína", "Low Carb"],
    objetivo: "Emagrecimento / Definição",
    ingredients: [
      "4 claras de ovo",
      "1 ovo inteiro",
      "1 xícara de espinafre fresco",
      "5 tomates cereja cortados ao meio",
      "Sal e pimenta a gosto",
    ],
    instructions:
      "1. Bata as claras e o ovo inteiro com um garfo.\n2. Despeje na frigideira antiaderente em fogo médio-baixo.\n3. Quando começar a firmar, adicione espinafre e tomate.\n4. Dobre ao meio e espere 1 min.\n5. Sirva imediatamente.",
    substituicoes: [
      "Claras → ovos inteiros (aumenta gordura e calorias)",
      "Espinafre → rúcula ou couve picada",
      "Tomate cereja → pimentão picado",
    ],
    ajusteEstrategico:
      "Apenas 200 kcal com ~28g de proteína. Perfeito em fase de definição ou cutting — alta saciedade, baixíssimo carboidrato e gordura. O espinafre adiciona ferro e folato sem custo calórico.",
    dicaPratica:
      "Separe as claras na noite anterior e deixe em um pote na geladeira. Pela manhã, despeje direto na frigideira — zero desculpa para pular o café.",
  },
  {
    id: "12",
    title: "Escondidinho Fit de Frango",
    image: recipeEscondidinho,
    time: "40 min",
    kcal: 370,
    category: "Jantar",
    tags: ["Comfort Food", "Brasileiro"],
    objetivo: "Manutenção / Hipertrofia",
    ingredients: [
      "200g batata doce cozida",
      "150g frango desfiado temperado",
      "1 colher de requeijão light",
      "30g queijo minas ralado",
      "Temperos: alho, cebola, sal, pimenta",
    ],
    instructions:
      "1. Cozinhe a batata doce e amasse com requeijão light até virar purê.\n2. Refogue o frango desfiado com alho, cebola e temperos.\n3. Em refratário pequeno: camada de purê, frango, outra camada de purê.\n4. Cubra com queijo minas ralado.\n5. Leve ao forno por 15 min a 200°C até gratinar.",
    substituicoes: [
      "Batata doce → mandioca cozida ou abóbora",
      "Frango → carne moída magra ou atum",
      "Queijo minas → parmesão ralado (menos quantidade, mais sabor)",
    ],
    ajusteEstrategico:
      "Comfort food com perfil nutricional controlado. O requeijão light dá cremosidade sem estourar gordura. É a prova de que dieta não precisa ser sofrida — comida de verdade com macros ajustados.",
    dicaPratica:
      "Monte 4 porções individuais em potinhos de alumínio e congele. Quando bater a vontade de 'comfort food', é só levar ao forno por 20 min — muito melhor que pedir delivery.",
  },
];

export const recipeCategories = ["Todos", "Café da manhã", "Almoço", "Lanche", "Jantar"] as const;
