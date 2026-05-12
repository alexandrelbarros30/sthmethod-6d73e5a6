CREATE POLICY "Consultors can update linked anamnesis"
ON public.anamnesis_entries
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id))
WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));