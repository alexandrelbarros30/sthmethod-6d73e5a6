
# Configurações do Motor de Resposta e APIs (CRM)

Nova área **somente Admin** dentro do CRM (`/admin/atendimento`) para configurar, monitorar e auditar os dois canais (**STH One** e **Fale com o Nutri**) e suas APIs de WhatsApp (WAPI, Z-API, Evolution, Cloud API), com motor de resposta por canal e logs de auditoria.

---

## 1. Banco de dados (1 migration)

Tabelas em `public` (todas com GRANT `authenticated`/`service_role`, RLS `admin`-only via `has_role`):

- **`api_channels`** — `id`, `name`, `channel_type` (`comercial`|`atendimento_personalizado`), `whatsapp_number`, `provider` (`wapi`|`zapi`|`evolution`|`cloud`), `instance_id`, `instance_name`, `base_url`, `webhook_url`, `status` (`ativo`|`inativo`|`manutencao`), `is_active`, `responsible_user_id` (uuid), `description`, `connection_status` (`connected`|`disconnected`|`pending`|`error`), `connected_number`, `qr_code`, `last_sync_at`, timestamps.
- **`api_credentials`** — `id`, `channel_id` (FK unique), campos `*_encrypted` (texto cifrado via `pgsodium`/`pgp_sym_encrypt` usando segredo do projeto; se `pgsodium` indisponível, usar coluna `text` opaca + máscara no front e nunca expor sem permissão), `token_expires_at`, timestamps.
  - Decisão: usar `pgp_sym_encrypt(value, current_setting('app.crm_secret'))` é frágil; manteremos colunas como `text` **sem GRANT a anon**, RLS apenas admin, e o front sempre mostra máscara `••••••••` exceto ao clicar "mostrar". Aceita o critério de "ocultos por padrão".
- **`response_engine_settings`** — `id`, `channel_id` (FK unique), `ai_enabled`, `human_enabled`, `auto_reply_enabled`, `business_hours` (jsonb: dias × janelas), `after_hours_message`, `max_auto_replies`, `handoff_to_human_after_minutes`, `ai_model`, `main_prompt`, `safety_prompt`, `fallback_prompt`, `temperature` (numeric), timestamps.
- **`api_logs`** — `id`, `channel_id`, `provider`, `event_type` (enum livre: `channel_enabled`, `channel_disabled`, `api_configured`, `token_updated`, `webhook_changed`, `connection_tested`, `send_error`, `receive_error`, `engine_failure`, `human_handoff`, `ticket_closed`, `credential_viewed`), `event_description`, `status` (`success`|`error`|`info`), `error_message`, `user_id`, `ip`, `created_at`.

**Seed:** insere 2 canais: `STH One` (comercial, provider `zapi`) e `Fale com o Nutri` (atendimento_personalizado, provider `wapi`), com `response_engine_settings` padrão.

**RLS:** `SELECT/INSERT/UPDATE/DELETE` apenas para `has_role(auth.uid(),'admin')`. `service_role` ALL (edge functions). `api_credentials` nunca acessível por `anon`.

---

## 2. Edge function

- **`crm-test-connection`** (nova) — recebe `channel_id`, lê credenciais, faz ping no provedor (W-API/Z-API/Evolution/Cloud), atualiza `connection_status`, `connected_number`, `last_sync_at` em `api_channels`, registra `api_logs`. Retorna `{ ok, status, number, error }`.

---

## 3. Frontend

Nova rota: `/admin/atendimento/configuracoes` (protegida por `has_role admin`).

Arquivos:
- `src/pages/admin/AdminMotorRespostaApis.tsx` — página com 4 abas: **Canais**, **APIs & Credenciais**, **Motor de Resposta**, **Logs**.
- `src/components/admin/motor-respostas/ChannelCard.tsx` — card por canal com toggle ativo, status badge (verde/cinza/âmbar), botões Testar/Reconectar/Desativar.
- `src/components/admin/motor-respostas/ChannelConfigDialog.tsx` — edita `api_channels` (nome, tipo, número, responsável, descrição, status).
- `src/components/admin/motor-respostas/ApiCredentialsForm.tsx` — formulário dinâmico por `provider` (campos relevantes), com botões **mostrar/ocultar**, **copiar**, **testar conexão**, **reconectar**.
- `src/components/admin/motor-respostas/ResponseEngineForm.tsx` — IA on/off, humano on/off, auto-reply, horário, mensagens, modelo IA (select dos Lovable AI), prompts (principal/segurança/fallback), temperatura (slider), handoff, limite mensagens.
- `src/components/admin/motor-respostas/ApiLogsTable.tsx` — tabela filtrável (canal, evento, status, período).

Integrar entrada no `AdminAtendimento.tsx`: botão "⚙ Configurações" no header (visível só para admin) → navega para a nova rota. Também adicionar item na sidebar admin: "Motor de Resposta & APIs".

**Visual:** dark, cards `rounded-2xl border border-border/40`, acentos `text-primary` (verde neon STH), badges de status (verde/cinza/âmbar/vermelho), tipografia `tracking-tight`, ocultação por padrão de campos sensíveis (`type="password"` + olhinho).

---

## 4. Segurança e auditoria

- Toda visualização de credencial chama uma função RPC `log_credential_view(channel_id)` que grava `event_type='credential_viewed'`.
- Toda mudança em `api_credentials` / `api_channels.status` grava log via trigger AFTER UPDATE.
- Botões "Testar conexão" e "Reconectar" sempre registram log com status retornado.

---

## 5. Rotas e acesso

- Rota nova: `/admin/atendimento/configuracoes` (protegida por `ProtectedRoute` + verificação `has_role admin`).
- Sidebar admin: adicionar item "Motor de Resposta & APIs" sob o grupo de Atendimento.

---

## Arquivos previstos

**Backend**
- `supabase/migrations/<ts>_api_channels_motor.sql`
- `supabase/functions/crm-test-connection/index.ts`

**Frontend**
- `src/pages/admin/AdminMotorRespostaApis.tsx`
- `src/components/admin/motor-respostas/ChannelCard.tsx`
- `src/components/admin/motor-respostas/ChannelConfigDialog.tsx`
- `src/components/admin/motor-respostas/ApiCredentialsForm.tsx`
- `src/components/admin/motor-respostas/ResponseEngineForm.tsx`
- `src/components/admin/motor-respostas/ApiLogsTable.tsx`
- `src/App.tsx` (rota nova)
- `src/components/DashboardSidebar.tsx` (item de menu)
- `src/pages/admin/AdminAtendimento.tsx` (atalho no header)

---

## Pontos a confirmar

1. **Criptografia das credenciais**: usar colunas `text` puras com RLS `admin-only` (sem `anon`, sem expor sem clique explícito + log) — ou prefere que eu monte com `pgp_sym_encrypt` usando um segredo do projeto (mais complexo, exige novo secret)? Recomendo a primeira opção (mais simples, suficiente para escopo admin).
2. **Reaproveitar `nutri_business_hours`** para o canal Fale com o Nutri ou cada canal terá seu próprio `business_hours` em `response_engine_settings` (independente)? Recomendo independente por canal.
3. **Os secrets atuais** (`WAPI_INSTANCE_ID`, `WAPI_TOKEN`, `ZAPI_INSTANCE_ID`, etc.) continuam sendo a fonte usada pelas funções `send-wapi`/`send-whatsapp` — a nova UI **edita as linhas em `api_channels`/`api_credentials`** para futuras integrações, mas o envio real continuará lendo os secrets até migrarmos as funções. Pode ser? (Sem isso, teria que reescrever `send-wapi` e `send-whatsapp` agora.)
