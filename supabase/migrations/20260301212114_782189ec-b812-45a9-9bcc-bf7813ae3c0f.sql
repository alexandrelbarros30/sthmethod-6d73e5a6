
-- Table for editable site content (CMS texts)
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'institutional',
  label text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read site content (public texts)
CREATE POLICY "Anyone can view site content"
ON public.site_content FOR SELECT
USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage site content"
ON public.site_content FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default content keys
INSERT INTO public.site_content (key, category, label, content) VALUES
-- Institutional
('hero_badge', 'institutional', 'Badge do Hero', 'Plataforma de Consultoria em Saúde & Performance'),
('hero_headline', 'institutional', 'Título Principal (Hero)', 'Transforme vidas. Escale resultados.'),
('hero_subtitle', 'institutional', 'Subtítulo do Hero', 'Ecossistema completo para consultores de saúde: dieta, treino, protocolos, check-ins, pagamentos e gestão — tudo integrado em uma única plataforma.'),
('hero_cta_primary', 'institutional', 'Botão Principal do Hero', 'Começar Gratuitamente'),
('hero_cta_secondary', 'institutional', 'Botão Secundário do Hero', 'Ver Demonstração'),
('features_title', 'institutional', 'Título Seção Funcionalidades', 'Funcionalidades Essenciais'),
('features_subtitle', 'institutional', 'Subtítulo Seção Funcionalidades', 'Cada módulo foi projetado para maximizar a experiência do aluno e a eficiência operacional da consultoria.'),
('modules_title', 'institutional', 'Título Seção Módulos', 'Módulos Estratégicos'),
('modules_subtitle', 'institutional', 'Subtítulo Seção Módulos', 'Diferenciais que aumentam retenção, escalabilidade e receita da sua consultoria.'),
('arch_title', 'institutional', 'Título Seção Arquitetura', 'Arquitetura Técnica'),
('arch_subtitle', 'institutional', 'Subtítulo Seção Arquitetura', 'Stack moderna, escalável e segura — pronta para crescer com o seu negócio.'),
('cta_title', 'institutional', 'Título CTA Final', 'Pronto para transformar sua consultoria?'),
('cta_subtitle', 'institutional', 'Subtítulo CTA Final', 'Junte-se a centenas de profissionais que já escalaram seus resultados com a plataforma ST&H.'),
('cta_button', 'institutional', 'Botão CTA Final', 'Começar Agora — É Grátis'),
('footer_text', 'institutional', 'Texto do Rodapé', '© 2026 ST&H — Consultoria Científica em Performance e Saúde. Todos os direitos reservados.'),
-- Operational
('welcome_after_payment', 'operational', 'Boas-vindas após pagamento', 'Parabéns! Sua assinatura foi ativada. Explore sua área exclusiva e comece sua transformação.'),
('msg_active_student', 'operational', 'Mensagem aluno ativo', 'Bem-vindo de volta! Continue sua evolução.'),
('msg_inactive_student', 'operational', 'Mensagem aluno inativo', 'Sentimos sua falta! Renove sua assinatura para continuar evoluindo.'),
('msg_new_student', 'operational', 'Mensagem novo aluno', 'Bem-vindo à plataforma! Complete seu perfil para começar.'),
('diet_intro', 'operational', 'Texto introdutório - Dieta', 'Confira seu plano alimentar personalizado. Siga as orientações para alcançar seus resultados.'),
('training_intro', 'operational', 'Texto introdutório - Treino', 'Seu treino foi montado especialmente para você. Assista aos vídeos e siga as séries indicadas.'),
('protocol_intro', 'operational', 'Texto introdutório - Protocolo', 'Seu protocolo foi elaborado com base no seu perfil clínico. Siga rigorosamente as orientações.'),
('student_area_welcome', 'operational', 'Texto área do aluno', 'Esta é sua área exclusiva. Aqui você encontra tudo que precisa para sua evolução.');
