
-- 1) Configuração singleton de motor de resposta
CREATE TABLE IF NOT EXISTS public.sth_engine_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  provider TEXT NOT NULL DEFAULT 'lovable_gemini',
  -- provider possíveis:
  --   lovable_gemini   -> Lovable AI Gateway (Gemini, default)
  --   lovable_gpt      -> Lovable AI Gateway (OpenAI GPT-5)
  --   custom_prompt    -> Lovable AI + system prompt customizado pelo admin
  --   gemini_direct    -> API Gemini direta (usa GEMINI_API_KEY)
  --   openai_direct    -> API OpenAI direta (usa OPENAI_API_KEY)
  model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  custom_system_prompt TEXT,
  temperature NUMERIC DEFAULT 0.7,
  auto_greeting_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT sth_engine_config_singleton CHECK (id = 1)
);

INSERT INTO public.sth_engine_config (id) VALUES (1) ON CONFLICT DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON public.sth_engine_config TO authenticated;
GRANT ALL ON public.sth_engine_config TO service_role;
ALTER TABLE public.sth_engine_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_engine_config" ON public.sth_engine_config
  FOR SELECT TO authenticated
  USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor'));
CREATE POLICY "admins_update_engine_config" ON public.sth_engine_config
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 2) Saudações por classificação
CREATE TABLE IF NOT EXISTS public.sth_greeting_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classification TEXT NOT NULL UNIQUE,
  -- classifications: aluno_ativo | renovacao | aluno_inativo | lead | tool_user
  label TEXT NOT NULL,
  message TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_greeting_templates TO authenticated;
GRANT ALL ON public.sth_greeting_templates TO service_role;
ALTER TABLE public.sth_greeting_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_greetings" ON public.sth_greeting_templates
  FOR SELECT TO authenticated
  USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor'));
CREATE POLICY "admins_write_greetings" ON public.sth_greeting_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Seed 5 saudações padrão
INSERT INTO public.sth_greeting_templates (classification, label, message) VALUES
  ('aluno_ativo',  'Aluno ativo',     'Olá {nome}! 👋 Tudo certo com seu plano *{plano}*? Como posso te ajudar hoje?'),
  ('renovacao',    'Renovação próxima','Oi {nome}! Seu plano vence em *{dias_restantes} dias*. Quer renovar agora e continuar evoluindo?'),
  ('aluno_inativo','Aluno inativo',   'Que bom te ver de volta, {nome}! 💪 Seu plano expirou — posso te enviar a renovação?'),
  ('lead',         'Lead qualificado','Olá {nome}! Vi que você fez nosso questionário. Quer que eu te mostre o plano ideal para o seu objetivo?'),
  ('tool_user',    'Visitante novo',  'Olá! Bem-vindo ao *STH METHOD*. 👋 Você está buscando consultoria, dieta ou treino?')
ON CONFLICT (classification) DO NOTHING;

-- 3) Tracking de saudação enviada (dedup por sessão)
ALTER TABLE public.sth_auto_sessions
  ADD COLUMN IF NOT EXISTS greeting_sent_at TIMESTAMPTZ;
