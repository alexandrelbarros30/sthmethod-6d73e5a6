
CREATE TABLE public.protocol_extra_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Categoria Extra',
  sort_order integer NOT NULL DEFAULT 0,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.protocol_extra_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage extra categories"
  ON public.protocol_extra_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultors can manage linked extra categories"
  ON public.protocol_extra_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'consultor') AND is_consultant_of(auth.uid(), user_id))
  WITH CHECK (has_role(auth.uid(), 'consultor') AND is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Students can view own extra categories"
  ON public.protocol_extra_categories FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
