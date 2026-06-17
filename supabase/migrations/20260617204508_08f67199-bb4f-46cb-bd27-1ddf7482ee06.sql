
-- Tabela de links de pagamento avulsos
CREATE TABLE public.custom_payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  description text,
  max_uses integer NOT NULL DEFAULT 0, -- 0 = ilimitado
  current_uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.custom_payment_links TO anon;
GRANT SELECT ON public.custom_payment_links TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.custom_payment_links TO authenticated;
GRANT ALL ON public.custom_payment_links TO service_role;

ALTER TABLE public.custom_payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active payment links"
  ON public.custom_payment_links FOR SELECT
  USING (active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admin/financeiro manage links"
  ON public.custom_payment_links FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'));

CREATE TRIGGER update_custom_payment_links_updated_at
  BEFORE UPDATE ON public.custom_payment_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de pagamentos recebidos via link
CREATE TABLE public.custom_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.custom_payment_links(id) ON DELETE RESTRICT,
  payer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payer_name text NOT NULL,
  payer_email text,
  payer_phone text,
  amount numeric(10,2) NOT NULL,
  method text NOT NULL DEFAULT 'pix',
  status text NOT NULL DEFAULT 'pending',
  mp_preference_id text,
  mp_payment_id text,
  reconciled boolean NOT NULL DEFAULT false,
  reconciled_plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  reconciled_subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  reconciled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reconciled_at timestamptz,
  reconciled_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_payments_link_id ON public.custom_payments(link_id);
CREATE INDEX idx_custom_payments_status ON public.custom_payments(status);
CREATE INDEX idx_custom_payments_payer_user_id ON public.custom_payments(payer_user_id);

GRANT SELECT, INSERT, UPDATE ON public.custom_payments TO authenticated;
GRANT ALL ON public.custom_payments TO service_role;

ALTER TABLE public.custom_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/financeiro view all custom payments"
  ON public.custom_payments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'));

CREATE POLICY "Payer views own custom payments"
  ON public.custom_payments FOR SELECT
  TO authenticated
  USING (payer_user_id = auth.uid());

CREATE POLICY "Admin/financeiro update custom payments"
  ON public.custom_payments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'));

CREATE TRIGGER update_custom_payments_updated_at
  BEFORE UPDATE ON public.custom_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
