
CREATE TABLE public.platform_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  impact text NOT NULL CHECK (impact IN ('patch','minor','major')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  released_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage platform_updates"
ON public.platform_updates FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view published updates"
ON public.platform_updates FOR SELECT TO authenticated
USING (published = true);

CREATE INDEX idx_platform_updates_released ON public.platform_updates (released_at DESC);

INSERT INTO public.platform_updates (version, impact, title, description, published, released_at)
VALUES ('3.5.0', 'minor', 'Beta 3.5.0 — Card de Medicamentos', 'Novo card MEDICAMENTOS, HORMÔNIOS E PEPTÍDEOS no protocolo. Suporte a quebras de linha em citações multilinha. Datas de pagamento na busca por aluno.', true, now());
