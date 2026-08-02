
CREATE OR REPLACE FUNCTION public.sync_ai_measurement_to_master()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.weight_kg IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.weight_logs w
    WHERE w.user_id = NEW.user_id
      AND w.logged_at::date = NEW.measured_on
      AND w.weight = NEW.weight_kg
  ) THEN
    INSERT INTO public.weight_logs (user_id, weight, waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm, logged_at, notes)
    VALUES (
      NEW.user_id, NEW.weight_kg, NEW.waist_cm, NEW.hip_cm, NEW.chest_cm, NEW.arm_cm, NEW.thigh_cm,
      (NEW.measured_on::timestamp + interval '12 hours') AT TIME ZONE 'UTC',
      'Registrado no STH AI'
    );
  END IF;

  UPDATE public.profiles SET weight = NEW.weight_kg, updated_at = now()
  WHERE user_id = NEW.user_id
    AND (weight IS DISTINCT FROM NEW.weight_kg);

  UPDATE public.ai_app_profiles SET weight_kg = NEW.weight_kg, updated_at = now()
  WHERE user_id = NEW.user_id AND weight_kg IS DISTINCT FROM NEW.weight_kg;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_ai_measurement_to_master ON public.ai_app_measurements;
CREATE TRIGGER trg_sync_ai_measurement_to_master
AFTER INSERT ON public.ai_app_measurements
FOR EACH ROW EXECUTE FUNCTION public.sync_ai_measurement_to_master();

CREATE OR REPLACE FUNCTION public.sync_ai_generation_to_master()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.content, '') = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.kind = 'diet' THEN
    INSERT INTO public.student_diets (id, user_id, title, content, visible, is_active, tab_label, created_at, updated_at)
    VALUES (NEW.id, NEW.user_id, 'Cardápio STH AI', NEW.content, true, false, 'STH AI', NEW.created_at, now())
    ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = now();
  ELSIF NEW.kind = 'workout' THEN
    INSERT INTO public.student_trainings (id, user_id, title, content, is_active, created_at, updated_at)
    VALUES (NEW.id, NEW.user_id, 'Treino STH AI', NEW.content, false, NEW.created_at, now())
    ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_ai_generation_to_master ON public.ai_app_generations;
CREATE TRIGGER trg_sync_ai_generation_to_master
AFTER INSERT OR UPDATE OF content ON public.ai_app_generations
FOR EACH ROW EXECUTE FUNCTION public.sync_ai_generation_to_master();

-- Backfill existente
INSERT INTO public.student_diets (id, user_id, title, content, visible, is_active, tab_label, created_at, updated_at)
SELECT g.id, g.user_id, 'Cardápio STH AI', g.content, true, false, 'STH AI', g.created_at, now()
FROM public.ai_app_generations g
WHERE g.kind = 'diet' AND COALESCE(g.content,'') <> ''
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.student_trainings (id, user_id, title, content, is_active, created_at, updated_at)
SELECT g.id, g.user_id, 'Treino STH AI', g.content, false, g.created_at, now()
FROM public.ai_app_generations g
WHERE g.kind = 'workout' AND COALESCE(g.content,'') <> ''
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.weight_logs (user_id, weight, waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm, logged_at, notes)
SELECT m.user_id, m.weight_kg, m.waist_cm, m.hip_cm, m.chest_cm, m.arm_cm, m.thigh_cm,
       (m.measured_on::timestamp + interval '12 hours') AT TIME ZONE 'UTC', 'Registrado no STH AI'
FROM public.ai_app_measurements m
WHERE m.weight_kg IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.weight_logs w
    WHERE w.user_id = m.user_id AND w.logged_at::date = m.measured_on AND w.weight = m.weight_kg
  );
