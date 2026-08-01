DROP VIEW IF EXISTS public.stcoach_exercise_catalog;

CREATE OR REPLACE FUNCTION public.get_stcoach_exercise_catalog()
RETURNS TABLE (name text, video_url text, image_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (lower(btrim(e.custom_name)))
    btrim(e.custom_name) AS name,
    e.video_url,
    e.image_url
  FROM public.workout_template_exercises e
  WHERE e.custom_name IS NOT NULL
    AND btrim(e.custom_name) <> ''
    AND e.video_url ILIKE '%vimeo%'
  ORDER BY lower(btrim(e.custom_name)), e.image_url NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.get_stcoach_exercise_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_stcoach_exercise_catalog() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stcoach_exercise_catalog() TO service_role;