## CRM Operacional — Camada sobre dados existentes

Construir um CRM como camada operacional que **lê** dados já existentes (profiles, subscriptions, payments, dietas, treinos, protocolos, exames, fotos, peso) e **cria apenas** o que é específico de CRM: conversas, mensagens, tags, tarefas, IA, campanhas, filas e atendimento.

### Princípios
- **Zero duplicação**: nenhuma tabela de aluno/plano/pagamento/dieta/treino/protocolo será criada.
- **Lookup por telefone**: ao abrir uma conversa, localizar `profiles.phone` e montar dossiê automático (nome, telefone, objetivo, plano ativo, datas, status assinatura/pagamento, último peso, última atualização).
- **Identidade da conversa**: a conversa é ancorada em `phone` (string normalizada E.164). Se houver `profiles.user_id` correspondente, é vinculado dinamicamente — não armazenado redundantemente.

### Novas tabelas (apenas CRM)

```text
crm_conversations
  id, phone (unique), display_name, last_message_at, last_message_preview,
  unread_count, status (open|snoozed|closed), assigned_to (uuid → user_roles),
  channel (whatsapp|manual), pinned, created_at, updated_at

crm_messages
  id, conversation_id → crm_conversations, direction (in|out),
  body, media_url, media_type, sent_by (uuid|null=ai|null=system),
  source (manual|ai|campaign|automation), external_id, status, created_at

crm_tags
  id, name (unique), color, created_at

crm_conversation_tags
  conversation_id, tag_id  (PK composto)

crm_tasks
  id, conversation_id (nullable), phone (nullable), title, notes,
  due_at, status (todo|doing|done), assigned_to, created_by, created_at

crm_ai_runs
  id, conversation_id, prompt, response, model, tokens, created_at

crm_campaigns
  id, name, message_template, target_filter (jsonb),
  scheduled_at, status (draft|scheduled|sending|done|paused),
  sent_count, failed_count, created_by, created_at

crm_campaign_recipients
  id, campaign_id, phone, status (pending|sent|failed), error, sent_at

crm_queues
  id, name, type (comercial|nutri|suporte), color, sort_order

crm_queue_items
  id, queue_id, conversation_id, priority, entered_at, picked_by, picked_at, closed_at
```

Todas com RLS `TO authenticated`, scoped via `has_role(auth.uid(), 'admin'|'consultor'|'assistente'|'financeiro')`.

### Páginas Admin

- `/admin/crm` — Inbox de conversas (lista + chat + dossiê lateral)
- `/admin/crm/campanhas` — campanhas WhatsApp
- `/admin/crm/filas` — filas (Comercial / Fale com Nutri / Suporte)
- `/admin/crm/tarefas` — tarefas CRM
- `/admin/crm/ia` — central de respostas com IA (Lovable AI Gateway, Gemini)

### Dossiê lateral (montado em tempo real)
Hook `useStudentDossier(phone)` faz queries paralelas:
1. `profiles` por phone → user_id, full_name, objective
2. `subscriptions` por user_id → plano ativo, start/end, status
3. `payments` por user_id → último pagamento + status
4. `weight_logs` por user_id → último peso + data
5. `student_diets`/`student_trainings`/`student_protocols` → última atualização
6. `clinical_documents`, `body_images` → contagem + última data

Tudo via `.in()` decoupled queries (padrão do projeto).

### Edge Functions
- `crm-send-whatsapp` — envia mensagem usando WAPI existente (`send-wapi`)
- `crm-inbound-webhook` — recebe mensagens (webhook WhatsApp), cria/atualiza conversa
- `crm-ai-suggest` — usa Lovable AI Gateway (Gemini) para sugerir resposta
- `crm-campaign-dispatch` — dispara campanhas em lote

### Navegação
Adicionar grupo "CRM" no `DashboardSidebar` (admin): Conversas, Filas, Campanhas, Tarefas, IA.

### Fora de escopo
- Não recriar tabelas de domínio existentes.
- Não substituir lógica de pagamento/assinatura.
- Não tocar em módulos de Treino/Dieta/Protocolo já consolidados.
