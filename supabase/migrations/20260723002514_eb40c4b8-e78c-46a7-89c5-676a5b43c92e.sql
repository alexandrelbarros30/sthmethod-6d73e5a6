
CREATE TABLE public.app_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  file_path text NOT NULL,
  size_bytes bigint,
  notes text,
  is_current boolean NOT NULL DEFAULT false,
  released_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
CREATE UNIQUE INDEX app_releases_one_current ON public.app_releases (is_current) WHERE is_current;

GRANT SELECT ON public.app_releases TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_releases TO authenticated;
GRANT ALL ON public.app_releases TO service_role;
ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read app releases" ON public.app_releases FOR SELECT USING (true);
CREATE POLICY "admins manage app releases" ON public.app_releases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "public read app-releases bucket" ON storage.objects FOR SELECT
  USING (bucket_id = 'app-releases');
CREATE POLICY "admins upload app-releases" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'app-releases' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update app-releases" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'app-releases' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete app-releases" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'app-releases' AND public.has_role(auth.uid(), 'admin'));
