-- Auto-expira assinaturas vencidas (fix A)
CREATE OR REPLACE FUNCTION public.expire_overdue_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.subscriptions
     SET status = 'expired'
   WHERE status = 'active'
     AND end_date < now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_overdue_subscriptions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_overdue_subscriptions() TO service_role;

-- Backfill imediato
SELECT public.expire_overdue_subscriptions();

-- Cron horário (pg_cron já habilitado no projeto)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('expire-overdue-subscriptions');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'expire-overdue-subscriptions',
  '5 * * * *',
  $$SELECT public.expire_overdue_subscriptions();$$
);