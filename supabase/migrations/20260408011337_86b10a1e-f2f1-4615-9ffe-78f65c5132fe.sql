
-- Add new columns to training_programs
ALTER TABLE public.training_programs
  ADD COLUMN IF NOT EXISTS objective text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'intermediate',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

-- Allow consultors to manage training programs
CREATE POLICY "Consultors can manage training programs"
  ON public.training_programs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'consultor'::app_role));
