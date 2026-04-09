
ALTER TABLE public.student_workout_assignments ADD COLUMN IF NOT EXISTS seen_by_student boolean NOT NULL DEFAULT false;
