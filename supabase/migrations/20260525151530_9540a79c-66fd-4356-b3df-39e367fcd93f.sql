ALTER TABLE public.evolution_reminders
ADD COLUMN IF NOT EXISTS auto_sent_at timestamptz;