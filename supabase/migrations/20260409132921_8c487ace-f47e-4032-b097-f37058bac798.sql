
-- Allow students to update seen_by_student on their own diets
CREATE POLICY "Students can mark own diet seen"
ON public.student_diets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow students to update seen_by_student on their own protocols
CREATE POLICY "Students can mark own protocol seen"
ON public.student_protocols
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow students to update seen_by_student on their own workout assignments
CREATE POLICY "Students can mark own assignment seen"
ON public.student_workout_assignments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
