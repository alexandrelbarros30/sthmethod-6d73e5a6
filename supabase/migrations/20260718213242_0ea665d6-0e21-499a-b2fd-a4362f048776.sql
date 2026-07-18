
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.install_backup_cron(_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, cron
AS $$
DECLARE
  job_name text := 'daily-backup-run';
  fn_url text := 'https://tthahgwkkdyvxdbhsgyb.supabase.co/functions/v1/daily-backup?action=run';
  sql_body text;
BEGIN
  -- remove qualquer agendamento anterior com esse nome
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = job_name;

  sql_body := format(
    $sql$
    SELECT net.http_post(
      url := %L,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-backup-token', %L
      ),
      body := jsonb_build_object('source','pg_cron','at', now())
    );
    $sql$,
    fn_url,
    _token
  );

  PERFORM cron.schedule(job_name, '0 3 * * *', sql_body);
  RETURN job_name;
END;
$$;

REVOKE ALL ON FUNCTION public.install_backup_cron(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.install_backup_cron(text) TO service_role;
