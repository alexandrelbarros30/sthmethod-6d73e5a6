# STH CRM — Plano de Implementação

Este é um módulo grande. Proponho construir em **3 fases** entregando valor incremental, reaproveitando as tabelas que já existem (`crm_contacts`, `crm_tickets`, `crm_ticket_messages`, `profiles`, `subscriptions`, `payments`, `weight_logs`, `body_images`, `evolution_notifications`, `nutri_conversations`, `plans`, `student_flow_status`) em vez de duplicar dados.

---

## Fase 1 — Núcleo do STH CRM (essa entrega)

**Rota:** `/admin/sth-crm` (link no sidebar admin “STH CRM”).

**Dashboard principal** com 8 cards calculados em tempo real:
- 🔥 Leads Novos (contatos `kind='lead'` sem assinatura ativa, últimos 30d)
- 👊 Alunos Ativos (subscriptions `status=active` e `end_date>=hoje`)
- ⏳ Renovações Próximas (end_date ≤ 30d)
- 📊 Atualizações Pendentes (alunos sem `weight_logs` há 29+ dias)
- 🧪 Exames Aguardando (documents tipo exame sem análise — usa tabela existente)
- 📞 Atendimentos Abertos (`crm_tickets` com `closed_at IS NULL`)
- 🚨 Prioridade Alta (tickets `priority` in sensitive/high)
- 💰 Oportunidades (leads com tag “quente” + abandono carrinho de pagamento pending)

**Lista unificada de pessoas** (Leads + Alunos) com:
- Busca global (nome, telefone, email, plano, tags)
- Filtros: tipo (lead/aluno), plano, status, tags, responsável, origem, objetivo, data
- Tabela premium com avatar, nome, WhatsApp, plano, status, última interação, tags
- Click → drawer lateral com ficha completa

**Ficha 360º do contato** (drawer):
- Header: nome, foto, WhatsApp (botão direto), email, status, tags
- Abas: Visão geral · Linha do tempo · Atendimentos · Renovações · Exames · Anotações
- Linha do tempo agregada de: mensagens (`crm_ticket_messages`), atualizações (`weight_logs`, `evolution_notifications`), renovações (`subscriptions`), pagamentos (`payments`), anotações (`crm_notes` — nova)
- Botões: Abrir/Encerrar/Transferir atendimento · Adicionar observação · Adicionar tag

**KPIs no header do dashboard**: Total Leads · Taxa Conversão · Alunos Ativos · Renovações 30d · Receita 30d · Atualizações Pendentes · Tempo Médio de Resposta.

## Fase 2 — Módulos especializados (entrega seguinte)
- Módulo de Renovação dedicado com alertas 30/15/7/3/1 dias
- Módulo de Exames com upload, status, responsável
- Sistema de Tags global gerenciável
- Atribuição de Responsável por contato

## Fase 3 — Automação & integrações
- Disparos automáticos por status (W-API/Z-API já existentes)
- Webhooks Gemini para sugestão de resposta
- N8N (fora do escopo do app, apenas endpoint preparado)

---

## Detalhes técnicos

**Migrations necessárias (Fase 1):**
- `crm_notes` (id, contact_id, author_id, body, created_at) — anotações livres
- `crm_tags` (id, name, color, kind) — catálogo de tags
- `crm_contact_tags` (contact_id, tag_id) — N:N
- Adicionar coluna `assigned_to uuid` em `crm_contacts` e `crm_tickets` (se não existir)
- Adicionar `origin text`, `objective text`, `notes text` em `crm_contacts` (se não existirem)
- View `crm_dashboard_stats` (security definer function) para os 8 cards de uma vez
- RLS: somente admin/consultor podem ler/editar (usar `has_admin_view` e `is_consultant_of`)
- GRANTs para `authenticated` e `service_role`

**Frontend (Fase 1):**
- `src/pages/admin/AdminSthCrm.tsx` — página principal com tabs
- `src/components/admin/sth-crm/CrmDashboard.tsx` — cards + KPIs
- `src/components/admin/sth-crm/CrmPeopleList.tsx` — lista + busca + filtros
- `src/components/admin/sth-crm/CrmContactDrawer.tsx` — ficha 360º
- `src/components/admin/sth-crm/CrmTimeline.tsx` — timeline agregada
- `src/components/admin/sth-crm/CrmNotes.tsx` — anotações
- Rota em `src/App.tsx` + item de menu em `src/components/DashboardSidebar.tsx`
- Visual: black piano, verde neon STH, cards `rounded-2xl shadow-apple`, framer-motion

**Reaproveitamento:**
- NÃO crio nova tabela de “alunos” — já existe `profiles` + `subscriptions`. O CRM consulta com join virtual (decoupled queries conforme memória).
- NÃO crio novo sistema de mensagens — já existe `crm_ticket_messages` e `nutri_conversations`.
- NÃO crio nova tabela de exames agora — Fase 2.

---

## Confirmação

Vou entregar **apenas a Fase 1** nesta mensagem (já é grande: ~7 arquivos novos + 1 migration + 2 edits). Fase 2 e 3 ficam para próximas mensagens.

Confirma que posso seguir com Fase 1?