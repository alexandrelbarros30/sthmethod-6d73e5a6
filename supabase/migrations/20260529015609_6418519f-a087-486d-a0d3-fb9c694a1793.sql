CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  enabled boolean NOT NULL DEFAULT true,
  active_main_menu_key text NOT NULL DEFAULT 'main',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.whatsapp_settings TO authenticated;
GRANT ALL ON public.whatsapp_settings TO service_role;

ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp settings"
ON public.whatsapp_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read whatsapp settings"
ON public.whatsapp_settings
FOR SELECT
TO authenticated
USING (true);

INSERT INTO public.whatsapp_settings (id, enabled, active_main_menu_key)
VALUES (true, true, 'main')
ON CONFLICT (id) DO NOTHING;