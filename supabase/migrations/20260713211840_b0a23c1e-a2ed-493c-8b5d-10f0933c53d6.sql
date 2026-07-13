
CREATE POLICY "Students view own image consents"
ON public.image_consents FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Students revoke own image consents"
ON public.image_consents FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
