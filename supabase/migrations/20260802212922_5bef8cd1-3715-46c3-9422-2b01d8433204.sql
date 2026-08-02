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
    comorbidities = COALESCE(NULLIF(NEW.comorbidities, ''), p.comorbidities),
    medications = COALESCE(NULLIF(NEW.medications, ''), p.medications),
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
      OR p.comorbidities IS DISTINCT FROM COALESCE(NULLIF(NEW.comorbidities, ''), p.comorbidities)
      OR p.medications IS DISTINCT FROM COALESCE(NULLIF(NEW.medications, ''), p.medications)
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
    comorbidities = COALESCE(NULLIF(NEW.comorbidities, ''), a.comorbidities),
    medications = COALESCE(NULLIF(NEW.medications, ''), a.medications),
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
      OR a.comorbidities IS DISTINCT FROM COALESCE(NULLIF(NEW.comorbidities, ''), a.comorbidities)
      OR a.medications IS DISTINCT FROM COALESCE(NULLIF(NEW.medications, ''), a.medications)
    );

  RETURN NEW;
END;
$$;