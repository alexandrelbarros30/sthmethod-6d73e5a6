ALTER TABLE public.email_template_settings
  ADD COLUMN IF NOT EXISTS custom_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS automation_rule JSONB;

CREATE TABLE IF NOT EXISTS public.email_scheduled_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,
  recipient_user_id UUID,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  attempts INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'manual'
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_scheduled_sends TO authenticated;
GRANT ALL ON public.email_scheduled_sends TO service_role;

ALTER TABLE public.email_scheduled_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scheduled emails"
  ON public.email_scheduled_sends
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin viewers read scheduled emails"
  ON public.email_scheduled_sends
  FOR SELECT
  TO authenticated
  USING (public.has_admin_view(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_email_scheduled_pending
  ON public.email_scheduled_sends (scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_scheduled_recipient
  ON public.email_scheduled_sends (recipient_user_id, status);