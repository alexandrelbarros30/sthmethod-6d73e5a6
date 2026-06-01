
-- Add operational columns to crm_conversations
ALTER TABLE public.crm_conversations
  ADD COLUMN IF NOT EXISTS queue_type text,
  ADD COLUMN IF NOT EXISTS nutri_category text,
  ADD COLUMN IF NOT EXISTS is_lead boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider text;

CREATE INDEX IF NOT EXISTS idx_crm_conversations_queue_type ON public.crm_conversations(queue_type);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_is_lead ON public.crm_conversations(is_lead);

-- crm_settings: provider configs + AI mode
CREATE TABLE IF NOT EXISTS public.crm_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_settings TO authenticated;
GRANT ALL ON public.crm_settings TO service_role;

ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm staff read settings" ON public.crm_settings;
CREATE POLICY "crm staff read settings" ON public.crm_settings
  FOR SELECT TO authenticated USING (public.is_crm_staff(auth.uid()));

DROP POLICY IF EXISTS "admin manage settings" ON public.crm_settings;
CREATE POLICY "admin manage settings" ON public.crm_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Default rows
INSERT INTO public.crm_settings (key, value) VALUES
  ('ai_mode', '{"mode":"copilot"}'::jsonb),
  ('zapi', '{"enabled":false,"instance_id":"","instance_token":"","client_token":"","webhook":""}'::jsonb),
  ('wapi', '{"enabled":false,"server_url":"https://api.w-api.app","instance_id":"","token":"","client_token":"","webhook":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Financeiro queue
INSERT INTO public.crm_queues (name, type, color, sort_order) VALUES
  ('Financeiro', 'financeiro', '#facc15', 2)
ON CONFLICT DO NOTHING;

-- System tags
INSERT INTO public.crm_tags (name, color) VALUES
  ('LEAD','#38bdf8'),
  ('INTERESSE','#a78bfa'),
  ('CADASTRO','#f59e0b'),
  ('PAGAMENTO','#facc15'),
  ('CONVERTIDO','#22c55e'),
  ('RENOVACAO','#10b981'),
  ('ALUNO_ATIVO','#22c55e'),
  ('DIETA','#22c55e'),
  ('TREINO','#3b82f6'),
  ('PROTOCOLO','#a855f7'),
  ('EXAMES','#f59e0b'),
  ('ATUALIZACAO','#06b6d4'),
  ('PRIORIDADE','#ef4444'),
  ('COMERCIAL','#22c55e'),
  ('NUTRI','#06b6d4'),
  ('FINANCEIRO','#facc15')
ON CONFLICT DO NOTHING;
