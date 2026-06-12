-- Limpa logs 'failed' de hoje para permitir reenvio após Z-API reconectar
DELETE FROM public.subscription_reminder_log
WHERE status = 'failed'
  AND sent_at >= (now() AT TIME ZONE 'America/Sao_Paulo')::date AT TIME ZONE 'America/Sao_Paulo';
