
CREATE TABLE public.diet_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  energy_kcal numeric NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diet_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage diet library" ON public.diet_library
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultors can manage diet library" ON public.diet_library
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'consultor'))
  WITH CHECK (public.has_role(auth.uid(), 'consultor'));
