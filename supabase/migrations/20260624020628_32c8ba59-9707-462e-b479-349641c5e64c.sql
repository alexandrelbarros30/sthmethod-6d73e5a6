
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.cas_chunks (
  id BIGSERIAL PRIMARY KEY,
  discipline TEXT NOT NULL,
  page_start INT NOT NULL,
  page_end INT NOT NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cas_chunks_discipline_idx ON public.cas_chunks (discipline, page_start);
CREATE INDEX IF NOT EXISTS cas_chunks_embedding_idx ON public.cas_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS cas_chunks_content_fts_idx ON public.cas_chunks USING gin (to_tsvector('portuguese', content));

GRANT SELECT ON public.cas_chunks TO anon, authenticated;
GRANT ALL ON public.cas_chunks TO service_role;

ALTER TABLE public.cas_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cas_chunks read for all"
  ON public.cas_chunks FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.match_cas_chunks(
  query_embedding vector(1536),
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
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.id, c.discipline, c.page_start, c.page_end, c.content,
         1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.cas_chunks c
  WHERE c.embedding IS NOT NULL
    AND (filter_discipline IS NULL OR c.discipline = filter_discipline)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_cas_chunks(vector, INT, TEXT) TO anon, authenticated, service_role;
