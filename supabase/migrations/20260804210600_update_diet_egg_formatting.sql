-- Update STHIA Master Prompt for Diet Generation
-- Target: crm_settings key 'ai_prompt_dieta'
-- Requirement: Units for eggs/egg whites, typical Brazilian cuisine

UPDATE public.crm_settings
SET value = jsonb_set(
  COALESCE(value, '{}'::jsonb),
  '{prompt}',
  (COALESCE(value->>'prompt', '') || '\n\nREGRAS ADICIONAIS DE ALIMENTAÇÃO:\n- OVOS E CLARAS EM UNIDADES: É obrigatório apresentar ovos e claras em UNIDADES (ex: 4 ovos, 3 claras), nunca em gramas.\n- CULINÁRIA BRASILEIRA: Priorizar alimentos e preparações típicas da culinária brasileira (arroz, feijão, tapioca, cuscuz, frutas tropicais).\n- ESTRUTURA DE 4 OPÇÕES: Cada refeição deve obrigatoriamente conter 1 Opção Base e 3 Opções Alternativas equivalentes em macros.')::jsonb
)
WHERE key = 'ai_prompt_dieta';
