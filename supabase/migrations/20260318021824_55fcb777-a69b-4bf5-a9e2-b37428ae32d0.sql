
CREATE TABLE public.message_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  example TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.message_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage message variables"
  ON public.message_variables
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone authenticated can view variables"
  ON public.message_variables
  FOR SELECT
  TO authenticated
  USING (true);

-- Seed default variables
INSERT INTO public.message_variables (key, label, example, sort_order) VALUES
  ('{nome}', 'Nome do aluno', 'Maria Silva', 1),
  ('{plano}', 'Nome do plano', 'Plano Premium 90 dias', 2),
  ('{vencimento}', 'Data de vencimento', '25/03/2026', 3),
  ('{link}', 'Link de renovação', 'https://...', 4),
  ('{dias_restantes}', 'Dias restantes', '7', 5),
  ('{valor}', 'Valor do plano', 'R$ 297,00', 6);
