
ALTER TABLE public.training_exercises 
ADD COLUMN IF NOT EXISTS description text DEFAULT '',
ADD COLUMN IF NOT EXISTS rest_interval text DEFAULT '',
ADD COLUMN IF NOT EXISTS load_suggestion text DEFAULT '';
