
-- 1) Tabela legal_acceptances
CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  email TEXT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('terms','privacy','marketing','program_nature','image_use')),
  document_version TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT true,
  option_value TEXT NULL,
  ip TEXT NULL,
  user_agent TEXT NULL,
  context TEXT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS legal_acceptances_user_idx ON public.legal_acceptances(user_id);
CREATE INDEX IF NOT EXISTS legal_acceptances_email_idx ON public.legal_acceptances(email);
CREATE INDEX IF NOT EXISTS legal_acceptances_type_idx ON public.legal_acceptances(document_type);

GRANT SELECT, INSERT ON public.legal_acceptances TO authenticated;
GRANT INSERT ON public.legal_acceptances TO anon;
GRANT ALL ON public.legal_acceptances TO service_role;

ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert acceptance"
  ON public.legal_acceptances FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "User can view own acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Coluna de autorização de imagem em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS image_consent_choice TEXT
  CHECK (image_consent_choice IN ('nao_autorizo','sem_identificacao','com_identificacao'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS image_consent_updated_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT false;
