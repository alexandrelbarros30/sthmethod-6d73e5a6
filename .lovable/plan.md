# Sistema Inteligente de Cobrança & Renovação

Plano para transformar a tela atual `AdminBilling` em um CRM completo de renovação com sequência automática de 5 etapas, histórico, bloqueio de duplicidade e notificações.

## 1. Banco de dados (migration)

**Nova tabela `billing_campaigns`** (uma linha por aluno em ciclo de cobrança):
- `user_id`, `subscription_id`, `plan_id_anterior`, `end_date`
- `stage` (1 a 5)
- `last_charged_at`, `next_due_at`
- `status` ('active' | 'paused' | 'renewed' | 'ignored' | 'reactivated')
- `responsible_user_id`, `notes`
- timestamps

**Nova tabela `billing_charges`** (log/histórico — uma linha por envio):
- `campaign_id`, `user_id`, `stage`, `template_key`, `responsible_user_id`
- `phone`, `message`, `image_url`, `document_url`
- `delivery_status` ('sent' | 'failed'), `delivery_error`
- `sent_at`

RLS: admin/staff/consultor podem ler/escrever (seguir padrão das tabelas admin existentes).

**Função `advance_billing_campaign(campaign_id)`**: incrementa `stage`, calcula `next_due_at` conforme regra (7, 8, 15, 30 dias) e seta status final em stage 5.

## 2. Templates do sistema

Adicionar 4 novas `SystemTemplateKey` em `src/lib/system-templates.ts`:
- `renewal_soft` — Template amigável (1ª)
- `renewal_objective` — Retorno leve (2ª)
- `renewal_recovery` — Cupom oportunidade (3ª)
- `renewal_last_contact` — Último contato ativo (4ª)
- já existe espaço para 5ª como "Reativação inteligente" (criar `renewal_reactivation`)

Mapa stage→template_key usado na composição automática.

## 3. UI — `src/pages/admin/AdminBilling.tsx`

Refatorar a tela atual mantendo o composer/anexos já implementados:

**Cards superiores** (6):
- Total vencidos, Aguardando próxima cobrança, Cobranças do dia, Reativações pendentes, Renovações recuperadas (últimos 30d), Valor estimado recuperável.

**Tabs**: `Fila ativa` (default — só quem está com `next_due_at <= hoje`) · `Aguardando` · `Histórico` · `Renovados` · `Ignorados`.

**Tabela** com colunas pedidas + badges por etapa (cores: 1ª cyan, 2ª azul, 3ª âmbar, 4ª violeta, 5ª rosa, Renovado verde STH, Ignorado cinza).

**Ações por linha**: Enviar (abre composer com template da stage atual pré-selecionado) · Renovou (marca `renewed`) · Ignorar (marca `ignored`) · Histórico (popup com `billing_charges`).

**Após envio bem-sucedido**:
- insere em `billing_charges`
- chama `advance_billing_campaign` (avança stage, agenda próximo)
- remove da fila ativa até `next_due_at`
- toast de confirmação

**Bloqueio de duplicidade**: fila ativa filtra `next_due_at <= now()` AND `status='active'`.

**Priorização**: ordenar por (dias_vencido entre 7 e 20 primeiro, depois plano 90/180D, depois último acesso recente).

## 4. Notificações internas

Sino no header admin (componente `NotificationCenter` já existe) — adicionar contador de "cobranças disponíveis hoje" lendo `billing_campaigns` com `next_due_at <= now()` e `status='active'`.

## 5. Integração WhatsApp

Manter `send-whatsapp` edge function. Composer já suporta template, imagem e PDF. Variáveis `{cupom}` e `{link_renovacao}` adicionadas ao `renderTemplate`.

## 6. Inicialização do ciclo

Quando uma subscription vence (ou já está vencida sem campanha ativa), criar automaticamente uma `billing_campaigns` com `stage=0`, `next_due_at=end_date`, `status='active'`. Feito via:
- trigger no insert da subscription expirada, OU
- backfill on-demand quando a tela carrega (mais simples — ver alunos vencidos sem campanha e criar).

Optarei pelo **backfill on-demand** para simplicidade — sem trigger novo.

## 7. Quando aluno paga

Já existe lógica que remove alunos pagos da lista (implementação anterior). Estender: ao detectar pagamento aprovado para um `user_id` com campanha ativa, marcar `status='renewed'`.

---

## Detalhes técnicos (resumo)

- Migration: 2 tabelas + 1 função SQL + RLS
- `src/lib/system-templates.ts`: 5 novas keys + defaults
- `src/pages/admin/AdminBilling.tsx`: refatoração grande (tabs, cards, histórico, ações)
- Sem novas edge functions

## Fora de escopo (não vou fazer)

- Agendamento real via cron (sem `pg_cron` novo) — sequência é dirigida pela coluna `next_due_at` consultada pela UI
- Mudanças no fluxo de pagamento Mercado Pago
- App do aluno

Confirma para eu implementar?
