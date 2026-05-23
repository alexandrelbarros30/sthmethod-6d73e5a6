
CREATE TABLE IF NOT EXISTS public.billing_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'overdue',
  assigned_to uuid,
  observations text DEFAULT '',
  attempts integer NOT NULL DEFAULT 0,
  last_template text,
  last_contact_at timestamptz,
  ignore_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_actions_user ON public.billing_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_actions_status ON public.billing_actions(status);

ALTER TABLE public.billing_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage billing_actions" ON public.billing_actions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Financeiro manage billing_actions" ON public.billing_actions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'financeiro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'financeiro'::app_role));

CREATE POLICY "Admin viewers read billing_actions" ON public.billing_actions
  FOR SELECT TO authenticated
  USING (public.has_admin_view(auth.uid()));

CREATE POLICY "Consultors read linked billing_actions" ON public.billing_actions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'consultor'::app_role) AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultors update linked billing_actions" ON public.billing_actions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'consultor'::app_role) AND public.is_consultant_of(auth.uid(), user_id))
  WITH CHECK (public.has_role(auth.uid(), 'consultor'::app_role) AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultors insert linked billing_actions" ON public.billing_actions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'consultor'::app_role) AND public.is_consultant_of(auth.uid(), user_id));

CREATE TRIGGER update_billing_actions_updated_at
  BEFORE UPDATE ON public.billing_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.message_templates (category_id, title, content, system_key, system_description, is_reusable)
VALUES
  ('2a8ece91-3abf-45b3-b88d-74810ccdde13', 'Renovação leve (cobrança)',
   E'Olá, {nome}! Tudo bem?\n\nIdentificamos que seu acompanhamento na STH METHOD venceu há {dias_vencido} dias.\n\nCaso deseje continuar sua estratégia, você pode renovar diretamente pela plataforma.\n\n{link_renovacao}\n\nA continuidade é importante para manter ajustes, evolução e acompanhamento com direção.',
   'renewal_soft', 'Template suave de cobrança (módulo Cobranças e Renovações).', true),
  ('2a8ece91-3abf-45b3-b88d-74810ccdde13', 'Renovação objetiva (cobrança)',
   E'Olá, {nome}!\n\nSeu plano STH METHOD está vencido há {dias_vencido} dias.\n\nPara continuar recebendo acompanhamento, ajustes estratégicos e suporte, realize sua renovação pela plataforma.\n\n{link_renovacao}',
   'renewal_objective', 'Template objetivo de cobrança (módulo Cobranças e Renovações).', true),
  ('2a8ece91-3abf-45b3-b88d-74810ccdde13', 'Recuperação (cobrança)',
   E'Olá, {nome}!\n\nPercebemos que você ainda não renovou seu acompanhamento.\n\nSe quiser retomar sua estratégia, podemos te direcionar para a melhor opção de plano conforme seu momento atual.\n\n{link_renovacao}',
   'renewal_recovery', 'Template de recuperação (módulo Cobranças e Renovações).', true),
  ('2a8ece91-3abf-45b3-b88d-74810ccdde13', 'Último contato (cobrança)',
   E'Olá, {nome}!\n\nEstamos encerrando os contatos referentes à sua renovação neste momento.\n\nCaso deseje retornar futuramente, estaremos à disposição para reativar sua estratégia na STH METHOD.',
   'renewal_last_contact', 'Template de último contato (módulo Cobranças e Renovações).', true)
ON CONFLICT DO NOTHING;
