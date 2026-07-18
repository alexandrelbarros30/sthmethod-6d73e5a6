
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_email_time ON public.auth_rate_limits (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_ip_time ON public.auth_rate_limits (ip_address, created_at DESC);

GRANT SELECT ON public.auth_rate_limits TO authenticated;
GRANT ALL ON public.auth_rate_limits TO service_role;

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read auth rate limits"
ON public.auth_rate_limits FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  _email TEXT,
  _ip TEXT,
  _max_attempts INT DEFAULT 5,
  _window_minutes INT DEFAULT 15
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email_fails INT;
  _ip_fails INT;
  _blocked BOOLEAN;
  _retry_after INT;
BEGIN
  SELECT count(*) INTO _email_fails
  FROM public.auth_rate_limits
  WHERE email = lower(_email)
    AND success = false
    AND created_at > now() - (_window_minutes || ' minutes')::interval;

  SELECT count(*) INTO _ip_fails
  FROM public.auth_rate_limits
  WHERE ip_address = _ip
    AND success = false
    AND created_at > now() - (_window_minutes || ' minutes')::interval;

  _blocked := _email_fails >= _max_attempts OR _ip_fails >= _max_attempts * 3;
  _retry_after := CASE WHEN _blocked THEN _window_minutes * 60 ELSE 0 END;

  RETURN jsonb_build_object(
    'blocked', _blocked,
    'email_fails', _email_fails,
    'ip_fails', _ip_fails,
    'retry_after_seconds', _retry_after
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_auth_attempt(
  _email TEXT,
  _ip TEXT,
  _user_agent TEXT,
  _success BOOLEAN,
  _reason TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.auth_rate_limits (email, ip_address, user_agent, success, reason)
  VALUES (lower(_email), _ip, _user_agent, _success, _reason);

  -- Housekeeping: keep only last 30 days
  DELETE FROM public.auth_rate_limits
  WHERE created_at < now() - interval '30 days';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_auth_rate_limit(TEXT, TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_auth_attempt(TEXT, TEXT, TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_auth_rate_limit(TEXT, TEXT, INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_auth_attempt(TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO service_role;
