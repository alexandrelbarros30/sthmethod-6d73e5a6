CREATE TABLE IF NOT EXISTS public.email_template_settings (
  template_key TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'transactional',
  enabled BOOLEAN NOT NULL DEFAULT true,
  auto_send BOOLEAN NOT NULL DEFAULT true,
  subject_override TEXT,
  body_html_override TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT ON public.email_template_settings TO authenticated;
GRANT ALL ON public.email_template_settings TO service_role;

ALTER TABLE public.email_template_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email template settings"
  ON public.email_template_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin viewers read email template settings"
  ON public.email_template_settings
  FOR SELECT
  TO authenticated
  USING (public.has_admin_view(auth.uid()));

CREATE TRIGGER trg_email_template_settings_updated_at
  BEFORE UPDATE ON public.email_template_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.email_template_settings (template_key, category) VALUES
  ('signup', 'auth'),
  ('magiclink', 'auth'),
  ('recovery', 'auth'),
  ('invite', 'auth'),
  ('email_change', 'auth'),
  ('reauthentication', 'auth'),
  ('welcome-registration', 'transactional'),
  ('welcome-post-payment', 'transactional'),
  ('payment-receipt-first', 'transactional'),
  ('payment-receipt-renewal', 'transactional'),
  ('payment-pending', 'transactional'),
  ('payment-failed', 'transactional'),
  ('renewal-reminder', 'transactional'),
  ('subscription-expired', 'transactional'),
  ('plan-changed', 'transactional'),
  ('coupon-applied', 'transactional'),
  ('email-change-confirm', 'transactional'),
  ('inactivity-reminder', 'transactional')
ON CONFLICT (template_key) DO NOTHING;