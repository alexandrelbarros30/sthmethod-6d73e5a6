CREATE TABLE public.evolution_arts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_name text NOT NULL,
  art_type text NOT NULL,
  storage_path text NOT NULL,
  before_date date,
  after_date date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evolution_arts TO authenticated;
GRANT ALL ON public.evolution_arts TO service_role;

ALTER TABLE public.evolution_arts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage evolution_arts"
  ON public.evolution_arts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX evolution_arts_user_id_idx ON public.evolution_arts (user_id, created_at DESC);

CREATE TRIGGER evolution_arts_set_updated_at
  BEFORE UPDATE ON public.evolution_arts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for the (to-be-created) private bucket "evolution-arts"
CREATE POLICY "Admins read evolution-arts bucket"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'evolution-arts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write evolution-arts bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'evolution-arts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update evolution-arts bucket"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'evolution-arts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete evolution-arts bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'evolution-arts' AND public.has_role(auth.uid(), 'admin'));