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
import recipeOvosCottage from "@/assets/recipe-ovos-cottage.jpg";
import recipeCrepioca from "@/assets/recipe-crepioca.jpg";
import recipeOvernightOats from "@/assets/recipe-overnight-oats.jpg";
import recipePanquecaProteica from "@/assets/recipe-panqueca-proteica.jpg";
import recipeToastBatata from "@/assets/recipe-toast-batata.jpg";
import recipeCuscuzCarne from "@/assets/recipe-cuscuz-carne.jpg";
import recipeTilapiaArroz from "@/assets/recipe-tilapia-arroz.jpg";
import recipeWrapFrango from "@/assets/recipe-wrap-frango.jpg";
import recipeBolonhesaAbobrinha from "@/assets/recipe-bolonhesa-abobrinha.jpg";
import recipeFrangoQuinoa from "@/assets/recipe-frango-quinoa.jpg";
import recipeCarnePanela from "@/assets/recipe-carne-panela.jpg";
import recipeBurgerFit from "@/assets/recipe-burger-fit.jpg";
import recipeSalmaoAspargos from "@/assets/recipe-salmao-aspargos.jpg";
import recipeCanja from "@/assets/recipe-canja.jpg";
import recipeOmeleteClara from "@/assets/recipe-omelete-clara.jpg";
import recipeCamaraoGrelha from "@/assets/recipe-camarao-grelha.jpg";
import recipeIogurteGranola from "@/assets/recipe-iogurte-granola.jpg";
import recipeBolinhaEnergia from "@/assets/recipe-bolinha-energia.jpg";
import recipeBarraProteica from "@/assets/recipe-barra-proteica.jpg";
import recipeShakeWhey from "@/assets/recipe-shake-whey.jpg";
import recipeMuffinBatata from "@/assets/recipe-muffin-batata.jpg";
import recipeChaAmendoas from "@/assets/recipe-cha-amendoas.jpg";
import recipeCottageNozes from "@/assets/recipe-cottage-nozes.jpg";
import recipePudimCaseina from "@/assets/recipe-pudim-caseina.jpg";
import recipeMousseWhey from "@/assets/recipe-mousse-whey.jpg";
import recipePatinhoGrelhado from "@/assets/recipe-patinho-grelhado.jpg";
import recipeMexidoOvos from "@/assets/recipe-mexido-ovos.jpg";
import recipeGelatinaProteica from "@/assets/recipe-gelatina-proteica.jpg";
import recipeAlmondegaFit from "@/assets/recipe-almondega-fit.jpg";

