
INSERT INTO storage.buckets (id, name, public) VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read ads' AND tablename = 'objects') THEN
    CREATE POLICY "Public read ads" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'ads');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth upload ads' AND tablename = 'objects') THEN
    CREATE POLICY "Auth upload ads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ads');
  END IF;
END $$;
