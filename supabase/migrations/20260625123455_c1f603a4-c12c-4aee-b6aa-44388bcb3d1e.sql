
CREATE TABLE IF NOT EXISTS public.cas_search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.cas_users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  discipline TEXT NULL,
  has_answer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cas_search_history_user_created_idx
  ON public.cas_search_history(user_id, created_at DESC);

GRANT ALL ON public.cas_search_history TO service_role;

ALTER TABLE public.cas_search_history ENABLE ROW LEVEL SECURITY;
-- No public policies: accessed only via cas-auth edge function (service role).
