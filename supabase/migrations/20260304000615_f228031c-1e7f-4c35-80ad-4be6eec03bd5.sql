
-- Add training detail columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS training_days_per_week integer DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS training_duration_minutes integer DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS training_intensity text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cardio_days_per_week integer DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cardio_duration_minutes integer DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cardio_intensity text DEFAULT NULL;
