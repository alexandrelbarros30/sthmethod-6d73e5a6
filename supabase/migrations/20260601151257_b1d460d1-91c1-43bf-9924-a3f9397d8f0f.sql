ALTER TABLE public.crm_conversations
  ADD COLUMN IF NOT EXISTS pipeline_stage text;

CREATE INDEX IF NOT EXISTS idx_crm_conversations_pipeline_stage
  ON public.crm_conversations(pipeline_stage)
  WHERE pipeline_stage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_conversations_status
  ON public.crm_conversations(status);

CREATE INDEX IF NOT EXISTS idx_crm_conversations_channel
  ON public.crm_conversations(channel);