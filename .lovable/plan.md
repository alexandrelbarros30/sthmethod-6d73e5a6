
# CRM STH — Sistema Operacional de Atendimento (WhatsApp)

Substituir os dois CRMs atuais (`/admin/crm` campanhas e `/admin/fale-nutri`) por **um único sistema operacional de atendimento** com **dois canais isolados**: **STH One** (comercial) e **Fale com o Nutri** (alunos ativos). Tudo dentro do design system existente (preto, verde neon STH METHOD, cards arredondados, tipografia Apple).

> A página atual `/admin/crm` (campanhas/mídias/templates de marketing) **permanece intacta** — ela cuida de campanhas em massa. O novo CRM é operacional, de 1:1, atendimento humano.

---

## 1. Banco de dados (1 migration)

Novas tabelas em `public`:

- **`crm_contacts`** — toda pessoa que escreve no WhatsApp (lead ou aluno)
  - `id`, `phone` (único, normalizado), `full_name`, `email`, `user_id` (FK opcional p/ aluno cadastrado), `kind` (`lead` | `student` | `unknown`), `plan_name`, `plan_start`, `plan_end`, `plan_status`, `last_weight_update`, `notes`, `tags` (text[]), `created_at`, `updated_at`
- **`crm_tickets`** — um por atendimento
  - `id`, `protocol` (texto único — `STH-000001` / `NUT-000001`), `protocol_seq` (bigint), `channel` (`sth_one` | `fale_nutri`), `contact_id` (FK), `type` (`lead`|`aluno`|`financeiro`|`suporte`|`nutri`), `status` (enum por canal), `priority` (`low`|`medium`|`high`|`sensitive`), `assigned_to` (uuid user), `tags` (text[]), `internal_notes`, `first_message_at`, `last_message_at`, `closed_at`, `created_at`, `updated_at`
- **`crm_ticket_messages`** — histórico unificado
  - `id`, `ticket_id`, `direction` (`in`|`out`), `body`, `media_url`, `message_id` (provider), `instance_id`, `phone`, `status` (`received`|`sent`|`delivered`|`read`|`failed`), `provider` (`wapi`|`zapi`|`cloud`), `created_at`
- **`crm_templates`** — templates de resposta operacional (separado de `crm_templates` de campanhas — usar nome `crm_op_templates`)
  - `id`, `channel`, `category` (boas_vindas, registrado, pagamento_pendente, atualizacao, encerramento, ausencia, etc.), `title`, `body`, `active`
- **`crm_webhook_logs`** — auditoria bruta
  - `id`, `provider`, `payload` (jsonb), `processed`, `error`, `created_at`
- **Sequences**: `crm_protocol_seq_sth`, `crm_protocol_seq_nut` p/ gerar `STH-000001`/`NUT-000001`

**Aproveitar o que já existe:**
- `nutri_messages`, `nutri_conversations`, `nutri_opt_outs`, `nutri_templates`, `nutri_away_throttle`, `nutri_business_hours` → ficam como estão; novas mensagens W-API entram no novo fluxo, mas o histórico antigo continua acessível em backup.
- `subscriptions`, `profiles` → fonte de verdade pra identificar aluno ativo.

**Funções/triggers:**
- `crm_route_inbound(phone, body, provider, message_id, instance_id)` — função SECURITY DEFINER que: identifica contact, decide canal (aluno ativo → `fale_nutri`, senão → `sth_one`), cria/atualiza ticket aberto (ou reabre), insere mensagem, classifica prioridade (regex sensível: `dor|colateral|tontura|pressão|glicemia|reação|ansiedade|sintoma|sangra|mal[- ]estar`), aplica tags automáticas.
- Trigger BEFORE INSERT em `crm_tickets` que gera `protocol` via sequence + canal.

**RLS:** todas as tabelas → apenas roles `admin`, `consultor`, `assistente`, `financeiro` (via `has_role`). `service_role` total para edge functions.

**GRANTS:** `authenticated` (SELECT/INSERT/UPDATE/DELETE) + `service_role` (ALL). Sem `anon`.

---

## 2. Edge functions

- **`crm-inbound`** (nova) — webhook único multi-provider (W-API, Z-API, Cloud API). Loga em `crm_webhook_logs`, chama `crm_route_inbound`, dispara auto-reply (boas-vindas + ausência usando `nutri_business_hours` reaproveitado).
- **`crm-send`** (nova) — envia mensagem outbound; escolhe `send-wapi` (canal Nutri) ou `send-whatsapp` Z-API (canal comercial) conforme `ticket.channel`. Grava `crm_ticket_messages` direction=out.
- **Reaproveitar** `wapi-inbound-nutri` e `whatsapp-inbound-ai` apontando o roteamento para `crm-inbound` (mantêm compatibilidade dos webhooks já registrados).

