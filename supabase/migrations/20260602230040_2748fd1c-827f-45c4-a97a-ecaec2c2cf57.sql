ALTER TABLE public.crm_message_templates
  ADD COLUMN IF NOT EXISTS silent_dispatch boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_msg_templates_silent
  ON public.crm_message_templates(silent_dispatch) WHERE silent_dispatch = true;

INSERT INTO public.crm_message_templates
  (key, name, category, body, channel, active, is_automatic, silent_dispatch, description, variables)
VALUES (
  'encerramento_expediente',
  'Encerramento de expediente (silencioso)',
  'outro',
  E'🌙 *Encerramento do expediente*\n\nOlá! Nosso atendimento de hoje foi encerrado.\n\n👉 Acesse agora: https://sthmethod.com.br/cadastro\n\nRealize seu cadastro e escolha o plano ideal. No primeiro horário do próximo expediente entraremos em contato. ✅\n\nEquipe STH METHOD',
  'both', true, false, true,
  'Disparo manual silencioso pelo Admin para conversas inativas 30+ min após contato pós-19h. NÃO substitui automações de ausência/encerramento.',
  ARRAY[]::text[]
)
ON CONFLICT (key) DO UPDATE
  SET silent_dispatch = true,
      body = EXCLUDED.body,
      active = true,
      channel = 'both',
      description = EXCLUDED.description;