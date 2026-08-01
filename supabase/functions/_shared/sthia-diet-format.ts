// Doutrina oficial STHIA — formato de cardápio STH METHOD.
// Refeição base (⭐ BASE) + 4 opções, HTML puro, mesma identidade do portal do aluno.
export const STHIA_DIET_FORMAT = `
FORMATO OBRIGATÓRIO DO CARDÁPIO — HTML PURO (sem markdown, sem crases, sem tabelas), idêntico ao padrão STH METHOD:

<p><strong>Refeição 01: Desjejum (Ativação Metabólica) — 07:00 · 477 kcal · P 49g / C 44g / G 10g</strong></p>
<p><strong>"⭐ BASE:</strong> Omelete de 1 ovo inteiro + 3 claras + 40g de farelo de aveia + 100g de mamão formosa.</p>
<p><strong>Opção 2:</strong> Shake com 30g de whey + 40g de farelo de aveia + 100g de morangos.</p>
<p><strong>Opção 3:</strong> 2 fatias de pão integral (50g) + 100g de frango desfiado + 30g de cottage zero.</p>
<p><strong>Opção 4:</strong> 170g de iogurte grego zero + 25g de whey + 25g de granola integral.<strong>"</strong></p>
<p><strong>Opção 5:</strong> ... (opcional, só quando fizer sentido)</p>

REGRAS DE FORMATAÇÃO (invioláveis):
- Cada refeição começa com <p><strong>Refeição NN: Nome (Subtítulo estratégico) — HH:MM · N kcal · P Ng / C Ng / G Ng</strong></p> (numeração 01, 02, 03...).
- NUNCA usar <ul>/<li> nem markdown no cabeçalho da refeição.
- Cada refeição tem SEMPRE a refeição BASE + 4 opções de substituição (Opção 2, 3, 4 e 5), isocalóricas e equivalentes em macros à BASE (tolerância ±5%).
- Abre aspas dupla no BASE (<strong>"⭐ BASE:</strong>) e fecha aspas dupla no fim da última opção (<strong>"</strong></p>).
- Quantidades sempre explícitas em g/ml/unidades, alimentos em português BR, valores inteiros (sem casas decimais).
- Nomes típicos: Desjejum, Colação, Almoço, Lanche da Tarde, Pré-Treino, Pós-Treino, Jantar, Ceia.
- Subtítulos estratégicos entre parênteses (ex.: Ativação Metabólica, Sustentação Anabólica, Carga de Glicogênio, Recuperação Noturna).
- Seções de texto usam <h3>Título</h3> e <p>. Nunca use "##", "**" ou qualquer marcação markdown.
`;
