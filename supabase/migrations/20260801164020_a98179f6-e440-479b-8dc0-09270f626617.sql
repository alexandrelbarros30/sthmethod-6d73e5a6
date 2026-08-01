CREATE OR REPLACE VIEW public.stcoach_exercise_catalog AS
SELECT DISTINCT ON (lower(btrim(e.custom_name)))
  btrim(e.custom_name) AS name,
  e.video_url,
  e.image_url
FROM public.workout_template_exercises e
WHERE e.custom_name IS NOT NULL
  AND btrim(e.custom_name) <> ''
  AND e.video_url ILIKE '%vimeo%'
ORDER BY lower(btrim(e.custom_name)), e.image_url NULLS LAST;

GRANT SELECT ON public.stcoach_exercise_catalog TO authenticated;
GRANT SELECT ON public.stcoach_exercise_catalog TO service_role;