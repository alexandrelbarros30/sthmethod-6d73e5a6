CREATE TABLE public.diet_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content_html TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diet_planning_user ON public.diet_planning(user_id);

ALTER TABLE public.diet_planning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student can view own planning"
ON public.diet_planning FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all planning"
ON public.diet_planning FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultor can view assigned planning"
ON public.diet_planning FOR SELECT TO authenticated
USING (public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultor can insert planning for assigned"
ON public.diet_planning FOR INSERT TO authenticated
WITH CHECK (public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultor can update assigned planning"
ON public.diet_planning FOR UPDATE TO authenticated
USING (public.is_consultant_of(auth.uid(), user_id))
WITH CHECK (public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultor can delete assigned planning"
ON public.diet_planning FOR DELETE TO authenticated
USING (public.is_consultant_of(auth.uid(), user_id));

CREATE TRIGGER trg_diet_planning_updated_at
BEFORE UPDATE ON public.diet_planning
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();