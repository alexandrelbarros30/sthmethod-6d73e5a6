
-- Diário alimentar — entradas
CREATE TABLE public.food_diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  meal_type text NOT NULL DEFAULT 'cafe', -- cafe, almoco, jantar, lanche, custom
  meal_label text NOT NULL DEFAULT '',
  food_id uuid,
  item_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 100,
  unit text NOT NULL DEFAULT 'g',
  energy_kcal numeric NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  fiber_g numeric NOT NULL DEFAULT 0,
  sodium_mg numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fde_user_date ON public.food_diary_entries(user_id, log_date);
ALTER TABLE public.food_diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own diary" ON public.food_diary_entries TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all diary" ON public.food_diary_entries FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Consultors view linked diary" ON public.food_diary_entries FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));

-- Água
CREATE TABLE public.food_diary_water (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  ml integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);
ALTER TABLE public.food_diary_water ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own water" ON public.food_diary_water TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view water" ON public.food_diary_water FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Metas
CREATE TABLE public.food_diary_goals (
  user_id uuid PRIMARY KEY,
  daily_kcal integer NOT NULL DEFAULT 2000,
  protein_g integer NOT NULL DEFAULT 130,
  carbs_g integer NOT NULL DEFAULT 220,
  fat_g integer NOT NULL DEFAULT 65,
  water_ml integer NOT NULL DEFAULT 2500,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.food_diary_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own goals" ON public.food_diary_goals TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view goals" ON public.food_diary_goals FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Refeições salvas
CREATE TABLE public.saved_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  total_kcal numeric NOT NULL DEFAULT 0,
  total_protein numeric NOT NULL DEFAULT 0,
  total_carbs numeric NOT NULL DEFAULT 0,
  total_fat numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sm_user ON public.saved_meals(user_id);
ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own saved meals" ON public.saved_meals TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.saved_meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_meal_id uuid NOT NULL REFERENCES public.saved_meals(id) ON DELETE CASCADE,
  food_id uuid,
  item_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 100,
  unit text NOT NULL DEFAULT 'g',
  energy_kcal numeric NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE public.saved_meal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own saved meal items" ON public.saved_meal_items TO authenticated
  USING (EXISTS (SELECT 1 FROM public.saved_meals sm WHERE sm.id = saved_meal_items.saved_meal_id AND sm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.saved_meals sm WHERE sm.id = saved_meal_items.saved_meal_id AND sm.user_id = auth.uid()));
