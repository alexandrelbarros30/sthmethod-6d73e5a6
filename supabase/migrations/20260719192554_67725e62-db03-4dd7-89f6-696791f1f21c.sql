
ALTER TABLE public.student_workout_assignments
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true;

ALTER TABLE public.student_program_assignments
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_swa_user_window ON public.student_workout_assignments(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_spa_user_window ON public.student_program_assignments(user_id, start_date, end_date);
