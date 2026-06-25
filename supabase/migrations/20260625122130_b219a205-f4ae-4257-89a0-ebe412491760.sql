
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS public.cas_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text NOT NULL,
  email         citext NOT NULL UNIQUE,
  birth_date    date NOT NULL,
  phone         text,
  rg            text,
  password_hash text NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cas_users TO service_role;
ALTER TABLE public.cas_users ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cas_users_email ON public.cas_users (email);

CREATE OR REPLACE FUNCTION public.cas_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_cas_users_updated_at ON public.cas_users;
CREATE TRIGGER trg_cas_users_updated_at
BEFORE UPDATE ON public.cas_users
FOR EACH ROW EXECUTE FUNCTION public.cas_set_updated_at();

CREATE TABLE IF NOT EXISTS public.cas_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.cas_users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  user_agent  text,
  ip_address  text,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cas_sessions TO service_role;
ALTER TABLE public.cas_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cas_sessions_user ON public.cas_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_cas_sessions_token ON public.cas_sessions (token_hash);

CREATE TABLE IF NOT EXISTS public.cas_password_resets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.cas_users(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  used_at      timestamptz,
  ip_address   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cas_password_resets TO service_role;
ALTER TABLE public.cas_password_resets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cas_password_resets_user ON public.cas_password_resets (user_id);
