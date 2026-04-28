-- Remove trigger duplicado que estava gerando 2 notificações por pagamento
DROP TRIGGER IF EXISTS trg_payment_notification ON public.payments;

-- Garante apenas um trigger ativo
DROP TRIGGER IF EXISTS trg_notify_payment_change ON public.payments;
CREATE TRIGGER trg_notify_payment_change
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_change();

-- Limpa duplicatas existentes mantendo a notificação mais antiga
DELETE FROM public.payment_notifications a
USING public.payment_notifications b
WHERE a.payment_id = b.payment_id
  AND a.payment_status = b.payment_status
  AND a.created_at >= b.created_at
  AND a.id <> b.id;

-- Índice único para impedir duplicatas futuras no nível do schema
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_notifications_payment_status_unique
ON public.payment_notifications (payment_id, payment_status);

-- Refaz a função com proteção idempotente extra
CREATE OR REPLACE FUNCTION public.notify_payment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_name text;
  v_plan_name text;
BEGIN
  IF NEW.status NOT IN ('approved', 'pending') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.payment_notifications
    WHERE payment_id = NEW.id AND payment_status = NEW.status
  ) THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_student_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
  SELECT name INTO v_plan_name FROM public.plans WHERE id = NEW.plan_id LIMIT 1;

  INSERT INTO public.payment_notifications (
    payment_id, student_user_id, student_name, plan_name, amount, method, action_type, payment_status, created_at
  )
  VALUES (
    NEW.id, NEW.user_id, COALESCE(v_student_name, 'Aluno'), COALESCE(v_plan_name, 'Plano'),
    NEW.amount, NEW.method, NEW.action_type, NEW.status, NEW.created_at
  )
  ON CONFLICT (payment_id, payment_status) DO NOTHING;

  RETURN NEW;
END;
$function$;