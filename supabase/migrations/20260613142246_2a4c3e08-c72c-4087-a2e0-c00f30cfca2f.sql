WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY source, external_id
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.crm_messages
  WHERE direction = 'in'
    AND external_id IS NOT NULL
)
DELETE FROM public.crm_messages
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_crm_messages_source_external_incoming
ON public.crm_messages (source, external_id)
WHERE external_id IS NOT NULL AND direction = 'in';

CREATE INDEX IF NOT EXISTS idx_crm_messages_conversation_outbound_recent
ON public.crm_messages (conversation_id, source, created_at DESC)
WHERE direction = 'out';