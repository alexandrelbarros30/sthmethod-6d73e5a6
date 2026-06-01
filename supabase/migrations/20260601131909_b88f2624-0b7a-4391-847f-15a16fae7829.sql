ALTER TABLE public.message_templates
  ADD COLUMN IF NOT EXISTS system_key text UNIQUE,
  ADD COLUMN IF NOT EXISTS system_description text;
CREATE INDEX IF NOT EXISTS idx_message_templates_system_key ON public.message_templates(system_key) WHERE system_key IS NOT NULL;