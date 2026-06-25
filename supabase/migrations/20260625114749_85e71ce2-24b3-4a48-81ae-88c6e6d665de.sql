
CREATE OR REPLACE FUNCTION public.cas_term_match(q text, is_phrase boolean DEFAULT false)
RETURNS TABLE(id bigint, occurrences int)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  norm_q text;
  pattern text;
BEGIN
  norm_q := lower(translate(coalesce(q,''),
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'));
  norm_q := regexp_replace(norm_q, '[[:punct:]]+', ' ', 'g');
  norm_q := trim(regexp_replace(norm_q, '\s+', ' ', 'g'));
  IF norm_q = '' THEN
    RETURN;
  END IF;

  IF is_phrase THEN
    pattern := regexp_replace(regexp_replace(norm_q, '([.^$|()\[\]{}*+?\\])', '\\\1', 'g'), ' ', '\s+', 'g');
  ELSE
    pattern := '\m' || regexp_replace(norm_q, '([.^$|()\[\]{}*+?\\])', '\\\1', 'g') || '\M';
  END IF;

  RETURN QUERY
  WITH c AS (
    SELECT cc.id, regexp_replace(regexp_replace(lower(translate(cc.content,
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),
      '[[:punct:]]+', ' ', 'g'), '\s+', ' ', 'g') AS norm
    FROM public.cas_chunks cc
  ),
  m AS (
    SELECT c.id, count(*)::int AS n
    FROM c, regexp_matches(c.norm, pattern, 'g')
    GROUP BY c.id
  )
  SELECT m.id, m.n FROM m;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cas_term_match(text, boolean) TO anon, authenticated, service_role;
