CREATE OR REPLACE FUNCTION public.is_coach_professional()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_members m
    WHERE m.user_id = auth.uid()
  )
$$;

CREATE POLICY "Coach professionals can read exercise library"
ON public.exercise_library
FOR SELECT TO authenticated
USING (public.is_coach_professional());