
CREATE TABLE IF NOT EXISTS public.broadcast_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  text_first BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broadcast_templates TO authenticated;
GRANT ALL ON public.broadcast_templates TO service_role;
ALTER TABLE public.broadcast_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage broadcast templates" ON public.broadcast_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.broadcast_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.broadcast_templates(id) ON DELETE SET NULL,
  audience TEXT NOT NULL,
  total INT NOT NULL DEFAULT 0,
  sent INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  skipped INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  dry_run BOOLEAN NOT NULL DEFAULT false,
  started_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.broadcast_runs TO authenticated;
GRANT ALL ON public.broadcast_runs TO service_role;
ALTER TABLE public.broadcast_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view broadcast runs" ON public.broadcast_runs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins create broadcast runs" ON public.broadcast_runs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.broadcast_templates (name, message)
VALUES (
  '📱 Lançamento App STH METHOD',
  E'Fala, {nome}! Conte comigo 💚\n\nTenho uma novidade que vai deixar sua rotina ainda mais prática: o *app STH METHOD para Android já está disponível* para você baixar direto pelo portal.\n\n📲 *Como baixar (Android)*\n1. Acesse: https://sthmethod.com/baixar-app\n2. Toque em Baixar APK e autorize a instalação\n3. Faça login com o mesmo e-mail e senha do portal\n\nTudo que você já usa no portal está no app — de forma mais rápida e fluida:\n✅ Protocolo atualizado\n✅ Dieta e refeições interativas\n✅ Treinos completos com vídeos de referência\n✅ Check-in semanal, evolução, hidratação e cronômetro de treino\n✅ Notificações e canal direto comigo\n\n🍎 *Está no iPhone?*\nAinda não temos app nativo para iOS, mas você tem a versão *Web App* com a mesma experiência:\n1. Abra https://sthmethod.com no Safari\n2. Toque em Compartilhar → *Adicionar à Tela de Início*\n3. Pronto! O ícone STH METHOD aparece como um app e abre em tela cheia\n\nQualquer dúvida na instalação, me chame por aqui.\n\nBora pra cima! 🚀\n— Nutri Alexandre | STH METHOD'
)
ON CONFLICT DO NOTHING;
