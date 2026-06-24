
CREATE OR REPLACE FUNCTION public.search_cas_chunks_fts(
  q TEXT,
  match_count INT DEFAULT 8,
  filter_discipline TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  discipline TEXT,
  page_start INT,
  page_end INT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  tsq tsquery;
BEGIN
  -- websearch_to_tsquery aceita aspas, OR, -termo etc.
  tsq := websearch_to_tsquery('portuguese', q);

  RETURN QUERY
  SELECT c.id, c.discipline, c.page_start, c.page_end, c.content,
         ts_rank(to_tsvector('portuguese', c.content), tsq)::float AS similarity
  FROM public.cas_chunks c
  WHERE (filter_discipline IS NULL OR c.discipline = filter_discipline)
    AND (
      to_tsvector('portuguese', c.content) @@ tsq
      OR c.content ILIKE '%' || q || '%'
    )
  ORDER BY similarity DESC, c.id ASC
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_cas_chunks_fts(TEXT, INT, TEXT) TO anon, authenticated, service_role;
