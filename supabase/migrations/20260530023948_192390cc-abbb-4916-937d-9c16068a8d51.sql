
CREATE TABLE public.sth_kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','aprovado','arquivado')),
  version INTEGER NOT NULL DEFAULT 1,
  author_id UUID,
  author_name TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  uses_count INTEGER NOT NULL DEFAULT 0,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sth_kb_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.sth_kb_articles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  edited_by UUID,
  edited_by_name TEXT,
  change_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_kb_articles TO authenticated;
GRANT ALL ON public.sth_kb_articles TO service_role;
GRANT SELECT, INSERT ON public.sth_kb_versions TO authenticated;
GRANT ALL ON public.sth_kb_versions TO service_role;

ALTER TABLE public.sth_kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sth_kb_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_articles_select_staff" ON public.sth_kb_articles FOR SELECT TO authenticated
USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente'));
CREATE POLICY "kb_articles_insert_staff" ON public.sth_kb_articles FOR INSERT TO authenticated
WITH CHECK (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente'));
CREATE POLICY "kb_articles_update_staff" ON public.sth_kb_articles FOR UPDATE TO authenticated
USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente'));
CREATE POLICY "kb_articles_delete_admin" ON public.sth_kb_articles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "kb_versions_select_admin" ON public.sth_kb_versions FOR SELECT TO authenticated
USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor'));
CREATE POLICY "kb_versions_insert_staff" ON public.sth_kb_versions FOR INSERT TO authenticated
WITH CHECK (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente'));

CREATE INDEX idx_kb_articles_category ON public.sth_kb_articles(category);
CREATE INDEX idx_kb_articles_status ON public.sth_kb_articles(status);
CREATE INDEX idx_kb_articles_tags ON public.sth_kb_articles USING GIN(tags);
CREATE INDEX idx_kb_articles_search ON public.sth_kb_articles USING GIN(search_vector);

CREATE OR REPLACE FUNCTION public.sth_kb_articles_tsv()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.summary,'')), 'B') ||
    setweight(to_tsvector('portuguese', array_to_string(NEW.tags, ' ')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.content,'')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_kb_articles_tsv BEFORE INSERT OR UPDATE ON public.sth_kb_articles
FOR EACH ROW EXECUTE FUNCTION public.sth_kb_articles_tsv();

CREATE OR REPLACE FUNCTION public.sth_kb_search(_query TEXT, _category TEXT DEFAULT NULL, _limit INT DEFAULT 5)
RETURNS TABLE(id UUID, title TEXT, category TEXT, summary TEXT, content TEXT, tags TEXT[], rank REAL)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE q tsquery;
BEGIN
  q := plainto_tsquery('portuguese', coalesce(_query,''));
  RETURN QUERY
  SELECT a.id, a.title, a.category, a.summary, a.content, a.tags,
         ts_rank(a.search_vector, q) AS rank
  FROM public.sth_kb_articles a
  WHERE a.status = 'aprovado'
    AND (_category IS NULL OR a.category = _category)
    AND (coalesce(_query,'') = '' OR a.search_vector @@ q)
  ORDER BY rank DESC NULLS LAST, a.updated_at DESC
  LIMIT _limit;
END $$;
