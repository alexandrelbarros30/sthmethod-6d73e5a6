
CREATE POLICY "Students can update own evolution_notifications"
ON public.evolution_notifications FOR UPDATE TO authenticated
USING (auth.uid() = student_user_id)
WITH CHECK (auth.uid() = student_user_id);
