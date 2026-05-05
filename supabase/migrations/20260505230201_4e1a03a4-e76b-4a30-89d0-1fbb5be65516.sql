
-- Add columns for student-facing program view: assigning whole programs and tracking sessions/feedback
ALTER TABLE public.training_programs
  ADD COLUMN IF NOT EXISTS subtitle text DEFAULT ''::text;

-- Allow assigning a full program to a student (cards on the home of "treino")
CREATE TABLE IF NOT EXISTS public.student_program_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, program_id)
);

ALTER TABLE public.student_program_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage program assignments" ON public.student_program_assignments;
CREATE POLICY "Admins manage program assignments" ON public.student_program_assignments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Consultors manage linked program assignments" ON public.student_program_assignments;
CREATE POLICY "Consultors manage linked program assignments" ON public.student_program_assignments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id))
  WITH CHECK (has_role(auth.uid(),'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));

DROP POLICY IF EXISTS "Students view own program assignments" ON public.student_program_assignments;
CREATE POLICY "Students view own program assignments" ON public.student_program_assignments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Workout sessions / feedback after finishing the workout
CREATE TABLE IF NOT EXISTS public.student_workout_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  assignment_id uuid NOT NULL REFERENCES public.student_workout_assignments(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone,
  feedback text DEFAULT ''::text
);

ALTER TABLE public.student_workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own sessions" ON public.student_workout_sessions;
CREATE POLICY "Students manage own sessions" ON public.student_workout_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all sessions" ON public.student_workout_sessions;
CREATE POLICY "Admins view all sessions" ON public.student_workout_sessions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Consultors view linked sessions" ON public.student_workout_sessions;
CREATE POLICY "Consultors view linked sessions" ON public.student_workout_sessions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));
