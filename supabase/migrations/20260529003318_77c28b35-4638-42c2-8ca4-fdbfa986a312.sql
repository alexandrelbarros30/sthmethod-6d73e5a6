
-- =========================================
-- WhatsApp Menus
-- =========================================
CREATE TABLE public.whatsapp_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  header_message TEXT NOT NULL DEFAULT '',
  footer_message TEXT NOT NULL DEFAULT '',
  parent_key TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_menus TO authenticated;
GRANT ALL ON public.whatsapp_menus TO service_role;

ALTER TABLE public.whatsapp_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and consultants can view menus"
ON public.whatsapp_menus FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor') OR public.has_admin_view(auth.uid()));

CREATE POLICY "Admins can manage menus"
ON public.whatsapp_menus FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_whatsapp_menus_updated
BEFORE UPDATE ON public.whatsapp_menus
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- WhatsApp Menu Options
-- =========================================
CREATE TABLE public.whatsapp_menu_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_key TEXT NOT NULL REFERENCES public.whatsapp_menus(key) ON DELETE CASCADE,
  option_number INTEGER NOT NULL,
  label TEXT NOT NULL,
  response_message TEXT NOT NULL DEFAULT '',
  tag TEXT,
  queue TEXT, -- comercial | financeiro | nutri | tecnico | humano
  channel TEXT NOT NULL DEFAULT 'sth_one', -- sth_one | fale_nutri
  requires_active_student BOOLEAN NOT NULL DEFAULT false,
  requires_human BOOLEAN NOT NULL DEFAULT false,
  ends_session BOOLEAN NOT NULL DEFAULT false,
  returns_to_menu BOOLEAN NOT NULL DEFAULT false,
  next_menu_key TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (menu_key, option_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_menu_options TO authenticated;
GRANT ALL ON public.whatsapp_menu_options TO service_role;

ALTER TABLE public.whatsapp_menu_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and consultants can view options"
ON public.whatsapp_menu_options FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor') OR public.has_admin_view(auth.uid()));

CREATE POLICY "Admins can manage options"
ON public.whatsapp_menu_options FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_whatsapp_menu_options_updated
BEFORE UPDATE ON public.whatsapp_menu_options
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_wa_options_menu ON public.whatsapp_menu_options(menu_key, display_order);

-- =========================================
-- WhatsApp Sessions
-- =========================================
CREATE TABLE public.whatsapp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  user_id UUID,
  current_menu_key TEXT,
  status TEXT NOT NULL DEFAULT 'NOVO',
  assigned_queue TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_interaction_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_sessions TO authenticated;
GRANT ALL ON public.whatsapp_sessions TO service_role;

ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view sessions"
ON public.whatsapp_sessions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor') OR public.has_admin_view(auth.uid()));

CREATE POLICY "Admins can manage sessions"
ON public.whatsapp_sessions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_whatsapp_sessions_updated
BEFORE UPDATE ON public.whatsapp_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_wa_sessions_status ON public.whatsapp_sessions(status, last_interaction_at DESC);

-- =========================================
-- Session Tags
-- =========================================
CREATE TABLE public.whatsapp_session_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.whatsapp_sessions(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, tag)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_session_tags TO authenticated;
GRANT ALL ON public.whatsapp_session_tags TO service_role;

ALTER TABLE public.whatsapp_session_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view session tags"
ON public.whatsapp_session_tags FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor') OR public.has_admin_view(auth.uid()));

CREATE POLICY "Admins can manage session tags"
ON public.whatsapp_session_tags FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- Menu Audit
-- =========================================
CREATE TABLE public.whatsapp_menu_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_key TEXT,
  option_id UUID,
  action TEXT NOT NULL, -- create | update | delete
  changed_by UUID,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.whatsapp_menu_audit TO authenticated;
GRANT ALL ON public.whatsapp_menu_audit TO service_role;

ALTER TABLE public.whatsapp_menu_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view audit"
ON public.whatsapp_menu_audit FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor') OR public.has_admin_view(auth.uid()));

CREATE POLICY "Admins can insert audit"
ON public.whatsapp_menu_audit FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- SEED — Menus
-- =========================================
INSERT INTO public.whatsapp_menus (key, title, header_message, footer_message, parent_key) VALUES
('main', 'Menu Principal', 'Olá! Eu sou o STH One, assistente da STH METHOD.

Para te atender melhor, escolha uma opção:', 'Digite o número da opção desejada.', NULL),
('aluno_ativo', 'Já sou aluno ativo', 'Bem-vindo de volta! Como posso te ajudar hoje?', 'Digite o número da opção desejada ou 0 para voltar.', 'main'),
('financeiro', 'Financeiro / Pagamento', 'Certo. Vou te direcionar para o setor financeiro.

Escolha uma opção:', 'Digite o número da opção ou 0 para voltar.', 'main'),
('suporte_tecnico', 'Suporte Técnico', 'Vamos resolver seu acesso.

Escolha uma opção:', 'Digite o número da opção ou 0 para voltar.', 'main');

-- =========================================
-- SEED — Main Menu Options
-- =========================================
INSERT INTO public.whatsapp_menu_options
(menu_key, option_number, label, response_message, tag, queue, channel, requires_active_student, next_menu_key, display_order) VALUES
('main', 1, 'Conhecer os planos',
'Perfeito. A STH METHOD oferece acompanhamento completo com:

🥗 Dieta personalizada
🏋️ Treino guiado pelo app
⚙️ Protocolo estratégico
🧪 Análise de exames
📲 Suporte ativo

Temos opções de 30, 90 e 180 dias.

Para iniciar, acesse:
sthmethod.com.br/cadastro',
'INTERESSE_PLANOS', 'comercial', 'sth_one', false, NULL, 1),

('main', 2, 'Já sou aluno ativo', '', 'ALUNO_ATIVO', NULL, 'sth_one', true, 'aluno_ativo', 2),

('main', 3, 'Financeiro / Pagamento', '', 'FINANCEIRO', NULL, 'sth_one', false, 'financeiro', 3),

('main', 4, 'Serviços da consultoria',
'A STH METHOD oferece um acompanhamento completo, muito além de uma consulta convencional:

🥗 Dieta personalizada
🏋️ Treino de musculação guiado no app
⚙️ Protocolo estratégico
🧪 Leitura e análise de exames
📲 Suporte ativo
📈 Acompanhamento da evolução

Para conhecer os planos, digite 1.
Para fazer cadastro, acesse: sthmethod.com.br/cadastro',
'SERVICOS', 'comercial', 'sth_one', false, NULL, 4),

('main', 5, 'Suporte técnico / Acesso', '', 'SUPORTE_TECNICO', NULL, 'sth_one', false, 'suporte_tecnico', 5),

('main', 6, 'Falar com atendente',
'Tudo bem. Vou te direcionar para um atendente humano.

Enquanto isso, me envie de forma objetiva o que você precisa para agilizar seu atendimento.',
'HUMANO_NECESSARIO', 'humano', 'sth_one', false, NULL, 6),

('main', 7, 'Fale com o Nutri',
'Você será direcionado para o canal exclusivo de alunos ativos: Fale com o Nutri.

Esse canal é destinado para dúvidas individualizadas sobre dieta, treino, protocolo, exames e evolução.',
'FALE_COM_NUTRI', 'nutri', 'fale_nutri', true, NULL, 7);

-- =========================================
-- SEED — Submenu Aluno Ativo
-- =========================================
INSERT INTO public.whatsapp_menu_options
(menu_key, option_number, label, response_message, tag, queue, channel, requires_active_student, next_menu_key, returns_to_menu, display_order) VALUES
('aluno_ativo', 1, 'Atualizar fotos e peso',
'Para manter seu acompanhamento atualizado, envie pela plataforma:

📸 Foto frontal
📸 Foto lateral
📸 Foto costas
⚖️ Peso atual

Acesse: sthmethod.com.br/login

Essas informações são fundamentais para ajuste de dieta, treino e protocolo.',
'ATUALIZACAO_PENDENTE', NULL, 'sth_one', true, NULL, true, 1),

('aluno_ativo', 2, 'Dieta',
'Sua dieta é personalizada e pode ser ajustada conforme sua evolução, peso, fotos, rotina e retorno na plataforma.

Para solicitar ajuste, atualize suas informações em:
sthmethod.com.br/login',
'SUPORTE_DIETA', NULL, 'sth_one', true, NULL, true, 2),

('aluno_ativo', 3, 'Treino',
'Seu treino é periodizado e atualizado conforme sua evolução.

Para ajustes de treino, informe:

🏋️ Exercícios com dificuldade
📆 Frequência semanal
⚖️ Peso atual
📸 Fotos recentes, se necessário',
'SUPORTE_TREINO', NULL, 'sth_one', true, NULL, true, 3),

('aluno_ativo', 4, 'Protocolo',
'Seu protocolo é acompanhado conforme seu plano, evolução, exames e retorno individual.

Informe se teve:

⚠️ Colaterais
✅ Melhoras percebidas
📉 Estagnação
🧪 Exames recentes

Assuntos sensíveis são encaminhados para atendimento humano/Nutri.',
'SUPORTE_PROTOCOLO', 'nutri', 'fale_nutri', true, NULL, false, 4),

('aluno_ativo', 5, 'Exames laboratoriais',
'Para enviar exames laboratoriais:

1. Acesse sthmethod.com.br/login
2. Vá em Atualização
3. Entre em Dados Clínicos / PDF
4. Clique em Adicionar Novo
5. Anexe o exame completo em PDF',
'EXAMES', NULL, 'sth_one', true, NULL, true, 5),

('aluno_ativo', 6, 'Renovação de plano',
'Para renovar seu acompanhamento, nossa equipe irá verificar seu plano atual e te enviar as melhores opções de continuidade.',
'RENOVACAO', 'financeiro', 'sth_one', true, NULL, false, 6),

('aluno_ativo', 7, 'Fale com o Nutri',
'Você será direcionado para o canal Fale com o Nutri.

Esse canal é destinado para dúvidas individualizadas sobre dieta, treino, protocolo, exames e evolução.',
'FALE_COM_NUTRI', 'nutri', 'fale_nutri', true, NULL, false, 7),

('aluno_ativo', 0, 'Voltar ao menu principal', '', NULL, NULL, 'sth_one', false, 'main', false, 8);

-- =========================================
-- SEED — Submenu Financeiro
-- =========================================
INSERT INTO public.whatsapp_menu_options
(menu_key, option_number, label, response_message, tag, queue, channel, next_menu_key, returns_to_menu, display_order) VALUES
('financeiro', 1, 'Enviar comprovante',
'Por favor, envie o comprovante de pagamento aqui mesmo nesta conversa. Nossa equipe financeira fará a conferência.',
'COMPROVANTE', 'financeiro', 'sth_one', NULL, false, 1),

('financeiro', 2, 'Segunda via / link de pagamento',
'Vou solicitar à equipe financeira a geração do seu link de pagamento. Em breve te enviaremos.',
'LINK_PAGAMENTO', 'financeiro', 'sth_one', NULL, false, 2),

('financeiro', 3, 'Dúvida sobre plano',
'Sem problema! Nos conte qual é sua dúvida sobre o plano que vamos te ajudar.',
'DUVIDA_PLANO', 'comercial', 'sth_one', NULL, false, 3),

('financeiro', 4, 'Renovação',
'Para renovação, nossa equipe vai verificar seu histórico e enviar as melhores opções de continuidade.',
'RENOVACAO', 'financeiro', 'sth_one', NULL, false, 4),

('financeiro', 5, 'Cupom / desconto',
'Se você possui um cupom de desconto, nos envie o código aqui que nossa equipe valida pra você.',
'CUPOM', 'comercial', 'sth_one', NULL, false, 5),

('financeiro', 0, 'Voltar ao menu principal', '', NULL, NULL, 'sth_one', 'main', false, 6);

-- =========================================
-- SEED — Submenu Suporte Técnico
-- =========================================
INSERT INTO public.whatsapp_menu_options
(menu_key, option_number, label, response_message, tag, queue, channel, next_menu_key, returns_to_menu, display_order) VALUES
('suporte_tecnico', 1, 'Não consigo acessar',
'Vamos resolver. Nos informe seu e-mail de cadastro e o que aparece quando tenta entrar.',
'ACESSO_PLATAFORMA', 'tecnico', 'sth_one', NULL, false, 1),

('suporte_tecnico', 2, 'Esqueci minha senha',
'Para redefinir sua senha, acesse: sthmethod.com.br/forgot-password

Se precisar de ajuda, nossa equipe técnica vai te apoiar.',
'SENHA', 'tecnico', 'sth_one', NULL, true, 2),

('suporte_tecnico', 3, 'Como instalar no celular',
'Para instalar a STH METHOD no seu celular:

1. Acesse sthmethod.com.br/install pelo navegador
2. Toque em "Adicionar à tela inicial"
3. Pronto! O app fica disponível como qualquer outro aplicativo.',
'ACESSO_PLATAFORMA', NULL, 'sth_one', NULL, true, 3),

('suporte_tecnico', 4, 'Problema no app de treino',
'Nos descreva o problema (qual tela, qual erro). Nossa equipe técnica vai te ajudar.',
'APP_TREINO', 'tecnico', 'sth_one', NULL, false, 4),

('suporte_tecnico', 5, 'Problema para enviar fotos/exames',
'Nos descreva o erro que aparece ao enviar fotos ou exames. Vamos resolver com você.',
'ERRO_UPLOAD', 'tecnico', 'sth_one', NULL, false, 5),

('suporte_tecnico', 0, 'Voltar ao menu principal', '', NULL, NULL, 'sth_one', 'main', false, 6);
