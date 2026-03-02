
-- Add discount fields to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'none';
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS discount_value numeric NOT NULL DEFAULT 0;

-- Create payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  amount numeric NOT NULL,
  original_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  method text NOT NULL DEFAULT 'pix',
  action_type text NOT NULL DEFAULT 'new',
  mp_payment_id text,
  mp_preference_id text,
  installments integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payment settings table
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment settings" ON public.payment_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view payment settings" ON public.payment_settings
  FOR SELECT USING (true);

-- Seed default payment settings
INSERT INTO public.payment_settings (key, value) VALUES
  ('pix_enabled', 'true'),
  ('credit_enabled', 'true'),
  ('debit_enabled', 'true'),
  ('mp_configured', 'false');
