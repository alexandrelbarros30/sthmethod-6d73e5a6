-- Add measurement columns + student message to weight_logs
ALTER TABLE public.weight_logs
  ADD COLUMN IF NOT EXISTS waist_cm numeric,
  ADD COLUMN IF NOT EXISTS hip_cm numeric,
  ADD COLUMN IF NOT EXISTS chest_cm numeric,
  ADD COLUMN IF NOT EXISTS arm_cm numeric,
  ADD COLUMN IF NOT EXISTS thigh_cm numeric,
  ADD COLUMN IF NOT EXISTS calf_cm numeric,
  ADD COLUMN IF NOT EXISTS student_message text DEFAULT ''::text;

-- Mirror on evolution_notifications so admin sees inline
ALTER TABLE public.evolution_notifications
  ADD COLUMN IF NOT EXISTS waist_cm numeric,
  ADD COLUMN IF NOT EXISTS hip_cm numeric,
  ADD COLUMN IF NOT EXISTS chest_cm numeric,
  ADD COLUMN IF NOT EXISTS arm_cm numeric,
  ADD COLUMN IF NOT EXISTS thigh_cm numeric,
  ADD COLUMN IF NOT EXISTS calf_cm numeric,
  ADD COLUMN IF NOT EXISTS student_message text DEFAULT ''::text;

-- Update trigger function to copy measurements + message into notification
CREATE OR REPLACE FUNCTION public.notify_evolution_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name TEXT;
  v_prev_weight NUMERIC;
BEGIN
  SELECT full_name INTO v_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

  SELECT weight INTO v_prev_weight FROM public.weight_logs
  WHERE user_id = NEW.user_id AND id != NEW.id
  ORDER BY logged_at DESC LIMIT 1;

  INSERT INTO public.evolution_notifications (
    student_user_id, student_name, new_weight, previous_weight, notes,
    waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm, calf_cm, student_message
  )
  VALUES (
    NEW.user_id, COALESCE(v_name, 'Aluno'), NEW.weight, v_prev_weight, COALESCE(NEW.notes, ''),
    NEW.waist_cm, NEW.hip_cm, NEW.chest_cm, NEW.arm_cm, NEW.thigh_cm, NEW.calf_cm,
    COALESCE(NEW.student_message, '')
  );

  RETURN NEW;
END;
$function$;