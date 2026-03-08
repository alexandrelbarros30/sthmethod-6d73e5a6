
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS receipt_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_verification_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_verification_notes text DEFAULT NULL;
