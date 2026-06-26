
-- 1) Evolution: condense per student per day
CREATE OR REPLACE FUNCTION public.notify_evolution_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_name TEXT;
  v_prev_weight NUMERIC;
  v_existing_id UUID;
BEGIN
  SELECT full_name INTO v_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

  SELECT weight INTO v_prev_weight FROM public.weight_logs
  WHERE user_id = NEW.user_id AND id != NEW.id
  ORDER BY logged_at DESC LIMIT 1;

  SELECT id INTO v_existing_id FROM public.evolution_notifications
   WHERE student_user_id = NEW.user_id
     AND created_at::date = now()::date
   ORDER BY created_at DESC LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.evolution_notifications SET
      student_name = COALESCE(v_name, student_name),
      new_weight = COALESCE(NEW.weight, new_weight),
      previous_weight = COALESCE(previous_weight, v_prev_weight),
      notes = COALESCE(NULLIF(NEW.notes,''), notes),
      waist_cm = COALESCE(NEW.waist_cm, waist_cm),
      hip_cm = COALESCE(NEW.hip_cm, hip_cm),
      chest_cm = COALESCE(NEW.chest_cm, chest_cm),
      arm_cm = COALESCE(NEW.arm_cm, arm_cm),
      thigh_cm = COALESCE(NEW.thigh_cm, thigh_cm),
      calf_cm = COALESCE(NEW.calf_cm, calf_cm),
      student_message = COALESCE(NULLIF(NEW.student_message,''), student_message),
      seen = false,
      created_at = now()
     WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.evolution_notifications (
      student_user_id, student_name, new_weight, previous_weight, notes,
      waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm, calf_cm, student_message
    )
    VALUES (
      NEW.user_id, COALESCE(v_name, 'Aluno'), NEW.weight, v_prev_weight, COALESCE(NEW.notes, ''),
      NEW.waist_cm, NEW.hip_cm, NEW.chest_cm, NEW.arm_cm, NEW.thigh_cm, NEW.calf_cm,
      COALESCE(NEW.student_message, '')
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Payment: condense per student per day (keep Projeto Verão special-case)
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
  v_existing_id uuid;
  v_existing_status text;
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

  -- Procura notificação do mesmo aluno NO DIA para condensar
  SELECT id, payment_status INTO v_existing_id, v_existing_status
    FROM public.payment_notifications
   WHERE student_user_id = NEW.user_id
     AND created_at::date = now()::date
   ORDER BY created_at DESC
   LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Aprovado tem prioridade sobre pending; senão apenas refresca dados
    IF NEW.status = 'approved' OR v_existing_status <> 'approved' THEN
      UPDATE public.payment_notifications SET
        payment_id = NEW.id,
        plan_name = COALESCE(v_plan_name, plan_name),
        amount = CASE WHEN NEW.plan_id = v_projeto_verao_id THEN 477.00 ELSE NEW.amount END,
        method = NEW.method,
        action_type = NEW.action_type,
        payment_status = NEW.status,
        student_name = COALESCE(v_student_name, student_name),
        seen = false,
        created_at = now()
       WHERE id = v_existing_id;
    END IF;
    RETURN NEW;
  END IF;

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
