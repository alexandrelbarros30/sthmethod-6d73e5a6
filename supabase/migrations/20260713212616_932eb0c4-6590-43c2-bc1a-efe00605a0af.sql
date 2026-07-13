
-- ============================================================
-- 1) plans.modules
-- ============================================================
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS modules jsonb NOT NULL DEFAULT '{"image_authorization":true,"phone_authorization":true}'::jsonb;

-- ============================================================
-- 2) authorization_audit (histórico do aluno)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.authorization_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('image','phone')),
  action text NOT NULL CHECK (action IN ('granted','updated','revoked','rejected')),
  previous_value text,
  new_value text,
  reason text,
  actor_user_id uuid,
  actor_role text,
  ip text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON public.authorization_audit(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_kind ON public.authorization_audit(kind, created_at DESC);

GRANT SELECT, INSERT ON public.authorization_audit TO authenticated;
GRANT ALL ON public.authorization_audit TO service_role;

ALTER TABLE public.authorization_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own authorization audit"
ON public.authorization_audit FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Staff read all authorization audit"
ON public.authorization_audit FOR SELECT TO authenticated
USING (public.is_crm_staff(auth.uid()) OR public.has_admin_view(auth.uid()));

CREATE POLICY "Users insert own authorization audit"
ON public.authorization_audit FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff insert authorization audit"
ON public.authorization_audit FOR INSERT TO authenticated
WITH CHECK (public.is_crm_staff(auth.uid()));

-- ============================================================
-- 3) authorization_change_notifications (alertas do admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.authorization_change_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  student_name text NOT NULL DEFAULT '',
  kind text NOT NULL CHECK (kind IN ('image','phone')),
  action text NOT NULL,
  previous_value text,
  new_value text,
  reason text,
  seen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_notif_created ON public.authorization_change_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_notif_seen ON public.authorization_change_notifications(seen);

GRANT SELECT, UPDATE ON public.authorization_change_notifications TO authenticated;
GRANT ALL ON public.authorization_change_notifications TO service_role;

ALTER TABLE public.authorization_change_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read authorization notifications"
ON public.authorization_change_notifications FOR SELECT TO authenticated
USING (public.is_crm_staff(auth.uid()) OR public.has_admin_view(auth.uid()));

CREATE POLICY "Staff update authorization notifications"
ON public.authorization_change_notifications FOR UPDATE TO authenticated
USING (public.is_crm_staff(auth.uid()) OR public.has_admin_view(auth.uid()))
WITH CHECK (public.is_crm_staff(auth.uid()) OR public.has_admin_view(auth.uid()));

-- ============================================================
-- 4) authorized_contacts: permitir status 'revoked' + política do aluno
-- ============================================================
ALTER TABLE public.authorized_contacts
  DROP CONSTRAINT IF EXISTS authorized_contacts_status_check;
ALTER TABLE public.authorized_contacts
  ADD CONSTRAINT authorized_contacts_status_check
  CHECK (status = ANY (ARRAY['pending','awaiting_student','approved','rejected','revoked']));

ALTER TABLE public.authorized_contacts
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_reason text;

DROP POLICY IF EXISTS "Users revoke own authorized contacts" ON public.authorized_contacts;
CREATE POLICY "Users revoke own authorized contacts"
ON public.authorized_contacts FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND status = 'revoked');

