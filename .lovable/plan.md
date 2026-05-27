
# Fale com o Nutri — CRM Premium

Vamos transformar a página atual `/admin/fale-nutri` em um CRM completo focado em alunos **ativos**, mantendo a linha W-API (`5521998984153`) isolada da linha comercial Z-API.

## 1. Banco de dados (migration)

Estender o que já existe (`nutri_messages`, `nutri_opt_outs`, `nutri_templates`) com:

- `nutri_conversations` — uma linha por aluno ativo
  - `user_id`, `status` (open/pending/waiting_student/waiting_nutri/closed)
  - `priority` (high/medium/low) calculada automaticamente
  - `assigned_to` (admin responsável)
  - `tags` (text[]: dieta, treino, protocolo, exames, urgente, renovação, financeiro, etc.)
  - `last_message_at`, `last_inbound_at`, `unread_count`
  - `internal_notes`
- `nutri_message_tags` — categoria detectada (dieta, treino, protocolo, sintoma, etc.)
- Atualizar `nutri_templates`:
  - `category` (boas_vindas, dieta, treino, protocolo, exames, atualizacao, renovacao, financeiro, encerramento, direcionamento, humanizada, automatica)
  - `tone` (curta, humanizada, tecnica, motivacional)
  - `body` com variáveis `{nome} {plano} {data_inicio} {data_fim} {link_plataforma} {peso_atual} {ultima_atualizacao}`
- Seed dos templates iniciais (12 categorias × 4 tons = base já pronta para começar)
- Trigger: ao inserir em `nutri_messages`, atualizar `nutri_conversations` (último contato, unread, priority por palavras-chave)

## 2. Edge functions

- `nutri-ai-reply` (nova) — recebe `conversation_id`, lê últimas 20 mensagens + dados do aluno (plano, datas, última atualização), chama Gemini com prompt fixo do canal e devolve sugestão. Bloqueia prescrição/dose/cura.
- `wapi-inbound-nutri` (existente) — passa a:
  - Atualizar `nutri_conversations` (upsert, unread+1, priority)
  - Classificar a mensagem (heurística por palavras-chave: dor, colateral, sintoma → high)
- `send-wapi` (existente) — usado pelo botão Enviar.
- `nutri-alerts-scan` (nova, opcional cron) — gera alertas (sem atualização 7/15d, plano vencendo 7/3d, encerrado).

## 3. Frontend `/admin/fale-nutri`

Substituir a tela atual por um CRM em 4 abas:

### Aba 1 — Dashboard
Cards: ativos, abertos, pendentes, prioridade alta, atualizações atrasadas, renovações próximas, últimas mensagens.

### Aba 2 — Atendimento (principal)
Layout 3 colunas estilo Apple:
- **Esquerda**: lista de conversas (filtros: status, prioridade, tag, responsável; busca por nome). Só aparecem alunos com assinatura ativa.
- **Centro**: chat com histórico, badges de tag/prioridade, input com botões:
  - "Templates" (drawer com biblioteca filtrável)
  - "Gerar com IA" (Gemini)
  - Seletor de motor: Template / Gemini / Personalizada / Híbrida
  - Enviar (chama `send-wapi`)
  - Marcar como respondido / Mudar status / Adicionar tag
- **Direita**: ficha do aluno (nome, plano, dias restantes, última atualização de peso/fotos, entregáveis dieta/treino/protocolo/exames, observações internas editáveis, responsável).

### Aba 3 — Biblioteca de Respostas
CRUD de templates com filtros (categoria, tom, plano, situação). Botões editar/duplicar/excluir. Preview com variáveis substituídas.

### Aba 4 — Configuração
URL do webhook W-API + status da conexão + lista de opt-outs (interromper/retomar).

## 4. Regras de segurança e elegibilidade

- Lista de conversas só carrega `user_id` com `subscriptions.status='active'` e `end_date >= now()`.
- Inbound de aluno inativo: edge function responde automaticamente com a mensagem de renovação e não cria conversa.
- RLS: somente `admin`/`assistente`/`consultor` acessam `nutri_conversations` e `nutri_messages`.

## 5. Priorização automática (heurística no inbound)

- **Alta**: regex `colateral|sintoma|dor|mal[- ]estar|tontura|enjoo|protocolo|sangra` ou plano expirando em ≤7d ou sem atualização >15d.
- **Média**: `dieta|treino|exame|ajuste|rotina`.
- **Baixa**: caso contrário.

## 6. IA Gemini — prompt do sistema

Prompt fixo no edge function (não no cliente) com as 10 regras de comportamento listadas pelo usuário, mais contexto dinâmico (nome, plano, últimas mensagens, status de entregáveis).

## 7. Visual

Mantém o design system existente (preto/verde STH METHOD, cards arredondados, tipografia Apple) — apenas reorganiza o layout.

## Arquivos previstos

- `supabase/migrations/<timestamp>_fale_nutri_crm.sql` (tabelas, trigger, RLS, GRANTs, seed)
- `supabase/functions/nutri-ai-reply/index.ts` (nova)
- `supabase/functions/wapi-inbound-nutri/index.ts` (atualiza conversation + priority)
- `supabase/config.toml` (registrar `nutri-ai-reply` com `verify_jwt = false` para chamadas autenticadas pelo admin via JWT validado em código)
- `src/pages/admin/AdminFaleNutri.tsx` (reescrito)
- Componentes em `src/components/admin/fale-nutri/`: `ConversationList.tsx`, `ChatPanel.tsx`, `StudentSidePanel.tsx`, `TemplateLibrary.tsx`, `DashboardCards.tsx`, `ConfigPanel.tsx`

## Pontos a confirmar

1. Manter as 3 tabelas já criadas (`nutri_messages`, `nutri_opt_outs`, `nutri_templates`) e só estender, certo?
2. O **alerts cron** (item 9 — alertas automáticos diários) pode ficar como uma função on-demand chamada do Dashboard, ou prefere agendamento automático (pg_cron)?
3. Os templates seed (~48 mensagens) eu já preencho com texto padrão profissional STH METHOD, ou você quer revisar antes?
