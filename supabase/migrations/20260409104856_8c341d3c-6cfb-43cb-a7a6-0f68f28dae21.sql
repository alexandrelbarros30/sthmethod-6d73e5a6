
ALTER TABLE public.student_trainings ADD COLUMN IF NOT EXISTS seen_by_student boolean NOT NULL DEFAULT false;
ALTER TABLE public.student_protocols ADD COLUMN IF NOT EXISTS seen_by_student boolean NOT NULL DEFAULT false;
