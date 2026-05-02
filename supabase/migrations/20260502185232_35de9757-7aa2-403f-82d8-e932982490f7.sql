
ALTER TABLE public.diet_meals
  ADD COLUMN IF NOT EXISTS diet_id uuid;

CREATE INDEX IF NOT EXISTS idx_diet_meals_user_diet ON public.diet_meals(user_id, diet_id);

-- Backfill: prefer active diet per user, fallback to most recent
WITH chosen AS (
  SELECT DISTINCT ON (user_id) user_id, id AS diet_id
  FROM public.student_diets
  ORDER BY user_id, is_active DESC NULLS LAST, created_at DESC
)
UPDATE public.diet_meals dm
SET diet_id = c.diet_id
FROM chosen c
WHERE dm.user_id = c.user_id
  AND dm.diet_id IS NULL;
