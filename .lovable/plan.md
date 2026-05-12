## O que será feito

A atualização de evolução do aluno **já sincroniza** peso, NEAT/treino/cardio, macros e anamnese no perfil (tabela `profiles`) — vou confirmar isso e fazer o mesmo no card do admin (`AdminEvolutionUpdate`), que hoje só atualiza peso+macros mas ignora rotina.

A novidade é criar uma **trilha histórica completa** (snapshot) a cada atualização e uma **tela de comparação** lado a lado, acessível tanto na edição do aluno quanto no prontuário.

---

## 1. Banco — nova tabela `evolution_snapshots`

Cada vez que o aluno (ou admin) salva uma atualização, gravamos um snapshot imutável com:

- `weight`, `bmr`, `tdee`, `daily_calories`, `protein_g`, `carbs_g`, `fat_g`
- `activity_type`, `does_cardio`, `physical_activity_level`, `training_days_per_week`, `training_duration_minutes`, `training_intensity`, `cardio_*`
- `notes` (texto da anamnese gerada)
- `body_image_front_url`, `body_image_back_url`, `body_image_profile_url` (snapshot das URLs vigentes naquele momento)
- `bioimpedance_log_id` (referência à bioimpedância mais recente, se existir)
- `source` ("student" | "admin" | "consultor")
- `created_at`, `user_id`

Snapshot **inicial** é criado automaticamente via trigger no `handle_new_user` complementar (ou seed na primeira atualização) para servir como linha-base.

RLS: aluno vê os próprios; admin vê todos; consultor vê dos vinculados (`is_consultant_of`).

## 2. Sincronização nos cards de evolução

- `EvolutionUpdateCard` (aluno) — após o `update profiles` + `insert anamnesis_entries` atual, **gravar snapshot**.
- `AdminEvolutionUpdate` (admin) — adicionar suporte a alteração de NEAT/atividade (mesmo componente `EvolutionActivityChange`) e gravar snapshot.
- Confirmar que tudo continua atualizando o profile (a edição do aluno já lê de `profiles`, então peso/macros/NEAT aparecem refletidos automaticamente).

## 3. Tela de comparação `EvolutionComparison`

Componente único, reaproveitado em dois lugares:

- **Edição do aluno** (`AdminStudents`) — nova aba "Histórico" no dialog de edição, com lista de snapshots e botão "Comparar inicial × atual" / seleção de 2 snapshots.
- **Prontuário** — link "Ver comparação completa" abre o mesmo componente em modal.

Layout (mobile-first, 360px):
- Duas colunas (ou stack vertical no celular) com cards: Peso, Macros, NEAT, Fotos (front/back/profile lado a lado), Bioimpedância.
- Variação calculada e exibida em verde/vermelho (Δ peso, Δ kcal, Δ % gordura, etc.).
- Datas dos dois snapshots no topo.

## 4. Onde aparece

- `StudentEvolution` — botão "Ver comparações" abre modal.
- `AdminStudents` (edição) — nova aba "Histórico de Evolução" com timeline + botão comparar.
- `AdminStudents` (prontuário, dialog de visualização) — seção colapsável "Snapshots de Evolução" abaixo do "Histórico de Anotações".

---

## Detalhes técnicos

- Migração SQL: tabela + RLS + índice `(user_id, created_at desc)`.
- Helper `lib/evolution-snapshot.ts` com `createSnapshot(userId, source)` que coleta o profile atual, body_images, bioimpedance e insere um row.
- Reuso do `EvolutionActivityChange` no card do admin.
- Tipos do Supabase serão regenerados automaticamente após a migração.