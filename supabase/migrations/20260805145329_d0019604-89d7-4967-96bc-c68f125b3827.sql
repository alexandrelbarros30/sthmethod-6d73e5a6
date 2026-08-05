-- 1. Atualizar templates de mensagens do CRM para remover links wa.me do Nutri
UPDATE public.crm_message_templates 
SET body = REPLACE(body, 'https://wa.me/5521998984153', 'https://wa.me/5521998496289')
WHERE body ILIKE '%998984153%';

UPDATE public.crm_message_templates 
SET body = REPLACE(body, '21 99898-4153', '21 99849-6289')
WHERE body ILIKE '%99898-4153%';

-- 2. Atualizar configurações do CRM (saudações, mensagens de ausência)
UPDATE public.crm_settings
SET value = jsonb_set(
  value, 
  '{message}', 
  to_jsonb(REPLACE(value->>'message', 'https://wa.me/5521998984153', 'https://wa.me/5521998496289'))
)
WHERE value->>'message' ILIKE '%998984153%';

UPDATE public.crm_settings
SET value = jsonb_set(
  value, 
  '{message}', 
  to_jsonb(REPLACE(value->>'message', '21 99898-4153', '21 99849-6289'))
)
WHERE value->>'message' ILIKE '%99898-4153%';

-- 3. Atualizar fluxos do CRM
UPDATE public.crm_flow_steps
SET message = REPLACE(message, 'https://wa.me/5521998984153', 'https://wa.me/5521998496289')
WHERE message ILIKE '%998984153%';

UPDATE public.crm_flow_steps
SET message = REPLACE(message, '21 99898-4153', '21 99849-6289')
WHERE message ILIKE '%99898-4153%';

-- 4. Injetar restrição absoluta na memória global da IA CRM (crm_ai_memory)
-- Usando a categoria 'aprendizado' que é aceita pelo constraint
INSERT INTO public.crm_ai_memory (scope, category, content)
VALUES (
  'global', 
  'aprendizado', 
  'PROIBIÇÃO ABSOLUTA (STH METHOD): Nunca, em hipótese alguma, fornecer o número ou link do canal Fale com o Nutri (21 99898-4153 / wa.me/5521998984153) para ninguém. Se for aluno ativo, ele já recebe resposta automaticamente naquele canal. Se for lead ou inativo, deve ser redirecionado exclusivamente para o canal Comercial (21 99849-6289 / wa.me/5521998496289).'
) ON CONFLICT DO NOTHING;
