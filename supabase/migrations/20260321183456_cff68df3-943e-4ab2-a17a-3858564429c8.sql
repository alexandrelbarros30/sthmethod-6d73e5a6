
CREATE TABLE public.bioimpedance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  total_weight numeric,
  body_fat_pct numeric,
  fat_mass_kg numeric,
  lean_mass_kg numeric,
  skeletal_muscle_kg numeric,
  total_water_pct numeric,
  total_water_l numeric,
  intracellular_water_l numeric,
  extracellular_water_l numeric,
  bmr_kcal numeric,
  metabolic_age integer,
  visceral_fat numeric,
  seg_left_arm numeric,
  seg_right_arm numeric,
  seg_left_leg numeric,
  seg_right_leg numeric,
  seg_trunk numeric,
  phase_angle numeric,
  notes text DEFAULT ''
);

ALTER TABLE public.bioimpedance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bioimpedance"
  ON public.bioimpedance_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultors can manage linked bioimpedance"
  ON public.bioimpedance_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id))
  WITH CHECK (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Students can view own bioimpedance"
  ON public.bioimpedance_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
