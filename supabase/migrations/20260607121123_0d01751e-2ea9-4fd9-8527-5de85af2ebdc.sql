ALTER TABLE public.crm_campaigns ADD COLUMN channel TEXT DEFAULT 'zapi';
COMMENT ON COLUMN public.crm_campaigns.channel IS 'Channel used for the broadcast: zapi (Comercial), wapi (Nutri), wapi_sucesso (Sucesso)';
