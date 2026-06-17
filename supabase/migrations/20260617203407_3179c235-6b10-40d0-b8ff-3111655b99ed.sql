ALTER TABLE public.crm_conversations
  ADD COLUMN IF NOT EXISTS ai_paused_until timestamptz,
  ADD COLUMN IF NOT EXISTS human_intro_sent boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_crm_conversations_ai_paused_until ON public.crm_conversations(ai_paused_until);