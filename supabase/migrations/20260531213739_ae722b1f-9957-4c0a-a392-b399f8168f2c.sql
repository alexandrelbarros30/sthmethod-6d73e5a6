CREATE OR REPLACE FUNCTION public.find_profile_by_phone(_phone text)
RETURNS TABLE(user_id uuid, full_name text, email text, objective text, phone text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH norm AS (
    SELECT regexp_replace(coalesce(_phone, ''), '\D', '', 'g') AS d
  ),
  candidates AS (
    SELECT
      p.user_id,
      p.full_name,
      p.email,
      p.objective,
      p.phone,
      regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') AS phone_digits,
      CASE
        WHEN regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') = (SELECT d FROM norm) THEN 100
        WHEN right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 11) = right((SELECT d FROM norm), 11)
          AND length((SELECT d FROM norm)) >= 11 THEN 80
        WHEN right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = right((SELECT d FROM norm), 10)
          AND length((SELECT d FROM norm)) >= 10 THEN 60
        WHEN right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 8) = right((SELECT d FROM norm), 8)
          AND length((SELECT d FROM norm)) >= 8 THEN 20
        ELSE 0
      END AS match_score
    FROM public.profiles p
    WHERE p.phone IS NOT NULL
      AND length(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g')) >= 8
  ),
  ranked AS (
    SELECT
      c.*, 
      count(*) FILTER (WHERE c.match_score = 100) OVER () AS exact_count,
      count(*) FILTER (WHERE c.match_score >= 80) OVER () AS high_confidence_count,
      count(*) FILTER (WHERE c.match_score >= 60) OVER () AS medium_confidence_count,
      count(*) FILTER (WHERE c.match_score >= 20) OVER () AS low_confidence_count
    FROM candidates c
    WHERE c.match_score > 0
  )
  SELECT r.user_id, r.full_name, r.email, r.objective, r.phone
  FROM ranked r
  WHERE
    r.match_score = 100
    OR (r.match_score >= 80 AND r.exact_count = 0 AND r.high_confidence_count = 1)
    OR (r.match_score >= 60 AND r.exact_count = 0 AND r.high_confidence_count = 0 AND r.medium_confidence_count = 1)
    OR (r.match_score >= 20 AND r.exact_count = 0 AND r.high_confidence_count = 0 AND r.medium_confidence_count = 0 AND r.low_confidence_count = 1)
  ORDER BY r.match_score DESC, length(r.phone_digits) DESC
  LIMIT 1;
$function$;