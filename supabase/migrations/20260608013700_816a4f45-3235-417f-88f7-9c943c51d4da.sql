ALTER TABLE public.crm_flow_steps ADD COLUMN IF NOT EXISTS display_format TEXT DEFAULT 'text' CHECK (display_format IN ('text', 'buttons', 'list'));
GRANT ALL ON public.crm_flow_steps TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_flow_steps TO authenticated;