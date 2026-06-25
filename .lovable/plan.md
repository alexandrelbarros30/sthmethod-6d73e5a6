## Projeto Verão 180 — Plano + Assinatura escalonada MP

### 1. Banco — novo plano e tabela de assinatura
**Migration:**

a) **Insert do plano** `Projeto Verão 180`:
- `name`: "Projeto Verão 180"
- `subtitle`: "Comece em julho. Chegue ao verão com resultados."
- `headline` (benefício #1): "Comece em julho. Chegue ao verão com resultados."
- `price`: "R$ 477,00" (total cartão)
- `card_price`: "R$ 477,00"
- `duration`: "180 dias" / `duration_days`: 180
- `visibility`: 'public', `active`: true
- `benefits`: lista de benefícios (mesma estrutura do 6M) + destaque "6× no cartão: 2× R$ 49,50 + 4× R$ 94,50"

b) **Nova tabela `mp_subscriptions`** (preapproval MP escalonado):
```
id, user_id, plan_id, mp_preapproval_id, status,
phase (1|2), charges_done, total_amount_paid,
phase1_amount (49.50), phase1_charges (2),
phase2_amount (94.50), phase2_charges (4),
next_payment_date, end_date, created_at, updated_at
```
+ RLS (user vê o próprio; service_role total) + GRANTs.

### 2. Edge function `create-mp-subscription`
- Recebe `plan_id` do aluno autenticado.
- Cria preapproval no MP em fase 1: `auto_recurring.transaction_amount=49.50`, frequency mensal, `end_date = hoje+60d` (cobra 2× R$49,50).
- `back_url`: `/dashboard/subscription?status=approved`.
- `external_reference`: `mpsub:{mp_subscriptions.id}`.
- Salva registro `mp_subscriptions` (phase=1, charges_done=0).
- Retorna `init_point` para o aluno autorizar o cartão.

### 3. Webhook `mercado-pago-webhook` — handler de preapproval
- Aceita topic `preapproval` e `authorized_payment`.
- Para cada cobrança aprovada:
  - Incrementa `charges_done` e `total_amount_paid`.
  - Se `phase=1` e `charges_done >= 2`: faz `PUT /preapproval/{id}` no MP atualizando `auto_recurring.transaction_amount=94.50` e `end_date = hoje+120d`, marca `phase=2`.
  - Se `phase=2` e `charges_done >= 4`: faz `PUT /preapproval/{id}` com `status='cancelled'`.
  - Cria/atualiza `subscriptions` do aluno (start = primeira cobrança, end = +180d) e marca plano ativo na 1ª aprovação.
  - Insere registro em `payments` (action_type='subscription') para histórico/recibo.

### 4. Frontend — `/dashboard/subscription` (StudentSubscription)
- No card do plano "Projeto Verão 180" exibir badge "6× no cartão (2× R$49,50 + 4× R$94,50)".
- Botão "Assinar no cartão" chama `create-mp-subscription` em vez de `create-payment`.
- Demais planos seguem fluxo atual de `create-payment` (PIX/cartão à vista/parcelado padrão).

### 5. Landing `/` (PlansSection)
- Renderiza automaticamente porque é `visibility=public` — sem mudança de código.
- Mostra subtitle como headline.

### Notas técnicas
- `MERCADO_PAGO_ACCESS_TOKEN` já configurado.
- Endpoint MP preapproval: `POST/PUT https://api.mercadopago.com/preapproval`.
- Reaproveita `mercado-pago-webhook` existente; só adiciona um branch para `topic=preapproval`/`authorized_payment` antes do branch de `payment`.
- Não altera fluxo dos demais planos.