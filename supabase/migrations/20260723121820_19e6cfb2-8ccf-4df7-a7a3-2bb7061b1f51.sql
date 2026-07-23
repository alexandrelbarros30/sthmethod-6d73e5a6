
-- 1) Idempotência: coluna que registra quando o pagamento já foi convertido em assinatura
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS subscription_applied_at TIMESTAMPTZ;

-- 2) Correção dos dados afetados pelo bug de empilhamento
--    Turbo 30D (60 -> 30 dias)
UPDATE public.subscriptions
SET end_date = start_date + INTERVAL '30 days'
WHERE user_id IN (
  '819496c0-bcf5-42fc-9c8f-c7d556f52c56',
  '1ec51cd0-ba96-4018-9e3f-7b164cd8bf8c'
)
  AND (end_date - start_date) > 30;

--    Selected 365D (1826 -> 365 dias)
UPDATE public.subscriptions
SET end_date = start_date + INTERVAL '365 days'
WHERE user_id = '78cf90b4-afdc-412a-91b1-2f9132e603bd'
  AND (end_date - start_date) > 365;

-- 3) Marca pagamentos já aprovados como "aplicados" para evitar reprocessamento
UPDATE public.payments
SET subscription_applied_at = COALESCE(subscription_applied_at, updated_at, created_at)
WHERE status = 'approved' AND subscription_applied_at IS NULL;
