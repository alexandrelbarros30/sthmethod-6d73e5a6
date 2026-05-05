UPDATE public.diet_meals dm
SET diet_id = sd.id
FROM public.student_diets sd
WHERE dm.diet_id IS NULL
  AND sd.user_id = dm.user_id
  AND sd.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.student_diets sd2
    WHERE sd2.user_id = dm.user_id AND sd2.is_active = true AND sd2.id <> sd.id
  );