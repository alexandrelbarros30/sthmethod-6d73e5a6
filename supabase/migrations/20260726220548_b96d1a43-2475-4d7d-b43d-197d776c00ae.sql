
-- 1) Cria plano SELECT FREE (oculto do público)
INSERT INTO public.plans (id, name, price, duration, duration_days, benefits, active, subtitle, discount_type, discount_value, visibility, card_price, modules)
VALUES (
  'f9e00000-0000-4000-8000-00000000f9e0',
  'SELECT FREE',
  'R$ 0,00',
  '30 dias',
  30,
  ARRAY['Acesso completo por 30 dias','Cortesia STH METHOD (uso interno)'],
  true,
  'Cortesia — acesso interno',
  'none',
  0,
  'select_free',
  'R$ 0,00',
  '{"image_authorization": true, "phone_authorization": true}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  visibility = EXCLUDED.visibility,
  active = true;

-- 2) Reatribui as 7 assinaturas ativas do Turbo 30D via cupom PRIMEIRO
UPDATE public.subscriptions
SET plan_id = 'f9e00000-0000-4000-8000-00000000f9e0'
WHERE id IN (
  '0409c499-e017-4922-bcfd-815407a72f44',
  'acb77620-0436-4050-80f0-1504c3383c5f',
  '31326092-cdd1-495a-8e74-4cda6d8b6403',
  '814814b0-54d2-4bd5-8f23-3dc8b9f75444',
  'e94751a4-c170-485a-bf94-716cedf9c6fe',
  '17874d9d-f5db-4919-8f1f-83ffd21b6ced',
  'd0f7be63-65a0-44c9-a3db-7edd4eea4270'
);

-- 3) Atualiza os pagamentos "free" para refletir o plano SELECT FREE e o cupom PRIMEIRO
UPDATE public.payments
SET plan_id = 'f9e00000-0000-4000-8000-00000000f9e0',
    coupon_id = 'b624bc4f-0d9c-4e01-8b94-44a0af327e30',
    coupon_discount = COALESCE(original_amount, 0)
WHERE id IN (
  '2e72acca-4318-4d7e-a561-f9e279981a9d',
  'dcd9ed1e-1e91-46a4-add5-f39b36f0e0cb',
  '1b6f3a14-37b4-4eec-9a81-e0ffd01b3b6a',
  '4c56ad5e-1cff-4936-b1f3-bc3b038ce1f3',
  'd34f9520-b45e-4437-88cc-d4a85aaea17d',
  '68fb617b-fda4-4315-a5f9-0a3df436dc1d',
  '15998c46-822d-45ca-ae7d-853f55a41404'
);

-- 4) Permite o cupom PRIMEIRO no plano SELECT FREE também (mantém Turbo 30D)
UPDATE public.coupons
SET plan_ids = ARRAY[
  '3f14ddee-b119-4e3f-bfbe-6a0c6b178cf5',
  '97cc2e02-4382-45ff-a4c7-bdfe9fd81dce',
  'f9e00000-0000-4000-8000-00000000f9e0'
]::uuid[]
WHERE id = 'b624bc4f-0d9c-4e01-8b94-44a0af327e30';
