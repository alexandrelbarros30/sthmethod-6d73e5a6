CREATE OR REPLACE FUNCTION public.apply_usda_translations(_ids uuid[], _names text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    -- allow service role / superuser bypass: only block normal authenticated non-admins
    IF auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;
  WITH upd AS (
    SELECT unnest(_ids) AS id, unnest(_names) AS new_name
  )
  UPDATE public.foods f
  SET name = upd.new_name
  FROM upd
  WHERE f.id = upd.id AND f.source = 'USDA';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_usda_translations(uuid[], text[]) TO postgres, service_role;