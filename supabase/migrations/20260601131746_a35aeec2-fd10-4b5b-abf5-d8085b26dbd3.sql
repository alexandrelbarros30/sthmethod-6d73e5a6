-- Recriar tabelas de mensagens essenciais (CRM removido, mas estas são usadas por features preservadas)

CREATE TABLE IF NOT EXISTS public.message_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.message_categories TO anon, authenticated;
GRANT ALL ON public.message_categories TO authenticated, service_role;
ALTER TABLE public.message_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage message categories" ON public.message_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone authenticated can view categories" ON public.message_categories FOR SELECT TO authenticated USING (true);

INSERT INTO public.message_categories (name, slug, sort_order) VALUES
  ('Cobranças', 'cobrancas', 1),
  ('Vencimentos de plano', 'vencimentos', 2),
  ('Renovação de assinatura', 'renovacao', 3),
  ('Ofertas e campanhas', 'ofertas', 4),
  ('Lembretes gerais', 'lembretes', 5),
  ('Aniversário do aluno', 'aniversario', 6),
  ('Mensagens personalizadas', 'personalizada', 7)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.message_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  image_url text,
  is_reusable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO authenticated, service_role;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage message templates" ON public.message_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone authenticated can view templates" ON public.message_templates FOR SELECT TO authenticated USING (true);
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.message_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  label text NOT NULL,
  example text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.message_variables TO authenticated;
GRANT ALL ON public.message_variables TO authenticated, service_role;
ALTER TABLE public.message_variables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage message variables" ON public.message_variables FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone authenticated can view variables" ON public.message_variables FOR SELECT TO authenticated USING (true);

INSERT INTO public.message_variables (key, label, example, sort_order) VALUES
  ('nome', 'Nome do aluno', 'João', 1),
  ('plano', 'Nome do plano', 'Premium', 2),
  ('valor', 'Valor do plano', 'R$ 197,00', 3),
  ('vencimento', 'Data de vencimento', '30/12/2025', 4),
  ('link', 'Link genérico', 'https://...', 5)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.message_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.message_categories(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  recipient_phone text,
  recipient_name text,
  content text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_history TO authenticated;
GRANT ALL ON public.message_history TO service_role;
ALTER TABLE public.message_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage message history" ON public.message_history FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));