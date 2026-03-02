
-- Fix admin_reminders: drop RESTRICTIVE policy and create PERMISSIVE one
DROP POLICY IF EXISTS "Admins can manage reminders" ON public.admin_reminders;

CREATE POLICY "Admins can manage reminders"
ON public.admin_reminders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
