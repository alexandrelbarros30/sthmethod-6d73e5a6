
CREATE TABLE public.authorized_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  holder_name text NOT NULL,
  phone text NOT NULL,
  relationship text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_authorized_contacts_user ON public.authorized_contacts(user_id);
CREATE INDEX idx_authorized_contacts_status ON public.authorized_contacts(status);

GRANT SELECT, INSERT, UPDATE ON public.authorized_contacts TO authenticated;
GRANT ALL ON public.authorized_contacts TO service_role;

ALTER TABLE public.authorized_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own authorized contacts"
  ON public.authorized_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_crm_staff(auth.uid()));

CREATE POLICY "Users insert own authorized contacts"
  ON public.authorized_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff update authorized contacts"
  ON public.authorized_contacts FOR UPDATE
  TO authenticated
  USING (public.is_crm_staff(auth.uid()))
  WITH CHECK (public.is_crm_staff(auth.uid()));

CREATE TRIGGER trg_authorized_contacts_updated_at
  BEFORE UPDATE ON public.authorized_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.check_registration_duplicate(
  _email text DEFAULT NULL,
  _cpf text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _exclude_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_norm text := lower(trim(coalesce(_email, '')));
  v_cpf_digits text := regexp_replace(coalesce(_cpf, ''), '\D', '', 'g');
  v_phone_digits text := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
  v_email_dup boolean := false;
  v_cpf_dup boolean := false;
  v_phone_dup boolean := false;
BEGIN
  IF v_email_norm <> '' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE lower(trim(email)) = v_email_norm
        AND (_exclude_user_id IS NULL OR user_id <> _exclude_user_id)
    ) INTO v_email_dup;
  END IF;

  IF length(v_cpf_digits) = 11 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE regexp_replace(coalesce(cpf,''), '\D', '', 'g') = v_cpf_digits
        AND (_exclude_user_id IS NULL OR user_id <> _exclude_user_id)
    ) INTO v_cpf_dup;
  END IF;

  IF length(v_phone_digits) >= 10 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE regexp_replace(coalesce(phone,''), '\D', '', 'g') = v_phone_digits
        AND (_exclude_user_id IS NULL OR user_id <> _exclude_user_id)
    ) INTO v_phone_dup;
  END IF;

  RETURN jsonb_build_object(
    'email', v_email_dup,
    'cpf', v_cpf_dup,
    'phone', v_phone_dup
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_registration_duplicate(text, text, text, uuid) TO anon, authenticated;
