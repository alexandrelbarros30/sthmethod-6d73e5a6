-- Sincronização nativa: ai_app_profiles (STH AI) <-> profiles (cadastro mestre STH METHOD)

CREATE OR REPLACE FUNCTION public.sync_ai_profile_to_master()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
  v_email text;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = NEW.user_id) INTO v_exists;

  IF NOT v_exists THEN
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.user_id, COALESCE(NEW.full_name, ''), COALESCE(v_email, ''))
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.profiles p SET
    full_name = COALESCE(NULLIF(NEW.full_name, ''), p.full_name),
    gender = COALESCE(NULLIF(NEW.sex, ''), p.gender),
    weight = COALESCE(NEW.weight_kg, p.weight),
    height = COALESCE(NEW.height_cm, p.height),
    objective = COALESCE(NULLIF(NEW.goal, ''), p.objective),
    physical_activity_level = COALESCE(NULLIF(NEW.training_level, ''), p.physical_activity_level),
    birth_date = COALESCE(
      p.birth_date,
      CASE WHEN NEW.age IS NOT NULL AND NEW.age BETWEEN 10 AND 100
           THEN make_date(EXTRACT(YEAR FROM now())::int - NEW.age, 1, 1)
      END
    ),
    updated_at = now()
  WHERE p.user_id = NEW.user_id
    AND (
      p.full_name IS DISTINCT FROM COALESCE(NULLIF(NEW.full_name, ''), p.full_name)
      OR p.gender IS DISTINCT FROM COALESCE(NULLIF(NEW.sex, ''), p.gender)
      OR p.weight IS DISTINCT FROM COALESCE(NEW.weight_kg, p.weight)
      OR p.height IS DISTINCT FROM COALESCE(NEW.height_cm, p.height)
      OR p.objective IS DISTINCT FROM COALESCE(NULLIF(NEW.goal, ''), p.objective)
      OR p.physical_activity_level IS DISTINCT FROM COALESCE(NULLIF(NEW.training_level, ''), p.physical_activity_level)
      OR p.birth_date IS NULL
    );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_master_to_ai_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ai_app_profiles a SET
    full_name = COALESCE(NULLIF(NEW.full_name, ''), a.full_name),
    sex = COALESCE(NULLIF(NEW.gender, ''), a.sex),
    weight_kg = COALESCE(NEW.weight, a.weight_kg),
    height_cm = COALESCE(NEW.height, a.height_cm),
    goal = COALESCE(NULLIF(NEW.objective, ''), a.goal),
    training_level = COALESCE(NULLIF(NEW.physical_activity_level, ''), a.training_level),
    age = COALESCE(
      CASE WHEN NEW.birth_date IS NOT NULL
           THEN EXTRACT(YEAR FROM age(NEW.birth_date))::int END,
      a.age
    ),
    updated_at = now()
  WHERE a.user_id = NEW.user_id
    AND (
      a.full_name IS DISTINCT FROM COALESCE(NULLIF(NEW.full_name, ''), a.full_name)
      OR a.sex IS DISTINCT FROM COALESCE(NULLIF(NEW.gender, ''), a.sex)
      OR a.weight_kg IS DISTINCT FROM COALESCE(NEW.weight, a.weight_kg)
      OR a.height_cm IS DISTINCT FROM COALESCE(NEW.height, a.height_cm)
      OR a.goal IS DISTINCT FROM COALESCE(NULLIF(NEW.objective, ''), a.goal)
      OR a.training_level IS DISTINCT FROM COALESCE(NULLIF(NEW.physical_activity_level, ''), a.training_level)
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_ai_profile_to_master ON public.ai_app_profiles;
CREATE TRIGGER trg_sync_ai_profile_to_master
AFTER INSERT OR UPDATE ON public.ai_app_profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_ai_profile_to_master();

DROP TRIGGER IF EXISTS trg_sync_master_to_ai_profile ON public.profiles;
CREATE TRIGGER trg_sync_master_to_ai_profile
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_master_to_ai_profile();

-- Backfill: garante cadastro mestre para quem começou pelo STH AI
INSERT INTO public.profiles (user_id, full_name, email)
SELECT a.user_id, COALESCE(a.full_name, ''), COALESCE(u.email, '')
FROM public.ai_app_profiles a
JOIN auth.users u ON u.id = a.user_id
LEFT JOIN public.profiles p ON p.user_id = a.user_id
WHERE p.user_id IS NULL;

UPDATE public.profiles p SET
  full_name = COALESCE(NULLIF(a.full_name, ''), p.full_name),
  gender = COALESCE(NULLIF(a.sex, ''), p.gender),
  weight = COALESCE(p.weight, a.weight_kg),
  height = COALESCE(p.height, a.height_cm),
  objective = COALESCE(NULLIF(p.objective, ''), a.goal),
  physical_activity_level = COALESCE(NULLIF(p.physical_activity_level, ''), a.training_level),
  updated_at = now()
FROM public.ai_app_profiles a
WHERE a.user_id = p.user_id;