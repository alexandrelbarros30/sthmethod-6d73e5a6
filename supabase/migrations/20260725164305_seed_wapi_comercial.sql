-- Migração canal Comercial: Z-API → W-API.
-- Cria a nova chave de configuração 'wapi_comercial' em crm_settings, se ainda
-- não existir, copiando o que for compatível da antiga 'zapi'.
INSERT INTO public.crm_settings (key, value)
SELECT 'wapi_comercial',
  jsonb_build_object(
    'enabled',      COALESCE((z.value->>'enabled')::boolean, false),
    'server_url',   'https://api.w-api.app',
    'instance_id',  COALESCE(z.value->>'instance_id', ''),
    'token',        COALESCE(z.value->>'instance_token', ''),
    'client_token', COALESCE(z.value->>'client_token', ''),
    'webhook',      COALESCE(z.value->>'webhook', '')
  )
FROM (
  SELECT value FROM public.crm_settings WHERE key = 'zapi'
  UNION ALL
  SELECT '{}'::jsonb WHERE NOT EXISTS (SELECT 1 FROM public.crm_settings WHERE key = 'zapi')
) z
WHERE NOT EXISTS (SELECT 1 FROM public.crm_settings WHERE key = 'wapi_comercial')
LIMIT 1;
