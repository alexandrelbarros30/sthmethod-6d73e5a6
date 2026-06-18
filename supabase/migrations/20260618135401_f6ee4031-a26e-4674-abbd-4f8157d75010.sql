
-- 1. Tabela
CREATE TABLE public.image_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  payer_name text NOT NULL DEFAULT '',
  payer_email text NULL,
  payer_phone text NULL,
  authorized boolean NULL,
  allow_tagging boolean NULL,
  social_handle text NULL,
  signature_name text NULL,
  ip_address text NULL,
  user_agent text NULL,
  responded_at timestamptz NULL,
  notes text NULL,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_image_consents_user_id ON public.image_consents(user_id);
CREATE INDEX idx_image_consents_created_at ON public.image_consents(created_at DESC);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_consents TO authenticated;
GRANT ALL ON public.image_consents TO service_role;

-- 3. RLS
ALTER TABLE public.image_consents ENABLE ROW LEVEL SECURITY;

-- Admin / admin_viewer: tudo
CREATE POLICY "Admins manage image consents"
  ON public.image_consents FOR ALL
  TO authenticated
  USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Consultor: ver alunos vinculados
CREATE POLICY "Consultor view own students consents"
  ON public.image_consents FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'consultor')
    AND user_id IS NOT NULL
    AND public.is_consultant_of(auth.uid(), user_id)
  );

-- Consultor: criar/editar para alunos vinculados
CREATE POLICY "Consultor insert own students consents"
  ON public.image_consents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'consultor')
    AND user_id IS NOT NULL
    AND public.is_consultant_of(auth.uid(), user_id)
  );

CREATE POLICY "Consultor update own students consents"
  ON public.image_consents FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'consultor')
    AND user_id IS NOT NULL
    AND public.is_consultant_of(auth.uid(), user_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'consultor')
    AND user_id IS NOT NULL
    AND public.is_consultant_of(auth.uid(), user_id)
  );

-- Aluno: vê o seu próprio
CREATE POLICY "Student view own consent"
  ON public.image_consents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Trigger updated_at
CREATE TRIGGER trg_image_consents_updated
BEFORE UPDATE ON public.image_consents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RPC público: ler por token (sem autenticação)
CREATE OR REPLACE FUNCTION public.get_image_consent_by_token(_token text)
RETURNS TABLE (
  id uuid,
  token text,
  payer_name text,
  payer_email text,
  payer_phone text,
  authorized boolean,
  allow_tagging boolean,
  social_handle text,
  signature_name text,
  responded_at timestamptz,
  has_user boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, token, payer_name, payer_email, payer_phone,
         authorized, allow_tagging, social_handle, signature_name, responded_at,
         (user_id IS NOT NULL) AS has_user
  FROM public.image_consents
  WHERE token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_image_consent_by_token(text) TO anon, authenticated;

-- 6. RPC público: submeter resposta
CREATE OR REPLACE FUNCTION public.submit_image_consent(
  _token text,
  _payer_name text,
  _payer_email text,
  _payer_phone text,
  _authorized boolean,
  _allow_tagging boolean,
  _social_handle text,
  _signature_name text,
  _ip_address text,
  _user_agent text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF _signature_name IS NULL OR length(trim(_signature_name)) < 3 THEN
    RAISE EXCEPTION 'Assinatura (nome completo) é obrigatória';
  END IF;
  IF _authorized IS NULL THEN
    RAISE EXCEPTION 'Resposta de autorização é obrigatória';
  END IF;

  UPDATE public.image_consents SET
    payer_name = COALESCE(NULLIF(trim(_payer_name), ''), payer_name),
    payer_email = COALESCE(NULLIF(trim(_payer_email), ''), payer_email),
    payer_phone = COALESCE(NULLIF(trim(_payer_phone), ''), payer_phone),
    authorized = _authorized,
    allow_tagging = COALESCE(_allow_tagging, false),
    social_handle = NULLIF(trim(_social_handle), ''),
    signature_name = trim(_signature_name),
    ip_address = _ip_address,
    user_agent = _user_agent,
    responded_at = now(),
    updated_at = now()
  WHERE token = _token
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Token inválido';
  END IF;

  RETURN jsonb_build_object('id', v_id, 'ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_image_consent(text, text, text, text, boolean, boolean, text, text, text, text) TO anon, authenticated;
