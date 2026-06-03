ALTER TABLE public.crm_conversations
  ADD COLUMN IF NOT EXISTS flow_state text,
  ADD COLUMN IF NOT EXISTS flow_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_bot_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS inactivity_warned_at timestamptz,
  ADD COLUMN IF NOT EXISTS human_handoff boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_conv_inactivity
  ON public.crm_conversations (last_bot_message_at)
  WHERE status = 'open' AND human_handoff = false AND provider = 'zapi';

CREATE INDEX IF NOT EXISTS idx_crm_conv_flow_state
  ON public.crm_conversations (flow_state)
  WHERE flow_state IS NOT NULL;