-- Multi-plan support for diets and trainings
ALTER TABLE public.student_diets
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

ALTER TABLE public.student_trainings
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

-- Ensure only one active per user per table (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_diets_one_active
  ON public.student_diets(user_id) WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_trainings_one_active
  ON public.student_trainings(user_id) WHERE is_active = true;