
CREATE TABLE public.metabolic_panels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  visible boolean NOT NULL DEFAULT false,
  seen_by_student boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.metabolic_panels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage metabolic panels"
ON public.metabolic_panels FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultors can manage linked metabolic panels"
ON public.metabolic_panels FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id))
WITH CHECK (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Students can view own visible metabolic panels"
ON public.metabolic_panels FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND visible = true);

CREATE POLICY "Students can update seen status"
ON public.metabolic_panels FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND visible = true)
WITH CHECK (auth.uid() = user_id AND visible = true);

CREATE TRIGGER update_metabolic_panels_updated_at
BEFORE UPDATE ON public.metabolic_panels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
