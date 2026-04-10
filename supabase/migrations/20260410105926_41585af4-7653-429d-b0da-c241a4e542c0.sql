
CREATE TABLE public.supplement_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Orçamento de Suplementos',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supplement_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage supplement_budgets"
ON public.supplement_budgets FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultors can manage linked supplement_budgets"
ON public.supplement_budgets FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id))
WITH CHECK (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Students can view own supplement_budgets"
ON public.supplement_budgets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_supplement_budgets_updated_at
BEFORE UPDATE ON public.supplement_budgets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
