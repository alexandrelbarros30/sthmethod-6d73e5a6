
CREATE TABLE public.evolution_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL DEFAULT 'student',
  notes TEXT NOT NULL DEFAULT '',

  weight NUMERIC,
  bmr NUMERIC,
  tdee NUMERIC,
  daily_calories NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,

  activity_type TEXT,
  does_cardio BOOLEAN,
  physical_activity_level TEXT,
  training_days_per_week INTEGER,
  training_duration_minutes INTEGER,
  training_intensity TEXT,
  cardio_days_per_week INTEGER,
  cardio_duration_minutes INTEGER,
  cardio_intensity TEXT,

  body_image_front_url TEXT,
  body_image_back_url TEXT,
  body_image_profile_url TEXT,

  bioimpedance_log_id UUID,
  body_fat_pct NUMERIC,
  lean_mass_kg NUMERIC,
  fat_mass_kg NUMERIC,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_evolution_snapshots_user_created
  ON public.evolution_snapshots (user_id, created_at DESC);

ALTER TABLE public.evolution_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own evolution_snapshots"
  ON public.evolution_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Students insert own evolution_snapshots"
  ON public.evolution_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage evolution_snapshots"
  ON public.evolution_snapshots FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultors view linked evolution_snapshots"
  ON public.evolution_snapshots FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultors insert linked evolution_snapshots"
  ON public.evolution_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));
