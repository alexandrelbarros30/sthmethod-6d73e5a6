
-- Create foods table (TACO/TBCA database)
CREATE TABLE public.foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source text NOT NULL DEFAULT 'TACO',
  category text NOT NULL DEFAULT '',
  energy_kcal numeric NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  fiber_g numeric NOT NULL DEFAULT 0,
  sugar_g numeric NOT NULL DEFAULT 0,
  sodium_mg numeric NOT NULL DEFAULT 0,
  cholesterol_mg numeric NOT NULL DEFAULT 0,
  serving_size numeric NOT NULL DEFAULT 100,
  serving_unit text NOT NULL DEFAULT 'g',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view foods"
ON public.foods FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage foods table"
ON public.foods FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add nutritional columns to diet_foods
ALTER TABLE public.diet_foods 
  ADD COLUMN IF NOT EXISTS food_id uuid REFERENCES public.foods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity_grams numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS energy_kcal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS protein_g numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carbs_g numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fat_g numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fiber_g numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sugar_g numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sodium_mg numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cholesterol_mg numeric NOT NULL DEFAULT 0;

-- Allow consultors to manage foods for linked students (diet_foods via diet_meals)
CREATE POLICY "Consultors can manage linked diet foods"
ON public.diet_foods FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'consultor'::app_role) AND EXISTS (
    SELECT 1 FROM diet_meals dm 
    WHERE dm.id = diet_foods.meal_id 
    AND is_consultant_of(auth.uid(), dm.user_id)
  )
)
WITH CHECK (
  has_role(auth.uid(), 'consultor'::app_role) AND EXISTS (
    SELECT 1 FROM diet_meals dm 
    WHERE dm.id = diet_foods.meal_id 
    AND is_consultant_of(auth.uid(), dm.user_id)
  )
);
