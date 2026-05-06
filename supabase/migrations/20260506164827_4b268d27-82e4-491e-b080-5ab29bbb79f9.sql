
ALTER TABLE public.bioimpedance_logs
  ADD COLUMN IF NOT EXISTS waist_cm numeric,
  ADD COLUMN IF NOT EXISTS hip_cm numeric,
  ADD COLUMN IF NOT EXISTS chest_cm numeric,
  ADD COLUMN IF NOT EXISTS arm_cm numeric,
  ADD COLUMN IF NOT EXISTS thigh_cm numeric,
  ADD COLUMN IF NOT EXISTS calf_cm numeric;

CREATE POLICY "Students can insert own bioimpedance"
ON public.bioimpedance_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own bioimpedance"
ON public.bioimpedance_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
