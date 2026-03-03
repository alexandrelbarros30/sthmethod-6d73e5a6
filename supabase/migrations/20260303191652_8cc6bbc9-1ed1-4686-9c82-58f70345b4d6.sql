
-- Add new profile columns for the updated registration form
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS gender text DEFAULT '',
  ADD COLUMN IF NOT EXISTS activity_type text DEFAULT '',
  ADD COLUMN IF NOT EXISTS does_cardio boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS additional_info text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bmr numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tdee numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS daily_calories numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS protein_g numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS carbs_g numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fat_g numeric DEFAULT NULL;
