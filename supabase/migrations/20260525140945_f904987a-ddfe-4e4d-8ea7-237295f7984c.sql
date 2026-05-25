CREATE OR REPLACE FUNCTION public.find_profile_by_phone(_phone text)
RETURNS TABLE(user_id uuid, full_name text, email text, objective text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH norm AS (
    SELECT regexp_replace(_phone, '\D', '', 'g') AS d
  )
  SELECT p.user_id, p.full_name, p.email, p.objective, p.phone
  FROM public.profiles p, norm
  WHERE p.phone IS NOT NULL
    AND length(regexp_replace(p.phone, '\D', '', 'g')) >= 8
    AND (
      regexp_replace(p.phone, '\D', '', 'g') = norm.d
      OR right(regexp_replace(p.phone, '\D', '', 'g'), 8) = right(norm.d, 8)
      OR right(norm.d, 8) = right(regexp_replace(p.phone, '\D', '', 'g'), 8)
      OR regexp_replace(p.phone, '\D', '', 'g') LIKE '%' || right(norm.d, 8)
      OR norm.d LIKE '%' || right(regexp_replace(p.phone, '\D', '', 'g'), 8)
    )
  LIMIT 5;
$$;