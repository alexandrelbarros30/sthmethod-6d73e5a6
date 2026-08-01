
CREATE POLICY "coach_tenants_admin_select" ON public.coach_tenants FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_admin_view(auth.uid()));
CREATE POLICY "coach_tenants_admin_update" ON public.coach_tenants FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "coach_members_admin_select" ON public.coach_members FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_admin_view(auth.uid()));
CREATE POLICY "coach_students_admin_select" ON public.coach_students FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_admin_view(auth.uid()));
CREATE POLICY "coach_invites_admin_select" ON public.coach_invites FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_admin_view(auth.uid()));