---

## 3. Frontend — nova rota `/admin/atendimento` (CRM operacional)

Arquivo principal: `src/pages/admin/AdminAtendimento.tsx`.
Componentes em `src/components/admin/atendimento/`:

- `AtendimentoLayout.tsx` — header com seletor de canal (toggle pill STH One / Fale com o Nutri) + tabs.
- `DashboardCards.tsx` — métricas do dia (atendimentos, leads novos, alunos em atendimento, sensíveis, pagamentos pendentes, tempo médio resposta, finalizados).
- `TicketList.tsx` — lista filtrável (status, prioridade, tag, responsável, busca por nome/fone/protocolo).
- `TicketKanban.tsx` — colunas por status do canal selecionado, drag & drop com `dnd-kit` (já no projeto).
- `TicketDetail.tsx` — chat central + ficha lateral do contato (nome, fone, plano, início/fim, última atualização, notas, tags, histórico de tickets anteriores).
- `TemplatesPanel.tsx` — CRUD de `crm_op_templates`.
- `TagsManager.tsx` — gerenciar conjunto de tags.
- `QueueColumns.tsx` — definição dos status por canal.

**Status por canal:**
- STH One: `novo_lead`, `em_atendimento`, `checkout_enviado`, `pagamento_pendente`, `pagamento_aprovado`, `convertido`, `perdido`.
- Fale com o Nutri: `aguardando`, `prioridade_sensivel`, `em_acompanhamento`, `aguardando_atualizacao`, `ajuste_solicitado`, `finalizado`.

**Tags padrão (seed):** Aluno ativo, Lead quente, Lead frio, Pagamento pendente, Precisa atualizar fotos, Prioridade sensível, Fale com o Nutri, Comercial, Renovação, Protocolo, Dieta, Treino, Exames.

**Visual:**
- Canal **STH One** → acento âmbar/branco, linguagem comercial nos placeholders.
- Canal **Fale com o Nutri** → acento verde neon STH, tom humanizado.
- Layout Apple: fundo `bg-background`, cards `rounded-2xl border border-border/40`, blur sutil no header, tipografia `tracking-tight`.

---

## 4. Roteamento e migração das rotas antigas

- `/admin/atendimento` → novo CRM operacional.
- `/admin/fale-nutri` → **redirect** para `/admin/atendimento?channel=fale_nutri`.
- `/admin/crm` (campanhas em massa) → **mantido** como está (é outro produto).
- Sidebar admin: substituir o item "Fale com o Nutri" por "Atendimento (CRM)" e remover duplicidade.

---

## 5. Controle de acesso

Roles existentes (`admin`, `consultor`, `assistente`, `financeiro`) liberadas via `has_role`. Sem novos roles.

---

## 6. Pronto pra expandir

- Tabela `crm_webhook_logs` + função única `crm_route_inbound` permitem plugar n8n/IA depois (basta apontar webhook).
- Campo `assigned_to` + `internal_notes` + `tags[]` deixa pronto pra automações.

---

## Arquivos previstos

**Backend**
- `supabase/migrations/<ts>_crm_atendimento.sql` (tabelas, sequences, função roteamento, trigger protocol, RLS, GRANTs, seed templates/tags)
- `supabase/functions/crm-inbound/index.ts` (novo)
- `supabase/functions/crm-send/index.ts` (novo)
- `supabase/functions/wapi-inbound-nutri/index.ts` (encaminhar p/ `crm-inbound`)

**Frontend**
- `src/pages/admin/AdminAtendimento.tsx`
- `src/components/admin/atendimento/AtendimentoLayout.tsx`
- `src/components/admin/atendimento/DashboardCards.tsx`
- `src/components/admin/atendimento/TicketList.tsx`
- `src/components/admin/atendimento/TicketKanban.tsx`
- `src/components/admin/atendimento/TicketDetail.tsx`
- `src/components/admin/atendimento/TemplatesPanel.tsx`
- `src/components/admin/atendimento/TagsManager.tsx`
- `src/App.tsx` (rota nova + redirect `/admin/fale-nutri`)
- `src/components/DashboardSidebar.tsx` (item de menu)

---

## Pontos a confirmar antes de codar

1. **Página `/admin/crm` (Campanhas & Ofertas)** fica intacta como produto separado, correto? (ela é envio em massa, o novo é 1:1 atendimento)
2. **`/admin/fale-nutri`** posso redirecionar e remover do menu, ou prefere manter os dois links por um tempo?
3. Os dados antigos de `nutri_messages` precisam ser **migrados** para `crm_tickets` (gerando protocolo retroativo), ou posso começar o histórico do CRM do zero a partir de hoje?
4. Auto-reply de **boas-vindas STH One** vai usar Z-API (linha comercial `21998496289`) — confirma que continua sendo essa linha?
