-- Grant Data API access to all CRM tables (auth-only, scoped by is_crm_staff)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_conversations TO authenticated;
GRANT ALL ON public.crm_conversations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_messages TO authenticated;
GRANT ALL ON public.crm_messages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tags TO authenticated;
GRANT ALL ON public.crm_tags TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_conversation_tags TO authenticated;
GRANT ALL ON public.crm_conversation_tags TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tasks TO authenticated;
GRANT ALL ON public.crm_tasks TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_ai_runs TO authenticated;
GRANT ALL ON public.crm_ai_runs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_campaigns TO authenticated;
GRANT ALL ON public.crm_campaigns TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_campaign_recipients TO authenticated;
GRANT ALL ON public.crm_campaign_recipients TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_queues TO authenticated;
GRANT ALL ON public.crm_queues TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_queue_items TO authenticated;
GRANT ALL ON public.crm_queue_items TO service_role;