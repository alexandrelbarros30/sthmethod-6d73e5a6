
-- Consultors can view linked student anamnesis
CREATE POLICY "Consultors can view linked anamnesis"
  ON public.anamnesis_entries
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));

-- Consultors can insert anamnesis for linked students
CREATE POLICY "Consultors can insert linked anamnesis"
  ON public.anamnesis_entries
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));

-- Consultors can view linked student body images
CREATE POLICY "Consultors can view linked body images"
  ON public.body_images
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));
