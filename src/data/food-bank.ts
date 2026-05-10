// Banco de alimentos local (base TACO/TBCA — valores por 100g ou 100ml).
// Curado para cobrir os itens mais usados em dietas brasileiras.
// Estrutura idêntica ao retorno da edge "fatsecret-search" para troca transparente.

export type LocalFood = {
  id: string;
  name: string;
  source: "TACO";
  category: string;
  serving_unit: "g" | "ml";
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
};

const f = (
  id: string,
  name: string,
  category: string,
  kcal: number,
  p: number,
  c: number,
  g: number,
  fiber = 0,
  sodium = 0,
  unit: "g" | "ml" = "g"
): LocalFood => ({
  id: `taco_${id}`,
  name,
  source: "TACO",
  category,
  serving_unit: unit,
  energy_kcal: kcal,
  protein_g: p,
  carbs_g: c,
  fat_g: g,
  fiber_g: fiber,
  sugar_g: 0,
  sodium_mg: sodium,
  cholesterol_mg: 0,
});

export const FOOD_BANK: LocalFood[] = [
  // ===== Cereais, pães e massas =====
  f("001", "Arroz branco cozido", "Cereais", 128, 2.5, 28.1, 0.2, 1.6, 1),
  f("002", "Arroz integral cozido", "Cereais", 124, 2.6, 25.8, 1.0, 2.7, 1),
  f("003", "Arroz parboilizado cozido", "Cereais", 131, 2.5, 28.6, 0.3, 1.6, 1),
  f("004", "Aveia em flocos crua", "Cereais", 394, 13.9, 66.6, 8.5, 9.1, 5),
  f("005", "Granola tradicional", "Cereais", 471, 11.5, 65.0, 18.0, 6.0, 25),
  f("006", "Pão francês", "Pães", 300, 8.0, 58.6, 3.1, 2.3, 643),
  f("007", "Pão de forma integral", "Pães", 253, 9.4, 49.7, 3.0, 6.9, 491),
  f("008", "Pão de forma branco", "Pães", 273, 9.3, 50.4, 3.4, 2.3, 540),
  f("009", "Pão sírio integral", "Pães", 262, 9.1, 53.0, 1.6, 5.0, 500),
  f("010", "Tapioca (goma hidratada)", "Cereais", 240, 0.0, 60.0, 0.0, 0.0, 0),
  f("011", "Macarrão cozido", "Massas", 158, 5.8, 30.9, 1.3, 1.6, 1),
  f("012", "Macarrão integral cozido", "Massas", 142, 5.3, 27.4, 1.5, 4.5, 1),
  f("013", "Cuscuz de milho cozido", "Cereais", 113, 2.3, 25.0, 0.4, 1.5, 1),
  f("014", "Quinoa cozida", "Cereais", 120, 4.4, 21.3, 1.9, 2.8, 7),
  f("015", "Farinha de aveia", "Cereais", 394, 13.9, 66.6, 8.5, 9.1, 5),
  f("016", "Farinha de mandioca", "Cereais", 361, 1.2, 87.9, 0.3, 6.4, 2),
  f("017", "Farinha de trigo", "Cereais", 360, 9.8, 75.1, 1.4, 2.3, 1),
  f("018", "Polvilho doce", "Cereais", 357, 0.3, 89.4, 0.1, 0.0, 1),
  f("019", "Tapioca pronta (1 unid 50g)", "Cereais", 240, 0.0, 60.0, 0.0, 0.0, 0),
  f("020", "Biscoito cream cracker", "Pães", 432, 11.2, 67.7, 13.7, 2.7, 760),

  // ===== Carnes bovinas =====
  f("100", "Patinho bovino grelhado", "Carnes", 219, 35.9, 0.0, 7.3, 0.0, 51),
  f("101", "Patinho bovino moído cozido", "Carnes", 212, 27.4, 0.0, 11.4, 0.0, 56),
  f("102", "Coxão mole grelhado", "Carnes", 219, 32.4, 0.0, 9.4, 0.0, 51),
  f("103", "Alcatra grelhada", "Carnes", 220, 35.0, 0.0, 8.5, 0.0, 50),
  f("104", "Filé mignon grelhado", "Carnes", 220, 32.0, 0.0, 9.5, 0.0, 50),
  f("105", "Picanha grelhada", "Carnes", 289, 26.7, 0.0, 19.7, 0.0, 50),
  f("106", "Contrafilé grelhado", "Carnes", 224, 32.4, 0.0, 9.9, 0.0, 50),
  f("107", "Acém cozido", "Carnes", 215, 30.3, 0.0, 9.7, 0.0, 50),
  f("108", "Maminha grelhada", "Carnes", 230, 32.0, 0.0, 11.0, 0.0, 50),
  f("109", "Costela bovina assada", "Carnes", 373, 22.0, 0.0, 31.0, 0.0, 50),
  f("110", "Carne seca dessalgada", "Carnes", 311, 27.5, 0.0, 22.3, 0.0, 1100),

  // ===== Frango / aves =====
  f("130", "Peito de frango grelhado (sem pele)", "Aves", 159, 32.0, 0.0, 3.0, 0.0, 53),
  f("131", "Peito de frango cozido", "Aves", 153, 31.5, 0.0, 2.5, 0.0, 50),
  f("132", "Sobrecoxa de frango assada (sem pele)", "Aves", 215, 26.0, 0.0, 12.5, 0.0, 80),
  f("133", "Coxa de frango assada (sem pele)", "Aves", 215, 24.0, 0.0, 13.0, 0.0, 80),
  f("134", "Frango desfiado cozido", "Aves", 165, 31.0, 0.0, 4.0, 0.0, 60),
  f("135", "Peito de peru defumado", "Aves", 110, 18.0, 2.0, 3.0, 0.0, 1090),
  f("136", "Ovo de galinha cozido", "Ovos", 146, 13.3, 0.6, 9.5, 0.0, 140),
  f("137", "Ovo de galinha frito", "Ovos", 240, 13.6, 0.7, 20.3, 0.0, 200),
  f("138", "Clara de ovo cozida", "Ovos", 52, 11.0, 0.7, 0.2, 0.0, 166),
  f("139", "Gema de ovo cozida", "Ovos", 354, 16.0, 0.6, 31.9, 0.0, 51),

  // ===== Peixes e frutos do mar =====
  f("160", "Tilápia grelhada", "Peixes", 128, 26.2, 0.0, 1.7, 0.0, 56),
  f("161", "Salmão grelhado", "Peixes", 208, 22.5, 0.0, 12.4, 0.0, 47),
  f("162", "Atum em conserva (água)", "Peixes", 116, 26.0, 0.0, 1.0, 0.0, 247),
  f("163", "Atum em conserva (óleo)", "Peixes", 198, 25.0, 0.0, 10.0, 0.0, 350),
  f("164", "Sardinha em conserva (óleo)", "Peixes", 208, 24.6, 0.0, 11.5, 0.0, 307),
  f("165", "Bacalhau cozido", "Peixes", 109, 23.5, 0.0, 0.9, 0.0, 78),
  f("166", "Pescada grelhada", "Peixes", 110, 23.0, 0.0, 1.5, 0.0, 80),
  f("167", "Camarão cozido", "Peixes", 90, 19.0, 0.0, 1.2, 0.0, 224),
  f("168", "Merluza grelhada", "Peixes", 113, 24.0, 0.0, 1.3, 0.0, 90),

  // ===== Carne suína =====
  f("180", "Lombo suíno assado", "Carnes", 210, 29.0, 0.0, 10.0, 0.0, 60),
  f("181", "Bisteca suína grelhada", "Carnes", 264, 28.5, 0.0, 16.5, 0.0, 70),
  f("182", "Costela suína assada", "Carnes", 397, 22.0, 0.0, 34.0, 0.0, 90),
  f("183", "Bacon frito", "Carnes", 541, 37.0, 0.0, 41.8, 0.0, 1717),

  // ===== Embutidos =====
  f("200", "Presunto magro", "Embutidos", 100, 17.0, 1.5, 3.0, 0.0, 950),
  f("201", "Salame", "Embutidos", 398, 21.0, 1.5, 33.0, 0.0, 2260),
  f("202", "Salsicha", "Embutidos", 257, 14.4, 2.0, 21.0, 0.0, 909),
  f("203", "Linguiça calabresa", "Embutidos", 308, 15.0, 1.5, 26.0, 0.0, 1300),
  f("204", "Mortadela", "Embutidos", 273, 11.5, 4.0, 23.0, 0.0, 1000),
  f("205", "Hambúrguer bovino grelhado", "Embutidos", 250, 18.0, 2.5, 18.0, 0.0, 470),

  // ===== Laticínios =====
  f("230", "Leite integral", "Laticínios", 61, 3.2, 4.7, 3.3, 0.0, 49, "ml"),
  f("231", "Leite semidesnatado", "Laticínios", 47, 3.3, 4.8, 1.7, 0.0, 50, "ml"),
  f("232", "Leite desnatado", "Laticínios", 35, 3.4, 4.9, 0.2, 0.0, 52, "ml"),
  f("233", "Iogurte natural integral", "Laticínios", 51, 4.1, 1.9, 3.0, 0.0, 50),
  f("234", "Iogurte natural desnatado", "Laticínios", 41, 4.6, 6.0, 0.2, 0.0, 52),
  f("235", "Iogurte grego natural", "Laticínios", 96, 9.0, 4.0, 5.0, 0.0, 35),
  f("236", "Iogurte grego zero", "Laticínios", 59, 10.0, 4.0, 0.0, 0.0, 40),
  f("237", "Queijo minas frescal", "Laticínios", 264, 17.4, 3.2, 20.2, 0.0, 35),
  f("238", "Queijo mussarela", "Laticínios", 280, 22.6, 3.0, 19.5, 0.0, 540),
  f("239", "Queijo prato", "Laticínios", 360, 22.7, 1.9, 29.1, 0.0, 580),
  f("240", "Queijo cottage", "Laticínios", 98, 11.0, 3.4, 4.3, 0.0, 364),
  f("241", "Queijo ricota", "Laticínios", 174, 11.3, 3.0, 13.0, 0.0, 84),
  f("242", "Queijo parmesão ralado", "Laticínios", 453, 35.7, 4.1, 32.7, 0.0, 1804),
  f("243", "Requeijão cremoso tradicional", "Laticínios", 257, 9.6, 3.0, 23.0, 0.0, 575),
  f("244", "Requeijão light", "Laticínios", 175, 11.0, 3.0, 13.0, 0.0, 590),
  f("245", "Manteiga com sal", "Laticínios", 726, 0.4, 0.0, 82.4, 0.0, 579),
  f("246", "Margarina 80% lipídios", "Laticínios", 596, 0.0, 0.6, 65.4, 0.0, 750),
  f("247", "Cream cheese", "Laticínios", 252, 6.0, 4.0, 24.0, 0.0, 320),
  f("248", "Whey protein concentrado (em pó)", "Suplementos", 412, 80.0, 5.0, 6.0, 0.0, 250),
  f("249", "Whey protein isolado (em pó)", "Suplementos", 380, 90.0, 1.0, 1.0, 0.0, 200),
  f("250", "Albumina (em pó)", "Suplementos", 388, 86.0, 5.0, 0.5, 0.0, 1000),
  f("251", "Caseína (em pó)", "Suplementos", 380, 80.0, 7.0, 1.5, 0.0, 600),

  // ===== Leguminosas =====
  f("280", "Feijão carioca cozido", "Leguminosas", 76, 4.8, 13.6, 0.5, 8.5, 2),
  f("281", "Feijão preto cozido", "Leguminosas", 77, 4.5, 14.0, 0.5, 8.4, 2),
  f("282", "Feijão branco cozido", "Leguminosas", 99, 6.7, 17.5, 0.5, 8.8, 2),
  f("283", "Lentilha cozida", "Leguminosas", 116, 9.0, 20.0, 0.4, 7.9, 2),
  f("284", "Grão de bico cozido", "Leguminosas", 164, 8.9, 27.4, 2.6, 7.6, 7),
  f("285", "Ervilha cozida", "Leguminosas", 84, 6.2, 15.7, 0.4, 5.0, 5),
  f("286", "Soja cozida", "Leguminosas", 173, 16.6, 9.9, 9.0, 6.0, 1),
  f("287", "Tofu firme", "Leguminosas", 76, 8.1, 1.9, 4.8, 0.3, 7),

  // ===== Vegetais e folhosos =====
  f("310", "Alface lisa", "Vegetais", 11, 1.4, 1.7, 0.2, 1.7, 7),
  f("311", "Rúcula", "Vegetais", 25, 2.6, 3.7, 0.7, 1.6, 27),
  f("312", "Espinafre cozido", "Vegetais", 23, 2.9, 3.7, 0.4, 2.4, 70),
  f("313", "Couve refogada", "Vegetais", 90, 2.9, 9.5, 5.0, 5.7, 11),
  f("314", "Couve crua", "Vegetais", 27, 2.9, 4.3, 0.5, 3.1, 9),
  f("315", "Brócolis cozido", "Vegetais", 25, 2.1, 4.0, 0.4, 3.4, 4),
  f("316", "Couve-flor cozida", "Vegetais", 19, 1.2, 4.3, 0.1, 1.8, 1),
  f("317", "Repolho cru", "Vegetais", 24, 1.4, 5.4, 0.2, 2.2, 4),
  f("318", "Tomate cru", "Vegetais", 15, 1.1, 3.1, 0.2, 1.2, 4),
  f("319", "Pepino cru", "Vegetais", 10, 0.9, 2.0, 0.1, 1.1, 1),
  f("320", "Cenoura crua", "Vegetais", 34, 1.3, 7.7, 0.2, 3.2, 65),
  f("321", "Cenoura cozida", "Vegetais", 30, 0.8, 6.7, 0.2, 2.6, 24),
  f("322", "Beterraba crua", "Vegetais", 49, 1.9, 11.1, 0.1, 3.4, 32),
  f("323", "Beterraba cozida", "Vegetais", 32, 1.3, 7.2, 0.1, 1.9, 36),
  f("324", "Abobrinha cozida", "Vegetais", 15, 1.2, 3.0, 0.2, 1.4, 1),
  f("325", "Berinjela cozida", "Vegetais", 24, 1.2, 5.7, 0.2, 2.6, 2),
  f("326", "Chuchu cozido", "Vegetais", 19, 0.5, 4.4, 0.1, 1.0, 2),
  f("327", "Pimentão verde cru", "Vegetais", 21, 0.9, 4.9, 0.2, 2.6, 2),
  f("328", "Pimentão vermelho cru", "Vegetais", 27, 1.0, 6.3, 0.2, 2.0, 1),
  f("329", "Cebola crua", "Vegetais", 39, 1.7, 8.9, 0.1, 2.2, 1),
  f("330", "Alho cru", "Vegetais", 113, 7.0, 23.9, 0.2, 4.3, 9),
  f("331", "Aspargo cozido", "Vegetais", 21, 2.4, 3.4, 0.2, 2.1, 4),
  f("332", "Cogumelo champignon cozido", "Vegetais", 28, 3.1, 5.3, 0.5, 2.2, 5),
  f("333", "Vagem cozida", "Vegetais", 35, 1.9, 7.8, 0.3, 2.7, 6),
  f("334", "Quiabo cozido", "Vegetais", 29, 1.8, 6.2, 0.1, 4.6, 6),

  // ===== Tubérculos =====
  f("360", "Batata inglesa cozida", "Tubérculos", 86, 1.8, 18.5, 0.1, 1.3, 2),
  f("361", "Batata-doce cozida", "Tubérculos", 77, 0.6, 18.4, 0.1, 2.2, 9),
  f("362", "Mandioca cozida", "Tubérculos", 125, 0.6, 30.1, 0.3, 1.6, 0),
  f("363", "Inhame cozido", "Tubérculos", 97, 2.1, 23.3, 0.1, 2.0, 5),
  f("364", "Cará cozido", "Tubérculos", 108, 2.0, 26.0, 0.1, 1.5, 5),
  f("365", "Mandioquinha cozida", "Tubérculos", 80, 1.4, 18.7, 0.2, 1.4, 6),
  f("366", "Abóbora cozida", "Tubérculos", 12, 0.6, 2.8, 0.1, 1.2, 1),
  f("367", "Milho verde cozido", "Cereais", 138, 4.5, 28.6, 1.4, 3.9, 1),

  // ===== Frutas =====
  f("400", "Banana nanica", "Frutas", 92, 1.4, 23.8, 0.1, 1.9, 0),
  f("401", "Banana prata", "Frutas", 98, 1.3, 26.0, 0.1, 2.0, 0),
  f("402", "Maçã com casca", "Frutas", 56, 0.3, 15.2, 0.1, 1.3, 1),
  f("403", "Pera", "Frutas", 53, 0.4, 13.9, 0.2, 3.1, 1),
  f("404", "Mamão formosa", "Frutas", 45, 0.8, 11.6, 0.1, 1.8, 3),
  f("405", "Mamão papaia", "Frutas", 40, 0.5, 10.4, 0.1, 1.0, 3),
  f("406", "Laranja pera", "Frutas", 37, 1.0, 8.9, 0.1, 0.8, 1),
  f("407", "Tangerina", "Frutas", 38, 0.8, 9.6, 0.1, 0.9, 1),
  f("408", "Limão tahiti", "Frutas", 22, 0.7, 7.0, 0.2, 1.2, 2),
  f("409", "Abacaxi", "Frutas", 48, 0.9, 12.3, 0.1, 1.0, 1),
  f("410", "Manga palmer", "Frutas", 64, 0.9, 16.7, 0.2, 2.1, 2),
  f("411", "Melancia", "Frutas", 33, 0.9, 8.1, 0.2, 0.4, 1),
  f("412", "Melão", "Frutas", 29, 0.7, 7.5, 0.1, 0.3, 12),
  f("413", "Morango", "Frutas", 30, 0.9, 6.8, 0.3, 1.7, 1),
  f("414", "Uva itália", "Frutas", 53, 0.7, 13.6, 0.2, 0.9, 1),
  f("415", "Kiwi", "Frutas", 51, 1.1, 11.6, 0.5, 2.7, 5),
  f("416", "Abacate", "Frutas", 96, 1.2, 6.0, 8.4, 6.3, 0),
  f("417", "Coco fresco (polpa)", "Frutas", 354, 3.3, 15.2, 33.5, 9.0, 20),
  f("418", "Goiaba", "Frutas", 54, 1.1, 13.0, 0.4, 6.3, 1),
  f("419", "Maracujá (polpa)", "Frutas", 68, 2.0, 12.3, 2.1, 1.1, 1),
  f("420", "Açaí (polpa pura)", "Frutas", 58, 0.8, 6.2, 3.9, 2.6, 0),
  f("421", "Pêssego", "Frutas", 36, 0.8, 9.1, 0.1, 1.4, 0),
  f("422", "Ameixa", "Frutas", 53, 0.7, 13.9, 0.2, 2.4, 0),
  f("423", "Caju (polpa)", "Frutas", 43, 1.0, 11.6, 0.3, 1.7, 4),
  f("424", "Acerola", "Frutas", 33, 0.9, 7.7, 0.2, 1.5, 7),

  // ===== Frutas secas / oleaginosas =====
  f("450", "Castanha do Pará", "Oleaginosas", 643, 14.5, 15.1, 63.5, 7.9, 1),
  f("451", "Castanha de caju torrada", "Oleaginosas", 570, 18.5, 28.7, 46.3, 3.7, 16),
  f("452", "Amendoim torrado", "Oleaginosas", 544, 27.2, 20.3, 43.9, 8.0, 5),
  f("453", "Pasta de amendoim integral", "Oleaginosas", 584, 25.0, 21.0, 50.0, 6.0, 17),
  f("454", "Amêndoa torrada", "Oleaginosas", 581, 18.6, 29.5, 47.3, 11.6, 1),
  f("455", "Nozes", "Oleaginosas", 620, 14.0, 18.4, 59.4, 5.2, 5),
  f("456", "Avelã", "Oleaginosas", 634, 14.0, 17.0, 61.0, 9.7, 1),
  f("457", "Pistache torrado", "Oleaginosas", 614, 21.0, 24.0, 51.0, 10.6, 5),
  f("458", "Linhaça em grãos", "Oleaginosas", 495, 14.1, 43.3, 32.3, 33.5, 9),
  f("459", "Chia em grãos", "Oleaginosas", 486, 16.5, 42.1, 30.7, 34.4, 16),
  f("460", "Semente de girassol", "Oleaginosas", 584, 20.8, 20.0, 51.5, 8.6, 9),
  f("461", "Uva passa", "Frutas secas", 299, 3.1, 79.2, 0.5, 3.7, 11),
  f("462", "Damasco seco", "Frutas secas", 241, 3.4, 62.6, 0.5, 7.3, 10),
  f("463", "Tâmara seca", "Frutas secas", 277, 1.8, 75.0, 0.2, 6.7, 1),

  // ===== Óleos e gorduras =====
  f("500", "Azeite de oliva extra virgem", "Óleos", 884, 0.0, 0.0, 100.0, 0.0, 2, "ml"),
  f("501", "Óleo de soja", "Óleos", 884, 0.0, 0.0, 100.0, 0.0, 0, "ml"),
  f("502", "Óleo de coco", "Óleos", 892, 0.0, 0.0, 99.1, 0.0, 0, "ml"),
  f("503", "Óleo de canola", "Óleos", 884, 0.0, 0.0, 100.0, 0.0, 0, "ml"),

  // ===== Açúcares e doces =====
  f("530", "Açúcar refinado", "Açúcares", 387, 0.0, 99.5, 0.0, 0.0, 1),
  f("531", "Açúcar mascavo", "Açúcares", 369, 0.4, 95.8, 0.1, 0.0, 11),
  f("532", "Mel de abelha", "Açúcares", 309, 0.4, 84.0, 0.0, 0.4, 5),
  f("533", "Geleia de frutas", "Açúcares", 240, 0.5, 60.0, 0.1, 1.0, 30),
  f("534", "Chocolate ao leite", "Doces", 540, 7.0, 58.0, 30.0, 2.0, 80),
  f("535", "Chocolate amargo 70%", "Doces", 600, 8.0, 35.0, 45.0, 11.0, 20),
  f("536", "Doce de leite pastoso", "Doces", 315, 6.8, 55.5, 7.4, 0.0, 130),
  f("537", "Brigadeiro", "Doces", 380, 5.0, 60.0, 14.0, 0.0, 80),

  // ===== Bebidas =====
  f("600", "Suco de laranja natural", "Bebidas", 36, 0.7, 8.4, 0.1, 0.1, 0, "ml"),
  f("601", "Suco de limão natural", "Bebidas", 22, 0.4, 7.1, 0.2, 0.4, 1, "ml"),
  f("602", "Água de coco", "Bebidas", 22, 0.0, 5.3, 0.0, 1.1, 105, "ml"),
  f("603", "Café preto sem açúcar", "Bebidas", 2, 0.1, 0.0, 0.0, 0.0, 1, "ml"),
  f("604", "Refrigerante cola", "Bebidas", 42, 0.0, 10.4, 0.0, 0.0, 4, "ml"),
  f("605", "Refrigerante zero", "Bebidas", 0, 0.0, 0.0, 0.0, 0.0, 12, "ml"),
  f("606", "Cerveja pilsen", "Bebidas", 43, 0.5, 3.6, 0.0, 0.0, 4, "ml"),
  f("607", "Vinho tinto seco", "Bebidas", 85, 0.1, 2.6, 0.0, 0.0, 4, "ml"),
  f("608", "Whisky", "Bebidas", 250, 0.0, 0.0, 0.0, 0.0, 0, "ml"),
  f("609", "Leite de amêndoas sem açúcar", "Bebidas", 13, 0.4, 0.3, 1.1, 0.4, 60, "ml"),
  f("610", "Leite de soja sem açúcar", "Bebidas", 33, 2.9, 1.8, 1.8, 0.6, 51, "ml"),

  // ===== Molhos e condimentos =====
  f("700", "Maionese tradicional", "Molhos", 700, 1.0, 4.0, 75.0, 0.0, 580),
  f("701", "Ketchup", "Molhos", 102, 1.0, 25.0, 0.1, 0.3, 950),
  f("702", "Mostarda amarela", "Molhos", 67, 4.4, 7.0, 4.0, 3.3, 1135),
  f("703", "Molho de tomate pronto", "Molhos", 65, 1.5, 12.0, 1.5, 1.5, 480),
  f("704", "Molho shoyu", "Molhos", 53, 8.0, 5.0, 0.1, 0.0, 5493, "ml"),
  f("705", "Vinagre", "Molhos", 21, 0.0, 0.6, 0.0, 0.0, 1, "ml"),

  // ===== Snacks / industrializados comuns =====
  f("750", "Barra de proteína 20g", "Suplementos", 380, 30.0, 35.0, 12.0, 6.0, 200),
  f("751", "Barrinha de cereal", "Suplementos", 380, 6.0, 70.0, 8.0, 4.0, 150),
  f("752", "Tapioca recheada com queijo", "Pratos prontos", 280, 8.0, 50.0, 5.0, 0.0, 200),
  f("753", "Pão de queijo", "Pães", 348, 5.5, 41.5, 17.6, 1.0, 600),
];

// Normaliza string para busca (sem acentos, minúscula)
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function searchFoodBank(query: string, limit = 40): LocalFood[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = FOOD_BANK.map((food) => {
    const name = normalize(food.name);
    const cat = normalize(food.category);
    let score = 0;
    for (const t of tokens) {
      if (name.startsWith(t)) score += 10;
      else if (name.includes(` ${t}`)) score += 6;
      else if (name.includes(t)) score += 3;
      else if (cat.includes(t)) score += 1;
      else { score = -1; break; }
    }
    return { food, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name))
    .slice(0, limit)
    .map((x) => x.food);

  return scored;
}