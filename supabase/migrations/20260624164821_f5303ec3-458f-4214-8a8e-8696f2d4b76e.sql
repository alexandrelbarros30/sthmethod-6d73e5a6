CREATE TABLE public.cas_search_cache (
  cache_key TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  discipline TEXT,
  intent TEXT,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  match_count INTEGER NOT NULL DEFAULT 10,
  request_type TEXT NOT NULL DEFAULT 'search',
  response JSONB NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);
GRANT ALL ON public.cas_search_cache TO service_role;
ALTER TABLE public.cas_search_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages CAS cache"
ON public.cas_search_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TABLE public.cas_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT,
  query TEXT,
  discipline TEXT,
  intent TEXT,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  match_count INTEGER NOT NULL DEFAULT 10,
  request_type TEXT NOT NULL DEFAULT 'search',
  duration_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ok',
  http_status INTEGER NOT NULL DEFAULT 200,
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  fallback_provider TEXT,
  model TEXT,
  external_status INTEGER,
  error_code TEXT,
  error_message TEXT,
  matches_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.cas_search_logs TO service_role;
ALTER TABLE public.cas_search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role writes CAS logs"
ON public.cas_search_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX cas_search_cache_lookup_idx ON public.cas_search_cache (discipline, intent, language, match_count, expires_at);
CREATE INDEX cas_search_logs_created_idx ON public.cas_search_logs (created_at DESC);
CREATE INDEX cas_search_logs_status_idx ON public.cas_search_logs (status, external_status, fallback_used, cache_hit);

CREATE OR REPLACE TRIGGER update_cas_search_cache_updated_at
BEFORE UPDATE ON public.cas_search_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.cas_search_metrics_hourly AS
SELECT
  date_trunc('hour', created_at) AS hour,
  count(*)::integer AS total_requests,
  avg(duration_ms)::integer AS avg_duration_ms,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::integer AS p95_duration_ms,
  count(*) FILTER (WHERE cache_hit)::integer AS cache_hits,
  count(*) FILTER (WHERE fallback_used)::integer AS fallback_uses,
  count(*) FILTER (WHERE external_status = 429)::integer AS rate_limited_count,
  count(*) FILTER (WHERE external_status >= 500)::integer AS upstream_5xx_count,
  count(*) FILTER (WHERE status <> 'ok')::integer AS failed_count,
  round((count(*) FILTER (WHERE status <> 'ok')::numeric / greatest(count(*), 1)) * 100, 2) AS failure_rate_pct
FROM public.cas_search_logs
GROUP BY 1
ORDER BY 1 DESC;
GRANT SELECT ON public.cas_search_metrics_hourly TO service_role;