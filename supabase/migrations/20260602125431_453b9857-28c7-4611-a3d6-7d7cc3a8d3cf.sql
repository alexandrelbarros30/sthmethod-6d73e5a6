
-- Tabela de log para deduplicar lembretes de renovação por janela
CREATE TABLE public.subscription_reminder_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID,
  end_date DATE NOT NULL,
  trigger TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, end_date, trigger)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_reminder_log TO authenticated;
GRANT ALL ON public.subscription_reminder_log TO service_role;

ALTER TABLE public.subscription_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage reminder log"
ON public.subscription_reminder_log
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CRM staff view reminder log"
ON public.subscription_reminder_log
FOR SELECT
TO authenticated
USING (public.is_crm_staff(auth.uid()));

CREATE INDEX idx_subscription_reminder_log_user ON public.subscription_reminder_log(user_id, trigger);

-- Cadastra/atualiza os 5 templates de renovação automática
INSERT INTO public.crm_message_templates (key, name, category, body, channel, active, is_automatic, automation_trigger, variables, description)
VALUES
  ('renewal_pre_3d', 'Renovação — D-3 (3 dias antes)', 'lembrete_vencimento',
'Olá, {nome}! 👋

Seu acompanhamento na STH Method está próximo do vencimento.

⏳ Faltam apenas {dias_restantes} dias para encerrar seu plano atual.

Para continuar sua jornada com segurança e planejamento, realize sua renovação através do link abaixo:

🔗 {link_renovacao}

Não interrompa sua evolução. Cada etapa do planejamento foi construída para manter seus resultados em constante progresso. 💪',
   'zapi', true, true, 'renewal_pre_3d', ARRAY['nome','dias_restantes','link_renovacao'],
   'Disparo automático 3 dias antes do vencimento via canal comercial Z-API.'),

  ('renewal_d1', 'Renovação — D+1 (1 dia após vencimento)', 'cobranca',
'Olá, {nome}!

Identificamos que o seu plano na STH Method venceu há 1 dia.

A partir deste momento, os serviços de acompanhamento ficam suspensos até a renovação.

Se deseja continuar sua jornada conosco, basta renovar pelo link abaixo:

🔗 {link_renovacao}

Estamos prontos para dar continuidade ao seu planejamento e aos seus resultados. 🚀',
   'zapi', true, true, 'renewal_d1', ARRAY['nome','link_renovacao'],
   'Disparo automático 1 dia após o vencimento via canal comercial Z-API.'),

  ('renewal_d7', 'Renovação — D+7 (7 dias após vencimento)', 'cobranca',
'Olá, {nome}!

Já se passaram 7 dias desde o vencimento do seu acompanhamento na STH Method.

Sabemos que a rotina pode ser corrida, mas interromper o acompanhamento por muito tempo pode dificultar a manutenção dos resultados conquistados.

Renove agora e retome sua evolução:

🔗 {link_renovacao}

Sua evolução merece continuidade. 💪',
   'zapi', true, true, 'renewal_d7', ARRAY['nome','link_renovacao'],
   'Disparo automático 7 dias após o vencimento via canal comercial Z-API.'),

  ('renewal_d15', 'Renovação — D+15 (cupom RETOMA20)', 'oferta',
'Olá, {nome}!

Sentimos sua falta na STH Method.

Para facilitar seu retorno, liberamos uma condição especial de renovação:

🎁 Cupom: {cupom}
💰 20% de desconto para pagamento à vista via PIX.

Utilize o cupom no momento da renovação através do link abaixo:

🔗 {link_renovacao}

⚠️ O cupom é válido exclusivamente para pagamentos realizados via PIX e por tempo limitado.

Esperamos você de volta para continuar sua evolução! 🚀💪',
   'zapi', true, true, 'renewal_d15', ARRAY['nome','cupom','link_renovacao'],
   'Disparo automático 15 dias após o vencimento, com cupom RETOMA20 (20% PIX) via Z-API.'),

  ('renewal_d30', 'Renovação — D+30 (último contato automático)', 'cobranca',
'Olá, {nome}!

Já se passaram 30 dias desde o encerramento do seu plano na STH Method.

Este será nosso último contato automático referente à renovação.

Caso deseje retornar futuramente, nossa equipe estará pronta para receber você novamente e elaborar uma nova estratégia alinhada aos seus objetivos atuais.

Quando decidir voltar, basta acessar:

🔗 {link_renovacao}

Obrigado por ter feito parte da STH Method.

Desejamos sucesso na sua jornada e esperamos reencontrá-lo em breve. 💪🏆',
   'zapi', true, true, 'renewal_d30', ARRAY['nome','link_renovacao'],
   'Último disparo automático, 30 dias após o vencimento via canal comercial Z-API.')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  body = EXCLUDED.body,
  channel = EXCLUDED.channel,
  active = EXCLUDED.active,
  is_automatic = EXCLUDED.is_automatic,
  automation_trigger = EXCLUDED.automation_trigger,
  variables = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at = now();
