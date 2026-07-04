
CREATE TABLE public.purchase_message_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL UNIQUE,
  user_id uuid,
  phone text NOT NULL,
  template_id uuid,
  message_body text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('pending','sent','failed','cancelled')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX purchase_message_sends_payment_idx ON public.purchase_message_sends(payment_id);
CREATE INDEX purchase_message_sends_user_idx ON public.purchase_message_sends(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_message_sends TO authenticated;
GRANT ALL ON public.purchase_message_sends TO service_role;

ALTER TABLE public.purchase_message_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM staff can view purchase sends"
  ON public.purchase_message_sends FOR SELECT TO authenticated
  USING (public.is_crm_staff(auth.uid()));

CREATE POLICY "CRM staff can insert purchase sends"
  ON public.purchase_message_sends FOR INSERT TO authenticated
  WITH CHECK (public.is_crm_staff(auth.uid()));

CREATE POLICY "CRM staff can update purchase sends"
  ON public.purchase_message_sends FOR UPDATE TO authenticated
  USING (public.is_crm_staff(auth.uid()))
  WITH CHECK (public.is_crm_staff(auth.uid()));

CREATE TRIGGER trg_purchase_message_sends_updated
  BEFORE UPDATE ON public.purchase_message_sends
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