-- ============================================================
-- 5) admin_email setting
-- ============================================================
INSERT INTO public.payment_settings (key, value)
VALUES ('admin_email','contato@sthmethod.com.br')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 6) Trigger helper: envia alerta admin + audit + email
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_authorization_change(
  _user_id uuid,
  _kind text,
  _action text,
  _previous text,
  _new text,
  _reason text,
  _actor_user uuid,
  _actor_role text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_email text;
  v_admin_email text;
BEGIN
  SELECT full_name, email INTO v_name, v_email FROM public.profiles WHERE user_id = _user_id LIMIT 1;

  -- Auditoria
  INSERT INTO public.authorization_audit (user_id, kind, action, previous_value, new_value, reason, actor_user_id, actor_role)
  VALUES (_user_id, _kind, _action, _previous, _new, _reason, _actor_user, _actor_role);

  -- Alerta admin (central de notificações)
  INSERT INTO public.authorization_change_notifications (student_user_id, student_name, kind, action, previous_value, new_value, reason)
  VALUES (_user_id, COALESCE(v_name, 'Aluno'), _kind, _action, _previous, _new, _reason);

  -- Log geral
  INSERT INTO public.automation_logs (event_type, target_user_id, payload)
  VALUES ('authorization_change', _user_id,
    jsonb_build_object('kind', _kind, 'action', _action, 'previous', _previous, 'new', _new, 'reason', _reason, 'actor', _actor_user));

  -- Email admin
  SELECT value INTO v_admin_email FROM public.payment_settings WHERE key = 'admin_email' LIMIT 1;
  IF v_admin_email IS NOT NULL AND v_admin_email <> '' THEN
    INSERT INTO public.email_scheduled_sends (
      template_key, recipient_user_id, recipient_email, recipient_name, template_data, source
    ) VALUES (
      'admin-authorization-change', NULL, v_admin_email, 'Equipe STH METHOD',
      jsonb_build_object(
        'studentName', COALESCE(v_name,'Aluno'),
        'studentEmail', COALESCE(v_email,''),
        'kind', _kind,
        'action', _action,
        'previousValue', COALESCE(_previous,''),
        'newValue', COALESCE(_new,''),
        'reason', COALESCE(_reason,''),
        'occurredAt', to_char(now() AT TIME ZONE 'America/Sao_Paulo','DD/MM/YYYY HH24:MI')
      ),
      'trigger:authorization_change'
    );
  END IF;
END;
$$;

-- ============================================================
-- 7) Trigger: profiles.image_consent_choice
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_profile_image_consent_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
BEGIN
  IF COALESCE(OLD.image_consent_choice,'') IS DISTINCT FROM COALESCE(NEW.image_consent_choice,'')
     AND NEW.image_consent_choice IS NOT NULL THEN
    v_action := CASE
      WHEN NEW.image_consent_choice = 'nao_autorizo' THEN 'revoked'
      WHEN OLD.image_consent_choice IS NULL OR OLD.image_consent_choice = 'nao_autorizo' THEN 'granted'
      ELSE 'updated'
    END;
    PERFORM public.notify_authorization_change(
      NEW.user_id, 'image', v_action,
      OLD.image_consent_choice, NEW.image_consent_choice,
      NULL, auth.uid(), NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_image_consent_change ON public.profiles;
CREATE TRIGGER trg_profile_image_consent_change
AFTER UPDATE OF image_consent_choice ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_profile_image_consent_change();

-- ============================================================
-- 8) Trigger: authorized_contacts status change
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_authorized_contact_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_reason text;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    PERFORM public.notify_authorization_change(NEW.user_id, 'phone', 'granted', NULL,
      NEW.holder_name || ' (' || NEW.phone || ')', NEW.reason, auth.uid(), NULL);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status IN ('revoked','rejected') THEN
      v_action := NEW.status;
      v_reason := COALESCE(NEW.revoked_reason, NEW.review_notes);
      PERFORM public.notify_authorization_change(NEW.user_id, 'phone', v_action,
        NEW.holder_name || ' (' || NEW.phone || ')', NEW.status, v_reason, auth.uid(), NULL);
    ELSIF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
      PERFORM public.notify_authorization_change(NEW.user_id, 'phone', 'granted', OLD.status,
        NEW.holder_name || ' (' || NEW.phone || ')', NEW.reason, auth.uid(), NULL);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_authorized_contact_change ON public.authorized_contacts;
CREATE TRIGGER trg_authorized_contact_change
AFTER INSERT OR UPDATE OF status ON public.authorized_contacts
FOR EACH ROW EXECUTE FUNCTION public.trg_authorized_contact_change();
