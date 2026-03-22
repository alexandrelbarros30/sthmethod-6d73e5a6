-- Delete existing diet_foods and diet_meals for the student to re-sync with fixed parser
DELETE FROM diet_foods WHERE meal_id IN (
  SELECT id FROM diet_meals WHERE user_id = '8375b630-5373-4e8a-bd16-37c57357549d'
);
DELETE FROM diet_meals WHERE user_id = '8375b630-5373-4e8a-bd16-37c57357549d';

-- Re-insert meals with correct data (5 meals as prescribed)
INSERT INTO diet_meals (user_id, name, time, sort_order) VALUES
  ('8375b630-5373-4e8a-bd16-37c57357549d', 'Café da Manhã', '07:00', 0),
  ('8375b630-5373-4e8a-bd16-37c57357549d', 'Lanche da Manhã', '10:00', 1),
  ('8375b630-5373-4e8a-bd16-37c57357549d', 'Almoço', '12:00', 2),
  ('8375b630-5373-4e8a-bd16-37c57357549d', 'Lanche da Tarde', '15:00', 3),
  ('8375b630-5373-4e8a-bd16-37c57357549d', 'Ceia', '21:00', 4);

-- Café da Manhã foods
INSERT INTO diet_foods (meal_id, item, quantity, sort_order)
SELECT dm.id, f.item, f.quantity, f.sort_order
FROM diet_meals dm,
(VALUES
  ('2 OVOS INTEIROS + 3 CLARAS PREPARADOS DA MANEIRA QUE PREFERIR', 'porção', 0),
  ('4 TORRADAS INTEGRAIS ou 2 FATIAS DE PÃO DE FORMA INTEGRAL/NORMAL ou 1 PÃO FRANCÊS', 'porção', 1),
  ('170g DE IOGURTE NATURAL DESNATADO ou IOGURTE ZERO ou 200ml LEITE DESNATADO ou 20g LEITE EM PO DESNATADO', '170g', 2),
  ('30g WHEY PROTEIN', '30g', 3),
  ('1 XÍCARA DE CAFÉ ou CHÁ SEM AÇUCAR OU POUCO ADOÇANTE', 'porção', 4)
) AS f(item, quantity, sort_order)
WHERE dm.user_id = '8375b630-5373-4e8a-bd16-37c57357549d' AND dm.sort_order = 0;

-- Lanche da Manhã foods (Refeição 2)
INSERT INTO diet_foods (meal_id, item, quantity, sort_order)
SELECT dm.id, f.item, f.quantity, f.sort_order
FROM diet_meals dm,
(VALUES
  ('150g ARROZ BRANCO/INTEGRAL ou 250g DE BATATA INGLESA COZIDA ou 170g BATATA DOCE COZIDA ou 150g AIPIM COZIDO', '150g', 0),
  ('250g DE FILÉ DE FRANGO, PEIXE OU CARNE VERMELHA MAGRA ou MIGNON SUÍNO', '250g', 1),
  ('100g BROCOLIS / COUVE FLOR / ABOBRINHA/ REPOLHO/ CHUCHU / QUIABO/ ABOBORA/ JILO/ CENOURA/ BERINJELA/ VAGEM', '100g', 2),
  ('SALADA À VONTADE', 'À vontade', 3),
  ('5ml AZEITE EXTRA VIRGEM', '5ml', 4),
  ('ÁGUA', 'À vontade', 5)
) AS f(item, quantity, sort_order)
WHERE dm.user_id = '8375b630-5373-4e8a-bd16-37c57357549d' AND dm.sort_order = 1;

-- Almoço foods (Refeição 3)
INSERT INTO diet_foods (meal_id, item, quantity, sort_order)
SELECT dm.id, f.item, f.quantity, f.sort_order
FROM diet_meals dm,
(VALUES
  ('2 OVOS INTEIROS PREPARADOS DA MANEIRA QUE PREFERIR ou 70g PEITO DE FRANGO DESFIADO + 30g REQUEIJÃO LIGHT', 'porção', 0),
  ('4 TORRADAS INTEGRAIS ou 2 FATIAS DE PÃO DE FORMA INTEGRAL/NORMAL ou 1 PÃO FRANCÊS', 'porção', 1),
  ('1 BANANA MÉDIA ou 150g MAMÃO/ MELÃO/ MELANCIA/ UVA/ MAÇA/ LARANJA/ TANGERINA/ MANGA...', 'porção', 2),
  ('170g DE IOGURTE NATURAL DESNATADO ou IOGURTE ZERO ou 200ml LEITE DESNATADO ou 20g LEITE EM PO DESNATADO', '170g', 3),
  ('1 XÍCARA DE CAFÉ ou CHÁ SEM AÇUCAR OU POUCO ADOÇANTE', 'porção', 4),
  ('ÁGUA', 'À vontade', 5)
) AS f(item, quantity, sort_order)
WHERE dm.user_id = '8375b630-5373-4e8a-bd16-37c57357549d' AND dm.sort_order = 2;

-- Lanche da Tarde foods (Refeição 4)
INSERT INTO diet_foods (meal_id, item, quantity, sort_order)
SELECT dm.id, f.item, f.quantity, f.sort_order
FROM diet_meals dm,
(VALUES
  ('250g DE FILÉ DE FRANGO, PEIXE OU CARNE VERMELHA MAGRA ou MIGNON SUÍNO', '250g', 0),
  ('SALADA À VONTADE', 'À vontade', 1),
  ('AZEITE 5ML', '5ml', 2),
  ('AGUA, REFRIGERANTE ZERO, CLIGHT, MID ZERO, ICE TEA... BEBA MODERADAMENTE (300-350ml)', 'porção', 3)
) AS f(item, quantity, sort_order)
WHERE dm.user_id = '8375b630-5373-4e8a-bd16-37c57357549d' AND dm.sort_order = 3;

-- Ceia foods (Refeição 5)
INSERT INTO diet_foods (meal_id, item, quantity, sort_order)
SELECT dm.id, f.item, f.quantity, f.sort_order
FROM diet_meals dm,
(VALUES
  ('30g WHEY PROTEIN', '30g', 0),
  ('170g DE IOGURTE NATURAL DESNATADO ou IOGURTE ZERO ou 200ml LEITE DESNATADO ou 20g LEITE EM PO DESNATADO', '170g', 1),
  ('ÁGUA', 'À vontade', 2)
) AS f(item, quantity, sort_order)
WHERE dm.user_id = '8375b630-5373-4e8a-bd16-37c57357549d' AND dm.sort_order = 4