ALTER TABLE public.training_programs ADD COLUMN IF NOT EXISTS supercoach_program_id BIGINT;
ALTER TABLE public.workout_templates ADD COLUMN IF NOT EXISTS supercoach_program_id BIGINT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_training_programs_supercoach_pid ON public.training_programs(supercoach_program_id) WHERE supercoach_program_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_workout_templates_supercoach_pid ON public.workout_templates(supercoach_program_id) WHERE supercoach_program_id IS NOT NULL;