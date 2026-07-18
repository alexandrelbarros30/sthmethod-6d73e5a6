
-- Helper: list all base tables in public schema
CREATE OR REPLACE FUNCTION public.backup_list_public_tables()
RETURNS TABLE(table_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT c.relname::text AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
  ORDER BY c.relname;
$$;

REVOKE ALL ON FUNCTION public.backup_list_public_tables() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backup_list_public_tables() TO service_role;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any previous schedule with same name (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('sthmethod-daily-backup');
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

-- Schedule daily backup: 06:00 UTC = 03:00 BRT
SELECT cron.schedule(
  'sthmethod-daily-backup',
  '0 6 * * *',
  $CRON$
  SELECT net.http_post(
    url := 'https://tthahgwkkdyvxdbhsgyb.supabase.co/functions/v1/daily-backup?action=run',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-backup-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'BACKUP_CRON_TOKEN' LIMIT 1)
    ),
    body := jsonb_build_object('triggered_at', now())
  );
  $CRON$
);
