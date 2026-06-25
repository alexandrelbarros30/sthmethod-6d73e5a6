
-- 1) Inserir plano Projeto Verão 180
INSERT INTO public.plans (
  name, subtitle, price, card_price, duration, duration_days,
  benefits, active, visibility, discount_type, discount_value
) VALUES (
  'Projeto Verão 180',
  'Comece em julho. Chegue ao verão com resultados.',
  'R$ 477,00',
  'R$ 477,00',
  '180 dias',
  180,
  ARRAY[
    '6× no cartão: 2× R$ 49,50 + 4× R$ 94,50 (total R$ 477,00).',
    'Comece em julho. Chegue ao verão com resultados.',
    'Estratégia completa de 180 dias com periodização para o verão',
    'Dieta personalizada com ajustes contínuos',
    'Treino guiado por aplicativo',
    'Protocolo individualizado refinado por fase',
    'Bioimpedância + Painel Metabólico',
    'Check-in semanal',
    'Acompanhamento próximo durante todo o ciclo'
  ],
  true,
  'public',
  'none',
  0
);

-- 2) Tabela de assinaturas escalonadas Mercado Pago
CREATE TABLE public.mp_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  mp_preapproval_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|authorized|paused|cancelled|finished
  phase SMALLINT NOT NULL DEFAULT 1,        -- 1 = R$49,50, 2 = R$94,50
  charges_done INTEGER NOT NULL DEFAULT 0,
  total_amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  phase1_amount NUMERIC(10,2) NOT NULL DEFAULT 49.50,
  phase1_charges INTEGER NOT NULL DEFAULT 2,
  phase2_amount NUMERIC(10,2) NOT NULL DEFAULT 94.50,
  phase2_charges INTEGER NOT NULL DEFAULT 4,
  next_payment_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  init_point TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.mp_subscriptions TO authenticated;
GRANT ALL ON public.mp_subscriptions TO service_role;

ALTER TABLE public.mp_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mp_subscriptions"
  ON public.mp_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own mp_subscriptions"
  ON public.mp_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all mp_subscriptions"
  ON public.mp_subscriptions FOR SELECT
  TO authenticated
  USING (public.has_admin_view(auth.uid()));

CREATE TRIGGER trg_mp_subscriptions_updated_at
  BEFORE UPDATE ON public.mp_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_mp_subscriptions_user ON public.mp_subscriptions(user_id);
CREATE INDEX idx_mp_subscriptions_preapproval ON public.mp_subscriptions(mp_preapproval_id);
