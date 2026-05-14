ALTER TABLE public.exercise_library ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';
ALTER TABLE public.training_exercises ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';
ALTER TABLE public.workout_template_exercises ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';