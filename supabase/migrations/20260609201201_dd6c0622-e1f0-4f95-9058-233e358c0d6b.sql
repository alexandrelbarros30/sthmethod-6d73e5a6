ALTER TABLE public.crm_conversations ADD COLUMN IF NOT EXISTS wa_id TEXT;
CREATE INDEX IF NOT EXISTS idx_crm_conversations_wa_id ON public.crm_conversations (wa_id);

GRANT ALL ON public.crm_conversations TO service_role;
