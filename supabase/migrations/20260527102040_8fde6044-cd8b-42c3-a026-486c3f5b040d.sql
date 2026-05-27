
CREATE TABLE IF NOT EXISTS public.nutri_business_hours (
  id text PRIMARY KEY DEFAULT 'main',
  enabled boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  schedule jsonb NOT NULL DEFAULT '[
    {"day":0,"label":"Domingo","enabled":false,"start":"09:00","end":"18:00"},
    {"day":1,"label":"Segunda","enabled":true,"start":"09:00","end":"18:00"},
    {"day":2,"label":"Terça","enabled":true,"start":"09:00","end":"18:00"},
    {"day":3,"label":"Quarta","enabled":true,"start":"09:00","end":"18:00"},
    {"day":4,"label":"Quinta","enabled":true,"start":"09:00","end":"18:00"},
    {"day":5,"label":"Sexta","enabled":true,"start":"09:00","end":"18:00"},
    {"day":6,"label":"Sábado","enabled":false,"start":"09:00","end":"14:00"}
  ]'::jsonb,
  away_message text NOT NULL DEFAULT 'Olá! 👋 Recebemos sua mensagem fora do horário de atendimento da STH METHOD. Nossa equipe responderá assim que estivermos online. Obrigado pela paciência! 💚',
  send_once_per_day boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutri_business_hours TO authenticated;
GRANT ALL ON public.nutri_business_hours TO service_role;

ALTER TABLE public.nutri_business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view business hours"
ON public.nutri_business_hours FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'assistente') OR public.has_role(auth.uid(), 'consultor'));

CREATE POLICY "Admins manage business hours"
ON public.nutri_business_hours FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'assistente'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'assistente'));

INSERT INTO public.nutri_business_hours (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.nutri_conversations
  ADD COLUMN IF NOT EXISTS last_away_at timestamptz;
