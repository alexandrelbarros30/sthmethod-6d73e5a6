
-- Students can view workout templates assigned to them
CREATE POLICY "Students can view assigned templates"
ON public.workout_templates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_workout_assignments swa
    WHERE swa.template_id = workout_templates.id
    AND swa.user_id = auth.uid()
    AND swa.active = true
  )
);

-- Students can view exercises of assigned templates
CREATE POLICY "Students can view assigned template exercises"
ON public.workout_template_exercises
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_workout_assignments swa
    WHERE swa.template_id = workout_template_exercises.template_id
    AND swa.user_id = auth.uid()
    AND swa.active = true
  )
);
