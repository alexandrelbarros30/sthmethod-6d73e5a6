CREATE TABLE IF NOT EXISTS public.nutri_away_throttle (
  phone text PRIMARY KEY,
  last_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutri_away_throttle TO service_role;

ALTER TABLE public.nutri_away_throttle ENABLE ROW LEVEL SECURITY;
