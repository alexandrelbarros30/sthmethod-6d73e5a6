## Objetivo

Permitir que renovações de plano destravem cards de medicamentos das semanas seguintes (continuação do protocolo), respeitando a duração do novo plano e o tempo entre renovações.

## Regras de negócio

**Janela de renovação ≤ 15 dias** (entre `end_date` da assinatura anterior e `start_date` da nova):
- Renovação automática de continuidade.
- O `maxMedWeeks` passa a considerar a soma das durações: anterior + nova.
  - Ex.: 30 dias + renovação 30 dias → libera semanas 1-8 (mantém 1-4 do ciclo anterior + 5-8 do novo).
  - 90 + 90 → 1-24. 180 + 180 → 1-48. Etc.
- Se o HTML do protocolo **não tiver** cards para as novas semanas, exibir aviso ao admin/consultor (badge no painel admin + mensagem no card do aluno) sinalizando: "Protocolo continuado — atualizar conteúdo conforme evolução do aluno". O admin decide manualmente liberar/atualizar.

**Janela de renovação > 15 dias**:
- Não libera automaticamente. Mostra ao admin/consultor um prompt/decisão: "Dar continuidade ao protocolo anterior?" (Sim/Não).
  - **Sim** → aplica a mesma regra acima (soma de durações).
  - **Não** → reinicia ciclo (semanas 1 a N do novo plano apenas).
- Enquanto o admin não decidir, o aluno vê apenas as semanas do novo plano (comportamento atual).

## Implementação

### Banco de dados (nova migration)
- Nova tabela `protocol_continuity_decisions`:
  - `id uuid pk`, `user_id uuid`, `subscription_id uuid` (a nova assinatura), `previous_subscription_id uuid`, `decision text check ('auto_continue','continue','restart','pending')`, `gap_days int`, `decided_by uuid`, `decided_at timestamptz`, `created_at timestamptz default now()`.
  - RLS: aluno SELECT próprio; admin/consultor SELECT/UPDATE dos seus alunos.
- Trigger `on subscriptions insert`: ao criar nova assinatura, calcular `gap_days` vs assinatura anterior do mesmo `user_id`. Inserir registro com `decision = 'auto_continue'` se gap ≤ 15, senão `'pending'`.

### Frontend — aluno (`StudentProtocol.tsx`)
- Buscar `subscriptions` do usuário (todas) + decisão de continuidade ativa.
- Calcular `maxMedWeeks` somando `duration_days` das assinaturas em continuidade ativa (`auto_continue` ou `continue`), dividido por 30 × 4.
- Quando o protocolo HTML não tiver cards suficientes para o novo intervalo: exibir banner discreto "Protocolo continuado — aguardando atualização do consultor".

### Frontend — admin (novo card em `AdminProtocol.tsx` do aluno selecionado)
- Quando existir decisão `pending`: card "Renovação detectada (>15 dias) — dar continuidade ao protocolo?" com botões Sim/Não.
- Quando existir `auto_continue`/`continue` mas o HTML não cobre as semanas necessárias: aviso "Protocolo continuado — adicione semanas X-Y" com link para editar.

### Painel gamificado (`GamifiedProtocolPanel.tsx`)
- Já aceita `maxWeeks`. Adicionar prop opcional `continuationNotice?: string` para renderizar o banner quando faltarem cards.

## Detalhes técnicos

- `gap_days = new.start_date - prev.end_date` (em dias, mínimo 0).
- Mapeamento semanas: `weeks = floor(duration_days * 4 / 30)`; soma das durações antes da divisão para evitar arredondamento.
- A decisão é única por `(user_id, subscription_id)`.
- Migration cria índice `(user_id, subscription_id)`.

## Fora do escopo

- Notificação push/WhatsApp ao admin (apenas badge na UI por enquanto).
- Histórico de continuidades em relatório separado.
