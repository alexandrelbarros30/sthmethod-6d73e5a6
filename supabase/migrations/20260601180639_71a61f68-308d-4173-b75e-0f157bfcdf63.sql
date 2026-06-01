-- Templates de mensagens reutilizáveis para envio manual e automático
CREATE TABLE public.crm_message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'outro',
  body TEXT NOT NULL,
  media_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  is_automatic BOOLEAN NOT NULL DEFAULT false,
  variables TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_message_templates TO authenticated;
GRANT ALL ON public.crm_message_templates TO service_role;

ALTER TABLE public.crm_message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM staff can view templates"
  ON public.crm_message_templates FOR SELECT
  TO authenticated
  USING (public.is_crm_staff(auth.uid()));

CREATE POLICY "CRM staff can insert templates"
  ON public.crm_message_templates FOR INSERT
  TO authenticated
  WITH CHECK (public.is_crm_staff(auth.uid()));

CREATE POLICY "CRM staff can update templates"
  ON public.crm_message_templates FOR UPDATE
  TO authenticated
  USING (public.is_crm_staff(auth.uid()));

CREATE POLICY "Admins can delete templates"
  ON public.crm_message_templates FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_crm_message_templates_updated_at
  BEFORE UPDATE ON public.crm_message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_crm_message_templates_category ON public.crm_message_templates(category);
CREATE INDEX idx_crm_message_templates_active ON public.crm_message_templates(active);

-- Seeds com os 12 templates iniciais
INSERT INTO public.crm_message_templates (key, name, category, body, is_automatic, variables, description) VALUES
('saudacao_boas_vindas', 'Saudação — Boas-vindas', 'saudacao',
'Olá {nome}! 👋 Sou da STH METHOD. Que bom ter você por aqui! Posso te ajudar a entender como funciona nossa metodologia?',
false, ARRAY['nome'], 'Primeira mensagem para novo contato.'),

('apresentacao_planos', 'Apresentação de Planos', 'planos',
'Oi {nome}! Aqui estão nossos planos STH METHOD:

🥉 Entrada — acompanhamento mensal
🥈 Intermediário — protocolo + dieta
🥇 Premium — programa completo com renovação automática

Quer que eu envie o link de cadastro? 🚀',
false, ARRAY['nome'], 'Envio inicial dos planos.'),

('como_funciona', 'Como Funciona', 'como_funciona',
'{nome}, a STH METHOD funciona em 3 etapas:

1️⃣ Questionário inicial (5 min)
2️⃣ Análise personalizada do seu caso
3️⃣ Dieta + treino + protocolo no app

Tudo acompanhado e ajustado periodicamente. Quer começar?',
false, ARRAY['nome'], 'Explicação resumida da metodologia.'),

('duvidas_geral', 'Dúvidas — Resposta padrão', 'duvidas',
'Oi {nome}, recebi sua dúvida! Pode mandar com mais detalhes? Assim te respondo com precisão. 🙏',
false, ARRAY['nome'], 'Resposta inicial para perguntas.'),

('lembrete_vencimento_7d', 'Lembrete — Vence em 7 dias', 'lembrete_vencimento',
'{nome}, seu plano {plano} vence em {dias_restantes} dias ({vencimento}). 

Renove agora e mantenha sua evolução sem interrupção: {link_renovacao}',
true, ARRAY['nome','plano','dias_restantes','vencimento','link_renovacao'], 'Disparo automático 7 dias antes do vencimento.'),

('lembrete_ciclo_1d', 'Lembrete — Atualização de ciclo (1 dia antes)', 'lembrete_ciclo',
'{nome}, amanhã ({vencimento}) seu ciclo termina! ⚠️

Atualize seus dados (peso, fotos e medidas) para receber o próximo ciclo ajustado: {link_renovacao}',
true, ARRAY['nome','vencimento','link_renovacao'], 'Disparo automático 1 dia antes do término do ciclo.'),

('cobranca_vencido', 'Cobrança — Plano vencido', 'cobranca',
'Oi {nome}, seu plano {plano} venceu em {vencimento}. 

Renove agora para retomar dieta, treino e protocolo: {link_renovacao}

Qualquer dúvida me chama! 💬',
true, ARRAY['nome','plano','vencimento','link_renovacao'], 'Disparo automático após o vencimento.'),

('renovacao_lembranca', 'Renovação — Lembrança', 'renovacao',
'{nome}, está chegando a hora de renovar seu plano {plano}! 

Mantenha sua evolução com a STH METHOD: {link_renovacao}',
true, ARRAY['nome','plano','link_renovacao'], 'Mensagem automática de incentivo à renovação.'),

('oferta_promocional', 'Oferta — Promoção', 'oferta',
'🔥 {nome}, oferta especial pra você!

{valor} de desconto no plano {plano} até {vencimento}.

Aproveita: {link_renovacao}',
false, ARRAY['nome','plano','valor','vencimento','link_renovacao'], 'Modelo para campanhas promocionais manuais.'),

('tarefa_atualizacao', 'Tarefa — Atualização pendente', 'tarefa',
'{nome}, notamos que faltam suas atualizações (peso, fotos ou medidas). 

Atualize hoje para receber seu próximo ciclo ajustado! 📊',
false, ARRAY['nome'], 'Cobrança de atualização de evolução.'),

('automacao_pagamento_aprovado', 'Automação — Pagamento aprovado', 'automacao',
'✅ {nome}, pagamento aprovado!

Plano: {plano}
Validade: até {vencimento}

Acesse o app e bons treinos! 💪',
true, ARRAY['nome','plano','vencimento'], 'Disparo automático após confirmação de pagamento.'),

('campanha_reativacao', 'Campanha — Reativação de ex-aluno', 'campanha',
'{nome}, sentimos sua falta! 💙

Voltamos com novidades na STH METHOD e queremos te ver evoluindo de novo. Topa conversar?',
false, ARRAY['nome'], 'Campanha em massa para ex-alunos.');