# Sistema WhatsApp STH One — Painéis de Atendimento CRM

Vou construir um sistema completo de menus interativos no WhatsApp, integrado ao CRM, com painel admin para edição dos fluxos sem código.

## 1. Banco de Dados (migration)

Novas tabelas (todas com GRANTs + RLS apenas admin/staff):

- **whatsapp_menus** — menus e submenus
  - `key` (ex: `main`, `aluno_ativo`, `financeiro`), `title`, `header_message`, `footer_message`, `active`, `parent_key`
- **whatsapp_menu_options** — cada botão/opção
  - `menu_key`, `option_number` (1–9, 0=voltar), `label`, `response_message`, `tag`, `queue` (comercial/financeiro/nutri/tecnico/humano), `channel` (sth_one/fale_nutri), `requires_active_student` (bool), `requires_human` (bool), `ends_session` (bool), `returns_to_menu` (bool), `next_menu_key` (submenu), `active`, `order`
- **whatsapp_sessions** — estado da conversa por telefone
  - `phone`, `current_menu_key`, `last_interaction_at`, `context` (jsonb), `status` (NOVO, EM_TRIAGEM, AGUARDANDO_CLIENTE, AGUARDANDO_HUMANO, EM_ATENDIMENTO, PRIORIDADE, FINALIZADO, TRANSFERIDO), `assigned_queue`
- **whatsapp_session_tags** — tags acumuladas por sessão (`session_id`, `tag`)
- **whatsapp_menu_audit** — histórico de alterações (`menu_key`, `option_id`, `changed_by`, `before`, `after`, `created_at`)

Seed inicial com todo o fluxo descrito (Menu principal + 6 submenus com todas as opções, mensagens e tags).

## 2. Edge Function: `whatsapp-menu-router`

Nova função (ou módulo integrado a `wapi-inbound-nutri` / `whatsapp-inbound-ai`) que:

1. Recebe mensagem inbound
2. Normaliza telefone, busca/cria `whatsapp_sessions`
3. Reconhece comandos globais: `MENU`, `VOLTAR`, `INÍCIO`, `SAIR`, `ATENDENTE`, `HUMANO`, `NUTRI`, `FINANCEIRO`, `PLANOS`, `SUPORTE`
4. Se sessão nova ou expirada (>2h sem atividade) → envia menu principal
5. Se texto = número válido → executa opção:
   - Aplica `tag` na sessão
   - Verifica `requires_active_student` → se não for ativo e opção exigir, envia mensagem de bloqueio (caso opção 7)
   - Se tiver `next_menu_key` → envia submenu
   - Se tiver `queue` → muda `status` para AGUARDANDO_HUMANO e transfere
   - Envia `response_message`
6. Heurística de palavras sensíveis (colateral, sintoma, dor, tontura, sangra, mal-estar) → status PRIORIDADE + fila Nutri/Humano + mensagem de protocolo clínico
7. Toda interação registrada em `crm_ticket_messages` (integração com CRM já existente)
8. Envia respostas via `send-wapi` (canal STH One para menus, Fale com o Nutri para opção 7 com aluno ativo)

## 3. Integração com inbound atual

Modificar `wapi-inbound-nutri/index.ts` e `whatsapp-inbound-ai/index.ts` para, antes da resposta atual da IA:
- Chamar router de menu
- Se a sessão estiver em fluxo de menu (não finalizada/transferida), o router responde
- Se status = EM_ATENDIMENTO (humano assumiu) ou TRANSFERIDO → pula bot
- Se finalizado e usuário escreve livre → cai na IA existente

## 4. Painel Admin: `Painéis WhatsApp`

Nova rota `/admin/whatsapp-flows` (link adicionado em `AdminMotorRespostaApis.tsx` e em `AdminCRM` como aba "Painéis WhatsApp").

Estrutura visual (Apple black piano + neon green STH):

- **Sidebar de menus** (Menu Principal + Submenus, com toggle ativo/inativo)
- **Editor de opções** (tabela drag-and-drop por menu):
  - Número, Label, Tag, Fila, Canal, Requer aluno ativo, Requer humano, Encerra, Volta ao menu, Próximo menu, Status
  - Editor inline da `response_message` (textarea com emojis preservados)
- **Aba Sessões ativas** — lista de `whatsapp_sessions` com status, fila, telefone, última interação, tags
- **Aba Histórico** — `whatsapp_menu_audit`
- **Botão "Testar fluxo"** — modal simula conversa enviando inputs e mostrando respostas (sem enviar WhatsApp real)
- **Estatísticas topo**: total sessões, em triagem, aguardando humano, prioridade, finalizadas hoje

Componentes:
- `src/pages/admin/AdminWhatsAppFlows.tsx`
- `src/components/admin/whatsapp/MenuList.tsx`
- `src/components/admin/whatsapp/MenuOptionEditor.tsx`
- `src/components/admin/whatsapp/SessionsPanel.tsx`
- `src/components/admin/whatsapp/FlowTester.tsx`

## 5. Status do atendimento

Enum aplicado em `whatsapp_sessions.status`:
`NOVO | EM_TRIAGEM | AGUARDANDO_CLIENTE | AGUARDANDO_HUMANO | EM_ATENDIMENTO | PRIORIDADE | FINALIZADO | TRANSFERIDO`

Badge colorido em todo o painel seguindo o design system.

## 6. Regras de segurança

- Opção 7 (Fale com o Nutri) só libera se houver `subscriptions.status='active'` com `end_date >= now()`
- Sensitive keywords sempre escalam para humano, nunca respondem prescrição
- Bot nunca expõe tokens, IDs internos ou dados de outros usuários
- RLS: tabelas só acessíveis por admin/consultor; sessões consultáveis por staff

## 7. Roteamento por fila

| Fila | Canal de saída | Quando |
|---|---|---|
| Comercial | STH One (`wapi-inbound-nutri` outbound) | Opções 1, planos, cupom |
| Financeiro | STH One | Opção 3, comprovante, link |
| Nutri | Fale com o Nutri | Opção 2.7, opção 7 ativo, sensível |
| Técnico | STH One | Opção 5 |
| Humano | STH One + alerta admin | Opção 6, fallback |

## Escopo desta entrega

Como é uma estrutura grande, esta primeira entrega inclui:
1. Migration completa com seed do fluxo
2. Edge function `whatsapp-menu-router` + integração nos dois inbounds
3. Painel admin completo (editor + sessões + testador)
4. Link no menu admin

Tempo estimado de execução: bastante código, vou implementar tudo em sequência após sua aprovação.

Confirma para eu seguir?
