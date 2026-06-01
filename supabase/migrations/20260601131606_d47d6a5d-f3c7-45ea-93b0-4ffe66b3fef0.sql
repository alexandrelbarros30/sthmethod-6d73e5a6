-- Limpeza total: CRM, IA, Automação, Memory, Billing automático, Nutri Conversations
-- Preserva: treino, dieta, protocolo, pagamentos, planos, perfis, assinaturas

-- 1. Drop crons relacionados (se existirem)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT jobid, jobname FROM cron.job WHERE jobname ~* '(crm|sth|billing|wapi|whatsapp|nutri|automation|scheduler|memory|evolution-whatsapp)' LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. DROP TABLES — CRM
DROP TABLE IF EXISTS public.crm_automation_runs CASCADE;
DROP TABLE IF EXISTS public.crm_automations CASCADE;
DROP TABLE IF EXISTS public.crm_campaign_messages CASCADE;
DROP TABLE IF EXISTS public.crm_campaign_runs CASCADE;
DROP TABLE IF EXISTS public.crm_campaigns CASCADE;
DROP TABLE IF EXISTS public.crm_contacts CASCADE;
DROP TABLE IF EXISTS public.crm_media CASCADE;
DROP TABLE IF EXISTS public.crm_notes CASCADE;
DROP TABLE IF EXISTS public.crm_op_templates CASCADE;
DROP TABLE IF EXISTS public.crm_segments CASCADE;
DROP TABLE IF EXISTS public.crm_tags CASCADE;
DROP TABLE IF EXISTS public.crm_templates CASCADE;
DROP TABLE IF EXISTS public.crm_ticket_messages CASCADE;
DROP TABLE IF EXISTS public.crm_tickets CASCADE;
DROP TABLE IF EXISTS public.crm_webhook_logs CASCADE;

-- 3. DROP TABLES — STH (IA / Memory / Automation / Knowledge)
DROP TABLE IF EXISTS public.sth_ai_drafts CASCADE;
DROP TABLE IF EXISTS public.sth_ai_templates CASCADE;
DROP TABLE IF EXISTS public.sth_ai_unsolved CASCADE;
DROP TABLE IF EXISTS public.sth_auto_events CASCADE;
DROP TABLE IF EXISTS public.sth_auto_score_log CASCADE;
DROP TABLE IF EXISTS public.sth_auto_sessions CASCADE;
DROP TABLE IF EXISTS public.sth_engine_config CASCADE;
DROP TABLE IF EXISTS public.sth_greeting_templates CASCADE;
DROP TABLE IF EXISTS public.sth_kb_articles CASCADE;
DROP TABLE IF EXISTS public.sth_kb_versions CASCADE;
DROP TABLE IF EXISTS public.sth_knowledge_base CASCADE;
DROP TABLE IF EXISTS public.sth_memory CASCADE;
DROP TABLE IF EXISTS public.sth_memory_alerts CASCADE;
DROP TABLE IF EXISTS public.sth_memory_learning CASCADE;
DROP TABLE IF EXISTS public.sth_memory_objections CASCADE;
DROP TABLE IF EXISTS public.sth_memory_timeline CASCADE;

-- 4. DROP TABLES — Billing automation
DROP TABLE IF EXISTS public.billing_automation CASCADE;
DROP TABLE IF EXISTS public.billing_campaigns CASCADE;
DROP TABLE IF EXISTS public.billing_charges CASCADE;
DROP TABLE IF EXISTS public.billing_actions CASCADE;

-- 5. DROP TABLES — Nutri Conversations / AI Assistant
DROP TABLE IF EXISTS public.nutri_conversations CASCADE;
DROP TABLE IF EXISTS public.nutri_messages CASCADE;
DROP TABLE IF EXISTS public.nutri_business_hours CASCADE;
DROP TABLE IF EXISTS public.nutri_opt_outs CASCADE;
DROP TABLE IF EXISTS public.nutri_templates CASCADE;
DROP TABLE IF EXISTS public.ai_assistant_chats CASCADE;
DROP TABLE IF EXISTS public.ai_assistant_config CASCADE;
DROP TABLE IF EXISTS public.ai_assistant_conversation CASCADE;
DROP TABLE IF EXISTS public.ai_assistant_training CASCADE;

-- 6. DROP TABLES — WhatsApp menus / sessions / settings / api channels
DROP TABLE IF EXISTS public.whatsapp_menu_audit CASCADE;
DROP TABLE IF EXISTS public.whatsapp_menu_options CASCADE;
DROP TABLE IF EXISTS public.whatsapp_menus CASCADE;
DROP TABLE IF EXISTS public.whatsapp_session_tags CASCADE;
DROP TABLE IF EXISTS public.whatsapp_sessions CASCADE;
DROP TABLE IF EXISTS public.whatsapp_settings CASCADE;
DROP TABLE IF EXISTS public.api_channels CASCADE;
DROP TABLE IF EXISTS public.api_credentials CASCADE;
DROP TABLE IF EXISTS public.api_logs CASCADE;
DROP TABLE IF EXISTS public.response_engine_settings CASCADE;
DROP TABLE IF EXISTS public.message_templates CASCADE;
DROP TABLE IF EXISTS public.message_categories CASCADE;
DROP TABLE IF EXISTS public.message_variables CASCADE;
DROP TABLE IF EXISTS public.message_history CASCADE;

-- 7. DROP funções relacionadas
DROP FUNCTION IF EXISTS public.sth_automation_dashboard() CASCADE;
DROP FUNCTION IF EXISTS public.sth_command_center() CASCADE;
DROP FUNCTION IF EXISTS public.sth_growth_dashboard() CASCADE;
DROP FUNCTION IF EXISTS public.sth_ai_engine_stats() CASCADE;
DROP FUNCTION IF EXISTS public.sth_crm_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.sth_memory_upsert(text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.sth_memory_recalc_score(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.sth_kb_search(text, text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.sth_kb_articles_tsv() CASCADE;
DROP FUNCTION IF EXISTS public.crm_route_inbound(text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.crm_set_protocol() CASCADE;
DROP FUNCTION IF EXISTS public.advance_billing_campaign(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.sync_nutri_conversation() CASCADE;
DROP FUNCTION IF EXISTS public.find_profile_by_phone(text) CASCADE;
DROP SEQUENCE IF EXISTS public.crm_protocol_seq_nut CASCADE;
DROP SEQUENCE IF EXISTS public.crm_protocol_seq_sth CASCADE;