export interface Recipe {
  id: string;
  title: string;
  image: string;
  time: string;
  kcal: number;
  category: "Café da manhã" | "Almoço" | "Lanche" | "Lanche da Tarde" | "Jantar" | "Ceia";
  tags: string[];
  objetivo: string;
  ingredients: string[];
  instructions: string;
  substituicoes: string[];
  ajusteEstrategico: string;
  dicaPratica: string;
  isNew?: boolean;
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
  // ===== NOVAS RECEITAS - CAFÉ DA MANHÃ (Emagrecimento) =====
  {
    id: "13",
    title: "Ovos Mexidos com Cottage e Tomate",
    image: recipeOvosCottage,
    time: "10 min",
    kcal: 220,
    category: "Café da manhã",
    tags: ["Low Carb", "Alto em Proteína"],
    objetivo: "Emagrecimento",
    ingredients: ["3 ovos", "2 col. sopa cottage", "5 tomates-cereja", "Sal, pimenta e cebolinha"],
    instructions: "1. Bata os ovos e tempere.\n2. Cozinhe em fogo baixo mexendo.\n3. Adicione cottage e tomates cortados ao meio.\n4. Finalize com cebolinha.",
    substituicoes: ["Cottage → ricota amassada", "Tomate-cereja → tomate seco (reduzir quantidade)", "Ovos → claras (4-5 unidades)"],
    ajusteEstrategico: "Proteína completa dos ovos + caseína do cottage garantem saciedade prolongada. O tomate adiciona licopeno sem calorias significativas.",
    dicaPratica: "Deixe os ovos batidos na geladeira na noite anterior. De manhã, é só despejar na frigideira — café da manhã em 5 minutos.",
  },
  {
    id: "14",
    title: "Crepioca de Frango com Espinafre",
    image: recipeCrepioca,
    time: "15 min",
    kcal: 280,
    category: "Café da manhã",
    tags: ["Alto em Proteína", "Sem Glúten"],
    objetivo: "Emagrecimento",
    ingredients: ["2 col. sopa de tapioca", "1 ovo", "80g frango desfiado", "1 punhado de espinafre", "Temperos a gosto"],
    instructions: "1. Misture tapioca e ovo até homogeneizar.\n2. Despeje em frigideira antiaderente.\n3. Quando firmar, adicione frango e espinafre.\n4. Dobre e sirva.",
    substituicoes: ["Frango → atum em lata", "Espinafre → rúcula ou couve", "Tapioca → farinha de aveia"],
    ajusteEstrategico: "A tapioca fornece energia rápida enquanto o ovo e frango garantem 30g+ de proteína. Perfeita para quem treina pela manhã.",
    dicaPratica: "Desfie o frango no domingo e congele em porções. Cada crepioca fica pronta em 5 min.",
  },
  {
    id: "15",
    title: "Overnight Oats com Banana e Pasta de Amendoim",
    image: recipeOvernightOats,
    time: "5 min + geladeira",
    kcal: 350,
    category: "Café da manhã",
    tags: ["Pré-treino", "Rico em Fibra"],
    objetivo: "Emagrecimento",
    ingredients: ["40g aveia em flocos", "150ml leite desnatado", "1 banana", "1 col. sopa pasta de amendoim", "Canela a gosto"],
    instructions: "1. Misture aveia e leite em pote de vidro.\n2. Cubra com fatias de banana e pasta de amendoim.\n3. Polvilhe canela.\n4. Leve à geladeira por 6h ou durante a noite.",
    substituicoes: ["Leite → iogurte natural", "Pasta de amendoim → pasta de castanha", "Banana → morango ou maçã"],
    ajusteEstrategico: "Fibra solúvel da aveia + gordura boa do amendoim = liberação lenta de energia. Ideal para quem precisa de saciedade até o almoço.",
    dicaPratica: "Prepare 3 potes no domingo para segunda, terça e quarta. Varie as frutas para não enjoar.",
  },
  // ===== CAFÉ DA MANHÃ (Hipertrofia) =====
  {
    id: "16",
    title: "Panqueca Proteica de Banana",
    image: recipePanquecaProteica,
    time: "15 min",
    kcal: 450,
    category: "Café da manhã",
    tags: ["Alto em Proteína", "Pós-treino"],
    objetivo: "Hipertrofia",
    ingredients: ["2 bananas maduras", "3 ovos", "30g whey protein", "2 col. sopa aveia", "Mel e canela a gosto"],
    instructions: "1. Amasse as bananas e misture com ovos.\n2. Adicione whey e aveia até formar massa.\n3. Faça as panquecas em frigideira antiaderente.\n4. Sirva com mel e canela.",
    substituicoes: ["Whey → albumina em pó", "Aveia → farinha de arroz", "Mel → pasta de amendoim"],
    ajusteEstrategico: "40g+ de proteína com carboidratos de rápida absorção. Janela anabólica aproveitada com praticidade. Banana madura aumenta o IG facilitando o spike de insulina pós-treino.",
    dicaPratica: "Congele as panquecas prontas separadas por papel-filme. Aqueça no micro-ondas em 30 segundos.",
  },
  {
    id: "17",
    title: "Toast de Batata Doce com Abacate e Ovo",
    image: recipeToastBatata,
    time: "20 min",
    kcal: 420,
    category: "Café da manhã",
    tags: ["Rico em Carboidrato", "Pré-treino"],
    objetivo: "Hipertrofia",
    ingredients: ["2 fatias grossas de batata doce", "1 ovo", "½ abacate amassado", "Sal, pimenta e cebolinha"],
    instructions: "1. Corte batata doce em fatias de 1cm.\n2. Torre na airfryer a 200°C por 10 min.\n3. Espalhe abacate amassado por cima.\n4. Finalize com ovo frito e cebolinha.",
    substituicoes: ["Batata doce → pão integral", "Abacate → cream cheese light", "Ovo frito → ovo poché"],
    ajusteEstrategico: "Carboidrato complexo da batata doce + gordura boa do abacate + proteína do ovo = tríade perfeita para abastecer treinos pesados.",
    dicaPratica: "Fatie a batata doce na noite anterior. Pela manhã, direto na airfryer enquanto prepara o restante.",
  },
  {
    id: "18",
    title: "Cuscuz Nordestino com Ovo e Carne Seca",
    image: recipeCuscuzCarne,
    time: "20 min",
    kcal: 480,
    category: "Café da manhã",
    tags: ["Alto em Proteína", "Rico em Carboidrato"],
    objetivo: "Hipertrofia",
    ingredients: ["100g flocos de milho (cuscuz)", "80g carne seca desfiada", "2 ovos", "1 col. sopa manteiga", "Sal a gosto"],
    instructions: "1. Hidrate o cuscuz com água e sal por 5 min.\n2. Cozinhe na cuscuzeira por 10 min.\n3. Frite os ovos na manteiga.\n4. Sirva com carne seca desfiada por cima.",
    substituicoes: ["Carne seca → frango desfiado", "Manteiga → azeite", "Ovos → queijo coalho grelhado"],
    ajusteEstrategico: "Receita calórica e proteica com base nordestina. O cuscuz é excelente fonte de carboidrato de baixo custo. A carne seca adiciona creatina natural.",
    dicaPratica: "Dessalgue a carne seca na noite anterior trocando a água 2 vezes. Desfie e guarde na geladeira para a semana.",
  },
  // ===== ALMOÇO (Emagrecimento) =====
  {
    id: "19",
    title: "Tilápia Grelhada com Arroz Integral",
    image: recipeTilapiaArroz,
    time: "25 min",
    kcal: 320,
    category: "Almoço",
    tags: ["Low Fat", "Alto em Proteína"],
    objetivo: "Emagrecimento",
    ingredients: ["180g filé de tilápia", "80g arroz integral", "100g legumes no vapor", "Limão, alho e ervas"],
    instructions: "1. Tempere a tilápia com limão, alho e ervas.\n2. Grelhe em fogo alto por 4 min de cada lado.\n3. Sirva com arroz integral e legumes no vapor.",
    substituicoes: ["Tilápia → merluza ou pescada", "Arroz integral → quinoa", "Legumes → salada verde"],
    ajusteEstrategico: "Peixe branco tem altíssima densidade proteica com mínima gordura. Perfeito para déficit calórico sem perder massa magra.",
    dicaPratica: "Compre filés congelados individualmente — tire do freezer na noite anterior e tempere já na marinada.",
  },
  {
    id: "20",
    title: "Wrap de Frango com Salada",
    image: recipeWrapFrango,
    time: "15 min",
    kcal: 310,
    category: "Almoço",
    tags: ["Rápido", "Alto em Proteína"],
    objetivo: "Emagrecimento",
    ingredients: ["1 tortilha integral", "120g frango grelhado fatiado", "Alface, tomate e cenoura ralada", "1 col. sopa iogurte natural"],
    instructions: "1. Espalhe iogurte na tortilha.\n2. Distribua o frango e os vegetais.\n3. Enrole bem apertado.\n4. Corte ao meio na diagonal.",
    substituicoes: ["Tortilha → folha de alface (low carb)", "Frango → atum ou peito de peru", "Iogurte → mostarda ou hummus"],
    ajusteEstrategico: "Refeição portátil com 30g de proteína e carboidrato controlado. O iogurte substitui maionese eliminando gordura saturada desnecessária.",
    dicaPratica: "Monte na noite anterior enrolado em papel-alumínio. Leve na bolsa e coma frio — funciona perfeitamente.",
  },
  {
    id: "21",
    title: "Bolonhesa de Peru com Abobrinha",
    image: recipeBolonhesaAbobrinha,
    time: "25 min",
    kcal: 280,
    category: "Almoço",
    tags: ["Low Carb", "Alto em Proteína"],
    objetivo: "Emagrecimento",
    ingredients: ["150g carne moída de peru", "1 abobrinha média (espaguete)", "100ml molho de tomate natural", "Alho, cebola e manjericão"],
    instructions: "1. Faça espirais de abobrinha com descascador.\n2. Refogue alho e cebola, adicione a carne.\n3. Junte molho de tomate e temperos.\n4. Sirva sobre a abobrinha.",
    substituicoes: ["Peru → frango moído", "Abobrinha → macarrão de palmito", "Molho de tomate → tomates frescos"],
    ajusteEstrategico: "Zera o carboidrato do macarrão trocando por abobrinha. A carne de peru é mais magra que a bovina, reduzindo calorias totais em 40%.",
    dicaPratica: "Faça o molho em quantidade e congele em potes de 200ml. A abobrinha prepare na hora para não amolecer.",
  },
  // ===== ALMOÇO (Hipertrofia) =====
  {
    id: "22",
    title: "Frango Grelhado com Quinoa e Legumes",
    image: recipeFrangoQuinoa,
    time: "30 min",
    kcal: 520,
    category: "Almoço",
    tags: ["Alto em Proteína", "Rico em Carboidrato"],
    objetivo: "Hipertrofia",
    ingredients: ["200g peito de frango", "100g quinoa", "150g legumes assados (abóbora, cenoura, batata)", "Azeite e temperos"],
    instructions: "1. Grelhe o frango temperado.\n2. Cozinhe a quinoa conforme embalagem.\n3. Asse os legumes com azeite a 200°C por 20 min.\n4. Monte o prato com todos os componentes.",
    substituicoes: ["Quinoa → arroz integral ou cuscuz marroquino", "Frango → carne de alcatra", "Legumes → brócolis e couve-flor"],
    ajusteEstrategico: "Quinoa é proteína vegetal completa com todos os aminoácidos essenciais. Combinada com frango, entrega 50g+ de proteína na refeição.",
    dicaPratica: "Cozinhe 500g de quinoa no domingo e use a semana toda. Guarde em potes na geladeira por até 5 dias.",
  },
  {
    id: "23",
    title: "Carne de Panela com Purê de Batata Doce",
    image: recipeCarnePanela,
    time: "45 min",
    kcal: 550,
    category: "Almoço",
    tags: ["Alto em Proteína", "Comfort Food"],
    objetivo: "Hipertrofia",
    ingredients: ["200g acém ou músculo", "200g batata doce", "1 cenoura", "Cebola, alho, louro e sal"],
    instructions: "1. Corte a carne em cubos e sele em panela.\n2. Adicione água, cebola, alho e louro.\n3. Cozinhe em pressão por 30 min.\n4. Amasse batata doce cozida com um fio de azeite.",
    substituicoes: ["Acém → paleta ou lagarto", "Batata doce → mandioca", "Cenoura → abóbora"],
    ajusteEstrategico: "Carne de segunda é mais barata e rica em colágeno. Cozimento lento quebra as fibras, facilitando a digestão e absorção de aminoácidos.",
    dicaPratica: "Cozinhe 1kg na panela de pressão e divida em 5 marmitas. Congele e descongele conforme necessidade.",
  },
  {
    id: "24",
    title: "Burger Fit com Batata Doce Frita",
    image: recipeBurgerFit,
    time: "30 min",
    kcal: 580,
    category: "Almoço",
    tags: ["Alto em Proteína", "Comfort Food"],
    objetivo: "Hipertrofia",
    ingredients: ["200g patinho moído", "1 folha de alface", "2 fatias tomate", "150g batata doce em palitos", "Temperos a gosto"],
    instructions: "1. Tempere a carne e modele o hambúrguer.\n2. Grelhe 5 min de cada lado.\n3. Corte batata doce em palitos e asse na airfryer 15 min.\n4. Monte: alface, burger e tomate.",
    substituicoes: ["Patinho → peito de frango moído", "Batata doce → batata inglesa", "Alface → pão integral (adicione 120kcal)"],
    ajusteEstrategico: "Hambúrguer artesanal com carne magra entrega 45g de proteína. A airfryer elimina óleo, reduzindo gordura total em 60% comparado à fritura.",
    dicaPratica: "Modele 10 hambúrgueres, separe com papel-filme e congele. Do freezer direto para a grelha — sem descongelar.",
  },
  // ===== JANTAR (Emagrecimento) =====
  {
    id: "25",
    title: "Salmão com Aspargos ao Limão",
    image: recipeSalmaoAspargos,
    time: "20 min",
    kcal: 350,
    category: "Jantar",
    tags: ["Ômega-3", "Low Carb"],
    objetivo: "Emagrecimento",
    ingredients: ["150g filé de salmão", "8 aspargos", "1 limão", "Azeite, sal e pimenta-do-reino"],
    instructions: "1. Tempere o salmão com limão, sal e pimenta.\n2. Sele em frigideira quente com azeite por 4 min de cada lado.\n3. Grelhe aspargos na mesma frigideira por 3 min.\n4. Sirva com rodela de limão.",
    substituicoes: ["Salmão → truta ou atum", "Aspargos → brócolis ou vagem", "Limão → laranja (mais doce)"],
    ajusteEstrategico: "Ômega-3 do salmão otimiza sensibilidade à insulina e reduz inflamação. Refeição noturna low carb evita acúmulo de glicogênio durante o sono.",
    dicaPratica: "Compre salmão congelado em porções — sai mais barato. Tempere congelado e leve direto à frigideira.",
  },
  {
    id: "26",
    title: "Canja de Frango Light",
    image: recipeCanja,
    time: "30 min",
    kcal: 250,
    category: "Jantar",
    tags: ["Reconfortante", "Baixa Caloria"],
    objetivo: "Emagrecimento",
    ingredients: ["150g peito de frango", "30g arroz", "1 cenoura", "Salsão, cebola, alho e salsinha"],
    instructions: "1. Cozinhe frango com cebola e alho em água.\n2. Retire, desfie e reserve.\n3. Na mesma água, cozinhe arroz e cenoura em cubos.\n4. Devolva o frango e finalize com salsinha.",
    substituicoes: ["Arroz → macarrão integral (letrinhas)", "Frango → peru", "Cenoura → abóbora"],
    ajusteEstrategico: "Sopas quentes aumentam a saciedade termogênica. Poucas calorias com volume generoso — perfeita para jantar em fase de cutting.",
    dicaPratica: "Faça um caldeirão grande e congele em potes de 400ml. Esquente no micro em 3 min para jantar express.",
  },
  {
    id: "27",
    title: "Omelete de Claras com Peru e Queijo",
    image: recipeOmeleteClara,
    time: "10 min",
    kcal: 200,
    category: "Jantar",
    tags: ["Low Carb", "Low Fat"],
    objetivo: "Emagrecimento",
    ingredients: ["5 claras de ovo", "3 fatias peito de peru", "1 fatia queijo minas", "Orégano e sal"],
    instructions: "1. Bata as claras com sal.\n2. Despeje em frigideira antiaderente.\n3. Quando firmar, adicione peru e queijo.\n4. Dobre e sirva com orégano.",
    substituicoes: ["Claras → 2 ovos inteiros (adicione 80kcal)", "Peru → frango desfiado", "Queijo minas → cottage"],
    ajusteEstrategico: "Claras eliminam a gema, cortando 5g de gordura por ovo. 35g de proteína pura com mínimo de calorias — ideal para última refeição.",
    dicaPratica: "Compre claras pasteurizadas em caixa. Sem casca para quebrar, sem gema para separar — praticidade total.",
  },
  // ===== JANTAR (Hipertrofia) =====
  {
    id: "28",
    title: "Camarão Grelhado com Arroz de Legumes",
    image: recipeCamaraoGrelha,
    time: "25 min",
    kcal: 480,
    category: "Jantar",
    tags: ["Alto em Proteína", "Rico em Minerais"],
    objetivo: "Hipertrofia",
    ingredients: ["200g camarão limpo", "100g arroz", "Mix de legumes (ervilha, milho, cenoura)", "Alho, azeite e limão"],
    instructions: "1. Tempere camarão com alho e limão.\n2. Grelhe em frigideira quente com azeite.\n3. Cozinhe arroz com legumes.\n4. Sirva camarão sobre o arroz.",
    substituicoes: ["Camarão → filé de peixe em cubos", "Arroz → cuscuz marroquino", "Legumes → brócolis e pimentão"],
    ajusteEstrategico: "Camarão é fonte de zinco e selênio — minerais-chave para produção de testosterona e recuperação muscular.",
    dicaPratica: "Camarão congelado e limpo cozinha em 3 minutos. Compre o pacote de 400g e use em 2 refeições.",
  },
  // ===== LANCHE DA TARDE (Emagrecimento) =====
  {
    id: "29",
    title: "Iogurte Grego com Granola e Frutas",
    image: recipeIogurteGranola,
    time: "5 min",
    kcal: 200,
    category: "Lanche da Tarde",
    tags: ["Probiótico", "Rápido"],
    objetivo: "Emagrecimento",
    ingredients: ["170g iogurte grego zero", "20g granola sem açúcar", "5 morangos", "5 mirtilos"],
    instructions: "1. Coloque iogurte em bowl.\n2. Adicione granola e frutas por cima.\n3. Pronto para consumir.",
    substituicoes: ["Iogurte grego → skyr", "Granola → aveia em flocos", "Morangos → banana fatiada"],
    ajusteEstrategico: "Iogurte grego zero tem 15g de proteína por pote. Probióticos melhoram absorção de nutrientes e saúde intestinal — fundamental em dieta restritiva.",
    dicaPratica: "Monte no pote do iogurte mesmo. Leve na bolsa com um sachê de granola — lanche de escritório perfeito.",
  },
  {
    id: "30",
    title: "Bolinhas de Energia (Energy Balls)",
    image: recipeBolinhaEnergia,
    time: "15 min",
    kcal: 180,
    category: "Lanche da Tarde",
    tags: ["Sem Açúcar", "Rico em Fibra"],
    objetivo: "Emagrecimento",
    ingredients: ["50g aveia", "2 col. sopa pasta de amendoim", "1 col. sopa mel", "1 col. sopa cacau em pó", "1 col. sopa chia"],
    instructions: "1. Misture todos os ingredientes.\n2. Modele bolinhas de ~20g.\n3. Leve à geladeira por 30 min.\n4. Guarde em pote hermético.",
    substituicoes: ["Pasta de amendoim → pasta de castanha", "Mel → xarope de agave", "Cacau → coco ralado"],
    ajusteEstrategico: "Snack denso com gorduras boas e fibra que estabiliza a glicemia entre refeições. Substitui barrinhas industrializadas cheias de açúcar escondido.",
    dicaPratica: "Renda: 8-10 bolinhas. Duram 7 dias na geladeira. Leve 2 por dia na bolsa como snack de emergência.",
  },
  {
    id: "31",
    title: "Barra Proteica Caseira",
    image: recipeBarraProteica,
    time: "20 min + geladeira",
    kcal: 220,
    category: "Lanche da Tarde",
    tags: ["Alto em Proteína", "Sem Açúcar"],
    objetivo: "Emagrecimento",
    ingredients: ["30g whey protein", "40g aveia", "2 col. sopa pasta de amendoim", "1 col. sopa mel", "20g castanhas picadas"],
    instructions: "1. Misture whey, aveia e pasta de amendoim.\n2. Adicione mel para dar liga.\n3. Pressione em forma retangular.\n4. Espalhe castanhas por cima e leve à geladeira por 2h.\n5. Corte em barras.",
    substituicoes: ["Whey → proteína vegana", "Mel → xilitol", "Castanhas → amêndoas ou nozes"],
    ajusteEstrategico: "20g de proteína por barra sem conservantes artificiais. Custo 3x menor que barras de farmácia com perfil nutricional superior.",
    dicaPratica: "Faça 8 barras no domingo. Embale individualmente em filme PVC e leve uma por dia — substitui o lanche da cantina.",
  },
  // ===== LANCHE DA TARDE (Hipertrofia) =====
  {
    id: "32",
    title: "Shake de Whey com Banana e Aveia",
    image: recipeShakeWhey,
    time: "5 min",
    kcal: 450,
    category: "Lanche da Tarde",
    tags: ["Pós-treino", "Alto em Proteína"],
    objetivo: "Hipertrofia",
    ingredients: ["30g whey protein", "1 banana", "200ml leite integral", "2 col. sopa aveia", "1 col. sopa pasta de amendoim"],
    instructions: "1. Bata tudo no liquidificador por 30 segundos.\n2. Sirva gelado.",
    substituicoes: ["Leite → água de coco (reduz 80kcal)", "Banana → manga", "Pasta de amendoim → óleo de coco"],
    ajusteEstrategico: "35g de proteína + 50g de carboidrato = combo anabólico perfeito pós-treino. A aveia prolonga a absorção, mantendo o fluxo de aminoácidos.",
    dicaPratica: "Pré-monte os ingredientes secos em sacos zip. No pós-treino, é só adicionar leite e bater — 30 segundos.",
  },
  {
    id: "33",
    title: "Muffin de Batata Doce com Frango",
    image: recipeMuffinBatata,
    time: "35 min",
    kcal: 380,
    category: "Lanche da Tarde",
    tags: ["Meal Prep", "Alto em Proteína"],
    objetivo: "Hipertrofia",
    ingredients: ["200g batata doce cozida", "100g frango desfiado", "2 ovos", "Temperos e cebolinha", "Queijo parmesão ralado"],
    instructions: "1. Amasse a batata doce e misture com ovos.\n2. Adicione frango desfiado e temperos.\n3. Distribua em forminhas de muffin.\n4. Cubra com parmesão.\n5. Asse a 180°C por 20 min.",
    substituicoes: ["Batata doce → abóbora", "Frango → atum", "Parmesão → queijo minas ralado"],
    ajusteEstrategico: "Snack salgado com 25g proteína por porção. A batata doce fornece carboidrato de baixo IG, evitando picos de insulina fora da janela pós-treino.",
    dicaPratica: "Rende 6 muffins. Congele individualmente e leve 2 por dia. Aqueça 1 min no micro.",
  },
  // ===== CEIA (Emagrecimento) =====
  {
    id: "34",
    title: "Chá de Camomila com Amêndoas e Chocolate",
    image: recipeChaAmendoas,
    time: "5 min",
    kcal: 150,
    category: "Ceia",
    tags: ["Relaxante", "Low Carb"],
    objetivo: "Emagrecimento",
    ingredients: ["1 xícara de chá de camomila", "10 amêndoas", "2 quadrados de chocolate 70%"],
    instructions: "1. Prepare o chá de camomila.\n2. Separe as amêndoas e chocolate em pratinho.\n3. Consuma lentamente antes de dormir.",
    substituicoes: ["Camomila → erva-cidreira ou maracujá", "Amêndoas → castanha-do-pará (3 unidades)", "Chocolate 70% → 85% (menos açúcar)"],
    ajusteEstrategico: "Magnésio das amêndoas + triptofano do cacau + camomila = trio do sono reparador. Sono de qualidade é essencial para emagrecimento — cortisol descontrolado armazena gordura.",
    dicaPratica: "Deixe um potinho com a porção já separada na mesa de cabeceira. Crie o ritual: chá + lanche + sono.",
  },
  {
    id: "35",
    title: "Cottage com Nozes e Mel",
    image: recipeCottageNozes,
    time: "3 min",
    kcal: 180,
    category: "Ceia",
    tags: ["Alto em Proteína", "Caseína"],
    objetivo: "Emagrecimento",
    ingredients: ["100g cottage", "5 nozes", "1 col. chá mel", "Canela a gosto"],
    instructions: "1. Coloque cottage em bowl.\n2. Adicione nozes e mel.\n3. Polvilhe canela.",
    substituicoes: ["Cottage → ricota fresca", "Nozes → castanha-de-caju", "Mel → pasta de amendoim"],
    ajusteEstrategico: "Cottage é rico em caseína — proteína de digestão lenta (6-8h). Mantém fluxo de aminoácidos durante o sono, preservando massa magra em déficit calórico.",
    dicaPratica: "Compre o pote grande e já separe porções de 100g em potinhos. Cada porção dura 3 dias na geladeira.",
  },
  {
    id: "36",
    title: "Pudim de Caseína com Cacau e Chia",
    image: recipePudimCaseina,
    time: "5 min + geladeira",
    kcal: 200,
    category: "Ceia",
    tags: ["Alto em Proteína", "Anti-catabolismo"],
    objetivo: "Emagrecimento",
    ingredients: ["30g caseína sabor chocolate", "150ml leite desnatado", "1 col. sopa chia", "Cacau em pó a gosto"],
    instructions: "1. Misture caseína com leite gelado.\n2. Adicione chia e cacau.\n3. Mexa bem e leve à geladeira por 1h.\n4. A chia vai engrossar dando textura de pudim.",
    substituicoes: ["Caseína → whey (digestão mais rápida)", "Leite → água (menos calórico)", "Chia → linhaça"],
    ajusteEstrategico: "Caseína micelar é a proteína de escolha noturna: 7h de liberação lenta de aminoácidos. A chia adiciona ômega-3 e fibra sem calorias relevantes.",
    dicaPratica: "Prepare antes do jantar e deixe na geladeira. Quando a vontade de doce bater à noite, está pronto e esperando.",
  },
  // ===== CEIA (Hipertrofia) =====
  {
    id: "37",
    title: "Shake Noturno de Caseína com Pasta de Amendoim",
    image: recipePudimCaseina,
    time: "5 min",
    kcal: 350,
    category: "Ceia",
    tags: ["Anti-catabolismo", "Alto em Proteína"],
    objetivo: "Hipertrofia",
    ingredients: ["30g caseína", "200ml leite integral", "1 col. sopa pasta de amendoim", "1 banana pequena", "Gelo a gosto"],
    instructions: "1. Bata todos os ingredientes no liquidificador.\n2. Sirva gelado antes de dormir.",
    substituicoes: ["Caseína → whey + 1 col. sopa aveia", "Leite integral → leite de aveia", "Pasta de amendoim → óleo de coco"],
    ajusteEstrategico: "Combinação calórica densa para evitar catabolismo noturno. A gordura da pasta de amendoim desacelera ainda mais a digestão da caseína, prolongando o efeito anticatabólico.",
    dicaPratica: "Tenha caseína e pasta de amendoim sempre em casa. É a última barreira entre você e a perda de massa durante 8h de jejum noturno.",
  },
  {
    id: "38",
    title: "Cottage Proteico com Nozes e Mel",
    image: recipeCottageNozes,
    time: "3 min",
    kcal: 280,
    category: "Ceia",
    tags: ["Caseína Natural", "Alto em Proteína"],
    objetivo: "Hipertrofia",
    ingredients: ["150g cottage", "8 nozes", "1 col. sopa mel", "30g granola sem açúcar"],
    instructions: "1. Coloque cottage em bowl.\n2. Adicione nozes, mel e granola.\n3. Misture levemente e consuma.",
    substituicoes: ["Cottage → iogurte grego", "Nozes → castanha-do-pará", "Granola → aveia crua"],
    ajusteEstrategico: "Cottage natural é 80% caseína. Com porção generosa + gordura das nozes + carboidrato da granola, cria um ambiente anticatabólico completo para a noite.",
    dicaPratica: "Versão turbinada da ceia de emagrecimento — mesma base, porção maior. Simples assim funciona a periodização nutricional.",
  },
  {
    id: "39",
    title: "Mousse de Whey com Cacau",
    image: recipeMousseWhey,
    time: "5 min",
    kcal: 220,
    category: "Lanche",
    tags: ["Whey Protein", "Sobremesa Fit"],
    objetivo: "Emagrecimento / Hipertrofia",
    ingredients: [
      "30g whey protein chocolate",
      "150g iogurte grego natural",
      "1 col. sopa cacau 100%",
      "1 col. chá adoçante",
      "Morangos para finalizar",
    ],
    instructions:
      "1. Misture whey, iogurte, cacau e adoçante em um bowl.\n2. Bata com fouet até virar mousse cremoso.\n3. Leve à geladeira por 10 min.\n4. Finalize com morangos e cacau em pó.",
    substituicoes: [
      "Iogurte grego → cottage batido",
      "Whey chocolate → whey baunilha + cacau extra",
      "Morangos → frutas vermelhas congeladas",
    ],
    ajusteEstrategico: "Sobremesa proteica de baixa caloria que mata vontade de doce sem sair do plano. O cacau 100% acrescenta antioxidantes e dá cremosidade sem açúcar.",
    dicaPratica: "Faça 3 porções no domingo e congele em potinhos. Lanche da tarde resolvido para a semana inteira em 5 minutos.",
  },
  {
    id: "40",
    title: "Patinho Grelhado com Batata-doce",
    image: recipePatinhoGrelhado,
    time: "20 min",
    kcal: 410,
    category: "Almoço",
    tags: ["Carne Magra", "Alto em Proteína"],
    objetivo: "Hipertrofia / Definição",
    ingredients: [
      "180g patinho em bifes",
      "150g batata-doce em cubos",
      "100g brócolis cozido no vapor",
      "Alho, sal, pimenta-do-reino",
      "1 col. chá azeite",
    ],
    instructions:
      "1. Tempere o patinho com alho, sal e pimenta.\n2. Asse a batata-doce no forno por 15 min a 200°C.\n3. Grelhe o patinho 3 min de cada lado.\n4. Cozinhe o brócolis no vapor por 4 min.\n5. Monte o prato e finalize com fio de azeite.",
    substituicoes: [
      "Patinho → coxão duro, alcatra ou músculo",
      "Batata-doce → mandioquinha ou inhame",
      "Brócolis → couve-flor ou abobrinha",
    ],
    ajusteEstrategico: "Carne vermelha magra entrega ferro heme, creatina natural e B12 — combo essencial para performance e hipertrofia. Combinada com carbo de baixo IG, sustenta energia por 4-5h.",
    dicaPratica: "Compre patinho em bifes finos (150-200g). Grelha em 6 minutos e fica suculento. Marmita de domingo: prepare 4 porções de uma vez.",
  },
  {
    id: "41",
    title: "Mexido de Ovos no Pão Integral",
    image: recipeMexidoOvos,
    time: "8 min",
    kcal: 340,
    category: "Café da manhã",
    tags: ["Rápido", "Alto em Proteína"],
    objetivo: "Hipertrofia / Manutenção",
    ingredients: [
      "3 ovos inteiros",
      "2 fatias pão integral",
      "½ abacate fatiado",
      "5 tomates-cereja",
      "Sal, pimenta e cebolinha",
    ],
    instructions:
      "1. Bata os ovos com sal e pimenta.\n2. Cozinhe em fogo baixo mexendo até ponto cremoso (3 min).\n3. Toste o pão integral.\n4. Monte: pão como base, ovos por cima, abacate e tomate.\n5. Finalize com cebolinha picada.",
    substituicoes: [
      "Ovos inteiros → 2 ovos + 3 claras (versão low fat)",
      "Pão integral → tapioca ou batata-doce",
      "Abacate → cottage ou queijo branco",
    ],
    ajusteEstrategico: "Ovos são a proteína de maior valor biológico (PDCAAS 1.0). Combinados com gordura monoinsaturada do abacate e carbo complexo do pão, criam saciedade prolongada para começar o dia.",
    dicaPratica: "Mexa os ovos em fogo BAIXO. Alta temperatura deixa borrachudo e perde nutrientes. Leve 1 min a mais, mas ganhe textura cremosa de chef.",
  },
  {
    id: "42",
    title: "Gelatina Proteica de Morango",
    image: recipeGelatinaProteica,
    time: "5 min + 2h gelar",
    kcal: 90,
    category: "Lanche da Tarde",
    tags: ["Sem Açúcar", "Low Calorie"],
    objetivo: "Emagrecimento / Definição",
    ingredients: [
      "1 sachê gelatina diet morango",
      "200ml água quente + 200ml água gelada",
      "15g whey protein morango",
      "Morangos frescos picados",
      "Folhas de hortelã",
    ],
    instructions:
      "1. Dissolva a gelatina na água quente conforme embalagem.\n2. Adicione a água gelada e mexa.\n3. Quando começar a esfriar, misture o whey dissolvido em 50ml de água.\n4. Acrescente morangos picados.\n5. Leve à geladeira por 2h. Finalize com hortelã.",
    substituicoes: [
      "Whey morango → whey baunilha + 1 col. essência",
      "Gelatina morango → uva, abacaxi ou frutas vermelhas",
      "Morangos → kiwi, manga ou pêssego",
    ],
    ajusteEstrategico: "A gelatina é fonte natural de colágeno tipo I e II — essencial para articulações em quem treina pesado. Com adição de whey, vira lanche proteico (15g) com apenas 90 kcal.",
    dicaPratica: "Faça em potinhos individuais de 100ml. Tenha sempre 5-6 na geladeira para emergências de fome ou vontade de doce sem culpa.",
  },
  {
    id: "43",
    title: "Almôndega Fit ao Forno",
    image: recipeAlmondegaFit,
    time: "30 min",
    kcal: 450,
    category: "Jantar",
    tags: ["Carne Magra", "Comfort Food Fit"],
    objetivo: "Hipertrofia",
    ingredients: [
      "200g patinho moído",
      "1 ovo inteiro",
      "2 col. sopa aveia em flocos",
      "Cebola, alho, salsa picados",
      "100g arroz integral cozido",
      "20g queijo muçarela light",
    ],
    instructions:
      "1. Misture carne, ovo, aveia, cebola, alho e salsa.\n2. Tempere com sal e pimenta.\n3. Modele 1 hambúrguer grande ou 4 almôndegas.\n4. Asse no forno a 200°C por 18 min.\n5. Adicione muçarela nos últimos 3 min.\n6. Sirva sobre arroz integral com salada.",
    substituicoes: [
      "Patinho → frango moído ou peru moído",
      "Aveia → farinha de mandioca ou farinha de grão-de-bico",
      "Arroz integral → quinoa ou batata-doce",
    ],
    ajusteEstrategico: "Receita comfort food saudável: ovo + aveia substituem farinha de rosca tradicional, mantendo textura sem peso glicêmico desnecessário. Carne magra entrega 40g+ de proteína completa.",
    dicaPratica: "Faça 8 almôndegas, congele cruas em saco zip. À noite tira 4 do freezer e leva direto ao forno. Jantar caseiro pronto em 25 min sem planejamento.",
  },
];

export const recipeCategories = ["Todos", "Café da manhã", "Almoço", "Lanche", "Lanche da Tarde", "Jantar", "Ceia"] as const;
