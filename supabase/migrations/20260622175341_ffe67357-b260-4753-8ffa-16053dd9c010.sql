
ALTER TABLE public.identity_verification_requests
  ALTER COLUMN created_by DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS self_service_token text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_ivr_token ON public.identity_verification_requests(self_service_token);
CREATE INDEX IF NOT EXISTS idx_ivr_user_created ON public.identity_verification_requests(target_user_id, created_at DESC);
