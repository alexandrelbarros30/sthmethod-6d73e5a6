
-- Extend workout sessions with structured feedback
ALTER TABLE public.student_workout_sessions
  ADD COLUMN IF NOT EXISTS difficulty_rating smallint CHECK (difficulty_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS energy_level smallint CHECK (energy_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS mood_rating smallint CHECK (mood_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS pain_reported boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS synced_to_stcoach boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS synced_at timestamptz;

-- Program-level feedback (given when student completes a program)
CREATE TABLE IF NOT EXISTS public.student_program_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  overall_rating smallint NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  difficulty_rating smallint CHECK (difficulty_rating BETWEEN 1 AND 5),
  results_rating smallint CHECK (results_rating BETWEEN 1 AND 5),
  would_repeat boolean,
  highlights text,
  improvements text,
  notes text,
  synced_to_stcoach boolean NOT NULL DEFAULT false,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_program_feedback TO authenticated;
GRANT ALL ON public.student_program_feedback TO service_role;

ALTER TABLE public.student_program_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own program feedback"
  ON public.student_program_feedback FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all program feedback"
  ON public.student_program_feedback FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultants view their students' program feedback"
  ON public.student_program_feedback FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE INDEX IF NOT EXISTS idx_spf_user ON public.student_program_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spf_program ON public.student_program_feedback(program_id);

CREATE TRIGGER trg_spf_updated_at
  BEFORE UPDATE ON public.student_program_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
