
-- Table to archive payment notifications
CREATE TABLE public.payment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  student_user_id uuid NOT NULL,
  student_name text NOT NULL DEFAULT '',
  plan_name text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'pix',
  action_type text NOT NULL DEFAULT 'new',
  payment_status text NOT NULL DEFAULT 'pending',
  seen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment_notifications"
  ON public.payment_notifications FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Financeiro can view payment_notifications"
  ON public.payment_notifications FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'financeiro'::app_role));

CREATE POLICY "Consultors can view linked payment_notifications"
  ON public.payment_notifications FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), student_user_id));

-- Function to auto-create notification on payment changes
CREATE OR REPLACE FUNCTION public.notify_payment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_name text;
  v_plan_name text;
BEGIN
  -- Only notify for approved or pending
  IF NEW.status NOT IN ('approved', 'pending') THEN
    RETURN NEW;
  END IF;

  -- On UPDATE, only notify if status actually changed
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_student_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
  SELECT name INTO v_plan_name FROM public.plans WHERE id = NEW.plan_id LIMIT 1;

  INSERT INTO public.payment_notifications (payment_id, student_user_id, student_name, plan_name, amount, method, action_type, payment_status)
  VALUES (NEW.id, NEW.user_id, COALESCE(v_student_name, 'Aluno'), COALESCE(v_plan_name, 'Plano'), NEW.amount, NEW.method, NEW.action_type, NEW.status);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_notification
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_change();

-- Enable realtime for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_notifications;
