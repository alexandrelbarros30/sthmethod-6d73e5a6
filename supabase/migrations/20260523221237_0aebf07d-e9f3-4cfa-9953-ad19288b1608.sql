
WITH stats AS (
  SELECT campaign_id,
         COUNT(*) FILTER (WHERE status='sent') AS sent,
         COUNT(*) FILTER (WHERE status='failed') AS failed
  FROM public.crm_campaign_messages
  WHERE campaign_id='b3224906-b04c-48db-b8d3-6df0889ff62a'
  GROUP BY campaign_id
)
UPDATE public.crm_campaigns c
SET status='sent',
    sent_count = COALESCE(s.sent,0),
    failed_count = COALESCE(s.failed,0)
FROM stats s
WHERE c.id = s.campaign_id;

UPDATE public.crm_campaign_runs r
SET finished_at = now(),
    sent_count = (SELECT COUNT(*) FROM public.crm_campaign_messages WHERE run_id = r.id AND status='sent'),
    failed_count = (SELECT COUNT(*) FROM public.crm_campaign_messages WHERE run_id = r.id AND status='failed')
WHERE r.campaign_id='b3224906-b04c-48db-b8d3-6df0889ff62a' AND r.finished_at IS NULL;
