-- Add system_key to mark templates used by automated popups/reminders
ALTER TABLE public.message_templates
  ADD COLUMN IF NOT EXISTS system_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS system_description TEXT;

CREATE INDEX IF NOT EXISTS idx_message_templates_system_key ON public.message_templates(system_key);

-- Ensure "personalizada" category exists for system templates
INSERT INTO public.message_categories (name, slug, sort_order)
SELECT 'Personalizada', 'personalizada', 0
WHERE NOT EXISTS (SELECT 1 FROM public.message_categories WHERE slug = 'personalizada');

-- Ensure "sistema" category exists
INSERT INTO public.message_categories (name, slug, sort_order)
SELECT 'Sistema (Automáticos)', 'sistema', -1
WHERE NOT EXISTS (SELECT 1 FROM public.message_categories WHERE slug = 'sistema');

-- Map existing template "Boas vindas 2" as the welcome system template
UPDATE public.message_templates
SET system_key = 'payment_welcome',
    system_description = 'Enviado automaticamente quando o admin clica em "WhatsApp" no popup de Pagamento Aprovado.'
WHERE id = 'c6aefbd6-049c-4d8e-aa55-ebece3b638ca'
  AND (system_key IS NULL OR system_key = 'payment_welcome');

-- Map existing "Atualização" template as the evolution-update system template
UPDATE public.message_templates
SET system_key = 'evolution_update_reminder',
    system_description = 'Enviado quando o admin clica em "Enviar" no popup de Lembrete de Atualização de Evolução (ciclos de 29 dias).'
WHERE id = 'b01842c0-e3b5-48be-984d-61bc3d029e04'
  AND (system_key IS NULL OR system_key = 'evolution_update_reminder');

-- Map "Renovar com link" as renewal system template
UPDATE public.message_templates
SET system_key = 'renewal_link',
    system_description = 'Template usado para enviar lembretes de renovação de plano com link seguro.'
WHERE id = '2ed4acba-9f72-4964-a19f-dc0d74409dcf'
  AND (system_key IS NULL OR system_key = 'renewal_link');

-- Map "Falta pagamento" as awaiting-payment template
UPDATE public.message_templates
SET system_key = 'awaiting_payment',
    system_description = 'Enviado para alunos que completaram cadastro mas ainda não pagaram.'
WHERE id = 'bef94ad6-7fbe-4376-8d22-dadd8775760a'
  AND (system_key IS NULL OR system_key = 'awaiting_payment');

-- Map "Cadastro recebido" as new-lead/queue first-contact template
UPDATE public.message_templates
SET system_key = 'service_queue_first_contact',
    system_description = 'Enviado pelo botão "WhatsApp" da Fila de Atendimento ao iniciar o primeiro contato com o aluno.'
WHERE id = '74693b12-2f9d-4a67-a165-3e966139e7d9'
  AND (system_key IS NULL OR system_key = 'service_queue_first_contact');

-- Seed any missing system templates so admin always has them available to edit
DO $$
DECLARE
  cat_id uuid;
BEGIN
  SELECT id INTO cat_id FROM public.message_categories WHERE slug = 'sistema' LIMIT 1;

  -- Diet adjustment reminder (Lembretes Inteligentes)
  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE system_key = 'diet_adjustment_reminder') THEN
    INSERT INTO public.message_templates (category_id, title, content, system_key, system_description, is_reusable)
    VALUES (cat_id, 'Ajuste de Dieta (30 dias)',
      'Olá {nome}! 🍽️\n\nFaz cerca de 30 dias desde seu último ajuste de dieta. Vamos revisar sua estratégia para manter os resultados acelerados? 🚀\n\nMe envie seu peso atual e como você está se sentindo.',
      'diet_adjustment_reminder',
      'Sugerido pelo painel de Lembretes Inteligentes (recorrência de 30 dias) ao clicar em "WhatsApp".', true);
  END IF;

  -- Renewal reminder 3 days before
  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE system_key = 'renewal_reminder') THEN
    INSERT INTO public.message_templates (category_id, title, content, system_key, system_description, is_reusable)
    VALUES (cat_id, 'Lembrete de Renovação (3 dias)',
      'Olá {nome}! ⏰\n\nSeu plano vence em {dias_restantes} dias ({vencimento}). Que tal renovar e seguir firme na evolução? 💪\n\n👉 Link de renovação: {link}',
      'renewal_reminder',
      'Sugerido pelo painel de Lembretes Inteligentes quando o plano do aluno está nos últimos 3 dias.', true);
  END IF;
END $$;