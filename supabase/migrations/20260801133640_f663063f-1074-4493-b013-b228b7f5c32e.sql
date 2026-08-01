-- ===== STH METHOD AI =====
CREATE TABLE public.ai_app_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER,
  sex TEXT,
  weight_kg NUMERIC,
  height_cm NUMERIC,
  goal TEXT,
  training_level TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  step INTEGER NOT NULL DEFAULT 0,
  phase1_complete BOOLEAN NOT NULL DEFAULT false,
  phase2_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_app_profiles TO authenticated;
GRANT ALL ON public.ai_app_profiles TO service_role;
ALTER TABLE public.ai_app_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai profile" ON public.ai_app_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff read ai profile" ON public.ai_app_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));

CREATE TABLE public.ai_app_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  external_reference TEXT,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_app_subs_user_idx ON public.ai_app_subscriptions(user_id, status);
GRANT SELECT, INSERT ON public.ai_app_subscriptions TO authenticated;
GRANT ALL ON public.ai_app_subscriptions TO service_role;
ALTER TABLE public.ai_app_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai subs read" ON public.ai_app_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own ai subs insert" ON public.ai_app_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ai_app_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL,
  cycle_start DATE NOT NULL DEFAULT CURRENT_DATE,
  revisions INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL DEFAULT '',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  exception_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_app_gen_user_idx ON public.ai_app_generations(user_id, kind, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_app_generations TO authenticated;
GRANT ALL ON public.ai_app_generations TO service_role;
ALTER TABLE public.ai_app_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai gens" ON public.ai_app_generations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff read ai gens" ON public.ai_app_generations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));

CREATE TABLE public.ai_app_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  measured_on DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC,
  waist_cm NUMERIC,
  hip_cm NUMERIC,
  chest_cm NUMERIC,
  arm_cm NUMERIC,
  thigh_cm NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_app_meas_user_idx ON public.ai_app_measurements(user_id, measured_on DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_app_measurements TO authenticated;
GRANT ALL ON public.ai_app_measurements TO service_role;
ALTER TABLE public.ai_app_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai measurements" ON public.ai_app_measurements FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff read ai measurements" ON public.ai_app_measurements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));

CREATE TABLE public.ai_app_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL,
  position TEXT,
  storage_path TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_app_files_user_idx ON public.ai_app_files(user_id, kind, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_app_files TO authenticated;
GRANT ALL ON public.ai_app_files TO service_role;
ALTER TABLE public.ai_app_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai files" ON public.ai_app_files FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff read ai files" ON public.ai_app_files FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));

-- storage policies for private bucket sth-ai (bucket created via tool)
CREATE POLICY "ai app own files read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'sth-ai' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor')));
CREATE POLICY "ai app own files write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sth-ai' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ai app own files delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'sth-ai' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE TRIGGER ai_app_profiles_touch BEFORE UPDATE ON public.ai_app_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ai_app_gens_touch BEFORE UPDATE ON public.ai_app_generations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ai_app_subs_touch BEFORE UPDATE ON public.ai_app_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();