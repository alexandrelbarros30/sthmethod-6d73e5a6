-- Força a criação da coluna metadata primeiro, fora de blocos complexos se necessário,
-- mas o PostgreSQL permite ALTER TABLE dentro de transações.
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Agora tenta o INSERT/UPDATE do cupom STH10AI
INSERT INTO public.coupons (
    code,
    discount_type,
    discount_value,
    active,
    max_uses,
    current_uses,
    metadata
) VALUES (
    'STH10AI',
    'percentage',
    10,
    true,
    1000,
    0,
    '{"campaign": "sth-ai-launch", "rules": "Somente para planos oficiais via Pix à vista. Não acumulativo com outras ofertas."}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    discount_type = 'percentage',
    discount_value = 10,
    active = true,
    metadata = EXCLUDED.metadata;
