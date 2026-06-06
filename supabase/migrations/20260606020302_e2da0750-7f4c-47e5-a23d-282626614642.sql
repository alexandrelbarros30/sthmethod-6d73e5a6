ALTER TABLE public.crm_message_templates ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Garantir que as permissões continuem corretas (embora a alteração de coluna não costuma removê-las)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_message_templates TO authenticated;
GRANT ALL ON public.crm_message_templates TO service_role;
