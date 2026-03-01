
-- Landing settings (logo, background, hero, CTA)
CREATE TABLE public.landing_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.landing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view landing settings" ON public.landing_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage landing settings" ON public.landing_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default settings
INSERT INTO public.landing_settings (key, value) VALUES
  ('logo_url', ''),
  ('bg_image_url', ''),
  ('bg_enabled', 'true'),
  ('bg_opacity', '0.25'),
  ('hero_title', 'Transforme seu corpo com ciência, estratégia e acompanhamento real.'),
  ('hero_subtitle', 'Consultoria online personalizada para quem busca emagrecimento, definição, saúde hormonal e evolução no shape.'),
  ('hero_cta_text', 'Quero evoluir meu shape'),
  ('hero_cta_link', '/login'),
  ('hero_cta2_text', 'Conhecer os planos'),
  ('hero_cta2_link', '#planos'),
  ('hero_stat1_value', '12k+'),
  ('hero_stat1_label', 'Alunos ativos'),
  ('hero_stat2_value', '98%'),
  ('hero_stat2_label', 'Satisfação'),
  ('hero_stat3_value', '340+'),
  ('hero_stat3_label', 'Transformações'),
  ('cta_final_title', 'Seu corpo não muda sozinho.'),
  ('cta_final_subtitle', 'Com método e acompanhamento, muda de verdade.'),
  ('cta_final_btn1_text', 'Começar agora'),
  ('cta_final_btn1_link', '/login'),
  ('cta_final_btn2_text', 'Falar com a consultoria'),
  ('cta_final_btn2_link', 'https://wa.me/');

-- Landing steps ("Como Funciona")
CREATE TABLE public.landing_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  icon text NOT NULL DEFAULT 'Brain',
  title text NOT NULL,
  items text[] NOT NULL DEFAULT '{}',
  footer text NOT NULL DEFAULT '',
  is_optional boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.landing_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view landing steps" ON public.landing_steps FOR SELECT USING (true);
CREATE POLICY "Admins can manage landing steps" ON public.landing_steps FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default steps
INSERT INTO public.landing_steps (icon, title, items, footer, sort_order) VALUES
  ('Brain', 'Avaliação Completa', ARRAY['Preenchimento de formulário','Envio de imagens corporais','Diálogo individual','Análise de exames (quando houver)'], 'Avaliação profunda, personalizada e respeitando sua individualidade.', 0),
  ('Utensils', 'Dieta Personalizada e Periodizada', ARRAY['Plano alimentar exclusivo','Ajustes metabólicos contínuos','Atualizações mínimas a cada 30 dias'], 'Nada genérico. Tudo alinhado ao seu objetivo.', 1),
  ('Dumbbell', 'Treino Guiado por Aplicativo', ARRAY['Treinos estruturados','Vídeos de execução','Progressão planejada','Controle de cargas'], 'Segurança, eficiência e constância.', 2),
  ('Pill', 'Protocolo Individualizado', ARRAY['Suplementação','Medicamentos (quando indicados)','Canetas emagrecedoras','Estimulantes e peptídeos'], 'Sempre com base técnica, ética e acompanhamento.', 3),
  ('FlaskConical', 'Interpretação de Exames', ARRAY['Identificação de desequilíbrios','Otimização de resultados','Prevenção de riscos'], 'Saúde sempre vem antes da estética.', 4),
  ('Headphones', 'Suporte Ativo', ARRAY['Acesso direto ao suporte','Atendimento dentro do horário estabelecido','Acompanhamento contínuo'], 'Você não fica sozinho no processo.', 5),
  ('FileText', 'Requisição de Exames', ARRAY['Orientação e educação em saúde fazem parte do método.'], '', 6);
UPDATE public.landing_steps SET is_optional = true WHERE sort_order = 6;

-- Landing testimonials
CREATE TABLE public.landing_testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  text text NOT NULL,
  tag text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.landing_testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view testimonials" ON public.landing_testimonials FOR SELECT USING (true);
CREATE POLICY "Admins can manage testimonials" ON public.landing_testimonials FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default testimonials
INSERT INTO public.landing_testimonials (name, text, tag, sort_order) VALUES
  ('Lucas M.', 'Nunca tive um acompanhamento tão organizado e ajustado à minha realidade. Resultados que eu tentei por anos sozinho vieram em meses.', 'Evolução', 0),
  ('Camila R.', 'Me sinto segura com cada orientação. A dieta faz sentido, o treino é no meu nível e o suporte é muito próximo.', 'Segurança', 1),
  ('Rafael T.', 'O diferencial é o acompanhamento real. Não é um PDF genérico — é um processo construído pra mim.', 'Acompanhamento', 2),
  ('Juliana S.', 'Perdi 12kg em 5 meses, sem passar fome e sem loucura. Tudo com ciência, paciência e ajuste constante.', 'Confiança', 3);

-- Landing evolutions (before/after carousel)
CREATE TABLE public.landing_evolutions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.landing_evolutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view evolutions" ON public.landing_evolutions FOR SELECT USING (true);
CREATE POLICY "Admins can manage evolutions" ON public.landing_evolutions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Landing sections (order/visibility)
CREATE TABLE public.landing_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE public.landing_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sections" ON public.landing_sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage sections" ON public.landing_sections FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.landing_sections (key, label, sort_order) VALUES
  ('how_it_works', 'Como Funciona', 0),
  ('results', 'Resultados & Evolução', 1),
  ('evolutions', 'Evoluções Reais', 2),
  ('testimonials', 'Depoimentos', 3),
  ('plans', 'Planos', 4),
  ('ethics', 'Compromisso Ético', 5);

-- Storage bucket for landing assets
INSERT INTO storage.buckets (id, name, public) VALUES ('landing-assets', 'landing-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view landing assets" ON storage.objects FOR SELECT USING (bucket_id = 'landing-assets');
CREATE POLICY "Admins can upload landing assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'landing-assets' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update landing assets" ON storage.objects FOR UPDATE USING (bucket_id = 'landing-assets' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete landing assets" ON storage.objects FOR DELETE USING (bucket_id = 'landing-assets' AND has_role(auth.uid(), 'admin'::app_role));
