
ALTER TABLE public.student_clinical_analyses
  ADD COLUMN IF NOT EXISTS released_to_student boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS released_at timestamptz;

DROP POLICY IF EXISTS "Students read own clinical analyses" ON public.student_clinical_analyses;

CREATE POLICY "Students read released clinical analyses"
  ON public.student_clinical_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND released_to_student = true);
