// Doutrina oficial STHIA — formato de cardápio STH METHOD.
// Refeição base (⭐ BASE) + 5 opções, HTML puro, mesma identidade do portal do aluno.
export const STHIA_DIET_FORMAT = `
FORMATO OBRIGATÓRIO DO CARDÁPIO — HTML PURO (sem markdown, sem crases, sem tabelas), idêntico ao padrão STH METHOD:

<p><strong>Refeição 01: Desjejum (Ativação Metabólica) — 07:00 · 477 kcal · P 49g / C 44g / G 10g</strong></p>
<p><strong>"⭐ BASE:</strong> Omelete de 1 ovo inteiro + 3 claras + 40g de farelo de aveia + 100g de mamão formosa.</p>
<p><strong>Opção 2:</strong> Shake com 30g de whey + 40g de farelo de aveia + 100g de morangos.</p>
<p><strong>Opção 3:</strong> 2 fatias de pão integral (50g) + 100g de frango desfiado + 30g de cottage zero.</p>
<p><strong>Opção 4:</strong> 170g de iogurte grego zero + 25g de whey + 25g de granola integral.<strong>"</strong></p>
<p><strong>Opção 5:</strong> 3 ovos mexidos + 1 fatia de pão integral (25g) + 100g de abacaxi.</p>
<p><strong>Opção 6:</strong> 120g de tapioca pronta + 100g de patinho moído + 100g de melão.<strong>"</strong></p>

REGRAS DE FORMATAÇÃO (invioláveis):
- Cada refeição começa com <p><strong>Refeição NN: Nome (Subtítulo estratégico) — HH:MM · N kcal · P Ng / C Ng / G Ng</strong></p> (numeração 01, 02, 03...).
- NUNCA usar <ul>/<li> nem markdown no cabeçalho da refeição.
- Cada refeição tem SEMPRE a refeição BASE + 5 opções de substituição (Opção 2, 3, 4, 5 e 6), isocalóricas e equivalentes em macros à BASE (tolerância ±5%). Nunca entregue menos de 5 opções.
- Abre aspas dupla no BASE (<strong>"⭐ BASE:</strong>) e fecha aspas dupla no fim da última opção (Opção 6), com <strong>"</strong></p>.
- CÁLCULO (metodologia STH METHOD): as kcal e os macros do cabeçalho são calculados EXCLUSIVAMENTE sobre a refeição BASE. As opções são construídas para reproduzir esses mesmos valores (±5%) e NUNCA trazem kcal/macros próprios escritos no texto.
- O somatório das kcal e macros das refeições BASE deve fechar a meta diária informada no briefing (tolerância ±5%). Confira a soma antes de responder.
- Quantidades sempre explícitas em g/ml/unidades, alimentos em português BR, valores inteiros (sem casas decimais).
- Nomes típicos: Desjejum, Colação, Almoço, Lanche da Tarde, Pré-Treino, Pós-Treino, Jantar, Ceia.
- Subtítulos estratégicos entre parênteses (ex.: Ativação Metabólica, Sustentação Anabólica, Carga de Glicogênio, Recuperação Noturna).
- Seções de texto usam <h3>Título</h3> e <p>. Nunca use "##", "**" ou qualquer marcação markdown.
`;
