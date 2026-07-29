
-- 1) Prompts de IA (crm_settings)
UPDATE crm_settings
SET value = jsonb_set(
  value,
  '{prompt}',
  to_jsonb(
    regexp_replace(
      regexp_replace(
        regexp_replace(value->>'prompt', '5521\s?97248[- ]?6650', '5521998496289', 'g'),
        '55\s?21\s?97248[- ]?6650', '5521998496289', 'g'),
      '\(?21\)?\s?97248[- ]?6650', '5521998496289', 'g')
  )
)
WHERE value ? 'prompt' AND value->>'prompt' ILIKE '%97248%';

-- Ajuste semântico: canal Sucesso do Aluno deixa de ser citado com número inexistente
UPDATE crm_settings
SET value = jsonb_set(value, '{prompt}', to_jsonb(
  replace(value->>'prompt', 'Sucesso do Aluno (https://wa.me/5521998496289)', 'canal Comercial (https://wa.me/5521998496289)')
))
WHERE key = 'ai_prompt_aluno';

-- 2) Memória da IA
UPDATE crm_ai_memory
SET content = regexp_replace(
  regexp_replace(content, '5521\s?97248[- ]?6650', '5521998496289', 'g'),
  '\(?21\)?\s?97248[- ]?6650', '5521998496289', 'g')
WHERE content ILIKE '%97248%';

-- 3) Templates e conteúdos
UPDATE crm_message_templates SET body = regexp_replace(regexp_replace(body, '5521\s?97248[- ]?6650', '5521998496289', 'g'), '\(?21\)?\s?97248[- ]?6650', '5521998496289', 'g') WHERE body ILIKE '%97248%';
UPDATE message_templates SET content = regexp_replace(regexp_replace(content, '5521\s?97248[- ]?6650', '5521998496289', 'g'), '\(?21\)?\s?97248[- ]?6650', '5521998496289', 'g') WHERE content ILIKE '%97248%';
UPDATE broadcast_templates SET message = regexp_replace(regexp_replace(message, '5521\s?97248[- ]?6650', '5521998496289', 'g'), '\(?21\)?\s?97248[- ]?6650', '5521998496289', 'g') WHERE message ILIKE '%97248%';
UPDATE crm_flow_steps SET message = regexp_replace(regexp_replace(message, '5521\s?97248[- ]?6650', '5521998496289', 'g'), '\(?21\)?\s?97248[- ]?6650', '5521998496289', 'g') WHERE message ILIKE '%97248%';
UPDATE crm_campaigns SET message_template = regexp_replace(regexp_replace(message_template, '5521\s?97248[- ]?6650', '5521998496289', 'g'), '\(?21\)?\s?97248[- ]?6650', '5521998496289', 'g') WHERE message_template ILIKE '%97248%';
UPDATE site_content SET content = regexp_replace(regexp_replace(content, '5521\s?97248[- ]?6650', '5521998496289', 'g'), '\(?21\)?\s?97248[- ]?6650', '5521998496289', 'g') WHERE content ILIKE '%97248%';
