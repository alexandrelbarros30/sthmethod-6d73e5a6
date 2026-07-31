ALTER TABLE public.student_clinical_analyses
  ADD COLUMN IF NOT EXISTS visual_share_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visual_share_expires_at timestamptz;

DROP POLICY IF EXISTS "Students read released clinical analyses" ON public.student_clinical_analyses;
CREATE POLICY "Students read released clinical analyses"
ON public.student_clinical_analyses FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  AND (
    released_to_student = true
    OR (visual_share_enabled = true AND (visual_share_expires_at IS NULL OR visual_share_expires_at > now()))
  )
);