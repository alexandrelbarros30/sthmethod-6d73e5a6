## CRM Campaigns — Central de Campanhas STH METHOD

Esse módulo é grande (≈ 7 submenus, banco novo, integrações Z-API, agendador, biblioteca de mídias, dashboard). Para entregar com qualidade, proponho construir em **4 fases incrementais**, validando cada uma antes de seguir.

---

### FASE 1 — Fundação (backend + navegação)

**Banco de dados (migration)**
- `crm_contacts_view` (view materializada unindo profiles + subscriptions + leads + última atividade)
- `crm_segments` (id, name, filters jsonb, created_by, scope: admin|consultor)
- `crm_templates` (id, category, title, content, variables, media_ids[], preview_text, created_by)
- `crm_media` (id, url, type, category, tags[], favorite, size, uploaded_by)
- `crm_campaigns` (id, name, segment_id, template_id, media_ids[], status, scheduled_at, recurrence, sent_count, response_count, created_by)
- `crm_campaign_runs` (histórico de execução por campanha)
- `crm_campaign_messages` (1 linha por destinatário: status, error, sent_at, clicked_at)
- Storage bucket `crm-media` (público)
- RLS: admin total; consultor vê só seus alunos/segmentos

**Navegação**
- Novo grupo no sidebar admin: **📣 Campanhas & Ofertas**
- Rotas placeholder: `/admin/crm/campanhas`, `/templates`, `/contatos`, `/segmentos`, `/historico`, `/automacao`, `/midias`, `/dashboard`

---

### FASE 2 — Contatos, Segmentação e Templates

- **Lista de contatos** com filtros (ativos, inativos, leads, plano, vencimento, último acesso, cidade, sexo, idade, objetivo)
- **Segmentações salvas** (CRUD + preview de contagem)
- **Templates** com categorias (Comercial, Relacionamento, Estratégico, Conteúdo)
- **Editor de template** rich text + variáveis `{nome} {plano} {dias_vencido} {cupom} {link} {objetivo}` + preview no estilo WhatsApp bubble
- **Biblioteca de Mídias STH** (upload, preview, categorias, favoritos)

---

### FASE 3 — Envio, Agendamento e WhatsApp

- Builder de campanha (público → template → mídia → agendamento/envio)
- Edge function `crm-dispatch-campaign` (envia em lote via `send-whatsapp` com pausa anti-spam 3–6s)
- Edge function `crm-scheduler` (pg_cron a cada 5min, dispara campanhas agendadas e recorrentes)
- Histórico detalhado por destinatário (sent/failed/clicked)
- Tracking de cliques via short link (`/r/:campaignId/:contactId`)

---

### FASE 4 — Dashboard, Automação e Alertas

- Dashboard premium (ativas, agendadas, total enviado, resposta, reativações, melhores campanhas)
- Recorrência (ex: "renovação toda segunda 10h")
- Notificações em tempo real (campanha enviada / erro / leads novos / reativados)
- Tema visual Apple dark + verde STH, animações Framer Motion, cards translúcidos

---

### Detalhes técnicos

- **Stack**: React + Tailwind (semantic tokens existentes), shadcn, Framer Motion, TanStack Query
- **Backend**: Supabase (Lovable Cloud) + edge functions Deno
- **WhatsApp**: reaproveita `send-whatsapp` (Z-API). Se o canal "Nutri" for adicionado depois, basta passar `channel:"comercial"`
- **Permissões**: admin (total) e consultor (apenas seus alunos vinculados via `is_consultant_of`)
- **Reuso**: aproveita `message_templates`, `message_history`, `billing_campaigns` existentes — o CRM é a camada estratégica acima

---

### Confirmação antes de começar

Antes de criar migration e código, preciso confirmar 3 pontos:

1. **Aprovação por fases**? Começo pela **Fase 1** (banco + navegação) e te mostro antes de avançar para contatos/templates. OK?
2. **Migrar `message_templates` existentes** para `crm_templates` (com categorias) ou manter os dois lados (sistema vs CRM)? Recomendo **manter os dois**: `message_templates` segue sendo dos disparos automáticos do sistema, `crm_templates` é a biblioteca editorial de campanhas.
3. **Tracking de cliques**: criar short link próprio (`sthmethod.com.br/r/:id`) ou apenas registrar envio sem tracking de clique nesta primeira versão? Recomendo **sem tracking de clique na v1** para acelerar entrega (adiciona depois).

Me responde esses 3 pontos e já começo pela Fase 1.