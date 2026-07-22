
UPDATE payments SET status='approved', updated_at=now() WHERE id='dcb16631-0347-4046-acc3-e9efaf3a6bb3';

INSERT INTO payment_gateway_details (payment_id, mp_payment_id, ai_verification_status, ai_verification_notes)
VALUES ('dcb16631-0347-4046-acc3-e9efaf3a6bb3', '170017027566', 'approved', 'Confirmação manual: MP aprovou em 2026-07-22 15:04 BRT. Webhook rejeitado por signature mismatch.')
ON CONFLICT (payment_id) DO UPDATE SET mp_payment_id=EXCLUDED.mp_payment_id, ai_verification_status='approved', ai_verification_notes=EXCLUDED.ai_verification_notes;

-- Renova assinatura: base = end_date atual (23/07) + 30 dias = 22/08
UPDATE subscriptions
SET plan_id='3f14ddee-b119-4e3f-bfbe-6a0c6b178cf5',
    status='active',
    end_date = (GREATEST(end_date, CURRENT_DATE) + INTERVAL '30 days')::date,
    updated_at=now()
WHERE user_id='24d2e6b7-81d8-4306-8a77-b6261af5d30c';
