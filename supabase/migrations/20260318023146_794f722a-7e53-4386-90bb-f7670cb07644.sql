
-- 1. Create restricted table for sensitive gateway data (admin-only)
CREATE TABLE public.payment_gateway_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  receipt_url TEXT,
  ai_verification_status TEXT,
  ai_verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(payment_id)
);

ALTER TABLE public.payment_gateway_details ENABLE ROW LEVEL SECURITY;

-- Only admins can access gateway details
CREATE POLICY "Only admins can manage gateway details"
  ON public.payment_gateway_details
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Financeiro can view gateway details
CREATE POLICY "Financeiro can view gateway details"
  ON public.payment_gateway_details
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'financeiro'::public.app_role));

-- 2. Migrate existing gateway data into the new table
INSERT INTO public.payment_gateway_details (payment_id, mp_payment_id, mp_preference_id, receipt_url, ai_verification_status, ai_verification_notes)
SELECT id, mp_payment_id, mp_preference_id, receipt_url, ai_verification_status, ai_verification_notes
FROM public.payments
WHERE mp_payment_id IS NOT NULL OR mp_preference_id IS NOT NULL OR receipt_url IS NOT NULL OR ai_verification_status IS NOT NULL;

-- 3. Drop sensitive columns from payments table
ALTER TABLE public.payments DROP COLUMN IF EXISTS mp_payment_id;
ALTER TABLE public.payments DROP COLUMN IF EXISTS mp_preference_id;
ALTER TABLE public.payments DROP COLUMN IF EXISTS receipt_url;
ALTER TABLE public.payments DROP COLUMN IF EXISTS ai_verification_status;
ALTER TABLE public.payments DROP COLUMN IF EXISTS ai_verification_notes;

-- 4. Harden payments RLS: restrict student SELECT to only non-sensitive columns via a view
-- Remove overly broad admin policy and replace with authenticated-scoped one
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Admins can manage payments"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Replace public user policies with authenticated-scoped
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments"
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
