ALTER TABLE public.workout_templates ADD COLUMN IF NOT EXISTS supercoach_training_id BIGINT;
ALTER TABLE public.workout_template_exercises ADD COLUMN IF NOT EXISTS supercoach_workout_id BIGINT;
CREATE INDEX IF NOT EXISTS ix_workout_templates_sc_training ON public.workout_templates(supercoach_training_id) WHERE supercoach_training_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_workout_template_exercises_sc_workout ON public.workout_template_exercises(supercoach_workout_id) WHERE supercoach_workout_id IS NOT NULL;