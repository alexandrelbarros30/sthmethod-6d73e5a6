
-- Adiciona verificação por e-mail para autorização de telefone adicional
ALTER TABLE public.authorized_contacts
  DROP CONSTRAINT IF EXISTS authorized_contacts_status_check;
ALTER TABLE public.authorized_contacts
  ADD CONSTRAINT authorized_contacts_status_check
  CHECK (status = ANY (ARRAY['pending','awaiting_student','approved','rejected']));

ALTER TABLE public.authorized_contacts
  ADD COLUMN IF NOT EXISTS verification_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS verification_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS student_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS student_ip text,
  ADD COLUMN IF NOT EXISTS student_user_agent text,
  ADD COLUMN IF NOT EXISTS terms_version text;

-- Adiciona novo document_type ao legal_acceptances
ALTER TABLE public.legal_acceptances
  DROP CONSTRAINT IF EXISTS legal_acceptances_document_type_check;
ALTER TABLE public.legal_acceptances
  ADD CONSTRAINT legal_acceptances_document_type_check
  CHECK (document_type = ANY (ARRAY['terms','privacy','marketing','program_nature','image_use','authorized_contact_consent']));

-- RPC: buscar dados públicos por token
CREATE OR REPLACE FUNCTION public.get_authorized_contact_by_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_student_name text;
  v_masked_phone text;
BEGIN
  SELECT ac.*, p.full_name AS student_name
    INTO r
    FROM public.authorized_contacts ac
    LEFT JOIN public.profiles p ON p.user_id = ac.user_id
   WHERE ac.verification_token = _token
   LIMIT 1;

  IF r IS NULL THEN
    RETURN jsonb_build_object('state','invalid');
  END IF;

  IF r.student_confirmed_at IS NOT NULL THEN
    RETURN jsonb_build_object('state','answered','authorized', r.status = 'approved');
  END IF;

  IF r.verification_expires_at IS NULL OR r.verification_expires_at < now() THEN
    RETURN jsonb_build_object('state','expired');
  END IF;

  -- Mascara telefone: mantém últimos 4 dígitos
  v_masked_phone := regexp_replace(coalesce(r.phone,''),'\D','','g');
  IF length(v_masked_phone) >= 4 THEN
    v_masked_phone := repeat('•', greatest(length(v_masked_phone)-4,0)) || right(v_masked_phone,4);
  END IF;

  RETURN jsonb_build_object(
    'state','valid',
    'student_name', coalesce(r.student_name,''),
    'holder_name', r.holder_name,
    'phone_masked', v_masked_phone,
    'relationship', r.relationship,
    'reason', r.reason,
    'expires_at', r.verification_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_authorized_contact_by_token(text) TO anon, authenticated;

-- RPC: confirmar (autorizar/recusar) via token
CREATE OR REPLACE FUNCTION public.confirm_authorized_contact(
  _token text,
  _authorized boolean,
  _signature_name text,
  _ip text,
  _user_agent text,
  _terms_version text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_email text;
  v_new_status text;
BEGIN
  IF _signature_name IS NULL OR length(trim(_signature_name)) < 3 THEN
    RAISE EXCEPTION 'Assinatura obrigatória';
  END IF;
  IF _authorized IS NULL THEN
    RAISE EXCEPTION 'Resposta obrigatória';
  END IF;

  SELECT * INTO r FROM public.authorized_contacts
   WHERE verification_token = _token LIMIT 1;

  IF r IS NULL THEN RAISE EXCEPTION 'Token inválido'; END IF;
  IF r.student_confirmed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Solicitação já respondida';
  END IF;
  IF r.verification_expires_at IS NULL OR r.verification_expires_at < now() THEN
    RAISE EXCEPTION 'Link expirado';
  END IF;

  v_new_status := CASE WHEN _authorized THEN 'approved' ELSE 'rejected' END;

  UPDATE public.authorized_contacts SET
    status = v_new_status,
    student_confirmed_at = now(),
    identity_verified_at = now(),
    student_ip = _ip,
    student_user_agent = _user_agent,
    terms_version = _terms_version,
    reviewed_at = now(),
    review_notes = COALESCE(review_notes,'') || CASE WHEN review_notes IS NULL OR review_notes = '' THEN '' ELSE E'\n' END
      || 'Aceite eletrônico por ' || trim(_signature_name) || ' em ' || to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
  WHERE id = r.id;

  SELECT email INTO v_email FROM public.profiles WHERE user_id = r.user_id LIMIT 1;

  INSERT INTO public.legal_acceptances (
    user_id, email, document_type, document_version, accepted, option_value, ip, user_agent, context
  ) VALUES (
    r.user_id, v_email, 'authorized_contact_consent',
    COALESCE(_terms_version, 'v1'),
    _authorized,
    trim(_signature_name),
    _ip, _user_agent,
    'authorized_contact:' || r.id::text || ':' || r.holder_name || ':' || r.relationship
  );

  RETURN jsonb_build_object('ok', true, 'status', v_new_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_authorized_contact(text, boolean, text, text, text, text) TO anon, authenticated;
