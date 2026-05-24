
ALTER TABLE public.crm_campaign_messages
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_crm_messages_provider_id
  ON public.crm_campaign_messages(provider_message_id) WHERE provider_message_id IS NOT NULL;
