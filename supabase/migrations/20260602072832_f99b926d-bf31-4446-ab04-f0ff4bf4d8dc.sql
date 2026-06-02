UPDATE public.evolution_notifications SET seen = false WHERE seen = true AND created_at > now() - interval '2 days';
UPDATE public.payment_notifications SET seen = false WHERE seen = true AND created_at > now() - interval '2 days';
UPDATE public.evolution_reminders SET seen = false WHERE seen = true AND due_date <= now()::date;