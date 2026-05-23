ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS plan_ids uuid[] NOT NULL DEFAULT '{}';

-- Backfill from legacy plan_id
UPDATE public.coupons
SET plan_ids = ARRAY[plan_id]
WHERE plan_id IS NOT NULL AND (plan_ids IS NULL OR array_length(plan_ids,1) IS NULL);

CREATE INDEX IF NOT EXISTS idx_coupons_plan_ids ON public.coupons USING GIN (plan_ids);