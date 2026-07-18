-- ============ Admin Access Audit ============
CREATE TABLE IF NOT EXISTS public.admin_access_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  target_user_id UUID,
  target_label TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  reauth_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_access_audit TO authenticated;
GRANT ALL ON public.admin_access_audit TO service_role;

ALTER TABLE public.admin_access_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "admins read admin_access_audit"
ON public.admin_access_audit FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins and consultants can insert their own actions (actor_id must be self)
CREATE POLICY "actors insert their audit rows"
ON public.admin_access_audit FOR INSERT TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'))
);

CREATE INDEX IF NOT EXISTS idx_admin_access_audit_actor ON public.admin_access_audit(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_access_audit_target ON public.admin_access_audit(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_access_audit_action ON public.admin_access_audit(action, created_at DESC);

-- Convenience RPC (SECURITY DEFINER) so client + edge functions can log uniformly
CREATE OR REPLACE FUNCTION public.log_admin_access(
  _action TEXT,
  _resource_type TEXT,
  _target_user_id UUID DEFAULT NULL,
  _target_label TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb,
  _reauth_used BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor UUID := auth.uid();
  _email TEXT;
  _role TEXT;
  _id UUID;
BEGIN
  IF _actor IS NULL THEN RETURN NULL; END IF;
  IF NOT (public.has_role(_actor, 'admin') OR public.has_role(_actor, 'consultor')) THEN
    RETURN NULL;
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _actor;
  SELECT CASE
    WHEN public.has_role(_actor, 'admin') THEN 'admin'
    WHEN public.has_role(_actor, 'consultor') THEN 'consultor'
    ELSE 'other'
  END INTO _role;

  INSERT INTO public.admin_access_audit(
    actor_id, actor_email, actor_role, action, resource_type,
    target_user_id, target_label, metadata, reauth_used
  ) VALUES (
    _actor, _email, _role, _action, _resource_type,
    _target_user_id, _target_label, COALESCE(_metadata, '{}'::jsonb), COALESCE(_reauth_used, false)
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_admin_access(TEXT, TEXT, UUID, TEXT, JSONB, BOOLEAN) TO authenticated, service_role;