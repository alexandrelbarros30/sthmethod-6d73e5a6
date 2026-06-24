DROP POLICY IF EXISTS "Service role manages CAS cache" ON public.cas_search_cache;
DROP POLICY IF EXISTS "Service role writes CAS logs" ON public.cas_search_logs;

GRANT SELECT ON public.cas_search_logs TO authenticated;
GRANT SELECT ON public.cas_search_metrics_hourly TO authenticated;

CREATE POLICY "Admins can read CAS search logs"
ON public.cas_search_logs
FOR SELECT
TO authenticated
USING (public.has_admin_view(auth.uid()));

ALTER VIEW public.cas_search_metrics_hourly SET (security_invoker = true);