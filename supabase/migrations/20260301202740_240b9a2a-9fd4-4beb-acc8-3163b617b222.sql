
-- Add extended profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS height numeric,
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS physical_activity text DEFAULT '',
  ADD COLUMN IF NOT EXISTS objective text DEFAULT '',
  ADD COLUMN IF NOT EXISTS current_protocol text DEFAULT '',
  ADD COLUMN IF NOT EXISTS comorbidities text DEFAULT '',
  ADD COLUMN IF NOT EXISTS lab_exam_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS medical_prescription_url text DEFAULT '';

-- Allow admins to update profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));
