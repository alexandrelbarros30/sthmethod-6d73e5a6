
-- (A) Ajusta a notificação para usar a data original do pagamento
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

  SELECT full_name INTO v_student_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
  SELECT name INTO v_plan_name FROM public.plans WHERE id = NEW.plan_id LIMIT 1;

  -- created_at usa a data original do pagamento (não a data de confirmação)
  INSERT INTO public.payment_notifications (
    payment_id, student_user_id, student_name, plan_name, amount, method, action_type, payment_status, created_at
  )
  VALUES (
    NEW.id, NEW.user_id, COALESCE(v_student_name, 'Aluno'), COALESCE(v_plan_name, 'Plano'),
    NEW.amount, NEW.method, NEW.action_type, NEW.status, NEW.created_at
  );

  RETURN NEW;
END;
$function$;

-- (B) Deduplicação: bloquear pendentes do mesmo user/plano em <10min
CREATE OR REPLACE FUNCTION public.prevent_duplicate_pending_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'pending' AND EXISTS (
    SELECT 1 FROM public.payments
    WHERE user_id = NEW.user_id
      AND plan_id = NEW.plan_id
      AND status = 'pending'
      AND id <> NEW.id
      AND created_at > now() - interval '10 minutes'
  ) THEN
    RAISE EXCEPTION 'Já existe um pagamento pendente recente para este plano. Aguarde alguns minutos antes de tentar novamente.'
      USING ERRCODE = 'unique_violation';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_pending_payments ON public.payments;
CREATE TRIGGER trg_prevent_duplicate_pending_payments
BEFORE INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.prevent_duplicate_pending_payments();

-- Garantir que o trigger de notificação está ativo
DROP TRIGGER IF EXISTS trg_notify_payment_change ON public.payments;
CREATE TRIGGER trg_notify_payment_change
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_change();
