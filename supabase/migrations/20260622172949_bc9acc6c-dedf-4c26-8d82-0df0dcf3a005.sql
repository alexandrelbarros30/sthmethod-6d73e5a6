
-- Identity verification requests
CREATE TABLE public.identity_verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id UUID NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('email','phone','password')),
  new_value TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','kba_failed','kba_passed','code_sent','code_failed','completed','cancelled','expired')),
  kba_attempts INT NOT NULL DEFAULT 0,
  kba_passed BOOLEAN NOT NULL DEFAULT false,
  code_hash TEXT,
  code_expires_at TIMESTAMPTZ,
  code_attempts INT NOT NULL DEFAULT 0,
  code_verified BOOLEAN NOT NULL DEFAULT false,
  code_sent_to TEXT,
  created_by UUID NOT NULL,
  completed_at TIMESTAMPTZ,
  ip TEXT,
  user_agent TEXT,
  audit JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ivr_target ON public.identity_verification_requests(target_user_id, created_at DESC);
CREATE INDEX idx_ivr_status ON public.identity_verification_requests(status);

GRANT SELECT, INSERT, UPDATE ON public.identity_verification_requests TO authenticated;
GRANT ALL ON public.identity_verification_requests TO service_role;

ALTER TABLE public.identity_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage identity verification" ON public.identity_verification_requests
FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_ivr_updated_at BEFORE UPDATE ON public.identity_verification_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- KBA comparison (server-side, no leak)
CREATE OR REPLACE FUNCTION public.verify_identity_kba(
  _user_id UUID,
  _birth_date DATE,
  _cpf_last4 TEXT
) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND birth_date IS NOT NULL
      AND cpf IS NOT NULL
      AND birth_date = _birth_date
      AND RIGHT(regexp_replace(cpf,'\D','','g'), 4) = regexp_replace(COALESCE(_cpf_last4,''),'\D','','g')
  );
$$;

-- Reports whether KBA data exists (so admin knows the desafio is viável)
CREATE OR REPLACE FUNCTION public.identity_kba_available(_user_id UUID)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'has_birth_date', (birth_date IS NOT NULL),
    'has_cpf', (cpf IS NOT NULL AND length(regexp_replace(cpf,'\D','','g')) >= 11)
  )
  FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_identity_kba(UUID,DATE,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_identity_kba(UUID,DATE,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.identity_kba_available(UUID) TO service_role, authenticated;
