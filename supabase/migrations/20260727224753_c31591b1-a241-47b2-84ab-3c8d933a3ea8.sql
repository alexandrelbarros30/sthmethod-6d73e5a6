
-- Add policy to allow users to delete their own food AI logs
CREATE POLICY "Students can delete their own food_ai_logs"
ON public.food_ai_logs
FOR DELETE
TO authenticated
USING (auth.uid() = student_id);
