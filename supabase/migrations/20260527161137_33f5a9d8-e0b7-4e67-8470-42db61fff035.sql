
-- api_channels
CREATE TABLE public.api_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel_type text NOT NULL CHECK (channel_type IN ('comercial','atendimento_personalizado')),
  whatsapp_number text,
  provider text NOT NULL CHECK (provider IN ('wapi','zapi','evolution','cloud')),
  instance_id text,
  instance_name text,
  base_url text,
  webhook_url text,
  status text NOT NULL DEFAULT 'inativo' CHECK (status IN ('ativo','inativo','manutencao')),
  is_active boolean NOT NULL DEFAULT false,
  responsible_user_id uuid,
  description text,
  connection_status text NOT NULL DEFAULT 'disconnected' CHECK (connection_status IN ('connected','disconnected','pending','error')),
  connected_number text,
  qr_code text,
  last_sync_at timestamptz,
  slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_channels TO authenticated;
GRANT ALL ON public.api_channels TO service_role;
ALTER TABLE public.api_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage api_channels" ON public.api_channels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_api_channels_updated BEFORE UPDATE ON public.api_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- api_credentials
CREATE TABLE public.api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL UNIQUE REFERENCES public.api_channels(id) ON DELETE CASCADE,
  api_key_encrypted text,
  token_encrypted text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  client_id_encrypted text,
  client_secret_encrypted text,
  token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_credentials TO authenticated;
GRANT ALL ON public.api_credentials TO service_role;
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage api_credentials" ON public.api_credentials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_api_credentials_updated BEFORE UPDATE ON public.api_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- response_engine_settings
CREATE TABLE public.response_engine_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL UNIQUE REFERENCES public.api_channels(id) ON DELETE CASCADE,
  ai_enabled boolean NOT NULL DEFAULT false,
  human_enabled boolean NOT NULL DEFAULT true,
  auto_reply_enabled boolean NOT NULL DEFAULT true,
  business_hours jsonb NOT NULL DEFAULT '{"timezone":"America/Sao_Paulo","days":{"mon":{"on":true,"from":"09:00","to":"18:00"},"tue":{"on":true,"from":"09:00","to":"18:00"},"wed":{"on":true,"from":"09:00","to":"18:00"},"thu":{"on":true,"from":"09:00","to":"18:00"},"fri":{"on":true,"from":"09:00","to":"18:00"},"sat":{"on":false},"sun":{"on":false}}}'::jsonb,
  after_hours_message text DEFAULT 'Estamos fora do horário de atendimento. Responderemos em breve.',
  max_auto_replies integer NOT NULL DEFAULT 3,
  handoff_to_human_after_minutes integer NOT NULL DEFAULT 10,
  ai_model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  main_prompt text,
  safety_prompt text,
  fallback_prompt text,
  temperature numeric NOT NULL DEFAULT 0.4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.response_engine_settings TO authenticated;
GRANT ALL ON public.response_engine_settings TO service_role;
ALTER TABLE public.response_engine_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage engine settings" ON public.response_engine_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_response_engine_updated BEFORE UPDATE ON public.response_engine_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- api_logs
CREATE TABLE public.api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.api_channels(id) ON DELETE SET NULL,
  provider text,
  event_type text NOT NULL,
  event_description text,
  status text NOT NULL DEFAULT 'info' CHECK (status IN ('success','error','info')),
  error_message text,
  user_id uuid,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.api_logs TO authenticated;
GRANT ALL ON public.api_logs TO service_role;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read api_logs" ON public.api_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins insert api_logs" ON public.api_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_api_logs_channel ON public.api_logs(channel_id, created_at DESC);

-- Seed two default channels + engine settings
INSERT INTO public.api_channels (name, channel_type, provider, slug, status, is_active, description)
VALUES
  ('STH One','comercial','zapi','sth_one','inativo',false,'Canal comercial — leads, planos, cadastro e pagamento.'),
  ('Fale com o Nutri','atendimento_personalizado','wapi','fale_nutri','inativo',false,'Canal exclusivo para alunos ativos — atendimento humanizado.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.response_engine_settings (channel_id, main_prompt, safety_prompt, fallback_prompt)
SELECT c.id,
  CASE WHEN c.slug = 'sth_one'
    THEN 'Você é o atendente comercial da STH METHOD. Tom objetivo e cordial. Atenda leads novos, explique planos, direcione para cadastro, envie link de pagamento, identifique aluno ativo e o encaminhe para o canal Fale com o Nutri.'
    ELSE 'Você é o atendente do canal Fale com o Nutri da STH METHOD, exclusivo para alunos ativos. Tom humanizado, cuidadoso e neutro. Priorize mensagens sensíveis (sintomas, colaterais, dúvidas de protocolo, exames, dieta, treino) e encaminhe para humano quando necessário. NUNCA trate como fluxo comercial.'
  END,
  'Nunca prometa resultados milagrosos. Nunca recomende dose ou conduta médica. Em sinais de risco (dor forte, sangramento, reação grave), oriente buscar atendimento médico e encaminhe para humano.',
  'Não tenho essa informação no momento — vou transferir para um atendente humano.'
FROM public.api_channels c
ON CONFLICT (channel_id) DO NOTHING;

INSERT INTO public.api_credentials (channel_id)
SELECT id FROM public.api_channels
ON CONFLICT (channel_id) DO NOTHING;
