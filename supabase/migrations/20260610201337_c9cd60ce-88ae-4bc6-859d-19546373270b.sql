ALTER TABLE public.supplement_budgets ADD COLUMN duration TEXT;
GRANT ALL ON public.supplement_budgets TO authenticated;
GRANT ALL ON public.supplement_budgets TO service_role;