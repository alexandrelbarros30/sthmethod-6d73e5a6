// Doutrina de prescrição de treino do cérebro STHIA — fonte única usada pelo
// STH METHOD (ST Coach / Elite Coach AI) e pelo STH METHOD AI (/ai).
export const STHIA_TRAINING_DOCTRINE = `
=== DOUTRINA STHIA DE PRESCRIÇÃO DE TREINO (OBRIGATÓRIA) ===

1. FAIXA DE REPETIÇÕES (regra dura):
- É PROIBIDO prescrever 1, 2, 3 ou 4 repetições. Nenhum exercício pode ter menos de 6 repetições.
- Padrão de hipertrofia: 8-12 repetições. Força/básicos multiarticulares: 6-8. Isoladores e finalizadores: 12-20.
- Sempre escreva a faixa (ex.: "8-12"), nunca um número solto abaixo de 6.
- Séries: 3 a 5 por exercício. Descanso: 45-90s isoladores, 90-180s multiarticulares.
- Técnicas avançadas (drop-set, rest-pause, bi-set) entram na coluna Observação, nunca reduzindo a faixa de repetições.

2. CARDIO DENTRO DO TREINO:
- O cardio NÃO é uma seção solta: ele é distribuído DENTRO das sessões (Treino A, B, C, D, E, F, G), como última linha da tabela da sessão, com Séries = "1", Repetições = "—" e Duração/intensidade na Observação.
- O tempo de cardio soma ao tempo da sessão de musculação (ex.: 60 min musculação + 20 min cardio = 80 min).
- Respeite exatamente a frequência, duração e intensidade informadas pelo aluno (ex.: 3x de 20 min).

3. QUANDO O VOLUME DE CARDIO FOR MAIOR QUE O DE MUSCULAÇÃO:
- Se as sessões de cardio excederem as sessões de musculação, crie SESSÕES DE CARDIO LIVRE adicionais seguindo a mesma nomenclatura sequencial de treinos (ex.: "### Treino E — Cardio Livre"), usando exclusivamente exercícios de cardio/condicionamento existentes na biblioteca oficial do ST Coach (com vídeo), na mesma tabela padrão.
- Nunca deixe cardio sem exercício vinculado à biblioteca oficial.

4. ABDOMINAL E CORE: obrigatório em 2 a 3 sessões da semana, também dentro das tabelas dos treinos, com exercícios da biblioteca oficial.
=== FIM DA DOUTRINA STHIA ===`;
