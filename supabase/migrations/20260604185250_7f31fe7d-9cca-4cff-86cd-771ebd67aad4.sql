ALTER TABLE public.crm_flow_steps ADD COLUMN IF NOT EXISTS position_x FLOAT;
ALTER TABLE public.crm_flow_steps ADD COLUMN IF NOT EXISTS position_y FLOAT;

-- Grant access (redundant if already granted, but safe)
GRANT ALL ON public.crm_flow_steps TO authenticated;
GRANT ALL ON public.crm_flow_steps TO service_role;