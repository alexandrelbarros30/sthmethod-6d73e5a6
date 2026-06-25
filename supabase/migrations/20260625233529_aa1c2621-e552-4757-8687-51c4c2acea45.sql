CREATE OR REPLACE FUNCTION public.notify_payment_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_student_name text;
  v_plan_name text;
  v_projeto_verao_id constant uuid := 'd5b528cf-4a0c-4f04-955f-a2892fad49cd';
  v_existing_count int;
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

  -- Para o plano Projeto Verão 180 (cobrança recorrente em 6 parcelas),
  -- consolidar em UMA única notificação por aluno/status para não poluir o painel.
  IF NEW.plan_id = v_projeto_verao_id THEN
    SELECT count(*) INTO v_existing_count
      FROM public.payment_notifications
     WHERE student_user_id = NEW.user_id
       AND plan_name ILIKE '%Projeto Verão%'
       AND payment_status = NEW.status;
    IF v_existing_count > 0 THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT full_name INTO v_student_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
  SELECT name INTO v_plan_name FROM public.plans WHERE id = NEW.plan_id LIMIT 1;

  INSERT INTO public.payment_notifications (
    payment_id, student_user_id, student_name, plan_name, amount, method, action_type, payment_status, created_at
  )
  VALUES (
    NEW.id, NEW.user_id, COALESCE(v_student_name, 'Aluno'),
    COALESCE(v_plan_name, 'Plano'),
    CASE WHEN NEW.plan_id = v_projeto_verao_id THEN 477.00 ELSE NEW.amount END,
    NEW.method, NEW.action_type, NEW.status, NEW.created_at
  )
  ON CONFLICT (payment_id, payment_status) DO NOTHING;

  RETURN NEW;
END;
$function$;