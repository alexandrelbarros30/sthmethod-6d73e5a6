// Doutrina oficial STHIA — formato de cardápio STH METHOD.
// Refeição base (⭐ BASE) + 4 opções (Total 5), texto puro, mesma identidade do portal do aluno.
export const STHIA_DIET_FORMAT = `
FORMATO OBRIGATÓRIO DO CARDÁPIO — TEXTO PURO (sem markdown, sem HTML, sem crases, sem tabelas):

Refeição 01: Desjejum (Ativação Metabólica) — 07:00 · 477 kcal · P 49g / C 44g / G 10g

"⭐ BASE:
1 ovo inteiro + 3 claras + 40g de farelo de aveia + 100g de mamão formosa.

Opção 2:
30g de whey + 40g de farelo de aveia + 100g de morangos.

Opção 3:
2 fatias de pão integral (50g) + 100g de frango desfiado + 30g de cottage zero.

Opção 4:
170g de iogurte grego zero + 25g de whey + 25g de granola integral.

Opção 5:
3 ovos mexidos + 1 fatia de pão integral (25g) + 100g de abacaxi."

REGRAS DE FORMATAÇÃO (invioláveis):
- Cada refeição começa com: Refeição NN: Nome (Subtítulo estratégico) — HH:MM · N kcal · P Ng / C Ng / G Ng (numeração 01, 02, 03...).
- Cada refeição tem SEMPRE a refeição BASE + 4 opções de substituição (Opção 2, 3, 4 e 5), isocalóricas e equivalentes em macros à BASE (tolerância ±5%). Nunca entregue menos de 4 opções (Total 5).
- Use uma LINHA EM BRANCO entre o título da refeição e o bloco de opções.
- Use aspas duplas (") envolvendo TODO o bloco de opções (da BASE até a Opção 5).
- Use uma LINHA EM BRANCO entre cada opção.
- CÁLCULO (metodologia STH METHOD): as kcal e os macros do cabeçalho são calculados EXCLUSIVAMENTE sobre a refeição BASE. Use a API FatSecret como referência real.
- O somatório das kcal e macros das refeições BASE deve fechar a meta diária informada no briefing (tolerância ±5%). 
- COERÊNCIA ENERGÉTICA (Atwater, obrigatória): em cada cabeçalho, kcal = (P x 4) + (C x 4) + (G x 9). 
- Quantidades sempre explícitas em g/ml/unidades, alimentos em português BR.
- OVOS E CLARAS (regra inviolável): sempre em UNIDADES, nunca em gramas. Escreva "2 ovos inteiros", "3 claras de ovo".
- Seções de texto como "Resumo estratégico" ou "Hidratação" podem usar <h3> para organização se necessário, mas o corpo das refeições DEVE ser texto puro.
`;
